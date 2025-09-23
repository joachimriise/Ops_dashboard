import React from 'react';
import { Clock, Globe, MapPin, Satellite, Calendar } from 'lucide-react';

interface TimePanelProps {
  onHeaderClick: () => void;
  isSelecting: boolean;
  gpsData?: {
    connected: boolean;
    latitude?: number;
    longitude?: number;
    altitude?: number;
    accuracy?: number;
    satellites?: number;
    fix_quality?: 'NO_FIX' | '2D' | '3D' | 'DGPS';
  };
}

// Convert decimal degrees to MGRS (simplified approximation)
const toMGRS = (lat: number, lon: number): string => {
  const zone = Math.floor((lon + 180) / 6) + 1;
  const letter = String.fromCharCode(67 + Math.floor((lat + 80) / 8));
  const easting = Math.floor(((lon % 6) + 6) % 6 * 100000);
  const northing = Math.floor(((lat % 8) + 8) % 8 * 100000);
  return `${zone}${letter} ${easting.toString().padStart(5, '0')} ${northing.toString().padStart(5, '0')}`;
};

// Convert decimal degrees to UTM (simplified approximation)
const toUTM = (lat: number, lon: number): string => {
  const zone = Math.floor((lon + 180) / 6) + 1;
  const hemisphere = lat >= 0 ? 'N' : 'S';
  const easting = Math.floor(((lon % 6) + 6) % 6 * 100000) + 500000;
  const northing = lat >= 0 ? 
    Math.floor(lat * 110946.257) : 
    Math.floor((lat + 90) * 110946.257) + 10000000;
  return `${zone}${hemisphere} ${easting} ${northing}`;
};

// Get time for different locations
const getWorldTimes = (currentTime: Date) => {
  return [
    { name: 'Local', time: currentTime.toLocaleTimeString(), timezone: Intl.DateTimeFormat().resolvedOptions().timeZone },
    { name: 'Zulu (UTC)', time: currentTime.toUTCString().split(' ')[4], timezone: 'UTC' },
    { name: 'New York', time: currentTime.toLocaleTimeString('en-US', { timeZone: 'America/New_York' }), timezone: 'EST/EDT' },
    { name: 'London', time: currentTime.toLocaleTimeString('en-GB', { timeZone: 'Europe/London' }), timezone: 'GMT/BST' },
    { name: 'Tokyo', time: currentTime.toLocaleTimeString('ja-JP', { timeZone: 'Asia/Tokyo' }), timezone: 'JST' },
    { name: 'Sydney', time: currentTime.toLocaleTimeString('en-AU', { timeZone: 'Australia/Sydney' }), timezone: 'AEST/AEDT' }
  ];
};

