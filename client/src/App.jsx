import { useState } from 'react';
import './App.css';

export default function App() {
  const [brand, setBrand] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchCompetitors = async () => {
    setLoading(true);
    setResults(null);
    const res = await fetch('https://findcompetitor.onrender.com/api/competitors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brand })
    });
    const data = await res.json();
    setResults(data);
    setLoading(false);
  };

  return (
    <div className="container">
      <h1>Competitor Discovery Engine</h1>
      <input
        type="text"
        placeholder="Enter a brand name..."
        value={brand}
        onChange={e => setBrand(e.target.value)}
      />
      <button onClick={fetchCompetitors} disabled={loading || !brand.trim()}>
        {loading ? 'Searching...' : 'Find Competitors'}
      </button>

      {results && (
        <div className="results">
          <h2>Found Competitors:</h2>
          <ul>
            {results.competitors.map((comp, idx) => (
              <li key={idx}>{comp}</li>
            ))}
          </ul>
          <p>Source: <a href={results.source} target="_blank" rel="noopener noreferrer">{results.source}</a></p>
        </div>
      )}
    </div>
  );
}
