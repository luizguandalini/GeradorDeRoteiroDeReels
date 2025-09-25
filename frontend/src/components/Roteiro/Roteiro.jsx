function Roteiro({ roteiro }) {
  if (!roteiro || roteiro.length === 0) {
    return <p>Nenhum roteiro gerado ainda.</p>;
  }

  return (
    <div>
      {roteiro.map((r, i) => (
        <div key={i} className="roteiro-item">
          <strong>Narração {i + 1}:</strong> {r.narracao}
          <em>Imagem:</em> {r.imagem}
        </div>
      ))}
    </div>
  );
}

export default Roteiro;
