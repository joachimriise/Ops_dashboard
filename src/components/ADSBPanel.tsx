import React from 'react';
import { Navigation, Plane, Settings, Radar, AlertTriangle, MapPin, Clock, Zap, Map, List } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon, LatLngTuple } from 'leaflet';
import { useLocalStorage } from '../hooks/useLocalStorage';
import 'leaflet/dist/leaflet.css';

interface Aircraft {
  icao: string;
  callsign: string;
  latitude: number;
  longitude: number;
  altitude: number;
  speed: number;
  heading: number;
  vertical_rate: number;
  squawk: string;
  aircraft_type: string;
  last_seen: Date;
  distance?: number;
  bearing?: number;
}

interface HealthStatus {
  status: 'ONLINE' | 'OFFLINE';
  timestamp: number;
  rtl?: {
    status: string;
    detail: string;
  };
  file?: {
    exists: boolean;
    recent: boolean;
  };
}

interface ADSBPanelProps {
  onHeaderClick: () => void;
  isSelecting: boolean;
  gpsData?: {
    connected: boolean;
    latitude?: number;
    longitude?: number;
  };
}

// Calculate distance between two points in kilometers
const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Calculate bearing between two points
const getBearing = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const lat1Rad = lat1 * Math.PI / 180;
  const lat2Rad = lat2 * Math.PI / 180;
  
  const y = Math.sin(dLon) * Math.cos(lat2Rad);
  const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
  
  const bearing = Math.atan2(y, x) * 180 / Math.PI;
  return (bearing + 360) % 360;
};

