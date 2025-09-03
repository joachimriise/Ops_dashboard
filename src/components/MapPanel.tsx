import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import { Icon, LatLngTuple } from 'leaflet';
import { Map, Satellite, Layers, Navigation, MapPin, X } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

interface MapPanelProps {
  onHeaderClick: () => void;
  isSelecting: boolean;
  gpsData: {
    connected: boolean;
    latitude?: number;
    longitude?: number;
    altitude?: number;
    accuracy?: number;
    satellites?: number;
    fix_quality?: 'NO_FIX' | '2D' | '3D' | 'DGPS';
  };
}

type MapLayerType = 'street' | 'satellite' | 'terrain' | 'topo';

interface MapLayer {
  id: MapLayerType;
  name: string;
  url: string;
  attribution: string;
  maxZoom: number;
}

interface MapPin {
  id: string;
  lat: number;
  lon: number;
  timestamp: Date;
  name: string;
}


const mapLayers: MapLayer[] = [
  {
    id: 'street',
    name: 'Street Map',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19
  },
  {
    id: 'satellite',
    name: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '© Esri, Maxar, Earthstar Geographics',
    maxZoom: 19
  },
  {
    id: 'terrain',
    name: 'Terrain',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '© OpenTopoMap contributors',
    maxZoom: 17
  },
  {
    id: 'topo',
    name: 'Topographic',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: '© Esri, HERE, Garmin, Intermap, increment P Corp.',
    maxZoom: 19
  }
];

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

// Get bearing between two points
const getBearing = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const lat1Rad = lat1 * Math.PI / 180;
  const lat2Rad = lat2 * Math.PI / 180;
  
  const y = Math.sin(dLon) * Math.cos(lat2Rad);
  const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
  
  const bearing = Math.atan2(y, x) * 180 / Math.PI;
  return (bearing + 360) % 360;
};

// Get distance between two points in kilometers
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

