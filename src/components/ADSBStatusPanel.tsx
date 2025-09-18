import React from 'react';
import { Radar, CheckCircle, XCircle, AlertCircle, RefreshCw, Zap, FileText } from 'lucide-react';

interface ADSBStatusPanelProps {
  // No props needed - this panel fetches its own data
}

interface HealthStatus {
  status: 'ONLINE' | 'BUSY' | 'OFFLINE';
  rtl?: {
    status: 'ONLINE' | 'BUSY' | 'OFFLINE' | 'UNKNOWN';
    detail: string;
  };
  service?: {
    active: boolean;
    detail: string;
  };
  file?: {
    exists: boolean;
    recent: boolean;
  };
  timestamp: number;
}

interface AircraftData {
  aircraft: any[];
  now: number;
  messages: number;
  aircraft_count?: number;
  error?: string;
}

export default function ADSBStatusPanel({}: ADSBStatusPanelProps) {
  const [healthStatus, setHealthStatus] = React.useState<HealthStatus>({
    status: 'OFFLINE',
    timestamp: Date.now()
  });
  const [aircraftData, setAircraftData] = React.useState<AircraftData | null>(null);
  const [isLoadingHealth, setIsLoadingHealth] = React.useState(false);
  const [isLoadingAircraft, setIsLoadingAircraft] = React.useState(false);
  const [healthError, setHealthError] = React.useState<string | null>(null);
  const [aircraftError, setAircraftError] = React.useState<string | null>(null);
  const [lastHealthUpdate, setLastHealthUpdate] = React.useState<Date>(new Date());
  const [lastAircraftUpdate, setLastAircraftUpdate] = React.useState<Date>(new Date());

  // Fetch health status from proxy
  const fetchHealthStatus = React.useCallback(async () => {
    setIsLoadingHealth(true);
    setHealthError(null);

    try {
      const response = await fetch('/adsb-proxy/health', {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`Health check failed (${response.status})`);
      }

      const responseText = await response.text();

      if (responseText.trim().startsWith('<!doctype') || responseText.trim().startsWith('<html')) {
        throw new Error('Proxy returned HTML instead of JSON');
      }

      let healthData;
      try {
        healthData = JSON.parse(responseText);
      } catch {
        throw new Error('Invalid JSON from proxy');
      }

      setHealthStatus(healthData);
      setLastHealthUpdate(new Date());
    } catch (error: any) {
      setHealthError(error.message.includes('ECONNREFUSED')
        ? 'No proxy server detected in this environment'
        : `Network error: ${error.message}`);
      setHealthStatus({
        status: 'OFFLINE',
        rtl: { 
          status: 'OFFLINE', 
          detail: error.message
        },
        service: { active: false, detail: 'Service check failed' },
        file: { exists: false, recent: false },
        timestamp: Date.now(),
      });
    } finally {
      setIsLoadingHealth(false);
    }
  }, []);

  // Fetch aircraft data from proxy
  const fetchAircraftData = React.useCallback(async () => {
    setIsLoadingAircraft(true);
    setAircraftError(null);

    try {
      const response = await fetch('/adsb-proxy/aircraft.json', {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`Aircraft data request failed (${response.status})`);
      }

      const responseText = await response.text();
      
      if (responseText.trim().startsWith('<!doctype') || responseText.trim().startsWith('<html')) {
        throw new Error('Proxy returned HTML instead of JSON');
      }
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error(`Failed to parse response as JSON: ${parseError.message}`);
      }
      
      setAircraftData(data);
      setLastAircraftUpdate(new Date());
    } catch (error: any) {
      setAircraftError(error.message.includes('ECONNREFUSED') 
        ? 'No proxy server available in this environment'
        : error.message);
      setAircraftData(null);
    } finally {
      setIsLoadingAircraft(false);
    }
  }, []);

  // Fetch data on component mount
  React.useEffect(() => {
    fetchHealthStatus();
    fetchAircraftData();
  }, [fetchHealthStatus, fetchAircraftData]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ONLINE':
        return <CheckCircle className="h-5 w-5 lattice-status-good" />;
      case 'BUSY':
        return <AlertCircle className="h-5 w-5 lattice-status-warning" />;
      case 'OFFLINE':
        return <XCircle className="h-5 w-5 lattice-status-error" />;
      default:
        return <AlertCircle className="h-5 w-5 lattice-text-secondary" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ONLINE': return 'lattice-status-good';
      case 'BUSY': return 'lattice-status-warning';
      case 'OFFLINE': return 'lattice-status-error';
      default: return 'lattice-text-secondary';
    }
  };

  const getDataStatusIcon = () => {
    if (aircraftError) {
      return <XCircle className="h-5 w-5 lattice-status-error" />;
    }
    if (aircraftData) {
      return <CheckCircle className="h-5 w-5 lattice-status-good" />;
    }
    return <AlertCircle className="h-5 w-5 lattice-text-secondary" />;
  };

  const getDataStatusColor = () => {
    if (aircraftError) return 'lattice-status-error';
    if (aircraftData) return 'lattice-status-good';
    return 'lattice-text-secondary';
  };

  return (
    <div className="h-full p-4 overflow-y-auto lattice-scrollbar">
      <div className="space-y-4">
        {/* Hardware Status Section */}
        <div className="lattice-panel p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Radar className="h-5 w-5 lattice-status-primary" />
              <h3 className="text-sm font-semibold lattice-text-primary">Hardware Status</h3>
            </div>
            <button
              onClick={fetchHealthStatus}
              disabled={isLoadingHealth}
              className="lattice-button disabled:opacity-50 text-xs px-3 py-1 flex items-center space-x-1"
            >
              <RefreshCw className={`h-3 w-3 ${isLoadingHealth ? 'lattice-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          {/* RTL-SDR Status */}
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              {getStatusIcon(healthStatus.status)}
              <div>
                <div className={`font-semibold ${getStatusColor(healthStatus.status)}`}>
                  RTL-SDR Dongle: {healthStatus.status}
                </div>
                {healthStatus.rtl?.detail && (
                  <div className="text-xs lattice-text-secondary mt-1">
                    {healthStatus.rtl.detail}
                  </div>
                )}
              </div>
            </div>

            {/* Service Status */}
            {healthStatus.service && (
              <div className="flex items-center space-x-3">
                {healthStatus.service.active ? (
                  <CheckCircle className="h-5 w-5 lattice-status-good" />
                ) : (
                  <XCircle className="h-5 w-5 lattice-status-error" />
                )}
                <div>
                  <div className={`font-semibold ${healthStatus.service.active ? 'lattice-status-good' : 'lattice-status-error'}`}>
                    dump1090.service: {healthStatus.service.active ? 'Active' : 'Inactive'}
                  </div>
                  <div className="text-xs lattice-text-secondary mt-1">
                    {healthStatus.service.detail}
                  </div>
                </div>
              </div>
            )}

            {/* File Status */}
            {healthStatus.file && (
              <div className="flex items-center space-x-3">
                {healthStatus.file.recent ? (
                  <CheckCircle className="h-5 w-5 lattice-status-good" />
                ) : (
                  <XCircle className="h-5 w-5 lattice-status-error" />
                )}
                <div>
                  <div className={`font-semibold ${healthStatus.file.recent ? 'lattice-status-good' : 'lattice-status-error'}`}>
                    Data File: {healthStatus.file.recent ? 'Fresh Data' : 'Stale/Missing'}
                  </div>
                  <div className="text-xs lattice-text-secondary mt-1">
                    aircraft.json {healthStatus.file.exists ? 'exists' : 'missing'}
                    {healthStatus.file.recent ? ' and is recent' : ' or outdated'}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Health Error */}
          {healthError && (
            <div className="lattice-panel border-red-400 p-3 mt-3 bg-red-900/30">
              <div className="text-xs lattice-status-error font-semibold mb-1">Health Check Error:</div>
              <div className="text-xs lattice-text-primary">{healthError}</div>
            </div>
          )}

          {/* Last Update */}
          <div className="text-xs lattice-text-muted mt-3">
            Last checked: {lastHealthUpdate.toLocaleTimeString()}
          </div>
        </div>

        {/* Data Status Section */}
        <div className="lattice-panel p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 lattice-status-primary" />
              <h3 className="text-sm font-semibold lattice-text-primary">Data Status</h3>
            </div>
            <button
              onClick={fetchAircraftData}
              disabled={isLoadingAircraft}
              className="lattice-button disabled:opacity-50 text-xs px-3 py-1 flex items-center space-x-1"
            >
              <RefreshCw className={`h-3 w-3 ${isLoadingAircraft ? 'lattice-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          {/* Aircraft Data Status */}
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              {getDataStatusIcon()}
              <div>
                <div className={`font-semibold ${getDataStatusColor()}`}>
                  aircraft.json: {aircraftError ? 'Error' : aircraftData ? 'Accessible' : 'Unknown'}
                </div>
                {aircraftError ? (
                  <div className="text-xs lattice-text-secondary mt-1">
                    {aircraftError}
                  </div>
                ) : aircraftData ? (
                  <div className="text-xs lattice-text-secondary mt-1">
                    JSON data successfully parsed
                  </div>
                ) : (
                  <div className="text-xs lattice-text-secondary mt-1">
                    No data available
                  </div>
                )}
              </div>
            </div>

            {/* Aircraft Count */}
            {aircraftData && (
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <div className="lattice-text-secondary">Aircraft Count:</div>
                  <div className="lattice-text-primary font-semibold">
                    {aircraftData.aircraft_count || aircraftData.aircraft?.length || 0}
                  </div>
                </div>
                <div>
                  <div className="lattice-text-secondary">Messages:</div>
                  <div className="lattice-text-primary font-semibold">
                    {aircraftData.messages?.toLocaleString() || 'N/A'}
                  </div>
                </div>
                <div>
                  <div className="lattice-text-secondary">Timestamp:</div>
                  <div className="lattice-text-primary font-semibold">
                    {aircraftData.now ? new Date(aircraftData.now * 1000).toLocaleTimeString() : 'N/A'}
                  </div>
                </div>
                <div>
                  <div className="lattice-text-secondary">Data Size:</div>
                  <div className="lattice-text-primary font-semibold">
                    {aircraftData.aircraft ? `${aircraftData.aircraft.length} entries` : 'N/A'}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Aircraft Error */}
          {aircraftError && (
            <div className="lattice-panel border-red-400 p-3 mt-3 bg-red-900/30">
              <div className="text-xs lattice-status-error font-semibold mb-1">Data Access Error:</div>
              <div className="text-xs lattice-text-primary">{aircraftError}</div>
            </div>
          )}

          {/* Last Update */}
          <div className="text-xs lattice-text-muted mt-3">
            Last checked: {lastAircraftUpdate.toLocaleTimeString()}
          </div>
        </div>

        {/* Raw Data Preview */}
        {aircraftData && (
          <div className="lattice-panel p-4">
            <h3 className="text-sm font-semibold lattice-text-primary mb-3">Raw Data Preview</h3>
            <div className="lattice-panel p-3 bg-gray-900/50">
              <pre className="text-xs lattice-text-mono lattice-text-secondary overflow-x-auto">
                {JSON.stringify(
                  {
                    aircraft_count: aircraftData.aircraft_count || aircraftData.aircraft?.length || 0,
                    messages: aircraftData.messages,
                    now: aircraftData.now,
                    sample_aircraft: aircraftData.aircraft?.slice(0, 2) || []
                  },
                  null,
                  2
                )}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}