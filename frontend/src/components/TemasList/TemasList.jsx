function TemasList({ temas, onSelect }) {
  return (
    <div>
      <h2>Temas da IA</h2>
      <ul>
        {temas.map((t, i) => (
          <li key={i} onClick={() => onSelect(t)}>
            {t}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default TemasList;
