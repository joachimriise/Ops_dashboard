import React from 'react';
import { Responsive, WidthProvider, Layout } from 'react-grid-layout';
import Header, { GPSData } from './components/Header';
import MapPanel from './components/MapPanel';
import ADSBPanel from './components/ADSBPanel';
import ADSBDemoPanel from './components/ADSBDemoPanel';
import WeatherPanel from './components/WeatherPanel';
import SpectrumPanel from './components/SpectrumPanel';
import VideoPanel from './components/VideoPanel';
import SoftwarePanel from './components/SoftwarePanel';
import FlightLoggerPanel from './components/FlightLoggerPanel';
import TacticalPanel from './components/TacticalPanel';
import PanelSelector from './components/PanelSelector';
import { useLocalStorage } from './hooks/useLocalStorage';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

type PanelType = 'adsb' | 'adsb-demo' | 'weather' | 'spectrum' | 'tactical' | 'video' | 'map' | 'software' | 'flight-logger' | 'comms' | 'navigation' | 'sensors' | 'intel';

interface SpectrumData {
  frequency: number;
  power: number;
  bandwidth: number;
  timestamp: number;
}

interface DroneSignal {
  frequency: number;
  power: number;
  bandwidth: number;
  protocol: string;
  confidence: number;
  duration: number;
  last_seen: number;
}

interface SpectrumConfig {
  center_freq: number;
  span: number;
  rbw: number;
  sweep_time: number;
  gain: number;
  enabled_bands: string[];
}

// Default layouts for different screen sizes
const defaultLayouts = {
  lg: [
    { i: 'panel-0', x: 0, y: 0, w: 8, h: 8 },
    { i: 'panel-1', x: 8, y: 0, w: 8, h: 8 },
    { i: 'panel-2', x: 0, y: 8, w: 8, h: 8 },
    { i: 'panel-3', x: 8, y: 8, w: 8, h: 8 }
  ],
  md: [
    { i: 'panel-0', x: 0, y: 0, w: 6, h: 6 },
    { i: 'panel-1', x: 6, y: 0, w: 6, h: 6 },
    { i: 'panel-2', x: 0, y: 6, w: 6, h: 6 },
    { i: 'panel-3', x: 6, y: 6, w: 6, h: 6 }
  ],
  sm: [
    { i: 'panel-0', x: 0, y: 0, w: 4, h: 4 },
    { i: 'panel-1', x: 0, y: 4, w: 4, h: 4 },
    { i: 'panel-2', x: 0, y: 8, w: 4, h: 4 },
    { i: 'panel-3', x: 0, y: 12, w: 4, h: 4 }
  ]
};

