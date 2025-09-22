import React from 'react';
import { Navigation, Plane, Settings, Radar, AlertTriangle, MapPin, Clock, Zap, Map, List, Activity } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
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

interface ADSBDemoPanelProps {
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
  
  let iconSvg = '';
  
  // Check for helicopter indicators
  if (aircraftType.toLowerCase().includes('h') || 
      aircraftType.toLowerCase().includes('helicopter') ||
      aircraftType.toLowerCase().includes('ec') ||
      aircraftType.toLowerCase().includes('bell') ||
      aircraftType.toLowerCase().includes('as') ||
      aircraftType.toLowerCase().includes('uh') ||
      aircraftType.toLowerCase().includes('ah')) {
    // Improved helicopter symbol
    iconSvg = `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" transform="rotate(${heading})">
      <ellipse cx="14" cy="14" rx="12" ry="6" fill="${color}" stroke="#000" stroke-width="1.5"/>
      <rect x="12" y="8" width="4" height="12" fill="#000" rx="1"/>
      <ellipse cx="14" cy="6" rx="10" ry="1.5" fill="#333" opacity="0.8"/>
      <ellipse cx="14" cy="22" rx="8" ry="1" fill="#333" opacity="0.6"/>
      <circle cx="14" cy="14" r="2" fill="#000"/>
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
    // Improved small aircraft symbol
    iconSvg = `<svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg" transform="rotate(${heading})">
      <path d="M13 3L14 9L22 11L14 13L13 23L12 13L4 11L12 9L13 3Z" fill="${color}" stroke="#000" stroke-width="1.2"/>
      <ellipse cx="13" cy="11" rx="8" ry="2" fill="${color}" opacity="0.7"/>
      <rect x="12" y="8" width="2" height="10" fill="#000" opacity="0.8"/>
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
    // Improved large aircraft symbol
    iconSvg = `<svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg" transform="rotate(${heading})">
      <path d="M15 2L17 7L26 9L17 11L15 28L13 11L4 9L13 7L15 2Z" fill="${color}" stroke="#000" stroke-width="1.2"/>
      <ellipse cx="15" cy="9" rx="11" ry="3" fill="${color}" opacity="0.6"/>
      <rect x="13" y="6" width="4" height="18" fill="#000" opacity="0.7"/>
      <ellipse cx="15" cy="15" rx="2" ry="6" fill="#000" opacity="0.8"/>
    </svg>`;
  } else if (aircraftType.toLowerCase().includes('mil') ||
             aircraftType.toLowerCase().includes('f') ||
             aircraftType.toLowerCase().includes('fighter') ||
             aircraftType.toLowerCase().includes('military') ||
             aircraftType.toLowerCase().includes('eurofighter') ||
             aircraftType.toLowerCase().includes('tornado') ||
             aircraftType.toLowerCase().includes('hawk')) {
    // Improved military aircraft symbol
    iconSvg = `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" transform="rotate(${heading})">
      <path d="M14 2L16 6L24 8L16 10L14 26L12 10L4 8L12 6L14 2Z" fill="${color}" stroke="#000" stroke-width="1.2"/>
      <polygon points="10,8 18,8 16,14 12,14" fill="#000" opacity="0.8"/>
      <rect x="13" y="4" width="2" height="20" fill="#000" opacity="0.9"/>
      <polygon points="8,10 20,10 18,12 10,12" fill="${color}" opacity="0.7"/>
    </svg>`;
  } else {
    // Improved default commercial aircraft symbol
    iconSvg = `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" transform="rotate(${heading})">
      <path d="M14 2L16 8L24 10L16 12L14 26L12 12L4 10L12 8L14 2Z" fill="${color}" stroke="#000" stroke-width="1.2"/>
      <ellipse cx="14" cy="10" rx="10" ry="2.5" fill="${color}" opacity="0.6"/>
      <rect x="13" y="7" width="2" height="14" fill="#000" opacity="0.8"/>
      <circle cx="14" cy="14" r="1.5" fill="#000"/>
    </svg>`;
  }
  
