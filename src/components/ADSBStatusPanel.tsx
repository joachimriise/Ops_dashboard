import React from 'react';

export default function ADSBDiagPanel() {
  const [logs, setLogs] = React.useState<string[]>([]);

  const addLog = (url: string, response: any, error?: string) => {
    const time = new Date().toLocaleTimeString();
    const entry = error
      ? `[${time}] GET ${url} ❌ ${error}`
      : `[${time}] GET ${url} ✅ ${JSON.stringify(response).substring(0,200)}...`;
    setLogs(prev => [entry, ...prev].slice(0,20)); // bare 20 siste
  };

  const fetchAndLog = async (url: string) => {
    try {
      const res = await fetch(url);
      const text = await res.text();
      try {
        const data = JSON.parse(text);
        addLog(url, data);
      } catch {
        addLog(url, text, 'Invalid JSON');
      }
    } catch (err: any) {
      addLog(url, null, err.message);
    }
  };

  React.useEffect(() => {
    // hent første gang
    fetchAndLog('/adsb-proxy/health');
    fetchAndLog('/adsb-proxy/aircraft.json');
    // repeter hvert 10. sekund
    const interval = setInterval(() => {
      fetchAndLog('/adsb-proxy/health');
      fetchAndLog('/adsb-proxy/aircraft.json');
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="lattice-panel p-4">
      <h2 className="font-bold lattice-text-primary mb-3">ADS-B Diagnostics Log</h2>
      <div className="text-xs lattice-text-mono space-y-1 max-h-96 overflow-y-auto bg-black/40 p-2 rounded">
        {logs.map((line, idx) => (
          <div key={idx}>{line}</div>
        ))}
      </div>
    </div>
  );
}
