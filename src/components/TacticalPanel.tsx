import React from 'react';
import { MapContainer, TileLayer, Marker, Polygon, Polyline, Circle, Tooltip, useMapEvents, useMap } from 'react-leaflet';
import { DivIcon, LatLngTuple } from 'leaflet';
import { Map, Target, Shield, Ruler, Square, Trash2, X, Plus, Edit, Circle as CircleIcon, Minus } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import 'leaflet/dist/leaflet.css';

interface TacticalTarget {
  id: string;
  name: string;
  lat: number;
  lon: number;
  description: string;
  classification: 'personnel' | 'vehicle' | 'building' | 'equipment' | 'unknown';
  certainty: number; // 0-100%
  type: 'hostile' | 'unknown' | 'neutral';
  timestamp: Date;
}

interface TacticalOwnForce {
  id: string;
  name: string;
  lat: number;
  lon: number;
  type: 'infantry' | 'vehicle' | 'command' | 'support';
  status: 'active' | 'standby' | 'moving' | 'engaged';
  timestamp: Date;
}

interface TacticalArea {
  id: string;
  name: string;
  coordinates: LatLngTuple[];
  shape: 'polygon' | 'circle' | 'line';
  radius?: number; // for circles only
  center?: LatLngTuple; // for circles only
  type: 'restricted' | 'patrol' | 'objective' | 'hazard';
  description: string;
  timestamp: Date;
}

interface TacticalPanelProps {
  onHeaderClick: () => void;
  isSelecting: boolean;
}

type ActiveTool = 'none' | 'target' | 'ownforce' | 'area-polygon' | 'area-circle' | 'area-line' | 'measure' | 'ruler';

// Helper function to update coordinates of an area
const updateAreaCoordinates = (area: TacticalArea, deltaLat: number, deltaLon: number): TacticalArea => {
  if (area.shape === 'circle' && area.center) {
    return {
      ...area,
      center: [area.center[0] + deltaLat, area.center[1] + deltaLon]
    };
  } else {
    return {
      ...area,
      coordinates: area.coordinates.map(coord => [coord[0] + deltaLat, coord[1] + deltaLon] as LatLngTuple)
    };
  }
};

// Convert decimal degrees to MGRS (simplified approximation)
const toMGRS = (lat: number, lon: number): string => {
  const zone = Math.floor((lon + 180) / 6) + 1;
  const letter = String.fromCharCode(67 + Math.floor((lat + 80) / 8));
  const easting = Math.floor(((lon % 6) + 6) % 6 * 100000);
  const northing = Math.floor(((lat % 8) + 8) % 8 * 100000);
  return `${zone}${letter} ${easting.toString().padStart(5, '0')} ${northing.toString().padStart(5, '0')}`;
};

