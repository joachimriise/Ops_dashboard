import React from 'react';

export default function ADSBDiagPanel() {
  const [health, setHealth] = React.useState<any>(null);
  const [aircraft, setAircraft] = React.useState<any>(null);
  const [logs, setLogs] = React.useState<string[]>([]);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [`[${time}] ${msg}`, ...prev].slice(0, 20));
  };

  const fetchHealth = async () => {
    const url = '/adsb-proxy/health';
    try {
      const res = await fetch(url);
      const text = await res.text();
      try {
        const data = JSON.parse(text);
        setHealth(data);
        addLog(`✅ ${url} -> status=${data.status}, rtl=${data.rtl?.status}`);
      } catch {
        addLog(`❌ ${url} -> invalid JSON: ${text.substring(0,100)}...`);
      }
    } catch (err: any) {
      addLog(`❌ ${url} -> ${err.message}`);
    }
  };

  const fetchAircraft = async () => {
    const url = '/adsb-proxy/aircraft.json';
    try {
      const res = await fetch(url);
      const text = await res.text();
      try {
        const data = JSON.parse(text);
        setAircraft(data);
        addLog(`✅ ${url} -> messages=${data.messages}, aircraft=${data.aircraft?.length || 0}`);
      } catch {
        addLog(`❌ ${url} -> invalid JSON: ${text.substring(0,100)}...`);
      }
    } catch (err: any) {
      addLog(`❌ ${url} -> ${err.message}`);
    }
  };

  React.useEffect(() => {
    fetchHealth();
    fetchAircraft();
    const interval = setInterval(() => {
      fetchHealth();
      fetchAircraft();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="lattice-panel p-4 space-y-4">
      <h2 className="font-bold lattice-text-primary">ADS-B Diagnostics</h2>

      {/* Status summary */}
      <div className="space-y-1 text-sm">
        <div>
          <span className="lattice-text-secondary">Dongle status:</span>{' '}
          <span className="font-semibold">
            {health?.rtl?.status || 'UNKNOWN'}
          </span>
        </div>
        <div>
          <span className="lattice-text-secondary">dump1090 service:</span>{' '}
          <span className="font-semibold">
            {health?.service?.active ? 'Active' : 'Inactive'}
          </span>
        </div>
        <div>
          <span className="lattice-text-secondary">Aircraft count:</span>{' '}
          <span className="font-semibold">
            {aircraft?.aircraft?.length || 0}
          </span>
        </div>
        <div>
          <span className="lattice-text-secondary">Messages:</span>{' '}
          <span className="font-semibold">
            {aircraft?.messages || 0}
          </span>
        </div>
      </div>

      {/* Raw JSON */}
      <div>
        <h3 className="font-semibold lattice-status-primary mb-1">/health raw</h3>
        <pre className="text-xs bg-black/40 p-2 rounded overflow-x-auto">
          {health ? JSON.stringify(health, null, 2) : 'No data yet'}
        </pre>
      </div>

      <div>
        <h3 className="font-semibold lattice-status-primary mb-1">/aircraft.json raw</h3>
        <pre className="text-xs bg-black/40 p-2 rounded overflow-x-auto">
          {aircraft ? JSON.stringify(aircraft, null, 2) : 'No data yet'}
        </pre>
      </div>

      {/* Logs */}
      <div>
        <h3 className="font-semibold lattice-status-primary mb-1">Logs</h3>
        <div className="text-xs lattice-text-mono space-y-1 max-h-48 overflow-y-auto bg-black/40 p-2 rounded">
          {logs.map((line, idx) => (
            <div key={idx}>{line}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