  return new Icon({
    iconUrl: 'data:image/svg+xml;utf8,' + encodeURIComponent(iconSvg),
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
};

// Trondheim Airport coordinates
const TRONDHEIM_AIRPORT = { lat: 63.4578, lon: 10.9239 };

// Generate demo aircraft around Trondheim
const generateDemoAircraft = (): Aircraft[] => {
  const demoFlights = [
    {
      icao: 'SAS123',
      callsign: 'SAS123',
      aircraft_type: 'Boeing 737',
      squawk: '2000',
      altitude: 15000,
      speed: 420,
      heading: 90,
      vertical_rate: -500
    },
    {
      icao: 'NAX456',
      callsign: 'NAX456',
      aircraft_type: 'Airbus A320',
      squawk: '2001',
      altitude: 8500,
      speed: 280,
      heading: 270,
      vertical_rate: -800
    },
    {
      icao: 'WIF789',
      callsign: 'WIF789',
      aircraft_type: 'DHC-8',
      squawk: '2002',
      altitude: 12000,
      speed: 320,
      heading: 180,
      vertical_rate: 0
    },
    {
      icao: 'LN-ABC',
      callsign: 'RESCUE01',
      aircraft_type: 'AW139',
      squawk: '7700',
      altitude: 2500,
      speed: 140,
      heading: 45,
      vertical_rate: 200
    },
    {
      icao: 'LN-DEF',
      callsign: 'POLICE1',
      aircraft_type: 'EC135',
      squawk: '7600',
      altitude: 1800,
      speed: 110,
      heading: 225,
      vertical_rate: 0
    },
    {
      icao: 'DEMO01',
      callsign: 'TRAINING',
      aircraft_type: 'Cessna 172',
      squawk: '1200',
      altitude: 3500,
      speed: 95,
      heading: 360,
      vertical_rate: 100
    }
  ];

  return demoFlights.map((flight, index) => {
    // Generate positions around Trondheim airport
    const angle = (index * 60) * Math.PI / 180; // Spread aircraft around
    const distance = 0.1 + (index * 0.05); // Varying distances
    
    const lat = TRONDHEIM_AIRPORT.lat + (distance * Math.cos(angle));
    const lon = TRONDHEIM_AIRPORT.lon + (distance * Math.sin(angle));
    
    const aircraft: Aircraft = {
      ...flight,
      latitude: lat,
      longitude: lon,
      last_seen: new Date(),
      distance: getDistance(TRONDHEIM_AIRPORT.lat, TRONDHEIM_AIRPORT.lon, lat, lon),
      bearing: getBearing(TRONDHEIM_AIRPORT.lat, TRONDHEIM_AIRPORT.lon, lat, lon)
    };
    
    return aircraft;
  });
};

export default function ADSBDemoPanel({ onHeaderClick, isSelecting, gpsData }: ADSBDemoPanelProps) {
  const [adsbLayer, setAdsbLayer] = React.useState<'map' | 'aircraft' | 'settings'>('map');
  const [aircraft, setAircraft] = React.useState<Aircraft[]>([]);
  const [selectedAircraft, setSelectedAircraft] = React.useState<string | null>(null);
  const [mapCenter, setMapCenter] = React.useState<LatLngTuple>([TRONDHEIM_AIRPORT.lat, TRONDHEIM_AIRPORT.lon]);
  const [mapZoom, setMapZoom] = React.useState(10);
  const [maxRange, setMaxRange] = useLocalStorage('adsbDemoMaxRange', 3); // km - default 3km
  const [minAltitude, setMinAltitude] = useLocalStorage('adsbDemoMinAltitude', 0); // feet
  const [maxAltitude, setMaxAltitude] = useLocalStorage('adsbDemoMaxAltitude', 50000); // feet
  const [showMilitary, setShowMilitary] = useLocalStorage('adsbDemoShowMilitary', true);
  const [showCivilian, setShowCivilian] = useLocalStorage('adsbDemoShowCivilian', true);
  const [lastUpdate, setLastUpdate] = React.useState<Date>(new Date());

  // Initialize demo aircraft and update them periodically
  React.useEffect(() => {
    // Initial load
    setAircraft(generateDemoAircraft());
    setLastUpdate(new Date());

    // Update aircraft positions every 5 seconds
    const interval = setInterval(() => {
      setAircraft(prev => prev.map(ac => {
        // Simulate movement
        const speed = ac.speed / 3600; // Convert to km/s
        const distance = speed * 5; // 5 seconds of movement
        const headingRad = ac.heading * Math.PI / 180;
        
        const deltaLat = (distance / 111) * Math.cos(headingRad); // Rough conversion
        const deltaLon = (distance / (111 * Math.cos(ac.latitude * Math.PI / 180))) * Math.sin(headingRad);
        
        const newLat = ac.latitude + deltaLat;
        const newLon = ac.longitude + deltaLon;
        
        return {
          ...ac,
          latitude: newLat,
          longitude: newLon,
          last_seen: new Date(),
          distance: getDistance(TRONDHEIM_AIRPORT.lat, TRONDHEIM_AIRPORT.lon, newLat, newLon),
          bearing: getBearing(TRONDHEIM_AIRPORT.lat, TRONDHEIM_AIRPORT.lon, newLat, newLon),
          // Add some random variation
          altitude: ac.altitude + (Math.random() - 0.5) * 100,
          speed: Math.max(50, ac.speed + (Math.random() - 0.5) * 20),
          heading: (ac.heading + (Math.random() - 0.5) * 10 + 360) % 360
        };
      }));
      setLastUpdate(new Date());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

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
            <span className="text-sm font-semibold lattice-text-primary">ADS-B Surveillance Demo</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-green-400" />
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
              <Radar className="h-3 w-3 mr-1 lattice-status-good" />
              Demo: Online
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 relative overflow-hidden">
        {/* Map Layer */}
        {adsbLayer === 'map' && (
          <div className="absolute inset-0">
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
                
                {/* Trondheim Airport Marker */}
                <Marker
                  position={[TRONDHEIM_AIRPORT.lat, TRONDHEIM_AIRPORT.lon]}
                  icon={new Icon({
                    iconUrl: 'data:image/svg+xml;base64,' + btoa(`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="12" r="10" fill="#00d4ff" opacity="0.8"/>
                      <circle cx="12" cy="12" r="6" fill="#ffffff"/>
                      <circle cx="12" cy="12" r="2" fill="#00d4ff"/>
                    </svg>`),
                    iconSize: [24, 24],
                    iconAnchor: [12, 12],
                    popupAnchor: [0, -12],
                  })}
                >
                  <Popup>
                    <div className="lattice-panel p-3 text-xs lattice-text-mono min-w-[200px]">
                      <div className="font-semibold lattice-status-primary mb-2 text-center">Trondheim Airport</div>
                      <div className="space-y-1">
                        <div><span className="lattice-text-secondary">ICAO:</span> <span className="lattice-text-primary">ENVA</span></div>
                        <div><span className="lattice-text-secondary">LAT:</span> <span className="lattice-text-primary">{TRONDHEIM_AIRPORT.lat.toFixed(6)}°</span></div>
                        <div><span className="lattice-text-secondary">LON:</span> <span className="lattice-text-primary">{TRONDHEIM_AIRPORT.lon.toFixed(6)}°</span></div>
                      </div>
                    </div>
                  </Popup>
                </Marker>
                
                {/* Detection Range Circle */}
                <Circle
                  center={[TRONDHEIM_AIRPORT.lat, TRONDHEIM_AIRPORT.lon]}
                  radius={maxRange * 1000} // Convert km to meters
                  pathOptions={{ color: '#00d4ff', weight: 2, opacity: 0.6, fillOpacity: 0.1 }}
                />
                
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
                            <div className="lattice-text-secondary text-xs mb-1">From Airport:</div>
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
            {filteredAircraft.length === 0 ? (
              <div className="text-center lattice-text-muted py-8">
                <Plane className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No aircraft in range</p>
                <p className="text-xs mt-2">Adjust filters to see more aircraft</p>
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
                      Detection Range: {maxRange}km
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="50"
                      step="1"
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

              {/* Demo Status */}
              <div className="lattice-panel p-4">
                <div className="text-sm lattice-status-primary mb-3 font-semibold">Demo Status</div>
                <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                  <div>
                    <div className="lattice-text-secondary">Demo Mode:</div>
                    <div className="font-semibold lattice-status-good">Active</div>
                  </div>
                  <div>
                    <div className="lattice-text-secondary">Location:</div>
                    <div className="font-semibold lattice-text-primary">Trondheim Airport</div>
                  </div>
                  <div>
                    <div className="lattice-text-secondary">Aircraft Count:</div>
                    <div className="lattice-text-primary font-semibold">{filteredAircraft.length}</div>
                  </div>
                  <div>
                    <div className="lattice-text-secondary">Last Update:</div>
                    <div className="lattice-text-primary font-semibold">
                      {lastUpdate.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
                
                <div className="mb-3 p-2 lattice-panel bg-green-800/50">
                  <div className="text-xs lattice-text-secondary mb-1">Demo Information:</div>
                  <div className="text-xs lattice-text-primary">
                    This panel shows simulated aircraft around Trondheim Airport (ENVA). Aircraft positions update every 5 seconds with realistic movement patterns.
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