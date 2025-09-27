import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// JWT Secret (em produção, use uma variável de ambiente)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

const googleClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;

const buildUserResponse = (user) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role,
  provider: user.provider
});

const generateUserToken = (user) => jwt.sign(
  {
    userId: user.id,
    email: user.email,
    role: user.role
  },
  JWT_SECRET,
  { expiresIn: '24h' }
);

const sendAuthResponse = (res, user, message) => {
  const token = generateUserToken(user);
  return res.json({
    message,
    token,
    user: buildUserResponse(user)
  });
};

const authUserSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  provider: true,
  active: true
};

const upsertSocialUser = async ({ email, name, provider, providerId }) => {
  if (providerId) {
    const userByProvider = await prisma.user.findUnique({
      where: { providerId },
      select: authUserSelect
    });

    if (userByProvider) {
      if (!userByProvider.active) {
        throw new Error('Conta de usuário inativa');
      }

      return prisma.user.update({
        where: { id: userByProvider.id },
        data: {
          name: userByProvider.name || name,
          provider,
          providerId
        },
        select: authUserSelect
      });
    }
  }

  const normalizedEmail = email.trim().toLowerCase();

  let user = await prisma.user.findUnique({
    where: { email: normalizedEmail }
  });

  if (user) {
    if (!user.active) {
      throw new Error('Conta de usuário inativa');
    }

    if (user.provider && user.provider !== provider && user.provider !== 'CREDENTIALS') {
      throw new Error(`Conta já vinculada ao login via ${user.provider}`);
    }

    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: user.name || name,
        provider,
        providerId
      },
      select: authUserSelect
    });

    return user;
  }

  return prisma.user.create({
    data: {
      email: normalizedEmail,
      name,
      provider,
      providerId,
      password: null,
      role: 'GENERAL'
    },
    select: authUserSelect
  });
};

// Registro de usuário
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, role = 'GENERAL' } = req.body;

    const normalizedEmail = email?.trim().toLowerCase();

    if (!normalizedEmail || !password || !name) {
      return res.status(400).json({ error: 'Email, senha e nome são obrigatórios' });
    }

    // Verificar se o usuário já existe
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Usuário já existe com este email' });
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Criar usuário
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
        name,
        role: role.toUpperCase(),
        provider: 'CREDENTIALS'
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        provider: true,
        createdAt: true
      }
    });

    res.status(201).json({ 
      message: 'Usuário criado com sucesso',
      user 
    });
  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user || !user.active) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    if (!user.password) {
      const providerLabel = user.provider === 'GOOGLE' ? 'Google' : 'social';
      return res.status(400).json({ error: `Esta conta está vinculada ao login via ${providerLabel}. Utilize o botão de login social correspondente.` });
    }

    // Verificar senha
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const sanitizedUser = buildUserResponse(user);

    return sendAuthResponse(res, sanitizedUser, 'Login realizado com sucesso');
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Login com Google
router.post('/google', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token do Google não informado' });
    }

    if (!googleClient) {
      return res.status(500).json({ error: 'Login com Google não está configurado no servidor' });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();

    if (!payload?.email) {
      return res.status(401).json({ error: 'Não foi possível obter o email do Google' });
    }

    if (payload.email_verified === false) {
      return res.status(401).json({ error: 'Email Google não verificado' });
    }

    const user = await upsertSocialUser({
      email: payload.email,
      name: payload.name || `${payload.given_name || ''} ${payload.family_name || ''}`.trim() || 'Usuário Google',
      provider: 'GOOGLE',
      providerId: payload.sub
    });

    return sendAuthResponse(res, user, 'Login via Google realizado com sucesso');
  } catch (error) {
    console.error('Erro no login com Google:', error);
    const message = error.message?.includes('Conta já vinculada')
      ? error.message
      : 'Não foi possível autenticar com Google';
    return res.status(401).json({ error: message });
  }
});

// Verificar token
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Buscar usuário atualizado
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
        provider: true
      }
    });

    if (!user || !user.active) {
      return res.status(401).json({ error: 'Usuário não encontrado ou inativo' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Erro na verificação do token:', error);
    res.status(401).json({ error: 'Token inválido' });
  }
});

// Logout (opcional - principalmente para limpar token no frontend)
router.post('/logout', (req, res) => {
  res.json({ message: 'Logout realizado com sucesso' });
});

export default router;