// Create tactical icons
const createTacticalIcon = (type: string, subtype: string, color: string, certainty?: number) => {
  let emoji = '';
  let bgColor = color;
  
  if (type === 'target') {
    switch (subtype) {
      case 'personnel': emoji = '👤'; break;
      case 'vehicle': emoji = '🚗'; break;
      case 'building': emoji = '🏢'; break;
      case 'equipment': emoji = '📦'; break;
      default: emoji = '❓'; break;
    }
  } else if (type === 'ownforce') {
    switch (subtype) {
      case 'infantry': emoji = '🚶'; break;
      case 'vehicle': emoji = '🚗'; break;
      case 'air': emoji = '✈️'; break;
      case 'command': emoji = '⭐'; break;
      case 'support': emoji = '🔧'; break;
      default: emoji = '🚶'; break;
    }
  } else if (type === 'area') {
    emoji = 'A';
  }
  // Calculate opacity based on certainty for targets
  const backgroundOpacity = type === 'target' && certainty !== undefined ? certainty / 100 : 1;
  return new DivIcon({
    html: `
      <div style="
        width: 32px;
        height: 32px;
        background: ${type === 'area' ? 'transparent' : `rgba(${hexToRgb(bgColor)}, ${backgroundOpacity})`};
        border: 2px solid #ffffff;
        border: 1px solid #000000;
        border-radius: ${type === 'ownforce' ? '50%' : type === 'area' ? '0' : '4px'};
        ${type === 'area' ? 'border-style: dashed;' : ''}
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        cursor: pointer;
        position: relative;
        font-size: 16px;
        color: white;
      ">
        ${emoji}
      </div>
    `,
    className: 'tactical-icon',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
};

// Helper function to convert hex color to RGB values
const hexToRgb = (hex: string): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);
    return `${r}, ${g}, ${b}`;
  }
  return '128, 128, 128'; // fallback gray
};
// Map click handler component
function MapClickHandler({ 
  activeTool, 
  onMapClick,
  onAreaClick
}: { 
  activeTool: ActiveTool;
  onMapClick: (lat: number, lon: number) => void;
  onAreaClick: (lat: number, lon: number) => void;
}) {
  useMapEvents({
    click: (e) => {
      if (activeTool === 'target' || activeTool === 'ownforce') {
        onMapClick(e.latlng.lat, e.latlng.lng);
      } else if (activeTool.startsWith('area-')) {
        onAreaClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

// Map resize handler
function MapController() {
  const map = useMap();
  const timeoutRef = React.useRef<NodeJS.Timeout>();

  React.useEffect(() => {
    const handleResize = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        if (map && map.getContainer() && map.getContainer().parentElement) {
          map.invalidateSize();
        }
      }, 100);
    };

    const mapContainer = map.getContainer().parentElement;
    if (mapContainer) {
      const resizeObserver = new ResizeObserver(handleResize);
      resizeObserver.observe(mapContainer);
      
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        resizeObserver.disconnect();
      };
    }

    window.addEventListener('resize', handleResize);
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [map]);

  return null;
}

export default function TacticalPanel({ onHeaderClick, isSelecting }: TacticalPanelProps) {
  const [tacticalLayer, setTacticalLayer] = React.useState<'targets' | 'forces' | 'areas'>('targets');
  const [activeTool, setActiveTool] = React.useState<ActiveTool>('none');
  const [currentAreaPoints, setCurrentAreaPoints] = React.useState<LatLngTuple[]>([]);
  const [isDrawingArea, setIsDrawingArea] = React.useState(false);
  const [showTargets, setShowTargets] = React.useState(true);
  const [showOwnForces, setShowOwnForces] = React.useState(true);
  const [showAreas, setShowAreas] = React.useState(true);
  const [showNames, setShowNames] = React.useState(true);
  
  // Data storage
  const [targets, setTargets] = useLocalStorage<TacticalTarget[]>('tacticalTargets', []);
  const [ownForces, setOwnForces] = useLocalStorage<TacticalOwnForce[]>('tacticalOwnForces', []);
  const [areas, setAreas] = useLocalStorage<TacticalArea[]>('tacticalAreas', []);
  
  // Modal state
  const [showModal, setShowModal] = React.useState(false);
  const [modalType, setModalType] = React.useState<'target' | 'ownforce' | 'area'>('target');
  const [editingItem, setEditingItem] = React.useState<TacticalTarget | TacticalOwnForce | TacticalArea | null>(null);
  const [pendingItem, setPendingItem] = React.useState<TacticalTarget | TacticalOwnForce | TacticalArea | null>(null);
  
  // Form state
  const [formData, setFormData] = React.useState({
    name: '',
    description: '',
    classification: 'unknown',
    certainty: 50,
    type: 'unknown',
    status: 'active',
    radius: 100,
    shape: 'polygon'
  });

  const handleMapClick = (lat: number, lon: number) => {
    if (activeTool === 'target') {
      const pendingTarget: TacticalTarget = {
        id: Date.now().toString(),
        name: '',
        lat,
        lon,
        description: '',
        classification: 'unknown' as const,
        certainty: 50,
        type: 'unknown' as const,
        timestamp: new Date()
      };
      setPendingItem(pendingTarget);
      setModalType('target');
      setFormData({
        name: '',
        description: '',
        classification: 'unknown',
        certainty: 50,
        type: 'unknown',
        status: 'active',
        radius: 100,
        shape: 'polygon'
      });
      setShowModal(true);
    } else if (activeTool === 'ownforce') {
      const pendingForce: TacticalOwnForce = {
        id: Date.now().toString(),
        name: '',
        lat,
        lon,
        type: 'infantry' as const,
        status: 'active' as const,
        timestamp: new Date()
      };
      setPendingItem(pendingForce);
      setModalType('ownforce');
      setFormData({
        name: '',
        description: '',
        classification: 'unknown',
        certainty: 50,
        type: 'infantry',
        status: 'active',
        radius: 100,
        shape: 'polygon'
      });
      setShowModal(true);
    }
  };

  const handleAreaClick = (lat: number, lon: number) => {
    if (activeTool.startsWith('area-')) {
      const newPoint: LatLngTuple = [lat, lon];
      
      if (activeTool === 'area-circle') {
        // For circles, first click is center, second click sets radius
        if (currentAreaPoints.length === 0) {
          setCurrentAreaPoints([newPoint]);
          setIsDrawingArea(true);
        } else if (currentAreaPoints.length === 1) {
          const center = currentAreaPoints[0];
          const radius = calculateDistance(center, newPoint);
          finishAreaDrawing('circle', [center], radius, center);
        }
      } else if (activeTool === 'area-line') {
        // For lines, collect points and finish on double-click or when enough points
        const newPoints = [...currentAreaPoints, newPoint];
        setCurrentAreaPoints(newPoints);
        setIsDrawingArea(true);
        
        // Auto-finish line after 2 points, but allow more points to be added
        if (newPoints.length >= 2) {
          // Don't auto-finish, let user continue adding points
        }
      } else if (activeTool === 'area-polygon') {
        // For polygons, collect points and finish on double-click or when enough points
        const newPoints = [...currentAreaPoints, newPoint];
        setCurrentAreaPoints(newPoints);
        setIsDrawingArea(true);
        
        // Auto-finish polygon after 3 points, but allow more points to be added
        if (newPoints.length >= 3) {
          // Don't auto-finish, let user continue adding points
        }
      }
    }
  };

  const finishAreaDrawing = (shape: 'polygon' | 'circle' | 'line', coordinates: LatLngTuple[], radius?: number, center?: LatLngTuple) => {
    const pendingArea: TacticalArea = {
      id: Date.now().toString(),
      name: '',
      coordinates,
      shape,
      radius,
      center,
      type: 'patrol',
      description: '',
      timestamp: new Date()
    };
    
    setCurrentAreaPoints([]);
    setIsDrawingArea(false);
    
    // Open modal for editing
    setPendingItem(pendingArea);
    setModalType('area');
    setFormData({
      name: '',
      description: '',
      classification: 'unknown',
      certainty: 50,
      type: 'patrol',
      status: 'active',
      radius: radius || 100,
      shape
    });
    setShowModal(true);
  };

  const cancelAreaDrawing = () => {
    setCurrentAreaPoints([]);
    setIsDrawingArea(false);
    setActiveTool('none');
  };

  const completeCurrentArea = () => {
    if (currentAreaPoints.length >= 2) {
      const shape = activeTool === 'area-line' ? 'line' : 'polygon';
      finishAreaDrawing(shape, currentAreaPoints);
    }
  };

  // Calculate distance between two points in meters
  const calculateDistance = (point1: LatLngTuple, point2: LatLngTuple): number => {
    const R = 6371000; // Earth's radius in meters
    const lat1Rad = point1[0] * Math.PI / 180;
    const lat2Rad = point2[0] * Math.PI / 180;
    const deltaLat = (point2[0] - point1[0]) * Math.PI / 180;
    const deltaLon = (point2[1] - point1[1]) * Math.PI / 180;

    const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
              Math.cos(lat1Rad) * Math.cos(lat2Rad) *
              Math.sin(deltaLon/2) * Math.sin(deltaLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  };

  const handleItemClick = (item: TacticalTarget | TacticalOwnForce | TacticalArea, type: 'target' | 'ownforce' | 'area') => {
    // Only allow editing existing items, not pending ones
    if (pendingItem) return;
    
    setEditingItem(item);
    setPendingItem(null);
    setModalType(type);
    
    if (type === 'target') {
      const target = item as TacticalTarget;
      setFormData({
        name: target.name,
        description: target.description,
        classification: target.classification,
        certainty: target.certainty,
        type: target.type,
        status: 'active',
        radius: 100,
        shape: 'polygon'
      });
    } else if (type === 'ownforce') {
      const force = item as TacticalOwnForce;
      setFormData({
        name: force.name,
        description: '',
        classification: 'unknown',
        certainty: 50,
        type: force.type,
        status: force.status,
        radius: 100,
        shape: 'polygon'
      });
    } else if (type === 'area') {
      const area = item as TacticalArea;
      setFormData({
        name: area.name,
        description: area.description,
        classification: 'unknown',
        certainty: 50,
        type: area.type,
        status: 'active',
        radius: area.radius || 100,
        shape: area.shape
      });
    }
    
    setShowModal(true);
  };

  const handleSave = () => {
    if (!editingItem && !pendingItem) return;
    
    const itemToSave = editingItem || pendingItem;
    if (!itemToSave) return;

    if (modalType === 'target') {
      const updatedTarget = {
        ...itemToSave as TacticalTarget,
        name: formData.name,
        description: formData.description,
        classification: formData.classification as TacticalTarget['classification'],
        certainty: formData.certainty,
        type: formData.type as TacticalTarget['type']
      };
      
      if (pendingItem) {
        setTargets(prev => [...prev, updatedTarget]);
      } else {
        setTargets(prev => prev.map(target => 
          target.id === itemToSave.id ? updatedTarget : target
        ));
      }
    } else if (modalType === 'ownforce') {
      const updatedForce = {
        ...itemToSave as TacticalOwnForce,
        name: formData.name,
        type: formData.type as TacticalOwnForce['type'],
        status: formData.status as TacticalOwnForce['status']
      };
      
      if (pendingItem) {
        setOwnForces(prev => [...prev, updatedForce]);
      } else {
        setOwnForces(prev => prev.map(force => 
          force.id === itemToSave.id ? updatedForce : force
        ));
      }
    } else if (modalType === 'area') {
      const updatedArea = {
        ...itemToSave as TacticalArea,
        name: formData.name,
        description: formData.description,
        type: formData.type as TacticalArea['type'],
        radius: formData.radius,
        shape: formData.shape as TacticalArea['shape']
      };
      
      if (pendingItem) {
        setAreas(prev => [...prev, updatedArea]);
      } else {
        setAreas(prev => prev.map(area => 
          area.id === itemToSave.id ? updatedArea : area
        ));
      }
    }

    // Close modal and reset state
    setShowModal(false);
    setEditingItem(null);
    setPendingItem(null);
    setActiveTool('none');
  };

  const handleCancel = () => {
    setShowModal(false);
    setEditingItem(null);
    setPendingItem(null);
    setActiveTool('none');
  };

  const handleDelete = () => {
    if (!editingItem && !pendingItem) return;
    
    const itemToDelete = editingItem || pendingItem;
    if (!itemToDelete) return;

    // Only delete if it's an existing item, not a pending one
    if (editingItem) {
      if (modalType === 'target') {
        setTargets(prev => prev.filter(target => target.id !== itemToDelete.id));
      } else if (modalType === 'ownforce') {
        setOwnForces(prev => prev.filter(force => force.id !== itemToDelete.id));
      } else if (modalType === 'area') {
        setAreas(prev => prev.filter(area => area.id !== itemToDelete.id));
      }
    }

    setShowModal(false);
    setEditingItem(null);
    setPendingItem(null);
    setActiveTool('none');
  };

  // Handle dragging of targets
  const handleTargetDrag = (targetId: string, newLat: number, newLon: number) => {
    setTargets(prev => prev.map(target => 
      target.id === targetId 
        ? { ...target, lat: newLat, lon: newLon, timestamp: new Date() }
        : target
    ));
  };

  // Handle dragging of own forces
  const handleOwnForceDrag = (forceId: string, newLat: number, newLon: number) => {
    setOwnForces(prev => prev.map(force => 
      force.id === forceId 
        ? { ...force, lat: newLat, lon: newLon, timestamp: new Date() }
        : force
    ));
  };

  // Handle dragging of areas
  const handleAreaDrag = (areaId: string, newLat: number, newLon: number, originalLat: number, originalLon: number) => {
    const deltaLat = newLat - originalLat;
    const deltaLon = newLon - originalLon;
    
    setAreas(prev => prev.map(area => 
      area.id === areaId 
        ? { ...updateAreaCoordinates(area, deltaLat, deltaLon), timestamp: new Date() }
        : area
    ));
  };

  const getTargetColor = (type: TacticalTarget['type']) => {
    switch (type) {
      case 'hostile': return '#ef4444';
      case 'unknown': return '#f59e0b';
      case 'neutral': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getForceColor = (status: TacticalOwnForce['status']) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'standby': return '#f59e0b';
      case 'moving': return '#3b82f6';
      case 'engaged': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <div className="lattice-panel flex flex-col h-full">
      {/* Header */}
      <div className={`lattice-header px-4 py-3 cursor-pointer transition-all ${
        isSelecting ? 'bg-gradient-to-r from-orange-500 to-amber-500' : ''
      }`} onClick={onHeaderClick}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Map className="h-4 w-4 lattice-status-primary" />
            <span className="text-sm font-semibold lattice-text-primary">Tactical Map</span>
          </div>
          <span className="text-xs lattice-text-secondary">
            {targets.length} targets • {ownForces.length} forces • {areas.length} areas
          </span>
        </div>
      </div>

      {/* Tools */}
      <div className="border-b border-gray-700 px-3 py-2">
        <div className="flex items-center justify-between">
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTool(activeTool === 'target' ? 'none' : 'target')}
              className={`lattice-tab px-3 py-1 text-xs rounded transition-all ${
                activeTool === 'target' ? 'active' : ''
              }`}
            >
              <Target className="h-3 w-3 inline mr-1" />
              Target
            </button>
            <button
              onClick={() => setActiveTool(activeTool === 'ownforce' ? 'none' : 'ownforce')}
              className={`lattice-tab px-3 py-1 text-xs rounded transition-all ${
                activeTool === 'ownforce' ? 'active' : ''
              }`}
            >
              <Shield className="h-3 w-3 inline mr-1" />
              Own Forces
            </button>
            
            {/* Area Tools Dropdown */}
            <div className="relative group">
              <button
                className={`lattice-tab px-3 py-1 text-xs rounded transition-all ${
                  activeTool.startsWith('area-') ? 'active' : ''
                }`}
              >
                <Square className="h-3 w-3 inline mr-1" />
                Area ▼
              </button>
              <div className="absolute top-full left-0 lattice-panel-elevated rounded-lg shadow-xl z-[1001] min-w-[120px] mt-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
                <div className="p-1">
                  <button
                    onClick={() => setActiveTool(activeTool === 'area-polygon' ? 'none' : 'area-polygon')}
                    className={`w-full text-left lattice-tab px-2 py-1 text-xs rounded transition-all flex items-center space-x-2 ${
                      activeTool === 'area-polygon' ? 'active' : ''
                    }`}
                  >
                    <Square className="h-3 w-3" />
                    <span>Polygon</span>
                  </button>
                  <button
                    onClick={() => setActiveTool(activeTool === 'area-circle' ? 'none' : 'area-circle')}
                    className={`w-full text-left lattice-tab px-2 py-1 text-xs rounded transition-all flex items-center space-x-2 ${
                      activeTool === 'area-circle' ? 'active' : ''
                    }`}
                  >
                    <CircleIcon className="h-3 w-3" />
                    <span>Circle</span>
                  </button>
                  <button
                    onClick={() => setActiveTool(activeTool === 'area-line' ? 'none' : 'area-line')}
                    className={`w-full text-left lattice-tab px-2 py-1 text-xs rounded transition-all flex items-center space-x-2 ${
                      activeTool === 'area-line' ? 'active' : ''
                    }`}
                  >
                    <Minus className="h-3 w-3" />
                    <span>Line</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Area Drawing Controls */}
          {isDrawingArea && (
            <div className="flex items-center space-x-2">
              <span className="text-xs lattice-status-warning">
                Drawing {activeTool.replace('area-', '')} - {currentAreaPoints.length} points
              </span>
              {currentAreaPoints.length >= 2 && (
                <button
                  onClick={completeCurrentArea}
                  className="lattice-button-primary text-xs px-2 py-1"
                >
                  Complete
                </button>
              )}
              <button
                onClick={cancelAreaDrawing}
                className="lattice-button text-xs px-2 py-1"
              >
                Cancel
              </button>
            </div>
          )}
          
          {!isDrawingArea && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowTargets(!showTargets)}
              className={`lattice-tab px-3 py-1 text-xs rounded transition-all ${
                  showTargets ? 'lattice-status-error' : 'lattice-text-muted'
              }`}
            >
                Targets
            </button>
              <button
                onClick={() => setShowOwnForces(!showOwnForces)}
                className={`text-xs px-2 py-1 rounded transition-all ${
                  showOwnForces ? 'lattice-status-good' : 'lattice-text-muted'
                }`}
              >
                Forces
              </button>
              <button
                onClick={() => setShowAreas(!showAreas)}
                className={`text-xs px-2 py-1 rounded transition-all ${
                  showAreas ? 'lattice-status-primary' : 'lattice-text-muted'
                }`}
              >
                Areas
              </button>
              <div className="flex items-center space-x-1 ml-2 px-2 py-1 lattice-panel rounded">
                <input
                  type="checkbox"
                  id="show-names"
                  checked={showNames}
                  onChange={(e) => setShowNames(e.target.checked)}
                  className="w-3 h-3 accent-cyan-400"
                />
                <label htmlFor="show-names" className="text-xs lattice-text-secondary cursor-pointer">
                  Names
                </label>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <MapContainer
          center={[59.9139, 10.7522]}
          zoom={12}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
          attributionControl={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="© OpenStreetMap contributors"
            className="map-lattice"
          />
          
          <MapController />
          
          <MapClickHandler 
            activeTool={activeTool}
            onMapClick={handleMapClick}
            onAreaClick={handleAreaClick}
          />
          
          {/* Render Targets */}
          {showTargets && targets.map((target) => (
            <Marker
              key={target.id}
              position={[target.lat, target.lon]}
              icon={createTacticalIcon('target', target.classification, getTargetColor(target.type), target.certainty)}
              draggable={true}
              eventHandlers={{
                click: () => handleItemClick(target, 'target'),
                dragend: (e) => {
                  const marker = e.target;
                  const position = marker.getLatLng();
                  handleTargetDrag(target.id, position.lat, position.lng);
                }
              }}
            >
              {target.name && showNames && (
                <Tooltip permanent direction="bottom" offset={[0, 20]} className="tactical-tooltip">
                  <div className="text-xs font-semibold text-white bg-black bg-opacity-80 px-2 py-1 rounded">
                    {target.name}
                  </div>
                </Tooltip>
              )}
            </Marker>
          ))}
          
          {/* Render Pending Target */}
          {pendingItem && modalType === 'target' && showModal && (
            <Marker
              position={[(pendingItem as TacticalTarget).lat, (pendingItem as TacticalTarget).lon]}
              icon={createTacticalIcon('target', formData.classification, getTargetColor(formData.type as TacticalTarget['type']), formData.certainty)}
            >
              {formData.name && (
                <Tooltip permanent direction="bottom" offset={[0, 20]} className="tactical-tooltip">
                  <div className="text-xs font-semibold text-white bg-black bg-opacity-80 px-2 py-1 rounded">
                    {formData.name}
                  </div>
                </Tooltip>
              )}
            </Marker>
          )}
          
          {/* Render Own Forces */}
          {showOwnForces && ownForces.map((force) => (
            <Marker
              key={force.id}
              position={[force.lat, force.lon]}
              icon={createTacticalIcon('ownforce', force.type, getForceColor(force.status))}
              draggable={true}
              eventHandlers={{
                click: () => handleItemClick(force, 'ownforce'),
                dragend: (e) => {
                  const marker = e.target;
                  const position = marker.getLatLng();
                  handleOwnForceDrag(force.id, position.lat, position.lng);
                }
              }}
            >
              {force.name && showNames && (
                <Tooltip permanent direction="bottom" offset={[0, 20]} className="tactical-tooltip">
                  <div className="text-xs font-semibold text-white bg-black bg-opacity-80 px-2 py-1 rounded">
                    {force.name}
                  </div>
                </Tooltip>
              )}
            </Marker>
          ))}
          
          {/* Render Pending Own Force */}
          {pendingItem && modalType === 'ownforce' && showModal && (
            <Marker
              position={[(pendingItem as TacticalOwnForce).lat, (pendingItem as TacticalOwnForce).lon]}
              icon={createTacticalIcon('ownforce', formData.type, getForceColor(formData.status as TacticalOwnForce['status']))}
            >
              {formData.name && showNames && (
                <Tooltip permanent direction="bottom" offset={[0, 20]} className="tactical-tooltip">
                  <div className="text-xs font-semibold text-white bg-black bg-opacity-80 px-2 py-1 rounded">
                    {formData.name}
                  </div>
                </Tooltip>
              )}
            </Marker>
          )}
          
          {/* Render Areas */}
          {showAreas && areas.map((area) => {
            const areaColor = area.type === 'restricted' ? '#ef4444' :
                             area.type === 'patrol' ? '#3b82f6' :
                             area.type === 'objective' ? '#10b981' :
                             '#f59e0b'; // hazard
            
            if (area.shape === 'circle' && area.center && area.radius) {
              // For circles, we need a draggable marker at the center
              return (
                <React.Fragment key={area.id}>
                  <Circle
                    center={area.center}
                    radius={area.radius}
                    pathOptions={{
                      color: areaColor,
                      fillColor: areaColor,
                      fillOpacity: 0.2,
                      weight: 2,
                      dashArray: '5, 5'
                    }}
                    eventHandlers={{
                      click: () => handleItemClick(area, 'area')
                    }}
                  />
                  {/* Draggable marker for circle center */}
                  <Marker
                    position={area.center}
                    icon={createTacticalIcon('area', 'circle', areaColor)}
                    draggable={true}
                    eventHandlers={{
                      click: () => handleItemClick(area, 'area'),
                      dragend: (e) => {
                        const marker = e.target;
                        const position = marker.getLatLng();
                        handleAreaDrag(area.id, position.lat, position.lng, area.center![0], area.center![1]);
                      }
                    }}
                  >
                    {area.name && showNames && (
                      <Tooltip permanent direction="bottom" offset={[0, 20]} className="tactical-tooltip">
                        <div className="text-xs font-semibold text-white bg-black bg-opacity-80 px-2 py-1 rounded">
                          {area.name}
                        </div>
                      </Tooltip>
                    )}
                  </Marker>
                </React.Fragment>
              );
            } else if (area.shape === 'line') {
              // For lines, add a draggable marker at the midpoint
              const midpoint: LatLngTuple = area.coordinates.length > 0 ? [
                area.coordinates.reduce((sum, coord) => sum + coord[0], 0) / area.coordinates.length,
                area.coordinates.reduce((sum, coord) => sum + coord[1], 0) / area.coordinates.length
              ] : [0, 0];
              
              return (
                <React.Fragment key={area.id}>
                  <Polyline
                    positions={area.coordinates}
                    pathOptions={{
                      color: areaColor,
                      weight: 3,
                      dashArray: area.type === 'restricted' ? '10, 5' : '5, 5'
                    }}
                    eventHandlers={{
                      click: () => handleItemClick(area, 'area')
                    }}
                  />
                  {/* Draggable marker for line midpoint */}
                  <Marker
                    position={midpoint}
                    icon={createTacticalIcon('area', 'line', areaColor)}
                    draggable={true}
                    eventHandlers={{
                      click: () => handleItemClick(area, 'area'),
                      dragend: (e) => {
                        const marker = e.target;
                        const position = marker.getLatLng();
                        handleAreaDrag(area.id, position.lat, position.lng, midpoint[0], midpoint[1]);
                      }
                    }}
                  >
                    {area.name && showNames && (
                      <Tooltip permanent direction="bottom" offset={[0, 20]} className="tactical-tooltip">
                        <div className="text-xs font-semibold text-white bg-black bg-opacity-80 px-2 py-1 rounded">
                          {area.name}
                        </div>
                      </Tooltip>
                    )}
                  </Marker>
                </React.Fragment>
              );
            } else if (area.shape === 'polygon' && area.coordinates.length >= 3) {
              // For polygons, add a draggable marker at the centroid
              const centroid: LatLngTuple = [
                area.coordinates.reduce((sum, coord) => sum + coord[0], 0) / area.coordinates.length,
                area.coordinates.reduce((sum, coord) => sum + coord[1], 0) / area.coordinates.length
              ];
              
              return (
                <React.Fragment key={area.id}>
                  <Polygon
                    positions={area.coordinates}
                    pathOptions={{
                      color: areaColor,
                      fillColor: areaColor,
                      fillOpacity: 0.2,
                      weight: 2,
                      dashArray: area.type === 'restricted' ? '10, 5' : '5, 5'
                    }}
                    eventHandlers={{
                      click: () => handleItemClick(area, 'area')
                    }}
                  />
                  {/* Draggable marker for polygon centroid */}
                  <Marker
                    position={centroid}
                    icon={createTacticalIcon('area', 'polygon', areaColor)}
                    draggable={true}
                    eventHandlers={{
                      click: () => handleItemClick(area, 'area'),
                      dragend: (e) => {
                        const marker = e.target;
                        const position = marker.getLatLng();
                        handleAreaDrag(area.id, position.lat, position.lng, centroid[0], centroid[1]);
                      }
                    }}
                  >
                    {area.name && showNames && (
                      <Tooltip permanent direction="bottom" offset={[0, 20]} className="tactical-tooltip">
                        <div className="text-xs font-semibold text-white bg-black bg-opacity-80 px-2 py-1 rounded">
                          {area.name}
                        </div>
                      </Tooltip>
                    )}
                  </Marker>
                </React.Fragment>
              );
            }
            return null;
          })}
          
          {/* Render Pending Area */}
          {pendingItem && modalType === 'area' && showModal && (
            <>
              {(pendingItem as TacticalArea).shape === 'circle' && (pendingItem as TacticalArea).center && (
                <Circle
                  center={(pendingItem as TacticalArea).center!}
                  radius={formData.radius}
                  pathOptions={{
                    color: '#00ff88',
                    fillColor: '#00ff88',
                    fillOpacity: 0.2,
                    weight: 2,
                    dashArray: '5, 5'
                  }}
                >
                  {formData.name && showNames && (
                    <Tooltip permanent direction="center" className="tactical-tooltip">
                      <div className="text-xs font-semibold text-white bg-black bg-opacity-80 px-2 py-1 rounded">
                        {formData.name}
                      </div>
                    </Tooltip>
                  )}
                </Circle>
              )}
              {(pendingItem as TacticalArea).shape === 'line' && (
                <Polyline
                  positions={(pendingItem as TacticalArea).coordinates}
                  pathOptions={{
                    color: '#00ff88',
                    weight: 3,
                    dashArray: '5, 5'
                  }}
                >
                  {formData.name && showNames && (
                    <Tooltip permanent direction="center" className="tactical-tooltip">
                      <div className="text-xs font-semibold text-white bg-black bg-opacity-80 px-2 py-1 rounded">
                        {formData.name}
                      </div>
                    </Tooltip>
                  )}
                </Polyline>
              )}
              {(pendingItem as TacticalArea).shape === 'polygon' && (pendingItem as TacticalArea).coordinates.length >= 3 && (
                <Polygon
                  positions={(pendingItem as TacticalArea).coordinates}
                  pathOptions={{
                    color: '#00ff88',
                    fillColor: '#00ff88',
                    fillOpacity: 0.2,
                    weight: 2,
                    dashArray: '5, 5'
                  }}
                >
                  {formData.name && showNames && (
                    <Tooltip permanent direction="center" className="tactical-tooltip">
                      <div className="text-xs font-semibold text-white bg-black bg-opacity-80 px-2 py-1 rounded">
                        {formData.name}
                      </div>
                    </Tooltip>
                  )}
                </Polygon>
              )}
            </>
          )}
          
          {/* Render Current Drawing */}
          {isDrawingArea && currentAreaPoints.length > 0 && (
            <>
              {activeTool === 'area-polygon' && currentAreaPoints.length >= 2 && (
                <Polyline
                  positions={currentAreaPoints}
                  pathOptions={{
                    color: '#00ff88',
                    weight: 2,
                    dashArray: '5, 5',
                    opacity: 0.8
                  }}
                />
              )}
              {activeTool === 'area-line' && currentAreaPoints.length >= 2 && (
                <Polyline
                  positions={currentAreaPoints}
                  pathOptions={{
                    color: '#00ff88',
                    weight: 3,
                    dashArray: '5, 5',
                    opacity: 0.8
                  }}
                />
              )}
              {activeTool === 'area-circle' && currentAreaPoints.length === 1 && (
                <Circle
                  center={currentAreaPoints[0]}
                  radius={50} // Preview radius
                  pathOptions={{
                    color: '#00ff88',
                    fillColor: '#00ff88',
                    fillOpacity: 0.1,
                    weight: 2,
                    dashArray: '5, 5',
                    opacity: 0.8
                  }}
                />
              )}
              
              {/* Show points being drawn */}
              {currentAreaPoints.map((point, index) => (
                <Marker
                  key={`drawing-point-${index}`}
                  position={point}
                  icon={new DivIcon({
                    html: `<div style="
                      width: 8px;
                      height: 8px;
                      background: #00ff88;
                      border: 2px solid #ffffff;
                      border-radius: 50%;
                      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                    "></div>`,
                    className: 'drawing-point',
                    iconSize: [12, 12],
                    iconAnchor: [6, 6],
                  })}
                />
              ))}
            </>
          )}
        </MapContainer>
      </div>

      {/* Compact Modal */}
      {showModal && (editingItem || pendingItem) && (
        <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-[9999]">
          <div className="lattice-panel-elevated p-3 w-64 max-h-[70vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                {modalType === 'target' && <Target className="h-3 w-3 lattice-status-primary" />}
                {modalType === 'ownforce' && <Shield className="h-3 w-3 lattice-status-primary" />}
                {modalType === 'area' && <Square className="h-3 w-3 lattice-status-primary" />}
                <span className="text-xs font-semibold lattice-text-primary">
                  {pendingItem ? 'New ' : 'Edit '}
                  {modalType === 'target' ? 'Target' : modalType === 'ownforce' ? 'Own Force' : 'Area'}
                </span>
              </div>
              <button
                onClick={handleCancel}
                className="lattice-text-muted hover:lattice-text-primary transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </div>

            {/* Form */}
            <div className="space-y-2">
              {(() => {
                const currentItem = editingItem || pendingItem;
                if (!currentItem) return null;
                
                return (
                  <>
              {/* Name */}
              <div>
                <label className="text-xs lattice-text-secondary block mb-0.5">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full lattice-input text-xs py-1"
                  placeholder="Enter name..."
                />
              </div>

              {/* Position */}
              {(modalType === 'target' || modalType === 'ownforce') && (
                <>
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    <div>
                      <span className="lattice-text-secondary">LAT:</span>
                      <span className="lattice-text-primary ml-1">{(currentItem as TacticalTarget | TacticalOwnForce).lat.toFixed(6)}°</span>
                    </div>
                    <div>
                      <span className="lattice-text-secondary">LON:</span>
                      <span className="lattice-text-primary ml-1">{(currentItem as TacticalTarget | TacticalOwnForce).lon.toFixed(6)}°</span>
                    </div>
                  </div>
                  <div className="text-xs mb-1">
                    <span className="lattice-text-secondary">MGRS:</span>
                    <span className="lattice-text-primary ml-1 font-mono">{toMGRS((currentItem as TacticalTarget | TacticalOwnForce).lat, (currentItem as TacticalTarget | TacticalOwnForce).lon)}</span>
                  </div>
                </>
              )}
              
              {modalType === 'area' && (
                <div className="text-xs mb-1">
                  <span className="lattice-text-secondary">Shape:</span>
                  <span className="lattice-text-primary ml-1 capitalize">{(currentItem as TacticalArea).shape}</span>
                  {(currentItem as TacticalArea).shape === 'circle' && (
                    <>
                      <br />
                      <span className="lattice-text-secondary">Radius:</span>
                      <span className="lattice-text-primary ml-1">{formData.radius}m</span>
                    </>
                  )}
                </div>
              )}

              {/* Target-specific fields */}
              {modalType === 'target' && (
                <>
                  <div>
                    <label className="text-xs lattice-text-secondary block mb-0.5">Classification</label>
                    <select
                      value={formData.classification}
                      onChange={(e) => setFormData(prev => ({ ...prev, classification: e.target.value }))}
                      className="w-full lattice-input text-xs py-1"
                    >
                      <option value="personnel">Personnel</option>
                      <option value="vehicle">Vehicle</option>
                      <option value="building">Building</option>
                      <option value="equipment">Equipment</option>
                      <option value="unknown">Unknown</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-xs lattice-text-secondary block mb-0.5">Type</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                      className="w-full lattice-input text-xs py-1"
                    >
                      <option value="hostile">Hostile</option>
                      <option value="unknown">Unknown</option>
                      <option value="neutral">Neutral</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-xs lattice-text-secondary block mb-0.5">
                      Certainty: {formData.certainty}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={formData.certainty}
                      onChange={(e) => setFormData(prev => ({ ...prev, certainty: parseInt(e.target.value) }))}
                      className="w-full"
                    />
                  </div>
                </>
              )}

              {/* Own Force-specific fields */}
              {modalType === 'ownforce' && (
                <>
                  <div>
                    <label className="text-xs lattice-text-secondary block mb-0.5">Type</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                      className="w-full lattice-input text-xs py-1"
                    >
                      <option value="infantry">Infantry</option>
                      <option value="vehicle">Vehicle</option>
                      <option value="command">Command</option>
                      <option value="support">Support</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-xs lattice-text-secondary block mb-0.5">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full lattice-input text-xs py-1"
                    >
                      <option value="active">Active</option>
                      <option value="standby">Standby</option>
                      <option value="moving">Moving</option>
                      <option value="engaged">Engaged</option>
                    </select>
                  </div>
                </>
              )}

              {/* Area-specific fields */}
              {modalType === 'area' && (
                <>
                  <div>
                    <label className="text-xs lattice-text-secondary block mb-0.5">Type</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                      className="w-full lattice-input text-xs py-1"
                    >
                      <option value="restricted">Restricted</option>
                      <option value="patrol">Patrol</option>
                      <option value="objective">Objective</option>
                      <option value="hazard">Hazard</option>
                    </select>
                  </div>
                  
                  {(currentItem as TacticalArea).shape === 'circle' && (
                    <div>
                      <label className="text-xs lattice-text-secondary block mb-0.5">
                        Radius: {formData.radius}m
                      </label>
                      <input
                        type="range"
                        min="10"
                        max="1000"
                        value={formData.radius}
                        onChange={(e) => setFormData(prev => ({ ...prev, radius: parseInt(e.target.value) }))}
                        className="w-full"
                      />
                    </div>
                  )}
                </>
              )}

              {/* Description */}
              <div>
                <label className="text-xs lattice-text-secondary block mb-0.5">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full lattice-input text-xs py-1 h-16 resize-none"
                  placeholder="Enter description..."
                />
              </div>
                  </>
                );
              })()}
            </div>

            {/* Actions */}
            <div className="flex justify-between mt-3 pt-2 border-t border-gray-700">
              <div>
                {editingItem && (
                  <button
                    onClick={handleDelete}
                    className="lattice-button-danger text-xs px-2 py-1 flex items-center space-x-1"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Delete</span>
                  </button>
                )}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleCancel}
                  className="lattice-button text-xs px-3 py-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="lattice-button-primary text-xs px-3 py-1"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}