// Create aircraft marker icon
const createAircraftIcon = (heading: number, altitude: number, aircraftType: string) => {
  const color = altitude < 5000 ? '#ff4444' : altitude < 10000 ? '#ffaa00' : '#00ff88';
  
  // Determine aircraft symbol based on type
  let iconSvg = '';
  
  // Check for helicopter indicators
  if (aircraftType.toLowerCase().includes('h') || 
      aircraftType.toLowerCase().includes('helicopter') ||
      aircraftType.toLowerCase().includes('ec') ||
      aircraftType.toLowerCase().includes('bell') ||
      aircraftType.toLowerCase().includes('as') ||
      aircraftType.toLowerCase().includes('uh') ||
      aircraftType.toLowerCase().includes('ah')) {
    // Helicopter symbol
    iconSvg = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" transform="rotate(${heading})">
      <circle cx="12" cy="12" r="8" fill="${color}" stroke="#000" stroke-width="1"/>
      <path d="M4 12h16M12 4v16" stroke="#000" stroke-width="2"/>
      <path d="M6 6l12 12M18 6L6 18" stroke="#000" stroke-width="1"/>
    </svg>`;
  } else if (aircraftType.toLowerCase().includes('light') ||
             aircraftType.toLowerCase().includes('c1') ||
             aircraftType.toLowerCase().includes('c2') ||
             aircraftType.toLowerCase().includes('pa') ||
             aircraftType.toLowerCase().includes('sr') ||
             aircraftType.toLowerCase().includes('da') ||
             aircraftType.toLowerCase().includes('tb') ||
             aircraftType.toLowerCase().includes('p2') ||
             aircraftType.toLowerCase().includes('cessna') ||
             aircraftType.toLowerCase().includes('piper')) {
    // Small aircraft symbol
    iconSvg = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" transform="rotate(${heading})">
      <path d="M12 2L13 10L20 12L13 14L12 22L11 14L4 12L11 10L12 2Z" fill="${color}" stroke="#000" stroke-width="1"/>
      <circle cx="12" cy="12" r="2" fill="#000"/>
    </svg>`;
  } else if (aircraftType.toLowerCase().includes('heavy') ||
             aircraftType.toLowerCase().includes('a3') ||
             aircraftType.toLowerCase().includes('a4') ||
             aircraftType.toLowerCase().includes('b7') ||
             aircraftType.toLowerCase().includes('b74') ||
             aircraftType.toLowerCase().includes('b77') ||
             aircraftType.toLowerCase().includes('b78') ||
             aircraftType.toLowerCase().includes('a380') ||
             aircraftType.toLowerCase().includes('boeing') ||
             aircraftType.toLowerCase().includes('airbus')) {
    // Large aircraft symbol
    iconSvg = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" transform="rotate(${heading})">
      <path d="M12 2L15 8L22 10L15 12L12 22L9 12L2 10L9 8L12 2Z" fill="${color}" stroke="#000" stroke-width="1"/>
      <rect x="10" y="10" width="4" height="4" fill="#000"/>
      <path d="M8 8L16 16M16 8L8 16" stroke="#000" stroke-width="1"/>
    </svg>`;
  } else if (aircraftType.toLowerCase().includes('mil') ||
             aircraftType.toLowerCase().includes('f') ||
             aircraftType.toLowerCase().includes('fighter') ||
             aircraftType.toLowerCase().includes('military') ||
             aircraftType.toLowerCase().includes('eurofighter') ||
             aircraftType.toLowerCase().includes('tornado') ||
             aircraftType.toLowerCase().includes('hawk')) {
    // Military aircraft symbol
    iconSvg = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" transform="rotate(${heading})">
      <path d="M12 2L14 6L20 8L14 10L12 22L10 10L4 8L10 6L12 2Z" fill="${color}" stroke="#000" stroke-width="1"/>
      <polygon points="8,8 16,8 14,12 10,12" fill="#000"/>
      <path d="M12 6v12" stroke="#000" stroke-width="2"/>
    </svg>`;
  } else {
    // Default commercial aircraft symbol
    iconSvg = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" transform="rotate(${heading})">
      <path d="M12 2L14 8L20 10L14 12L12 22L10 12L4 10L10 8L12 2Z" fill="${color}" stroke="#000" stroke-width="1"/>
      <circle cx="12" cy="12" r="1.5" fill="#000"/>
    </svg>`;
  }
  
  return new Icon({
    iconUrl: 'data:image/svg+xml;utf8,' + encodeURIComponent(iconSvg),
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
};

export default function ADSBPanel({ onHeaderClick, isSelecting, gpsData }: ADSBPanelProps) {
  const [adsbLayer, setAdsbLayer] = React.useState<'map' | 'aircraft' | 'settings'>('map');
  const [aircraft, setAircraft] = React.useState<Aircraft[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [lastUpdate, setLastUpdate] = React.useState<Date>(new Date());
  const [selectedAircraft, setSelectedAircraft] = React.useState<string | null>(null);
  const [mapCenter, setMapCenter] = React.useState<LatLngTuple>([59.9139, 10.7522]);
  const [mapZoom, setMapZoom] = React.useState(8);
  const [maxRange, setMaxRange] = useLocalStorage('adsbMaxRange', 250); // km
  const [minAltitude, setMinAltitude] = useLocalStorage('adsbMinAltitude', 0); // feet
  const [maxAltitude, setMaxAltitude] = useLocalStorage('adsbMaxAltitude', 50000); // feet
  const [showMilitary, setShowMilitary] = useLocalStorage('adsbShowMilitary', true);
  const [showCivilian, setShowCivilian] = useLocalStorage('adsbShowCivilian', true);
  const [searchRadius, setSearchRadius] = useLocalStorage('adsbSearchRadius', 100); // km radius for API search
  const [error, setError] = React.useState<string | null>(null);
  const [healthStatus, setHealthStatus] = React.useState<HealthStatus>({
    status: 'OFFLINE',
    timestamp: Date.now()
  });
  const [hardwareConnected, setHardwareConnected] = React.useState(false);

  // Fetch live ADS-B data from local proxy
  const fetchADSBData = React.useCallback(async () => {
    // Only fetch data if hardware is connected
    if (!hardwareConnected) {
      setAircraft([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost/adsb-proxy/aircraft.json', {
        method: 'GET',
        // Removed AbortSignal.timeout for better compatibility with older browsers
      });

      if (!response.ok) {
        const errorText = await response.text();
        
        // Check if we got HTML instead of expected JSON (indicates proxy server not running)
        if (errorText.trim().startsWith('<!doctype') || errorText.trim().startsWith('<html')) {
          throw new Error(`Proxy server not running - got HTML response instead of JSON data. Please start the proxy server with 'npm run proxy' (port 3001).`);
        }
        
        throw new Error(`Proxy server error: ${response.status} - ${errorText}`);
      }

      // Parse JSON regardless of content-type (dump1090 often sends text/plain)
      // Read response text first, then parse as JSON
      const responseText = await response.text();
      
      // Check if we got HTML instead of expected JSON
      if (responseText.trim().startsWith('<!doctype') || responseText.trim().startsWith('<html')) {
        throw new Error(`Proxy server not running - got HTML response instead of JSON data. Please start the proxy server with 'npm run proxy'.`);
      }
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error(`Failed to parse response as JSON: ${parseError.message}. Response: ${responseText.substring(0, 200)}`);
      }
      
      // Check if we got an error response from the proxy
      if (data.error) {
        console.warn('ADS-B hardware/dump1090 not available:', data.error);
        setAircraft([]);
        setHealthStatus({
          status: 'OFFLINE',
          reason: data.error,
          timestamp: Date.now()
        });
        return;
      }
      
      if (!data.aircraft) {
        data.aircraft = [];
      }
      
      // Update health status based on data quality and message count
      const now = Date.now() / 1000;
      const dataAge = data.now ? Math.abs(now - data.now) : 0;
      const messageCount = data.messages || 0;
      
      // Check multiple indicators for RTL-SDR health
      if (dataAge > 30 || messageCount === 0) {
        // Data is too old or no messages received - RTL-SDR likely disconnected
        setHealthStatus({
          status: 'OFFLINE',
          reason: messageCount === 0 ? 'No messages received - RTL-SDR disconnected' : `Stale data (${dataAge.toFixed(0)}s old)`,
          timestamp: Date.now()
        });
      } else {
        // Data is fresh and messages are being received
        setHealthStatus({
          status: 'ONLINE',
          aircraftCount: data.aircraft.length,
          messageCount: messageCount,
          dataAge: dataAge,
          timestamp: Date.now()
        });
      }

      // Transform dump1090-mutability data to our Aircraft interface
      const aircraftData: Aircraft[] = data.aircraft.map((ac: any) => {
        const refLat = gpsData?.latitude || 59.9139;
        const refLon = gpsData?.longitude || 10.7522;
        
        // dump1090-mutability JSON format
        const aircraft: Aircraft = {
          icao: ac.hex || 'UNKNOWN',
          callsign: ac.flight?.trim() || 'UNKNOWN',
          latitude: ac.lat || 0,
          longitude: ac.lon || 0,
          altitude: ac.alt_baro || 0, // Already in feet
          speed: ac.gs || 0, // Already in knots
          heading: ac.track || 0,
          vertical_rate: ac.baro_rate || 0, // Already in ft/min
          squawk: ac.squawk || '0000',
          aircraft_type: ac.category || ac.type || 'civilian',
          last_seen: new Date(),
          distance: ac.lat && ac.lon ? getDistance(refLat, refLon, ac.lat, ac.lon) : undefined,
          bearing: ac.lat && ac.lon ? getBearing(refLat, refLon, ac.lat, ac.lon) : undefined
        };
        
        return aircraft;
      }).filter((ac: Aircraft) => {
        // Filter out aircraft without valid position data
        return ac.latitude !== 0 && ac.longitude !== 0 && 
               !isNaN(ac.latitude) && !isNaN(ac.longitude) &&
               ac.icao !== 'UNKNOWN';
      });

      setAircraft(aircraftData);
      setLastUpdate(new Date());
    } catch (error: any) {
      console.error('Error fetching aircraft data:', error);
      setError(error.message.includes('ECONNREFUSED') 
        ? 'No proxy server available in this environment'
        : error.message);
      setAircraft([]);
    } finally {
      setIsLoading(false);
    }
  }, [gpsData]);

  // Fetch health status from proxy
  const fetchHealthStatus = React.useCallback(async () => {
    try {
      const response = await fetch('http://localhost/adsb-proxy/health', {
        method: 'GET',
        // Removed AbortSignal.timeout for better compatibility with older browsers
      });

      const responseText = await response.text();

      if (!response.ok) {
        // Instead of throwing, mark as offline gracefully
        setHealthStatus({
          status: 'OFFLINE',
          reason: `Health check failed (${response.status})`,
          timestamp: Date.now(),
        });
        setHardwareConnected(false);
        return;
      }

      if (responseText.trim().startsWith('<!doctype') || responseText.trim().startsWith('<html')) {
        setHealthStatus({
          status: 'OFFLINE',
          reason: 'Proxy returned HTML instead of JSON',
          timestamp: Date.now(),
        });
        setHardwareConnected(false);
        return;
      }

      let healthData;
      try {
        healthData = JSON.parse(responseText);
      } catch {
        setHealthStatus({
          status: 'OFFLINE',
          reason: 'Invalid JSON from proxy',
          timestamp: Date.now(),
        });
        setHardwareConnected(false);
        return;
      }

      setHealthStatus(healthData);
      
      // Update hardware connection status
      const isHardwareConnected = healthData.rtlsdr && 
        (healthData.rtlsdr.status === 'BUSY' || healthData.rtlsdr.status === 'ONLINE');
      setHardwareConnected(isHardwareConnected);
    } catch (error: any) {
      setHealthStatus({
        status: 'OFFLINE',
        reason: error.message.includes('ECONNREFUSED')
          ? 'No proxy server detected in this environment'
          : `Network error: ${error.message}`,
        timestamp: Date.now(),
      });
      setHardwareConnected(false);
    }
  }, []);

  // Fetch ADS-B data on component mount and set up interval
  React.useEffect(() => {
    // Center map on GPS if available
    if (gpsData?.connected && gpsData.latitude && gpsData.longitude) {
      setMapCenter([gpsData.latitude, gpsData.longitude]);
    }
  }, [gpsData]);

  // Fetch ADS-B data on component mount and set up interval
  React.useEffect(() => {
    // Initial fetch
    fetchHealthStatus();

    // Set up health check interval (always runs to detect hardware)
    const healthInterval = setInterval(fetchHealthStatus, 10000);

    // Set up aircraft data interval (only when hardware is connected)
    let aircraftInterval: NodeJS.Timeout;
    
    const startDataFetching = () => {
      if (hardwareConnected) {
        fetchADSBData(); // Initial fetch
        aircraftInterval = setInterval(fetchADSBData, 2000);
      }
    };
    
    // Start data fetching if hardware is already connected
    startDataFetching();
    
    // Watch for hardware connection changes
    const hardwareCheckInterval = setInterval(() => {
      if (hardwareConnected && !aircraftInterval) {
        startDataFetching();
      } else if (!hardwareConnected && aircraftInterval) {
        clearInterval(aircraftInterval);
        aircraftInterval = undefined;
      }
    }, 1000);

    return () => {
      clearInterval(healthInterval);
      clearInterval(hardwareCheckInterval);
      if (aircraftInterval) clearInterval(aircraftInterval);
    };
  }, [fetchADSBData, fetchHealthStatus, hardwareConnected]);

  // Filter aircraft based on settings
  const filteredAircraft = aircraft.filter(ac => {
    if (ac.altitude < minAltitude || ac.altitude > maxAltitude) return false;
    if (ac.distance && ac.distance > maxRange) return false;
    
    // Simple military/civilian classification based on squawk codes
    const isMilitary = ac.squawk.startsWith('7') && parseInt(ac.squawk) > 7500;
    if (isMilitary && !showMilitary) return false;
    if (!isMilitary && !showCivilian) return false;
    
    return true;
  });

  const getAltitudeColor = (altitude: number) => {
    if (altitude < 5000) return 'lattice-status-error';
    if (altitude < 10000) return 'lattice-status-warning';
    return 'lattice-status-good';
  };

  const getVerticalRateIcon = (rate: number) => {
    if (rate > 500) return '↗';
    if (rate < -500) return '↘';
    return '→';
  };

  return (
    <div className="lattice-panel flex flex-col h-full">
      {/* Main Header */}
      <div className={`lattice-header px-4 py-3 cursor-pointer transition-all ${
        isSelecting ? 'bg-gradient-to-r from-orange-500 to-amber-500' : ''
      }`} onClick={onHeaderClick}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Navigation className="h-4 w-4 lattice-status-primary" />
            <span className="text-sm font-semibold lattice-text-primary">ADS-B Surveillance</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${healthStatus.status === 'ONLINE' ? 'bg-green-400' : 'bg-red-400'}`} />
            <span className="text-xs lattice-text-secondary">
              {filteredAircraft.length} aircraft
            </span>
          </div>
        </div>
      </div>

      {/* ADS-B Tabs */}
      <div className="border-b border-gray-700 px-3 py-2">
        <div className="flex items-center justify-between">
          <div className="flex space-x-1">
            <button
              onClick={() => setAdsbLayer('map')}
              className={`lattice-tab px-3 py-1 text-xs rounded transition-all ${
                adsbLayer === 'map'
                  ? 'active'
                  : ''
              }`}
            >
              <Map className="h-3 w-3 inline mr-1" />
              Map
            </button>
            <button
              onClick={() => setAdsbLayer('aircraft')}
              className={`lattice-tab px-3 py-1 text-xs rounded transition-all ${
                adsbLayer === 'aircraft'
                  ? 'active'
                  : ''
              }`}
            >
              <Plane className="h-3 w-3 inline mr-1" />
              Aircraft
            </button>
            <button
              onClick={() => setAdsbLayer('settings')}
              className={`lattice-tab px-3 py-1 text-xs rounded transition-all ${
                adsbLayer === 'settings'
                  ? 'active'
                  : ''
              }`}
            >
              <Settings className="h-3 w-3 inline mr-1" />
              Settings
            </button>
          </div>
          
          <div className="flex items-center space-x-1 ml-auto px-2 py-1 lattice-panel rounded">
            <span className="text-xs lattice-text-secondary flex items-center">
              <Radar className={`h-3 w-3 mr-1 ${healthStatus.status === 'ONLINE' ? 'lattice-status-good' : 'lattice-status-error'}`} />
              ADS-B: {healthStatus.status}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 relative overflow-hidden">
        {/* Map Layer */}
        {adsbLayer === 'map' && (
          <div className="absolute inset-0">
            {/* Hardware Not Detected Overlay */}
            {!hardwareConnected && (
              <div className="absolute inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="lattice-panel-elevated p-8 max-w-md w-full mx-4 text-center">
                  <div className="flex items-center justify-center mb-4">
                    <Radar className="h-12 w-12 lattice-status-error" />
                  </div>
                  <h3 className="text-lg font-semibold lattice-status-error mb-2">
                    ADS-B Hardware Not Detected
                  </h3>
                  <div className="space-y-2 text-sm lattice-text-secondary">
                    <p>RTL-SDR dongle is not connected or not detected.</p>
                    <p>Please check:</p>
                    <ul className="list-disc list-inside text-left space-y-1 mt-2">
                      <li>RTL-SDR dongle is plugged in</li>
                      <li>USB connection is secure</li>
                      <li>Device drivers are installed</li>
                      <li>No other software is using the device</li>
                    </ul>
                  </div>
                  <div className="mt-4 text-xs lattice-text-muted">
                    Hardware detection runs automatically every 10 seconds
                  </div>
                </div>
              </div>
            )}
            
            {/* Map Container - Full width */}
            <div className="h-full">
              <MapContainer
                center={mapCenter}
                zoom={mapZoom}
                style={{ height: '100%', width: '100%' }}
                zoomControl={true}
                attributionControl={false}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution="© OpenStreetMap contributors"
                  maxZoom={19}
                  className="map-lattice"
                />
                
                {/* GPS Position Marker */}
                {gpsData?.connected && gpsData.latitude && gpsData.longitude && (
                  <Marker
                    position={[gpsData.latitude, gpsData.longitude]}
                    icon={new Icon({
                      iconUrl: 'data:image/svg+xml;base64,' + btoa(`<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="16" cy="16" r="14" fill="none" stroke="#00ff88" stroke-width="3" opacity="0.8"/>
                        <circle cx="16" cy="16" r="8" fill="none" stroke="#00ff88" stroke-width="2"/>
                        <circle cx="16" cy="16" r="3" fill="#00ff88"/>
                        <path d="M16 2v6M16 24v6M2 16h6M24 16h6" stroke="#00ff88" stroke-width="2"/>
                      </svg>`),
                      iconSize: [32, 32],
                      iconAnchor: [16, 16],
                      popupAnchor: [0, -16],
                    })}
                  >
                    <Popup>
                      <div className="lattice-panel p-3 text-xs lattice-text-mono min-w-[200px]">
                        <div className="font-semibold lattice-status-good mb-2 text-center">GPS Position</div>
                        <div className="space-y-1">
                          <div><span className="lattice-text-secondary">LAT:</span> <span className="lattice-text-primary">{gpsData.latitude.toFixed(6)}°</span></div>
                          <div><span className="lattice-text-secondary">LON:</span> <span className="lattice-text-primary">{gpsData.longitude.toFixed(6)}°</span></div>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                )}
                
                {/* Aircraft Markers */}
                {filteredAircraft.map((aircraft) => (
                  <Marker
                    key={aircraft.icao}
                    position={[aircraft.latitude, aircraft.longitude]}
                    icon={createAircraftIcon(aircraft.heading, aircraft.altitude, aircraft.aircraft_type)}
                  >
                    <Popup>
                      <div className="lattice-panel p-3 text-xs lattice-text-mono min-w-[250px]">
                        <div className="font-semibold lattice-status-primary mb-2 text-center">
                          {aircraft.callsign} ({aircraft.aircraft_type})
                        </div>
                        
                        <div className="space-y-1 mb-2">
                          <div><span className="lattice-text-secondary">ICAO:</span> <span className="lattice-text-primary">{aircraft.icao}</span></div>
                          <div><span className="lattice-text-secondary">Squawk:</span> <span className="lattice-text-primary">{aircraft.squawk}</span></div>
                          <div><span className="lattice-text-secondary">Altitude AMSL:</span> <span className={`font-semibold ${getAltitudeColor(aircraft.altitude)}`}>{aircraft.altitude.toLocaleString()}ft ({Math.round(aircraft.altitude * 0.3048)}m)</span></div>
                          <div><span className="lattice-text-secondary">Speed:</span> <span className="lattice-text-primary">{aircraft.speed}kts</span></div>
                          <div><span className="lattice-text-secondary">Heading:</span> <span className="lattice-text-primary">{aircraft.heading}°</span></div>
                          <div><span className="lattice-text-secondary">V/Rate:</span> <span className="lattice-text-primary">{getVerticalRateIcon(aircraft.vertical_rate)} {Math.abs(aircraft.vertical_rate)}ft/min</span></div>
                        </div>
                        
                        <div className="space-y-1 mb-2">
                          <div><span className="lattice-text-secondary">LAT:</span> <span className="lattice-text-primary">{aircraft.latitude.toFixed(6)}°</span></div>
                          <div><span className="lattice-text-secondary">LON:</span> <span className="lattice-text-primary">{aircraft.longitude.toFixed(6)}°</span></div>
                        </div>
                        
                        {aircraft.distance && aircraft.bearing && (
                          <div className="border-t border-gray-600 pt-2 mt-2">
                            <div className="lattice-text-secondary text-xs mb-1">From GPS:</div>
                            <div><span className="lattice-text-secondary">Distance:</span> <span className="lattice-text-primary">{aircraft.distance.toFixed(1)}km</span></div>
                            <div><span className="lattice-text-secondary">Bearing:</span> <span className="lattice-text-primary">{aircraft.bearing.toFixed(0)}°</span></div>
                          </div>
                        )}
                        
                        <div className="border-t border-gray-600 pt-2 mt-2 lattice-text-muted">
                          <div>Last seen: {aircraft.last_seen.toLocaleTimeString()}</div>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </div>
        )}

        {/* Aircraft Layer */}
        {adsbLayer === 'aircraft' && (
          <div className="absolute inset-0 p-4 overflow-y-auto lattice-scrollbar">
            {!hardwareConnected ? (
              <div className="text-center lattice-text-muted py-8">
                <Radar className="h-8 w-8 mx-auto mb-2 lattice-status-error" />
                <p className="lattice-status-error">ADS-B Hardware Not Detected</p>
                <p className="text-xs mt-2 lattice-text-secondary">
                  {healthStatus.rtl?.detail || 'RTL-SDR dongle not found'}
                </p>
                <p className="text-xs mt-1 lattice-text-secondary">
                  Connect RTL-SDR hardware to begin aircraft tracking
                </p>
              </div>
            ) : isLoading ? (
              <div className="text-center lattice-text-muted py-8">
                <Radar className="h-8 w-8 mx-auto mb-2 opacity-50 lattice-spin" />
                <p>Loading aircraft data...</p>
                <p className="text-xs mt-2">Searching {searchRadius}km radius</p>
              </div>
            ) : error ? (
              <div className="text-center lattice-text-muted py-8">
                <AlertTriangle className="h-8 w-8 mx-auto mb-2 lattice-status-error" />
                <p className="lattice-status-error">ADS-B Connection Error</p>
                <p className="text-xs mt-2 lattice-text-secondary">{error}</p>
                <p className="text-xs mt-1 lattice-text-secondary">Make sure the proxy server is running</p>
                <button
                  onClick={fetchADSBData}
                  className="lattice-button text-xs px-3 py-1 mt-3"
                >
                  Retry
                </button>
              </div>
            ) : filteredAircraft.length === 0 ? (
              <div className="text-center lattice-text-muted py-8">
                <Plane className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No aircraft detected</p>
                <p className="text-xs mt-2">No aircraft in RTL-SDR range</p>
                <p className="text-xs mt-1">Check antenna and receiver position</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredAircraft.map((ac) => (
                  <div 
                    key={ac.icao} 
                    className={`lattice-panel p-3 cursor-pointer transition-all ${
                      selectedAircraft === ac.icao ? 'border-cyan-400 lattice-glow' : 'hover:lattice-glow'
                    }`}
                    onClick={() => setSelectedAircraft(selectedAircraft === ac.icao ? null : ac.icao)}
                  >
                    {/* Aircraft Header */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Plane className="h-4 w-4 lattice-status-primary" />
                        <span className="font-semibold lattice-text-primary">{ac.callsign}</span>
                        <span className="text-xs lattice-text-secondary">({ac.aircraft_type})</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs lattice-text-mono lattice-text-secondary">{ac.icao}</span>
                        <span className="text-xs lattice-text-mono lattice-text-secondary">{ac.squawk}</span>
                      </div>
                    </div>

                    {/* Aircraft Data Grid */}
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <div className="lattice-text-secondary">Altitude</div>
                        <div className={`font-semibold ${getAltitudeColor(ac.altitude)}`}>
                          {ac.altitude.toLocaleString()}ft
                        </div>
                      </div>
                      <div>
                        <div className="lattice-text-secondary">Speed</div>
                        <div className="lattice-text-primary font-semibold">{ac.speed}kts</div>
                      </div>
                      <div>
                        <div className="lattice-text-secondary">Heading</div>
                        <div className="lattice-text-primary font-semibold">{ac.heading}°</div>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {selectedAircraft === ac.icao && (
                      <div className="mt-3 pt-3 border-t border-gray-600">
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <div className="lattice-text-secondary">Position:</div>
                            <div className="lattice-text-primary font-mono">
                              {ac.latitude.toFixed(4)}°, {ac.longitude.toFixed(4)}°
                            </div>
                          </div>
                          <div>
                            <div className="lattice-text-secondary">Vertical Rate:</div>
                            <div className="lattice-text-primary font-semibold">
                              {getVerticalRateIcon(ac.vertical_rate)} {Math.abs(ac.vertical_rate)}ft/min
                            </div>
                          </div>
                          {ac.distance && (
                            <div>
                              <div className="lattice-text-secondary">Distance:</div>
                              <div className="lattice-text-primary font-semibold">{ac.distance.toFixed(1)}km</div>
                            </div>
                          )}
                          {ac.bearing && (
                            <div>
                              <div className="lattice-text-secondary">Bearing:</div>
                              <div className="lattice-text-primary font-semibold">{ac.bearing.toFixed(0)}°</div>
                            </div>
                          )}
                          <div>
                            <div className="lattice-text-secondary">Last Seen:</div>
                            <div className="lattice-text-primary font-semibold">
                              {ac.last_seen.toLocaleTimeString()}
                            </div>
                          </div>
                          <div>
                            <div className="lattice-text-secondary">Age:</div>
                            <div className="lattice-text-primary font-semibold">
                              {Math.floor((Date.now() - ac.last_seen.getTime()) / 1000)}s
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Settings Layer */}
        {adsbLayer === 'settings' && (
          <div className="absolute inset-0 p-4 overflow-y-auto lattice-scrollbar">
            <div className="space-y-4">
              {/* Range Settings */}
              <div className="lattice-panel p-4">
                <div className="text-sm lattice-status-primary mb-3 font-semibold">Filters</div>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs lattice-text-secondary block mb-1">
                      Maximum Range: {maxRange}km
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="500"
                      step="10"
                      value={maxRange}
                      onChange={(e) => setMaxRange(parseInt(e.target.value))}
                      className="w-full accent-cyan-400"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs lattice-text-secondary block mb-1">Min Altitude (ft)</label>
                      <input
                        type="number"
                        value={minAltitude}
                        onChange={(e) => setMinAltitude(parseInt(e.target.value) || 0)}
                        className="w-full lattice-input text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs lattice-text-secondary block mb-1">Max Altitude (ft)</label>
                      <input
                        type="number"
                        value={maxAltitude}
                        onChange={(e) => setMaxAltitude(parseInt(e.target.value) || 50000)}
                        className="w-full lattice-input text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Aircraft Type Filters */}
              <div className="lattice-panel p-4">
                <div className="text-sm lattice-status-primary mb-3 font-semibold">Aircraft Types</div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm lattice-text-primary">Show Civilian Aircraft</span>
                    <button
                      onClick={() => setShowCivilian(!showCivilian)}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        showCivilian ? 'bg-green-600' : 'bg-gray-600'
                      }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                        showCivilian ? 'translate-x-6' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm lattice-text-primary">Show Military Aircraft</span>
                    <button
                      onClick={() => setShowMilitary(!showMilitary)}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        showMilitary ? 'bg-green-600' : 'bg-gray-600'
                      }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                        showMilitary ? 'translate-x-6' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Hardware Status */}
              <div className="lattice-panel p-4">
                <div className="text-sm lattice-status-primary mb-3 font-semibold">Hardware Status</div>
                <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                  <div>
                    <div className="lattice-text-secondary">Status:</div>
                    <div className={`font-semibold ${healthStatus.status === 'ONLINE' ? 'lattice-status-good' : 'lattice-status-error'}`}>
                      {healthStatus.status}
                    </div>
                  </div>
                  <div>
                    <div className="lattice-text-secondary">RTL-SDR:</div>
                    <div className={`font-semibold ${hardwareConnected ? 'lattice-status-good' : 'lattice-status-error'}`}>
                      {hardwareConnected ? (
                        healthStatus.rtlsdr?.status === 'BUSY' ? 'Connected (In Use)' : 'Connected (Available)'
                      ) : (
                        'Not Detected'
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="lattice-text-secondary">Hardware Status:</div>
                    <div className={`font-semibold ${hardwareConnected ? 'lattice-status-good' : 'lattice-status-error'}`}>
                      {hardwareConnected ? 'Connected' : 'Disconnected'}
                    </div>
                  </div>
                  <div>
                    <div className="lattice-text-secondary">Data Collection:</div>
                    <div className={`font-semibold ${hardwareConnected ? 'lattice-status-good' : 'lattice-status-error'}`}>
                      {hardwareConnected ? 'Active' : 'Suspended'}
                    </div>
                  </div>
                  <div>
                    <div className="lattice-text-secondary">Messages:</div>
                    <div className="lattice-text-primary font-semibold">{hardwareConnected ? (healthStatus.messageCount || 0) : 'N/A'}</div>
                  </div>
                  <div>
                    <div className="lattice-text-secondary">Aircraft:</div>
                    <div className="lattice-text-primary font-semibold">{hardwareConnected ? filteredAircraft.length : 'N/A'}</div>
                  </div>
                  <div>
                    <div className="lattice-text-secondary">Frequency:</div>
                    <div className="lattice-text-primary font-semibold">{hardwareConnected ? '1090 MHz' : 'N/A'}</div>
                  </div>
                  <div>
                    <div className="lattice-text-secondary">Last Update:</div>
                    <div className="lattice-text-primary font-semibold">{hardwareConnected ? lastUpdate.toLocaleTimeString() : 'N/A'}</div>
                  </div>
                </div>
                
                <div className="mt-3">
                  {hardwareConnected ? (
                    <button
                      onClick={fetchADSBData}
                      disabled={isLoading}
                      className="lattice-button disabled:opacity-50 text-xs px-3 py-1 flex items-center space-x-1"
                    >
                      <Radar className={`h-3 w-3 ${isLoading ? 'lattice-spin' : ''}`} />
                      <span>{isLoading ? 'Loading...' : 'Refresh Data'}</span>
                    </button>
                  ) : (
                    <button
                      onClick={fetchHealthStatus}
                      className="lattice-button text-xs px-3 py-1 flex items-center space-x-1"
                    >
                      <Radar className="h-3 w-3" />
                      <span>Check Hardware</span>
                    </button>
                  )}
                </div>
                
                {!hardwareConnected && healthStatus.rtl?.detail && (
                  <div className="lattice-panel border-red-400 p-3 mt-3 bg-red-900/30">
                    <div className="text-xs lattice-status-error font-semibold mb-1">Hardware Status:</div>
                    <div className="text-xs lattice-text-primary">{healthStatus.rtlsdr?.detail}</div>
                  </div>
                )}
                
                {hardwareConnected && error && (
                  <div className="lattice-panel border-red-400 p-3 mt-3 bg-red-900/30">
                    <div className="text-xs lattice-status-error font-semibold mb-1">Data Error:</div>
                    <div className="text-xs lattice-text-primary">{error}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}