// Create GPS marker icon
const createGPSIcon = () => {
  const iconSvg = `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="14" fill="none" stroke="#00ff88" stroke-width="3" opacity="0.8"/>
    <circle cx="16" cy="16" r="8" fill="none" stroke="#00ff88" stroke-width="2"/>
    <circle cx="16" cy="16" r="3" fill="#00ff88"/>
    <path d="M16 2v6M16 24v6M2 16h6M24 16h6" stroke="#00ff88" stroke-width="2"/>
  </svg>`;
  
  return new Icon({
    iconUrl: 'data:image/svg+xml;base64,' + btoa(iconSvg),
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
};

// Create map pin icon

// Map click handler component
function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lon: number) => void }) {
  const map = useMapEvents({
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// GPS center handler component
function GPSCenterHandler({ gpsData, showGPS }: { 
  gpsData: { connected: boolean; latitude?: number; longitude?: number; };
  showGPS: boolean;
}) {
  const map = useMap();
  
  // Handle map resize when container changes
  React.useEffect(() => {
    const handleResize = () => {
      setTimeout(() => {
        map.invalidateSize();
      }, 100);
    };

    // Use ResizeObserver to detect container size changes
    const mapContainer = map.getContainer().parentElement;
    if (mapContainer) {
      const resizeObserver = new ResizeObserver(handleResize);
      resizeObserver.observe(mapContainer);
      
      return () => {
        resizeObserver.disconnect();
      };
    }

    // Fallback to window resize
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [map]);

  React.useEffect(() => {
    if (showGPS && gpsData.connected && gpsData.latitude && gpsData.longitude) {
      map.setView([gpsData.latitude, gpsData.longitude], map.getZoom());
    }
  }, [showGPS, gpsData.connected, gpsData.latitude, gpsData.longitude, map]);
  
  return null;
}

export default function MapPanel({ onHeaderClick, isSelecting, gpsData }: MapPanelProps) {
  const [selectedLayer, setSelectedLayer] = React.useState<MapLayerType>('street');
  const [showGPS, setShowGPS] = React.useState(true);
  const [mapCenter, setMapCenter] = React.useState<LatLngTuple>([59.9139, 10.7522]);
  const [mapZoom, setMapZoom] = React.useState(12);
  const [showPopup, setShowPopup] = React.useState(false);
  const [popupPosition, setPopupPosition] = React.useState<LatLngTuple>([0, 0]);
  const [popupData, setPopupData] = React.useState<{
    lat: number;
    lon: number;
    timestamp: Date;
  } | null>(null);

  const currentLayer = mapLayers.find(layer => layer.id === selectedLayer) || mapLayers[0];

  const handleMapClick = (lat: number, lon: number) => {
    const newPoint = {
      lat,
      lon,
      timestamp: new Date()
    };
    
    setPopupData(newPoint);
    setPopupPosition([lat, lon]);
    setShowPopup(true);
  };

  const closePopup = () => {
    setShowPopup(false);
    setPopupData(null);
  };

  return (
    <div className="lattice-panel flex flex-col h-full">
      {/* Main Header */}
      <div className={`lattice-header px-4 py-3 cursor-pointer transition-all ${
        isSelecting ? 'bg-gradient-to-r from-orange-500 to-amber-500' : ''
      }`} onClick={onHeaderClick}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Map className="h-4 w-4 lattice-status-primary" />
            <span className="text-sm font-semibold lattice-text-primary">Tactical Map</span>
            <span className="text-xs lattice-text-secondary">
              {currentLayer.name}
            </span>
          </div>
        </div>
      </div>

      {/* Map Layer Selection */}
      <div className="border-b border-gray-700 px-3 py-2">
        <div className="flex items-center justify-between">
          <div className="flex space-x-1">
            {mapLayers.map((layer) => (
              <button
                key={layer.id}
                onClick={() => setSelectedLayer(layer.id)}
                className={`lattice-tab px-3 py-1 text-xs rounded transition-all ${
                  selectedLayer === layer.id
                    ? 'active'
                    : ''
                }`}
              >
                {layer.id === 'satellite' && <Satellite className="h-3 w-3 inline mr-1" />}
                {layer.id === 'street' && <Map className="h-3 w-3 inline mr-1" />}
                {layer.id === 'terrain' && <Layers className="h-3 w-3 inline mr-1" />}
                {layer.id === 'topo' && <Navigation className="h-3 w-3 inline mr-1" />}
                {layer.name}
              </button>
            ))}
          </div>
          
          {/* GPS Button and Instructions */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowGPS(!showGPS)}
              className={`lattice-tab px-3 py-1 text-xs rounded transition-all ${
                showGPS && gpsData.connected ? 'active' : 'text-slate-300'
              }`}
              title="Toggle GPS location"
              disabled={!gpsData.connected}
            >
              <Satellite className="h-3 w-3 inline mr-1" />
              GPS
            </button>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative">
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
          attributionControl={false}
        >
          <TileLayer
            key={selectedLayer}
            url={currentLayer.url}
            attribution={currentLayer.attribution}
            maxZoom={currentLayer.maxZoom}
            className="map-lattice"
          />
          
          <MapClickHandler onMapClick={handleMapClick} />
          
          <GPSCenterHandler gpsData={gpsData} showGPS={showGPS} />
          
          {/* GPS Position Marker */}
          {gpsData.connected && showGPS && gpsData.latitude && gpsData.longitude && (
            <Marker
              position={[gpsData.latitude, gpsData.longitude]}
              icon={createGPSIcon()}
            >
              <Popup>
                <div className="lattice-panel p-3 text-xs lattice-text-mono min-w-[200px]">
                  <div className="font-semibold lattice-status-primary mb-2 text-center">GPS Position</div>
                  
                  <div className="space-y-1 mb-2">
                    <div><span className="lattice-text-secondary">LAT:</span> <span className="lattice-text-primary">{gpsData.latitude.toFixed(6)}°</span></div>
                    <div><span className="lattice-text-secondary">LON:</span> <span className="lattice-text-primary">{gpsData.longitude.toFixed(6)}°</span></div>
                    <div><span className="lattice-text-secondary">MGRS:</span> <span className="lattice-text-primary">{toMGRS(gpsData.latitude, gpsData.longitude)}</span></div>
                    <div><span className="lattice-text-secondary">UTM:</span> <span className="lattice-text-primary">{toUTM(gpsData.latitude, gpsData.longitude)}</span></div>
                  </div>
                  
                  {gpsData.altitude && <div><span className="lattice-text-secondary">ALT:</span> <span className="lattice-text-primary">{gpsData.altitude.toFixed(1)}m</span></div>}
                  {gpsData.accuracy && <div><span className="lattice-text-secondary">ACC:</span> <span className="lattice-text-primary">±{gpsData.accuracy.toFixed(1)}m</span></div>}
                  <div><span className="lattice-text-secondary">FIX:</span> <span className="lattice-text-primary">{gpsData.fix_quality || 'NO_FIX'}</span></div>
                  {gpsData.satellites && <div><span className="lattice-text-secondary">SATS:</span> <span className="lattice-text-primary">{gpsData.satellites}</span></div>}
                </div>
              </Popup>
            </Marker>
          )}
          
          {/* Clicked Point Popup */}
        </MapContainer>
        
        {/* Popup overlay */}
        {showPopup && popupData && (
          <div 
            className="absolute z-[1000] lattice-panel-elevated p-4 text-xs lattice-text-mono min-w-[250px] pointer-events-auto"
            style={{
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)'
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold lattice-status-primary">Point Coordinates</div>
              <button
                onClick={closePopup}
                className="lattice-text-muted hover:lattice-text-primary transition-colors ml-2"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="space-y-1 mb-2">
              <div><span className="lattice-text-secondary">LAT:</span> <span className="lattice-text-primary">{popupData.lat.toFixed(6)}°</span></div>
              <div><span className="lattice-text-secondary">LON:</span> <span className="lattice-text-primary">{popupData.lon.toFixed(6)}°</span></div>
              <div><span className="lattice-text-secondary">MGRS:</span> <span className="lattice-text-primary">{toMGRS(popupData.lat, popupData.lon)}</span></div>
              <div><span className="lattice-text-secondary">UTM:</span> <span className="lattice-text-primary">{toUTM(popupData.lat, popupData.lon)}</span></div>
            </div>
            
            {/* Distance and bearing from GPS */}
            {gpsData.connected && gpsData.latitude && gpsData.longitude && (
              <div className="border-t border-gray-600 pt-2 mt-2">
                <div className="lattice-text-secondary text-xs mb-1">From GPS:</div>
                <div><span className="lattice-text-secondary">DIST:</span> <span className="lattice-text-primary">{getDistance(gpsData.latitude, gpsData.longitude, popupData.lat, popupData.lon).toFixed(2)}km</span></div>
                <div><span className="lattice-text-secondary">BRG:</span> <span className="lattice-text-primary">{getBearing(gpsData.latitude, gpsData.longitude, popupData.lat, popupData.lon).toFixed(0)}°</span></div>
              </div>
            )}
            
            <div className="border-t border-gray-600 pt-2 mt-2 lattice-text-muted">
              <div>Selected: {popupData.timestamp.toLocaleTimeString()}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}