export default function TimePanel({ onHeaderClick, isSelecting, gpsData }: TimePanelProps) {
  const [currentTime, setCurrentTime] = React.useState(new Date());
  const [timeLayer, setTimeLayer] = React.useState<'time' | 'position'>('time');

  // Demo GPS data if not available
  const demoGpsData = {
    connected: true,
    latitude: 59.9139,
    longitude: 10.7522,
    altitude: 156,
    accuracy: 3.2,
    satellites: 8,
    fix_quality: '3D' as const
  };

  const activeGpsData = gpsData?.connected ? gpsData : demoGpsData;

  // Update time every second
  React.useEffect(() => {
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timeInterval);
  }, []);

  const worldTimes = getWorldTimes(currentTime);

  return (
    <div className="lattice-panel flex flex-col h-full">
      {/* Main Header */}
      <div className={`lattice-header px-4 py-3 cursor-pointer transition-all ${
        isSelecting ? 'bg-gradient-to-r from-orange-500 to-amber-500' : ''
      }`} onClick={onHeaderClick}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 lattice-status-primary" />
            <span className="text-sm font-semibold lattice-text-primary">Time & Position</span>
          </div>
          <span className="text-xs lattice-text-secondary">
            {currentTime.toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Time Tabs */}
      <div className="border-b border-gray-700 px-3 py-2">
        <div className="flex space-x-1">
          <button
            onClick={() => setTimeLayer('time')}
            className={`lattice-tab px-3 py-1 text-xs rounded transition-all ${
              timeLayer === 'time'
                ? 'active'
                : ''
            }`}
          >
            <Clock className="h-3 w-3 inline mr-1" />
            Time
          </button>
          <button
            onClick={() => setTimeLayer('position')}
            className={`lattice-tab px-3 py-1 text-xs rounded transition-all ${
              timeLayer === 'position'
                ? 'active'
                : ''
            }`}
          >
            <MapPin className="h-3 w-3 inline mr-1" />
            Position
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 relative overflow-hidden">
        {/* Time Layer */}
        {timeLayer === 'time' && (
          <div className="absolute inset-0 p-4 overflow-y-auto lattice-scrollbar">
            <div className="space-y-4">
              {/* Current Date & Time Display */}
              <div className="lattice-panel p-4 text-center">
                <div className="text-2xl font-bold lattice-text-primary mb-2 font-mono">
                  {currentTime.toLocaleTimeString()}
                </div>
                <div className="text-lg lattice-text-secondary mb-2">
                  {currentTime.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </div>
                <div className="text-sm lattice-text-muted">
                  {Intl.DateTimeFormat().resolvedOptions().timeZone}
                </div>
              </div>

              {/* Zulu Time */}
              <div className="lattice-panel p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <Globe className="h-4 w-4 lattice-status-primary" />
                  <span className="text-sm font-semibold lattice-status-primary">Zulu Time (UTC)</span>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold lattice-text-primary font-mono">
                    {currentTime.toUTCString().split(' ')[4]}Z
                  </div>
                  <div className="text-sm lattice-text-secondary">
                    {currentTime.toUTCString().split(' ').slice(0, 4).join(' ')}
                  </div>
                </div>
              </div>

              {/* World Times */}
              <div className="lattice-panel p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <Calendar className="h-4 w-4 lattice-status-primary" />
                  <span className="text-sm font-semibold lattice-status-primary">World Times</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {worldTimes.slice(2).map((timeZone) => (
                    <div key={timeZone.name} className="lattice-panel p-2">
                      <div className="text-xs lattice-text-secondary">{timeZone.name}</div>
                      <div className="text-sm font-semibold lattice-text-primary font-mono">
                        {timeZone.time}
                      </div>
                      <div className="text-xs lattice-text-muted">{timeZone.timezone}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Julian Date & Day of Year */}
              <div className="lattice-panel p-4">
                <div className="text-sm font-semibold lattice-status-primary mb-3">Date Information</div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <div className="lattice-text-secondary">Day of Year:</div>
                    <div className="lattice-text-primary font-semibold">
                      {Math.ceil((currentTime.getTime() - new Date(currentTime.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24))}
                    </div>
                  </div>
                  <div>
                    <div className="lattice-text-secondary">Week:</div>
                    <div className="lattice-text-primary font-semibold">
                      {Math.ceil(((currentTime.getTime() - new Date(currentTime.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)) / 7)}
                    </div>
                  </div>
                  <div>
                    <div className="lattice-text-secondary">Unix Timestamp:</div>
                    <div className="lattice-text-primary font-semibold font-mono">
                      {Math.floor(currentTime.getTime() / 1000)}
                    </div>
                  </div>
                  <div>
                    <div className="lattice-text-secondary">ISO 8601:</div>
                    <div className="lattice-text-primary font-semibold font-mono text-xs">
                      {currentTime.toISOString().split('T')[0]}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Position Layer */}
        {timeLayer === 'position' && (
          <div className="absolute inset-0 p-4 overflow-y-auto lattice-scrollbar">
            <div className="space-y-4">
              {/* GPS Status */}
              <div className={`lattice-panel p-4 ${
                !gpsData?.connected ? 'border-amber-400 bg-amber-900/30' : ''
              }`}>
                <div className="flex items-center space-x-2 mb-3">
                  <Satellite className={`h-4 w-4 ${
                    activeGpsData.connected ? 'lattice-status-good' : 'lattice-status-warning'
                  }`} />
                  <span className="text-sm font-semibold lattice-status-primary">GPS Status</span>
                  {!gpsData?.connected && (
                    <span className="text-xs lattice-status-warning">(Demo Data)</span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <div className="lattice-text-secondary">Fix Quality:</div>
                    <div className={`font-semibold ${
                      activeGpsData.fix_quality === '3D' ? 'lattice-status-good' :
                      activeGpsData.fix_quality === '2D' ? 'lattice-status-warning' :
                      'lattice-status-error'
                    }`}>
                      {activeGpsData.fix_quality}
                    </div>
                  </div>
                  <div>
                    <div className="lattice-text-secondary">Satellites:</div>
                    <div className="lattice-text-primary font-semibold">
                      {activeGpsData.satellites}
                    </div>
                  </div>
                  <div>
                    <div className="lattice-text-secondary">Accuracy:</div>
                    <div className="lattice-text-primary font-semibold">
                      ±{activeGpsData.accuracy?.toFixed(1)}m
                    </div>
                  </div>
                  <div>
                    <div className="lattice-text-secondary">Altitude:</div>
                    <div className="lattice-text-primary font-semibold">
                      {activeGpsData.altitude?.toFixed(1)}m
                    </div>
                  </div>
                </div>
              </div>

              {/* Coordinates */}
              <div className="lattice-panel p-4">
                <div className="text-sm font-semibold lattice-status-primary mb-3">Coordinates</div>
                <div className="space-y-3">
                  <div>
                    <div className="text-xs lattice-text-secondary mb-1">Decimal Degrees</div>
                    <div className="lattice-panel p-2">
                      <div className="text-xs space-y-1">
                        <div><span className="lattice-text-secondary">LAT:</span> <span className="lattice-text-primary font-mono font-semibold">{activeGpsData.latitude?.toFixed(6)}°</span></div>
                        <div><span className="lattice-text-secondary">LON:</span> <span className="lattice-text-primary font-mono font-semibold">{activeGpsData.longitude?.toFixed(6)}°</span></div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs lattice-text-secondary mb-1">Degrees Minutes Seconds</div>
                    <div className="lattice-panel p-2">
                      <div className="text-xs space-y-1">
                        <div>
                          <span className="lattice-text-secondary">LAT:</span> 
                          <span className="lattice-text-primary font-mono font-semibold ml-1">
                            {Math.floor(Math.abs(activeGpsData.latitude!))}°{Math.floor((Math.abs(activeGpsData.latitude!) % 1) * 60)}'
                            {((Math.abs(activeGpsData.latitude!) % 1) * 60 % 1 * 60).toFixed(1)}"
                            {activeGpsData.latitude! >= 0 ? 'N' : 'S'}
                          </span>
                        </div>
                        <div>
                          <span className="lattice-text-secondary">LON:</span> 
                          <span className="lattice-text-primary font-mono font-semibold ml-1">
                            {Math.floor(Math.abs(activeGpsData.longitude!))}°{Math.floor((Math.abs(activeGpsData.longitude!) % 1) * 60)}'
                            {((Math.abs(activeGpsData.longitude!) % 1) * 60 % 1 * 60).toFixed(1)}"
                            {activeGpsData.longitude! >= 0 ? 'E' : 'W'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Grid References */}
              <div className="lattice-panel p-4">
                <div className="text-sm font-semibold lattice-status-primary mb-3">Grid References</div>
                <div className="space-y-3">
                  <div>
                    <div className="text-xs lattice-text-secondary mb-1">MGRS (Military Grid)</div>
                    <div className="lattice-panel p-2">
                      <div className="text-sm lattice-text-primary font-mono font-semibold">
                        {toMGRS(activeGpsData.latitude!, activeGpsData.longitude!)}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs lattice-text-secondary mb-1">UTM (Universal Transverse Mercator)</div>
                    <div className="lattice-panel p-2">
                      <div className="text-sm lattice-text-primary font-mono font-semibold">
                        {toUTM(activeGpsData.latitude!, activeGpsData.longitude!)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Location Info */}
              <div className="lattice-panel p-4">
                <div className="text-sm font-semibold lattice-status-primary mb-3">Location Information</div>
                <div className="text-xs space-y-2">
                  <div>
                    <span className="lattice-text-secondary">Timezone:</span>
                    <span className="lattice-text-primary font-semibold ml-2">
                      {Intl.DateTimeFormat().resolvedOptions().timeZone}
                    </span>
                  </div>
                  <div>
                    <span className="lattice-text-secondary">UTC Offset:</span>
                    <span className="lattice-text-primary font-semibold ml-2">
                      {currentTime.getTimezoneOffset() > 0 ? '-' : '+'}
                      {Math.abs(Math.floor(currentTime.getTimezoneOffset() / 60)).toString().padStart(2, '0')}:
                      {Math.abs(currentTime.getTimezoneOffset() % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                  <div>
                    <span className="lattice-text-secondary">Last Update:</span>
                    <span className="lattice-text-primary font-semibold ml-2">
                      {currentTime.toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}