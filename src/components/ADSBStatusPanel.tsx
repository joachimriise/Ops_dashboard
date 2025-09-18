import React from 'react';

export default function ADSBStatusPanel() {
  const [health, setHealth] = React.useState<any>(null);
  const [aircraft, setAircraft] = React.useState<any>(null);
  const [error, setError] = React.useState<string | null>(null);

  // fetch health
  const fetchHealth = async () => {
    try {
      const res = await fetch('/adsb-proxy/health');
      const data = await res.json();
      setHealth(data);
    } catch (err: any) {
      setError(`Health fetch error: ${err.message}`);
    }
  };

  // fetch aircraft
  const fetchAircraft = async () => {
    try {
      const res = await fetch('/adsb-proxy/aircraft.json');
      const data = await res.json();
      setAircraft(data);
    } catch (err: any) {
      setError(`Aircraft fetch error: ${err.message}`);
    }
  };

  React.useEffect(() => {
    fetchHealth();
    fetchAircraft();
  }, []);

  return (
    <div className="lattice-panel p-4 space-y-4">
      <h2 className="font-bold lattice-text-primary">ADS-B Diagnostics</h2>

      {error && (
        <div className="text-red-400 text-sm">{error}</div>
      )}

      <div>
        <h3 className="font-semibold lattice-status-primary mb-1">/health</h3>
        <pre className="text-xs bg-black/40 p-2 rounded overflow-x-auto">
          {health ? JSON.stringify(health, null, 2) : 'Loading...'}
        </pre>
      </div>

      <div>
        <h3 className="font-semibold lattice-status-primary mb-1">/aircraft.json</h3>
        <pre className="text-xs bg-black/40 p-2 rounded overflow-x-auto">
          {aircraft ? JSON.stringify(aircraft, null, 2) : 'Loading...'}
        </pre>
      </div>
    </div>
  );
}