export default function App() {
  const [isLocked, setIsLocked] = useLocalStorage('dashboardLocked', true);
  const [layouts, setLayouts] = useLocalStorage('dashboardLayouts', defaultLayouts);
  const [selectedPanel, setSelectedPanel] = useLocalStorage<PanelType>('selectedPanel', 'map');
  const [showPanelSelector, setShowPanelSelector] = React.useState(false);
  const [selectingPanelIndex, setSelectingPanelIndex] = React.useState<number | null>(null);
  const [showTimeModal, setShowTimeModal] = React.useState(false);
  const [showGpsModal, setShowGpsModal] = React.useState(false);
  const [showNetworkModal, setShowNetworkModal] = React.useState(false);
  const [showViewportInfo, setShowViewportInfo] = React.useState(false);
  const [showGridSelector, setShowGridSelector] = React.useState(false);
  const [gridSize, setGridSize] = useLocalStorage('gridSize', 4);
  
  // Panel configuration
  const [panelTypes, setPanelTypes] = useLocalStorage<PanelType[]>('panelTypes', ['map', 'adsb', 'weather', 'spectrum']);

  // GPS simulation
  const [gpsData, setGpsData] = React.useState<GPSData>({
    connected: true,
    latitude: 59.9139,
    longitude: 10.7522,
    altitude: 15,
    accuracy: 3.2,
    satellites: 8,
    fix_quality: '3D',
    hdop: 1.1,
    speed: 0,
    course: 0,
    timestamp: Date.now()
  });

  // Weather location
  const [weatherLocation, setWeatherLocation] = useLocalStorage('weatherLocation', {
    lat: 59.9139,
    lon: 10.7522,
    name: 'Oslo, Norway'
  });

  // Network status
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);

  // Spectrum data simulation
  const [spectrumData, setSpectrumData] = React.useState<SpectrumData[]>([]);
  const [droneSignals, setDroneSignals] = React.useState<DroneSignal[]>([]);
  const [spectrumConnected, setSpectrumConnected] = React.useState(true);
  const [spectrumConfig, setSpectrumConfig] = useLocalStorage<SpectrumConfig>('spectrumConfig', {
    center_freq: 2450,
    span: 100,
    rbw: 10,
    sweep_time: 0.1,
    gain: 20,
    enabled_bands: ['2.4G', '5.8G']
  });
  const [lastSpectrumUpdate, setLastSpectrumUpdate] = React.useState<Date>(new Date());
  const [isLoadingSpectrum, setIsLoadingSpectrum] = React.useState(false);

  // Network status monitoring
  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // GPS simulation
  React.useEffect(() => {
    const interval = setInterval(() => {
      setGpsData(prev => ({
        ...prev,
        timestamp: Date.now(),
        satellites: Math.max(4, Math.min(12, prev.satellites! + (Math.random() - 0.5) * 2)),
        hdop: Math.max(0.8, Math.min(3.0, prev.hdop! + (Math.random() - 0.5) * 0.2)),
        accuracy: Math.max(1.0, Math.min(10.0, prev.accuracy! + (Math.random() - 0.5) * 0.5))
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Spectrum data simulation
  React.useEffect(() => {
    const generateSpectrumData = () => {
      const data: SpectrumData[] = [];
      const signals: DroneSignal[] = [];
      
      // Generate spectrum data points
      for (let i = 0; i < 1000; i++) {
        const freq = spectrumConfig.center_freq - spectrumConfig.span/2 + (i * spectrumConfig.span / 1000);
        const power = -80 + Math.random() * 20;
        
        data.push({
          frequency: freq,
          power,
          bandwidth: spectrumConfig.rbw,
          timestamp: Date.now()
        });
      }
      
      // Generate some drone signals
      if (Math.random() > 0.7) {
        const protocols = ['WiFi 2.4GHz', 'DJI OcuSync', 'Custom 2.4GHz', 'Bluetooth', 'RC Control'];
        const protocol = protocols[Math.floor(Math.random() * protocols.length)];
        
        signals.push({
          frequency: spectrumConfig.center_freq + (Math.random() - 0.5) * spectrumConfig.span * 0.8,
          power: -40 + Math.random() * 20,
          bandwidth: 5 + Math.random() * 15,
          protocol,
          confidence: 60 + Math.random() * 40,
          duration: Math.random() * 30,
          last_seen: Date.now()
        });
      }
      
      setSpectrumData(data);
      setDroneSignals(signals);
      setLastSpectrumUpdate(new Date());
    };

    generateSpectrumData();
    const interval = setInterval(generateSpectrumData, 2000);

    return () => clearInterval(interval);
  }, [spectrumConfig]);

  // Event listeners for grid controls
  React.useEffect(() => {
    const handleShowGridSelector = () => setShowGridSelector(true);
    const handleResetLayout = () => {
      setLayouts(defaultLayouts);
    };

    window.addEventListener('showGridSelector', handleShowGridSelector);
    window.addEventListener('resetLayout', handleResetLayout);

    return () => {
      window.removeEventListener('showGridSelector', handleShowGridSelector);
      window.removeEventListener('resetLayout', handleResetLayout);
    };
  }, [setLayouts]);

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowPanelSelector(false);
        setShowTimeModal(false);
        setShowGpsModal(false);
        setShowNetworkModal(false);
        setShowViewportInfo(false);
        setShowGridSelector(false);
        setSelectingPanelIndex(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLayoutChange = (layout: Layout[], layouts: { [key: string]: Layout[] }) => {
    setLayouts(layouts);
  };

  const handlePanelHeaderClick = (index: number) => {
    if (!isLocked) {
      setSelectingPanelIndex(index);
      setShowPanelSelector(true);
    }
  };

  const handlePanelSelect = (panelType: PanelType) => {
    if (selectingPanelIndex !== null) {
      const newPanelTypes = [...panelTypes];
      newPanelTypes[selectingPanelIndex] = panelType;
      setPanelTypes(newPanelTypes);
    } else {
      setSelectedPanel(panelType);
    }
    setShowPanelSelector(false);
    setSelectingPanelIndex(null);
  };

  const handleGridSizeChange = (size: number) => {
    setGridSize(size);
    const newPanelTypes = Array(size).fill(null).map((_, i) => 
      panelTypes[i] || (['map', 'adsb', 'weather', 'spectrum', 'tactical', 'video', 'software', 'flight-logger'][i] || 'map')
    );
    setPanelTypes(newPanelTypes);
    setShowGridSelector(false);
  };

  const renderPanel = (panelType: PanelType, index: number, isSelecting: boolean = false) => {
    const commonProps = {
      onHeaderClick: () => handlePanelHeaderClick(index),
      isSelecting
    };

    switch (panelType) {
      case 'map':
        return <MapPanel {...commonProps} gpsData={gpsData} />;
      case 'adsb':
        return <ADSBPanel {...commonProps} gpsData={gpsData} />;
      case 'adsb-demo':
        return <ADSBDemoPanel {...commonProps} gpsData={gpsData} />;
      case 'weather':
        return (
          <WeatherPanel 
            {...commonProps} 
            weatherLocation={weatherLocation}
            onLocationChange={setWeatherLocation}
          />
        );
      case 'spectrum':
        return (
          <SpectrumPanel
            {...commonProps}
            spectrumData={spectrumData}
            droneSignals={droneSignals}
            spectrumConnected={spectrumConnected}
            spectrumConfig={spectrumConfig}
            lastSpectrumUpdate={lastSpectrumUpdate}
            isLoadingSpectrum={isLoadingSpectrum}
            onConfigChange={setSpectrumConfig}
            panelId={`spectrum-${index}`}
          />
        );
      case 'tactical':
        return <TacticalPanel {...commonProps} />;
      case 'video':
        return <VideoPanel {...commonProps} />;
      case 'software':
        return <SoftwarePanel {...commonProps} />;
      case 'flight-logger':
        return <FlightLoggerPanel {...commonProps} />;
      default:
        return (
          <div className="lattice-panel flex items-center justify-center h-full">
            <div className="text-center lattice-text-muted">
              <div className="text-lg font-semibold mb-2">Panel Coming Soon</div>
              <div className="text-sm">This panel is under development</div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Header
        gpsData={gpsData}
        isOnline={isOnline}
        isLocked={isLocked}
        onToggleLock={() => setIsLocked(!isLocked)}
        onShowTimeModal={() => setShowTimeModal(true)}
        onShowGpsModal={() => setShowGpsModal(true)}
        onShowNetworkModal={() => setShowNetworkModal(true)}
        onShowViewportInfo={() => setShowViewportInfo(true)}
      />

      <main className="h-[calc(100vh-80px)]">
        {isLocked ? (
          // Single panel view when locked
          <div className="h-full p-4">
            {renderPanel(selectedPanel, 0)}
          </div>
        ) : (
          // Grid layout when unlocked
          <div className="h-full p-4">
            <ResponsiveGridLayout
              className="layout"
              layouts={layouts}
              onLayoutChange={handleLayoutChange}
              breakpoints={{ lg: 1200, md: 996, sm: 768 }}
              cols={{ lg: 16, md: 12, sm: 4 }}
              rowHeight={30}
              isDraggable={!isLocked}
              isResizable={!isLocked}
              margin={[8, 8]}
              containerPadding={[0, 0]}
            >
              {Array.from({ length: gridSize }, (_, i) => (
                <div key={`panel-${i}`}>
                  {renderPanel(panelTypes[i] || 'map', i, selectingPanelIndex === i)}
                </div>
              ))}
            </ResponsiveGridLayout>
          </div>
        )}
      </main>

      {/* Panel Selector Modal */}
      {showPanelSelector && (
        <PanelSelector
          onSelect={handlePanelSelect}
          onClose={() => {
            setShowPanelSelector(false);
            setSelectingPanelIndex(null);
          }}
          currentPanel={selectingPanelIndex !== null ? panelTypes[selectingPanelIndex] : selectedPanel}
        />
      )}

      {/* Time Modal */}
      {showTimeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="lattice-panel-elevated p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold lattice-text-primary">World Time</h3>
              <button
                onClick={() => setShowTimeModal(false)}
                className="lattice-text-muted hover:lattice-text-primary transition-colors"
              >
                ×
              </button>
            </div>
            <div className="space-y-3 text-sm">
              {[
                { name: 'Local', time: new Date().toLocaleTimeString(), timezone: Intl.DateTimeFormat().resolvedOptions().timeZone },
                { name: 'Zulu (UTC)', time: new Date().toUTCString().split(' ')[4], timezone: 'UTC' },
                { name: 'New York', time: new Date().toLocaleTimeString('en-US', { timeZone: 'America/New_York' }), timezone: 'EST/EDT' },
                { name: 'London', time: new Date().toLocaleTimeString('en-GB', { timeZone: 'Europe/London' }), timezone: 'GMT/BST' },
                { name: 'Tokyo', time: new Date().toLocaleTimeString('ja-JP', { timeZone: 'Asia/Tokyo' }), timezone: 'JST' },
                { name: 'Sydney', time: new Date().toLocaleTimeString('en-AU', { timeZone: 'Australia/Sydney' }), timezone: 'AEST/AEDT' }
              ].map((location) => (
                <div key={location.name} className="flex justify-between items-center">
                  <span className="lattice-text-secondary">{location.name}</span>
                  <div className="text-right">
                    <div className="lattice-text-primary font-semibold">{location.time}</div>
                    <div className="text-xs lattice-text-muted">{location.timezone}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* GPS Modal */}
      {showGpsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="lattice-panel-elevated p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold lattice-text-primary">GPS Status</h3>
              <button
                onClick={() => setShowGpsModal(false)}
                className="lattice-text-muted hover:lattice-text-primary transition-colors"
              >
                ×
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="lattice-text-secondary">Status:</span>
                <span className="lattice-status-good font-semibold">{gpsData.fix_quality}</span>
              </div>
              <div className="flex justify-between">
                <span className="lattice-text-secondary">Satellites:</span>
                <span className="lattice-text-primary font-semibold">{gpsData.satellites}</span>
              </div>
              <div className="flex justify-between">
                <span className="lattice-text-secondary">HDOP:</span>
                <span className="lattice-text-primary font-semibold">{gpsData.hdop?.toFixed(1)}</span>
              </div>
              <div className="flex justify-between">
                <span className="lattice-text-secondary">Accuracy:</span>
                <span className="lattice-text-primary font-semibold">±{gpsData.accuracy?.toFixed(1)}m</span>
              </div>
              <div className="flex justify-between">
                <span className="lattice-text-secondary">Latitude:</span>
                <span className="lattice-text-primary font-semibold">{gpsData.latitude?.toFixed(6)}°</span>
              </div>
              <div className="flex justify-between">
                <span className="lattice-text-secondary">Longitude:</span>
                <span className="lattice-text-primary font-semibold">{gpsData.longitude?.toFixed(6)}°</span>
              </div>
              <div className="flex justify-between">
                <span className="lattice-text-secondary">Altitude:</span>
                <span className="lattice-text-primary font-semibold">{gpsData.altitude}m</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Network Modal */}
      {showNetworkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="lattice-panel-elevated p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold lattice-text-primary">Network Status</h3>
              <button
                onClick={() => setShowNetworkModal(false)}
                className="lattice-text-muted hover:lattice-text-primary transition-colors"
              >
                ×
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="lattice-text-secondary">Connection:</span>
                <span className={`font-semibold ${isOnline ? 'lattice-status-good' : 'lattice-status-error'}`}>
                  {isOnline ? 'ONLINE' : 'OFFLINE'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="lattice-text-secondary">Type:</span>
                <span className="lattice-text-primary font-semibold">
                  {(navigator as any).connection?.effectiveType || 'Unknown'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="lattice-text-secondary">User Agent:</span>
                <span className="lattice-text-primary font-semibold text-xs break-all">
                  {navigator.userAgent.split(' ')[0]}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Viewport Info Modal */}
      {showViewportInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="lattice-panel-elevated p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold lattice-text-primary">Viewport Information</h3>
              <button
                onClick={() => setShowViewportInfo(false)}
                className="lattice-text-muted hover:lattice-text-primary transition-colors"
              >
                ×
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="lattice-text-secondary">Window Size:</span>
                <span className="lattice-text-primary font-semibold">
                  {window.innerWidth} × {window.innerHeight}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="lattice-text-secondary">Screen Size:</span>
                <span className="lattice-text-primary font-semibold">
                  {window.screen.width} × {window.screen.height}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="lattice-text-secondary">Device Pixel Ratio:</span>
                <span className="lattice-text-primary font-semibold">{window.devicePixelRatio}</span>
              </div>
              <div className="flex justify-between">
                <span className="lattice-text-secondary">Grid Size:</span>
                <span className="lattice-text-primary font-semibold">{gridSize} panels</span>
              </div>
              <div className="flex justify-between">
                <span className="lattice-text-secondary">Layout Mode:</span>
                <span className="lattice-text-primary font-semibold">{isLocked ? 'Single Panel' : 'Grid Layout'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grid Selector Modal */}
      {showGridSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="lattice-panel-elevated p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold lattice-text-primary">Grid Layout</h3>
              <button
                onClick={() => setShowGridSelector(false)}
                className="lattice-text-muted hover:lattice-text-primary transition-colors"
              >
                ×
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 4, 6, 8, 9].map((size) => (
                <button
                  key={size}
                  onClick={() => handleGridSizeChange(size)}
                  className={`lattice-button p-4 text-center ${
                    gridSize === size ? 'lattice-button-primary' : ''
                  }`}
                >
                  <div className="text-lg font-semibold">{size}</div>
                  <div className="text-xs">Panel{size !== 1 ? 's' : ''}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}