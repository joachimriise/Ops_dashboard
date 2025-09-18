import React from 'react';
import { CheckCircle, XCircle, AlertCircle, RefreshCw, FileText, Radar } from 'lucide-react';

interface HealthStatus {
  status: 'ONLINE' | 'BUSY' | 'OFFLINE' | 'UNKNOWN';
  rtl?: { status: string; detail: string };
  service?: { active: boolean; detail: string };
  file?: { exists: boolean; recent: boolean };
  timestamp: number;
}

interface AircraftData {
  aircraft: any[];
  now: number;
  messages: number;
}

export default function ADSBStatusPanel() {
  const [health, setHealth] = React.useState<HealthStatus | null>(null);
  const [aircraft, setAircraft] = React.useState<AircraftData | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = React.useState<Date>(new Date());

  const fetchHealth = async () => {
    try {
      const res = await fetch('/adsb-proxy/health');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setHealth(data);
      setError(null);
      setLastUpdate(new Date());
    } catch (err: any) {
      setError(`Health fetch error: ${err.message}`);
      setHealth(null);
    }
  };

  const fetchAircraft = async () => {
    try {
      const res = await fetch('/adsb-proxy/aircraft.json');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setAircraft(data);
      setError(null);
      setLastUpdate(new Date());
    } catch (err: any) {
      setError(`Aircraft fetch error: ${err.message}`);
      setAircraft(null);
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

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'ONLINE': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'BUSY': return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'OFFLINE': return <XCircle className="h-5 w-5 text-red-500" />;
      default: return <AlertCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  return (
    <div className="lattice-panel p-4 space-y-4">
      <h2 className="font-bold lattice-text-primary">ADS-B Status</h2>

      {error && (
        <div className="text-red-400 text-sm">{error}</div>
      )}

      {/* Hardware status */}
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Radar className="h-5 w-5 text-blue-500" />
          <span className="font-semibold">Dongle status:</span>
          {getStatusIcon(health?.rtl?.status)}
          <span>{health?.rtl?.status || 'UNKNOWN'}</span>
        </div>
        <div className="flex items-center space-x-2">
          {health?.service?.active ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : (
            <XCircle className="h-5 w-5 text-red-500" />
          )}
          <span className="font-semibold">dump1090:</span>
          <span>{health?.service?.active ? 'Active' : 'Inactive'}</span>
        </div>
      </div>

      {/* Aircraft status */}
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <FileText className="h-5 w-5 text-blue-500" />
          <span className="font-semibold">Aircraft.json:</span>
          <span>{aircraft ? 'Accessible' : 'No data'}</span>
        </div>
        {aircraft && (
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>Aircraft count: {aircraft.aircraft?.length || 0}</div>
            <div>Messages: {aircraft.messages}</div>
          </div>
        )}
      </div>

      {/* Raw data */}
      <div>
        <h3 className="font-semibold text-blue-400">Raw /health</h3>
        <pre className="text-xs bg-black/40 p-2 rounded overflow-x-auto">
          {health ? JSON.stringify(health, null, 2) : 'No data'}
        </pre>
      </div>

      <div>
        <h3 className="font-semibold text-blue-400">Raw /aircraft.json</h3>
        <pre className="text-xs bg-black/40 p-2 rounded overflow-x-auto">
          {aircraft ? JSON.stringify(aircraft, null, 2) : 'No data'}
        </pre>
      </div>

      <div className="text-xs text-gray-400">
        Last update: {lastUpdate.toLocaleTimeString()}
      </div>

      <button
        onClick={() => { fetchHealth(); fetchAircraft(); }}
        className="lattice-button text-xs px-3 py-1 flex items-center space-x-1"
      >
        <RefreshCw className="h-3 w-3" /> <span>Refresh</span>
      </button>
    </div>
  );
}
