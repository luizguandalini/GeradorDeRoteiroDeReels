import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// JWT Secret (em produção, use uma variável de ambiente)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

const googleClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;

const parsePositiveInt = (value, fallback) => {
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) || parsed <= 0 ? fallback : parsed;
};

const isProduction = process.env.NODE_ENV === 'production';
const ACCESS_TOKEN_TTL_SECONDS = parsePositiveInt(process.env.ACCESS_TOKEN_TTL_SECONDS, 900);
const REFRESH_TOKEN_TTL_DAYS = parsePositiveInt(process.env.REFRESH_TOKEN_TTL_DAYS, 7);
const REFRESH_COOKIE_NAME = 'refreshToken';
const REFRESH_TOKEN_EXPIRATION_MS = REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000;

const buildUserResponse = (user) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role,
  provider: user.provider,
  language: user.language
});

const generateUserToken = (user) => jwt.sign(
  {
    userId: user.id,
    email: user.email,
    role: user.role
  },
  JWT_SECRET,
  { expiresIn: ACCESS_TOKEN_TTL_SECONDS }
);

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const setRefreshTokenCookie = (res, token) => {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    path: '/api/auth',
    maxAge: REFRESH_TOKEN_EXPIRATION_MS
  });
};

const clearRefreshTokenCookie = (res) => {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    path: '/api/auth'
  });
};

const issueRefreshToken = async (userId) => {
  const now = new Date();
  const rawToken = crypto.randomBytes(64).toString('hex');
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(now.getTime() + REFRESH_TOKEN_EXPIRATION_MS);

  await prisma.refreshToken.deleteMany({
    where: {
      userId,
      expiresAt: { lt: now }
    }
  });

  await prisma.refreshToken.updateMany({
    where: {
      userId,
      revokedAt: null,
      expiresAt: { gt: now }
    },
    data: { revokedAt: now }
  });

  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt
    }
  });

  return { rawToken, expiresAt };
};

const extractRefreshToken = (req) => {
  const cookiesHeader = req.headers.cookie;
  if (!cookiesHeader) {
    return null;
  }

  const cookies = cookiesHeader.split(';').map((cookie) => cookie.trim());
  for (const cookie of cookies) {
    const [name, ...rest] = cookie.split('=');
    if (decodeURIComponent(name) === REFRESH_COOKIE_NAME) {
      return decodeURIComponent(rest.join('='));
    }
  }

  return null;
};

const sendAuthResponse = async (res, user, message) => {
  const token = generateUserToken(user);
  const { rawToken } = await issueRefreshToken(user.id);

  setRefreshTokenCookie(res, rawToken);

  return res.json({
    message,
    token,
    user: buildUserResponse(user),
    expiresIn: ACCESS_TOKEN_TTL_SECONDS
  });
};

const authUserSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  provider: true,
  language: true,
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
        language: true,
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

    return sendAuthResponse(res, user, 'Login realizado com sucesso');
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

// Renovar access token
router.post('/refresh', async (req, res) => {
  try {
    const refreshToken = extractRefreshToken(req);

    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token não fornecido' });
    }

    const tokenHash = hashToken(refreshToken);
    const now = new Date();

    const storedToken = await prisma.refreshToken.findFirst({
      where: { tokenHash },
      include: {
        user: {
          select: authUserSelect
        }
      }
    });

    if (!storedToken || storedToken.revokedAt || storedToken.expiresAt <= now) {
      if (storedToken?.id && !storedToken.revokedAt) {
        await prisma.refreshToken.update({
          where: { id: storedToken.id },
          data: { revokedAt: now }
        });
      }

      clearRefreshTokenCookie(res);
      return res.status(401).json({ error: 'Refresh token inválido' });
    }

    if (!storedToken.user || !storedToken.user.active) {
      clearRefreshTokenCookie(res);
      return res.status(401).json({ error: 'Usuário não encontrado ou inativo' });
    }

    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: now }
    });

    return sendAuthResponse(res, storedToken.user, 'Sessão renovada com sucesso');
  } catch (error) {
    console.error('Erro no refresh token:', error);
    return res.status(401).json({ error: 'Não foi possível renovar o token de acesso' });
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
        provider: true,
        language: true
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

// Logout (encerra sessão e revoga refresh token)
router.post('/logout', async (req, res) => {
  try {
    const refreshToken = extractRefreshToken(req);

    if (refreshToken) {
      const tokenHash = hashToken(refreshToken);
      await prisma.refreshToken.updateMany({
        where: { tokenHash, revokedAt: null },
        data: { revokedAt: new Date() }
      });
    }
  } catch (error) {
    console.error('Erro no logout:', error);
  } finally {
    clearRefreshTokenCookie(res);
  }

  res.json({ message: 'Logout realizado com sucesso' });
});

export default router;









