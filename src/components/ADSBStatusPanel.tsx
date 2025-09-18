import React from 'react';
import { Radar, CheckCircle, XCircle, AlertCircle, RefreshCw, FileText } from 'lucide-react';

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
  aircraft_count?: number;
  error?: string;
}

export default function ADSBStatusPanel() {
  const [healthStatus, setHealthStatus] = React.useState<HealthStatus>({
    status: 'UNKNOWN',
    timestamp: Date.now()
  });
  const [healthDiag, setHealthDiag] = React.useState<string>('');
  const [aircraftData, setAircraftData] = React.useState<AircraftData | null>(null);
  const [aircraftDiag, setAircraftDiag] = React.useState<string>('');

  const fetchHealthStatus = React.useCallback(async () => {
    try {
      const res = await fetch('/adsb-proxy/health');
      const text = await res.text();

      console.log('[DEBUG] /health status:', res.status, res.headers.get('content-type'));
      console.log('[DEBUG] /health body:', text);

      setHealthDiag(
        `Status ${res.status}, type ${res.headers.get('content-type')}\n` +
        text.substring(0, 200)
      );

      if (res.ok && text.trim().startsWith('{')) {
        setHealthStatus(JSON.parse(text));
      } else {
        setHealthStatus({ status: 'OFFLINE', timestamp: Date.now() });
      }
    } catch (err: any) {
      setHealthDiag(`Fetch error: ${err.message}`);
      setHealthStatus({ status: 'OFFLINE', timestamp: Date.now() });
    }
  }, []);

  const fetchAircraftData = React.useCallback(async () => {
    try {
      const res = await fetch('/adsb-proxy/aircraft.json');
      const text = await res.text();

      console.log('[DEBUG] /aircraft.json status:', res.status, res.headers.get('content-type'));
      console.log('[DEBUG] /aircraft.json body:', text);

      setAircraftDiag(
        `Status ${res.status}, type ${res.headers.get('content-type')}\n` +
        text.substring(0, 200)
      );

      if (res.ok && text.trim().startsWith('{')) {
        setAircraftData(JSON.parse(text));
      } else {
        setAircraftData(null);
      }
    } catch (err: any) {
      setAircraftDiag(`Fetch error: ${err.message}`);
      setAircraftData(null);
    }
  }, []);

  React.useEffect(() => {
    fetchHealthStatus();
    fetchAircraftData();
  }, [fetchHealthStatus, fetchAircraftData]);

  return (
    <div className="p-4 space-y-4">
      <div className="lattice-panel p-4">
        <h3 className="font-semibold mb-2 flex items-center space-x-2">
          <Radar className="h-5 w-5" /> <span>Health Status</span>
        </h3>
        <div className="text-xs whitespace-pre-wrap lattice-text-secondary">
          {healthDiag || 'No data yet'}
        </div>
      </div>

      <div className="lattice-panel p-4">
        <h3 className="font-semibold mb-2 flex items-center space-x-2">
          <FileText className="h-5 w-5" /> <span>Aircraft Data</span>
        </h3>
        <div className="text-xs whitespace-pre-wrap lattice-text-secondary">
          {aircraftDiag || 'No data yet'}
        </div>
        {aircraftData && (
          <pre className="text-xs mt-2 lattice-text-mono">
            {JSON.stringify(
              {
                count: aircraftData.aircraft?.length || 0,
                messages: aircraftData.messages,
                now: aircraftData.now
              },
              null,
              2
            )}
          </pre>
        )}
      </div>

      <div className="flex space-x-2">
        <button
          onClick={fetchHealthStatus}
          className="lattice-button px-3 py-1 text-xs flex items-center space-x-1"
        >
          <RefreshCw className="h-3 w-3" /> <span>Refresh Health</span>
        </button>
        <button
          onClick={fetchAircraftData}
          className="lattice-button px-3 py-1 text-xs flex items-center space-x-1"
        >
          <RefreshCw className="h-3 w-3" /> <span>Refresh Aircraft</span>
        </button>
      </div>
    </div>
  );
}
