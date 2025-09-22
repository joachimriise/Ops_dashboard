import React, { useState, useEffect } from 'react';
import { X, Layout as LayoutIcon, Grid3X3, Grid2X2, Radio, Target, Clock, Satellite, Wifi, WifiOff } from 'lucide-react';
import { Layout } from 'react-grid-layout';
import { useLocalStorage } from './hooks/useLocalStorage';
import GridLayout from './components/GridLayout';
import Header, { GPSData } from './components/Header';
import ADSBPanel from './components/ADSBPanel';
import ADSBDemoPanel from './components/ADSBDemoPanel';
import WeatherPanel from './components/WeatherPanel';
import SpectrumPanel from './components/SpectrumPanel';
import TacticalPanel from './components/TacticalPanel';
import VideoPanel from './components/VideoPanel';
import MapPanel from './components/MapPanel';
import SoftwarePanel from './components/SoftwarePanel';
import FlightLoggerPanel from './components/FlightLoggerPanel';
import PanelSelector from './components/PanelSelector';

export interface GPSData {
  connected: boolean;
  latitude?: number;
  longitude?: number;
  altitude?: number;
  accuracy?: number;
  satellites?: number;
  fix_quality?: string;
  hdop?: number;
  speed?: number;
  course?: number;
  timestamp?: number;
}

interface Aircraft {
  icao24: string;
  callsign: string;
  origin_country: string;
  time_position: number;
  last_contact: number;
  longitude: number;
  latitude: number;
  baro_altitude: number;
  on_ground: boolean;
  velocity: number;
  true_track: number;
  vertical_rate: number;
  geo_altitude: number;
  source: 'opensky' | 'rtl-sdr';
  signal_strength?: number;
  last_seen?: number;
  // Additional ADS-B Exchange fields
  aircraft_type?: string;
  registration?: string;
  operator?: string;
  squawk?: string;
  emergency?: string;
  spi?: boolean;
  mlat?: boolean;
  tisb?: boolean;
  messages?: number;
  seen?: number;
  rssi?: number;
}

interface WeatherData {
  temperature: number;
  humidity: number;
  pressure: number;
  visibility: number;
  wind_speed: number;
  wind_direction: number;
  wind_gust?: number;
  weather_main: string;
  weather_description: string;
  clouds: number;
  rain?: number;
  snow?: number;
}

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

interface ADSBSettings {
  useGPS: boolean;
  defaultLocation: { lat: number; lon: number; name: string };
  radiusKm: number;
}

type PanelType = 'adsb' | 'adsb-demo' | 'weather' | 'spectrum' | 'tactical' | 'video' | 'map' | 'comms' | 'navigation' | 'sensors' | 'intel' | 'software' | 'flight-logger';

interface PanelItem {
  id: string;
  type: PanelType;
  title: string;
}

const defaultPanels: PanelItem[] = [
  { id: 'panel-1', type: 'adsb', title: 'ADS-B SURVEILLANCE' },
  { id: 'panel-2', type: 'spectrum', title: 'SPECTRUM ANALYZER' },
  { id: 'panel-3', type: 'weather', title: 'WEATHER CONDITIONS' },
  { id: 'panel-4', type: 'video', title: 'VIDEO SURVEILLANCE' }
];

const defaultLayouts = {
  lg: [
    { i: 'panel-1', x: 0, y: 0, w: 8, h: 8, minW: 2, minH: 2 },
    { i: 'panel-2', x: 8, y: 0, w: 8, h: 8, minW: 2, minH: 2 },
    { i: 'panel-3', x: 0, y: 8, w: 8, h: 8, minW: 2, minH: 2 },
    { i: 'panel-4', x: 8, y: 8, w: 8, h: 8, minW: 2, minH: 2 }
  ],
  md: [
    { i: 'panel-1', x: 0, y: 0, w: 8, h: 8, minW: 2, minH: 2 },
    { i: 'panel-2', x: 8, y: 0, w: 8, h: 8, minW: 2, minH: 2 },
    { i: 'panel-3', x: 0, y: 8, w: 8, h: 8, minW: 2, minH: 2 },
    { i: 'panel-4', x: 8, y: 8, w: 8, h: 8, minW: 2, minH: 2 }
  ],
  sm: [
    { i: 'panel-1', x: 0, y: 0, w: 16, h: 4, minW: 2, minH: 2 },
    { i: 'panel-2', x: 0, y: 4, w: 16, h: 4, minW: 2, minH: 2 },
    { i: 'panel-3', x: 0, y: 8, w: 16, h: 4, minW: 2, minH: 2 },
    { i: 'panel-4', x: 0, y: 12, w: 16, h: 4, minW: 2, minH: 2 }
  ]
};

// 16x16 Grid Layout Presets
const gridPresets = {
  '1x1': {
    name: 'Single Panel',
    description: 'One large panel',
    layouts: [
      { i: 'panel-1', x: 0, y: 0, w: 16, h: 16, minW: 2, minH: 2 }
    ]
  },
  '1x2': {
    name: 'Vertical Split',
    description: 'Two panels stacked vertically',
    layouts: [
      { i: 'panel-1', x: 0, y: 0, w: 16, h: 8, minW: 2, minH: 2 },
      { i: 'panel-2', x: 0, y: 8, w: 16, h: 8, minW: 2, minH: 2 }
    ]
  },
  '2x1': {
    name: 'Horizontal Split',
    description: 'Two panels side by side',
    layouts: [
      { i: 'panel-1', x: 0, y: 0, w: 8, h: 16, minW: 2, minH: 2 },
      { i: 'panel-2', x: 8, y: 0, w: 8, h: 16, minW: 2, minH: 2 }
    ]
  },
  '2x2': {
    name: 'Quad Layout',
    description: 'Four equal panels',
    layouts: [
      { i: 'panel-1', x: 0, y: 0, w: 8, h: 8, minW: 2, minH: 2 },
      { i: 'panel-2', x: 8, y: 0, w: 8, h: 8, minW: 2, minH: 2 },
      { i: 'panel-3', x: 0, y: 8, w: 8, h: 8, minW: 2, minH: 2 },
      { i: 'panel-4', x: 8, y: 8, w: 8, h: 8, minW: 2, minH: 2 }
    ]
  },
  'main-side': {
    name: 'Main + Sidebar',
    description: 'Large main panel with sidebar',
    layouts: [
      { i: 'panel-1', x: 0, y: 0, w: 12, h: 12, minW: 4, minH: 4 },
      { i: 'panel-2', x: 12, y: 0, w: 4, h: 6, minW: 2, minH: 2 },
      { i: 'panel-3', x: 12, y: 6, w: 4, h: 6, minW: 2, minH: 2 },
      { i: 'panel-4', x: 0, y: 12, w: 4, h: 4, minW: 2, minH: 2 },
      { i: 'panel-5', x: 4, y: 12, w: 4, h: 4, minW: 2, minH: 2 },
      { i: 'panel-6', x: 8, y: 12, w: 4, h: 4, minW: 2, minH: 2 },
      { i: 'panel-7', x: 12, y: 12, w: 4, h: 4, minW: 2, minH: 2 }
    ]
  },
  'dashboard': {
    name: 'Dashboard Layout',
    description: 'Mixed panel sizes for dashboard',
    layouts: [
      { i: 'panel-1', x: 0, y: 0, w: 10, h: 8, minW: 4, minH: 4 },
      { i: 'panel-2', x: 10, y: 0, w: 6, h: 4, minW: 2, minH: 2 },
      { i: 'panel-3', x: 10, y: 4, w: 6, h: 4, minW: 2, minH: 2 },
      { i: 'panel-4', x: 0, y: 8, w: 5, h: 8, minW: 2, minH: 2 },
      { i: 'panel-5', x: 5, y: 8, w: 5, h: 8, minW: 2, minH: 2 },
      { i: 'panel-6', x: 10, y: 8, w: 6, h: 8, minW: 2, minH: 2 }
    ]
  },
  '3x3': {
    name: 'Nine Grid',
    description: 'Nine equal panels',
    layouts: [
      { i: 'panel-1', x: 0, y: 0, w: 5, h: 5, minW: 2, minH: 2 },
      { i: 'panel-2', x: 5, y: 0, w: 6, h: 5, minW: 2, minH: 2 },
      { i: 'panel-3', x: 11, y: 0, w: 5, h: 5, minW: 2, minH: 2 },
      { i: 'panel-4', x: 0, y: 5, w: 5, h: 6, minW: 2, minH: 2 },
      { i: 'panel-5', x: 5, y: 5, w: 6, h: 6, minW: 2, minH: 2 },
      { i: 'panel-6', x: 11, y: 5, w: 5, h: 6, minW: 2, minH: 2 },
      { i: 'panel-7', x: 0, y: 11, w: 5, h: 5, minW: 2, minH: 2 },
      { i: 'panel-8', x: 5, y: 11, w: 6, h: 5, minW: 2, minH: 2 },
      { i: 'panel-9', x: 11, y: 11, w: 5, h: 5, minW: 2, minH: 2 }
    ]
  },
  'monitoring': {
    name: 'Monitoring Layout',
    description: 'Large display with small monitoring panels',
    layouts: [
      { i: 'panel-1', x: 0, y: 0, w: 12, h: 10, minW: 6, minH: 6 },
      { i: 'panel-2', x: 12, y: 0, w: 4, h: 5, minW: 2, minH: 2 },
      { i: 'panel-3', x: 12, y: 5, w: 4, h: 5, minW: 2, minH: 2 },
      { i: 'panel-4', x: 0, y: 10, w: 3, h: 6, minW: 2, minH: 2 },
      { i: 'panel-5', x: 3, y: 10, w: 3, h: 6, minW: 2, minH: 2 },
      { i: 'panel-6', x: 6, y: 10, w: 3, h: 6, minW: 2, minH: 2 },
      { i: 'panel-7', x: 9, y: 10, w: 3, h: 6, minW: 2, minH: 2 },
      { i: 'panel-8', x: 12, y: 10, w: 4, h: 6, minW: 2, minH: 2 }
    ]
  }
};

const generateGridLayout = (preset: keyof typeof gridPresets): { [key: string]: Layout[] } => {
  const presetConfig = gridPresets[preset];
  const layouts = presetConfig.layouts;

  return {
    lg: layouts,
    md: layouts.map(l => ({ ...l, w: Math.max(2, Math.floor(l.w * 0.8)), h: Math.max(2, Math.floor(l.h * 0.8)) })),
    sm: layouts.map((l, index) => ({ ...l, x: 0, y: index * 4, w: 16, h: 4 }))
  };
};

export default function App() {
  // Use localStorage for persistent state
  const [aircraft, setAircraft] = useState<Aircraft[]>([]);
  const [rtlSdrConnected, setRtlSdrConnected] = useState(false);
  const [rtlSdrAircraft, setRtlSdrAircraft] = useState<Aircraft[]>([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLocation, setWeatherLocation] = useLocalStorage('weatherLocation', { 
    lat: 59.9139, 
    lon: 10.7522, 
    name: 'Oslo, Norway' 
  });
  const [spectrumData, setSpectrumData] = useState<SpectrumData[]>([]);
  const [droneSignals, setDroneSignals] = useState<DroneSignal[]>([]);
  const [spectrumConnected, setSpectrumConnected] = useState(false);
  const [spectrumConfigs, setSpectrumConfigs] = useLocalStorage('spectrumConfigs', {
    'panel-1': {
      center_freq: 2450,
      span: 100,
      rbw: 100,
      sweep_time: 0.1,
      gain: 20,
      enabled_bands: ['2.4G', '5.8G', '900M', '433M']
    },
    'panel-2': {
      center_freq: 5800,
      span: 200,
      rbw: 100,
      sweep_time: 0.1,
      gain: 20,
      enabled_bands: ['5.8G']
    },
    'panel-3': {
      center_freq: 433,
      span: 10,
      rbw: 50,
      sweep_time: 0.1,
      gain: 25,
      enabled_bands: ['433M']
    },
    'panel-4': {
      center_freq: 915,
      span: 50,
      rbw: 100,
      sweep_time: 0.1,
      gain: 20,
      enabled_bands: ['900M']
    }
  });
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [lastWeatherUpdate, setLastWeatherUpdate] = useState<Date>(new Date());
  const [lastRtlUpdate, setLastRtlUpdate] = useState<Date>(new Date());
  const [lastSpectrumUpdate, setLastSpectrumUpdate] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);
  const [isLoadingRtl, setIsLoadingRtl] = useState(false);
  const [isLoadingSpectrum, setIsLoadingSpectrum] = useState(false);
  const [demoAircraftPositions, setDemoAircraftPositions] = useState<Map<string, {lat: number, lon: number, alt: number, track: number, velocity: number}>>(new Map());
  const [showGpsInfo, setShowGpsInfo] = useState(false);
  const [panels, setPanels] = useLocalStorage('dashboardPanels', defaultPanels);
  const [layouts, setLayouts] = useLocalStorage('dashboardLayouts', defaultLayouts);
  const [isLayoutLocked, setIsLayoutLocked] = useLocalStorage('layoutLocked', true);
  const [selectingPanel, setSelectingPanel] = useState<string | null>(null);
  const [currentGridPreset, setCurrentGridPreset] = useLocalStorage<keyof typeof gridPresets>('gridPreset', '2x2');
  const [showGridSelector, setShowGridSelector] = useState(false);
  const [adsbSettings, setAdsbSettings] = useLocalStorage('adsbSettings', {
    useGPS: false,
    defaultLocation: { lat: 59.9139, lon: 10.7522, name: 'Oslo, Norway' },
    radiusKm: 10
  });
  const [gpsData, setGpsData] = React.useState<GPSData>({
    connected: false,
    latitude: 59.9139,
    longitude: 10.7522,
    altitude: 0,
    accuracy: 0,
    satellites: 0,
    fix_quality: 'NO_FIX',
    timestamp: Date.now()
  });
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);
  const [isLocked, setIsLocked] = useLocalStorage('isLocked', false);
  const [showTimeModal, setShowTimeModal] = React.useState(false);
  const [showGpsModal, setShowGpsModal] = React.useState(false);
  const [showNetworkModal, setShowNetworkModal] = React.useState(false);
  const [showViewportInfo, setShowViewportInfo] = React.useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [networkInfo, setNetworkInfo] = useState({
    ipAddress: 'Detecting...',
    publicIp: 'Detecting...',
    connectionType: 'Unknown',
    effectiveType: 'Unknown',
    downlink: 0,
    rtt: 0,
    onlineSince: new Date(),
    downtime: 0,
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    cookieEnabled: navigator.cookieEnabled,
    javaEnabled: false,
    screenResolution: `${screen.width}x${screen.height}`,
    colorDepth: screen.colorDepth,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timezoneOffset: new Date().getTimezoneOffset()
  });
  const [viewportDimensions, setViewportDimensions] = React.useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  // Helper functions for weather symbol parsing
  const getWeatherMain = (symbolCode: string): string => {
    if (symbolCode.includes('rain')) return 'Rain';
    if (symbolCode.includes('snow')) return 'Snow';
    if (symbolCode.includes('sleet')) return 'Sleet';
    if (symbolCode.includes('fog')) return 'Fog';
    if (symbolCode.includes('cloudy')) return 'Clouds';
    if (symbolCode.includes('partlycloudy')) return 'Clouds';
    if (symbolCode.includes('fair')) return 'Clear';
    if (symbolCode.includes('clearsky')) return 'Clear';
    return 'Clear';
  };

  const getWeatherDescription = (symbolCode: string): string => {
    const symbolMap: { [key: string]: string } = {
      'clearsky_day': 'clear sky',
      'clearsky_night': 'clear sky',
      'fair_day': 'fair',
      'fair_night': 'fair',
      'partlycloudy_day': 'partly cloudy',
      'partlycloudy_night': 'partly cloudy',
      'cloudy': 'cloudy',
      'rainshowers_day': 'light rain showers',
      'rainshowers_night': 'light rain showers',
      'rainshowersandthunder_day': 'rain showers and thunder',
      'rainshowersandthunder_night': 'rain showers and thunder',
      'sleetshowers_day': 'sleet showers',
      'sleetshowers_night': 'sleet showers',
      'snowshowers_day': 'snow showers',
      'snowshowers_night': 'snow showers',
      'rain': 'rain',
      'heavyrain': 'heavy rain',
      'heavyrainandthunder': 'heavy rain and thunder',
      'sleet': 'sleet',
      'snow': 'snow',
      'snowandthunder': 'snow and thunder',
      'fog': 'fog',
      'sleetshowersandthunder_day': 'sleet showers and thunder',
      'sleetshowersandthunder_night': 'sleet showers and thunder',
      'snowshowersandthunder_day': 'snow showers and thunder',
      'snowshowersandthunder_night': 'snow showers and thunder',
      'rainandthunder': 'rain and thunder',
      'sleetandthunder': 'sleet and thunder'
    };
    
    return symbolMap[symbolCode] || symbolCode.replace(/_/g, ' ');
  };

  // Monitor network connectivity
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    const handleShowGridSelector = () => setShowGridSelector(true);
    const handleResetLayout = () => resetLayout();
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('showGridSelector', handleShowGridSelector);
    window.addEventListener('resetLayout', handleResetLayout);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('showGridSelector', handleShowGridSelector);
      window.removeEventListener('resetLayout', handleResetLayout);
    };
  }, []);

  // Update time every second
  useEffect(() => {
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timeInterval);
  }, []);

  // Fetch network information
  const fetchNetworkInfo = async () => {
    try {
      // Try to get local IP first
      try {
        const localIpResponse = await fetch('http://localhost:8080/api/network-info', {
          signal: AbortSignal.timeout(2000)
        });
        if (localIpResponse.ok) {
          const localData = await localIpResponse.json();
          setNetworkInfo(prev => ({ 
            ...prev, 
            ipAddress: localData.localIp || 'Unavailable'
          }));
        }
      } catch (error) {
        // Fallback to detecting local IP via WebRTC
        try {
          const pc = new RTCPeerConnection({iceServers: []});
          pc.createDataChannel('');
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          
          pc.onicecandidate = (ice) => {
            if (ice && ice.candidate && ice.candidate.candidate) {
              const candidate = ice.candidate.candidate;
              const ipMatch = candidate.match(/(\d+\.\d+\.\d+\.\d+)/);
              if (ipMatch) {
                setNetworkInfo(prev => ({ ...prev, ipAddress: ipMatch[1] }));
                pc.close();
              }
            }
          };
        } catch (webrtcError) {
          setNetworkInfo(prev => ({ ...prev, ipAddress: 'Unavailable' }));
        }
      }

      // Try to get public IP
      const ipResponse = await fetch('https://api.ipify.org?format=json', {
        signal: AbortSignal.timeout(5000)
      });
      if (ipResponse.ok) {
        const ipData = await ipResponse.json();
        setNetworkInfo(prev => ({ ...prev, publicIp: ipData.ip }));
      }
    } catch (error) {
      setNetworkInfo(prev => ({ ...prev, publicIp: 'Unavailable' }));
    }

    // Get connection info if available
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      setNetworkInfo(prev => ({ 
        ...prev, 
        connectionType: connection.type || 'Unknown',
        effectiveType: connection.effectiveType || 'Unknown',
        downlink: connection.downlink || 0,
        rtt: connection.rtt || 0
      }));
    }

    // Check Java support
    try {
      setNetworkInfo(prev => ({ 
        ...prev, 
        javaEnabled: navigator.javaEnabled ? navigator.javaEnabled() : false
      }));
    } catch (error) {
      setNetworkInfo(prev => ({ ...prev, javaEnabled: false }));
    }
  };

  // Monitor network connectivity and fetch info
  useEffect(() => {
    const handleOnlineStatus = () => {
      setIsOnline(true);
      setNetworkInfo(prev => ({ ...prev, onlineSince: new Date() }));
    };
    const handleOfflineStatus = () => {
      setIsOnline(false);
      setNetworkInfo(prev => ({ ...prev, downtime: prev.downtime + 1 }));
    };
    
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOfflineStatus);
    
    // Initial network info fetch
    if (isOnline) {
      fetchNetworkInfo();
    }
    
    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOfflineStatus);
    };
  }, []);

  // Fetch GPS data
  const fetchGPSData = async () => {
    try {
      // Try to connect to local GPS daemon (gpsd) or similar service
      const response = await fetch('http://localhost:2947/gps', {
        signal: AbortSignal.timeout(2000)
      });
      
      if (response.ok) {
        const data = await response.json();
        setGpsData({
          connected: true,
          latitude: data.lat,
          longitude: data.lon,
          altitude: data.alt,
          accuracy: data.accuracy,
          satellites: data.satellites,
          fix_quality: data.fix_quality || '3D',
          hdop: data.hdop,
          speed: data.speed,
          course: data.course,
          timestamp: Date.now()
        });
      } else {
        throw new Error('GPS service not available');
      }
    } catch (error) {
      // No GPS available - set disconnected state
      setGpsData({ connected: false });
    }
  };

  const fetchAircraftData = async () => {
    try {
      setIsLoading(true);
      
      // Determine center position for API query
      const centerLat = adsbSettings.useGPS 
        ? adsbSettings.defaultLocation.lat 
        : adsbSettings.defaultLocation.lat ?? 59.9139;
      const centerLon = adsbSettings.useGPS 
        ? adsbSettings.defaultLocation.lon 
        : Number(adsbSettings.defaultLocation?.lon ?? 10.7522);
      
      // Calculate bounding box based on radius
      const radiusInDegrees = adsbSettings.radiusKm / 111; // Approximate km to degrees conversion
      
      // Fetch live data from OpenSky Network API (with offline fallback)
      let onlineAircraft: Aircraft[] = [];
      
      // Only attempt online fetch if connected
      if (isOnline) {
        // OpenSky API temporarily disabled due to rate limiting (HTTP 429)
        console.log('OpenSky API disabled - using RTL-SDR data only');
      }
      
      // Combine online and RTL-SDR aircraft data
      const combinedAircraft = [...onlineAircraft, ...rtlSdrAircraft];
      
      setAircraft(combinedAircraft);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error in fetchAircraftData:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWeatherData = async () => {
    try {
      setIsLoadingWeather(true);
      
      // Use Yr.no API (Norwegian Meteorological Institute)
      const response = await fetch(`/api/yr/locationforecast/2.0/compact?lat=${weatherLocation.lat}&lon=${weatherLocation.lon}`, {
        signal: AbortSignal.timeout(10000),
        headers: {
          'User-Agent': 'MilUAS-Dashboard/1.0 (contact@example.com)'
        }
      });
      
      if (response.ok) {
        const data = await response.json();

        // Using MET Norway API
        const response2 = await fetch(
          `/api/metno/weatherapi/locationforecast/2.0/compact?lat=${weatherLocation.lat}&lon=${weatherLocation.lon}`
        );

        if (!response2.ok) {
          throw new Error('Weather data not available');
        }

        const data2 = await response2.json();
        
        // Parse MET Norway data structure
        const currentData = data2.properties.timeseries[0];
        const instant = currentData.data.instant.details;
        const next1h = currentData.data.next_1_hours?.details;
        const next6h = currentData.data.next_6_hours?.details;
        
        // Get precipitation data from next hour if available
        const precipitation = next1h?.precipitation_amount || 0;
        
        // Get weather symbol from next 1h or 6h forecast
        const weatherSymbol = currentData.data.next_1_hours?.summary?.symbol_code || 
                             currentData.data.next_6_hours?.summary?.symbol_code || 
                             'clearsky_day';
        
        // Convert weather symbol to description
        const getWeatherDescription = (symbol: string): { main: string; description: string } => {
          if (symbol.includes('rain')) return { main: 'Rain', description: 'rainy' };
          if (symbol.includes('snow')) return { main: 'Snow', description: 'snowy' };
          if (symbol.includes('sleet')) return { main: 'Sleet', description: 'sleet' };
          if (symbol.includes('fog')) return { main: 'Fog', description: 'foggy' };
          if (symbol.includes('cloudy')) return { main: 'Clouds', description: 'cloudy' };
          if (symbol.includes('partlycloudy')) return { main: 'Clouds', description: 'partly cloudy' };
          if (symbol.includes('fair')) return { main: 'Clear', description: 'fair' };
          if (symbol.includes('clearsky')) return { main: 'Clear', description: 'clear sky' };
          return { main: 'Clear', description: 'clear' };
        };
        
        const weatherDesc = getWeatherDescription(weatherSymbol);
        
        setWeather({
          temperature: instant.air_temperature,
          humidity: instant.relative_humidity,
          pressure: instant.air_pressure_at_sea_level,
          visibility: instant.fog_area_fraction ? (1 - instant.fog_area_fraction / 100) * 10 : 10, // Estimate visibility from fog
          wind_speed: instant.wind_speed * 3.6, // Convert m/s to km/h
          wind_direction: instant.wind_from_direction,
          wind_gust: instant.wind_speed_of_gust ? instant.wind_speed_of_gust * 3.6 : undefined,
          weather_main: weatherDesc.main,
          weather_description: weatherDesc.description,
          clouds: instant.cloud_area_fraction || 0,
          rain: precipitation > 0 && weatherSymbol.includes('rain') ? precipitation : undefined,
          snow: precipitation > 0 && weatherSymbol.includes('snow') ? precipitation : undefined
        });
        
        setLastWeatherUpdate(new Date());
      }
    } catch (error) {
      console.error('Error fetching weather data:', error);
      // Don't set any weather data on error - let UI show loading/error state
      setWeather(null);
    } finally {
      setIsLoadingWeather(false);
    }
  };

  const simulateSpectrumData = () => {
    setIsLoadingSpectrum(true);
    
    // Generate spectrum data
    const newSpectrumData: SpectrumData[] = [];
    const newDroneSignals: DroneSignal[] = [];
    
    // Generate spectrum data for all frequency ranges
    Object.values(spectrumConfigs).forEach(config => {
      for (let i = 0; i < 1000; i++) {
        const freq = config.center_freq - config.span/2 + (i * config.span / 1000);
        newSpectrumData.push({
          frequency: freq,
          power: -80 + Math.random() * 20,
          bandwidth: config.rbw,
          timestamp: Date.now()
        });
      }
    });
    
    // Add some drone signals based on all enabled bands
    Object.values(spectrumConfigs).forEach(config => {
      config.enabled_bands.forEach(band => {
        if (Math.random() > 0.7) { // 30% chance of signal in each band
          let centerFreq = 2450;
          let protocol = 'Unknown';
          
          switch (band) {
            case '433M':
              centerFreq = 433 + Math.random() * 10;
              protocol = 'LoRa/Telemetry';
              break;
            case '900M':
              centerFreq = 915 + Math.random() * 20;
              protocol = 'Long Range Control';
              break;
            case '2.4G':
              centerFreq = 2400 + Math.random() * 100;
              protocol = Math.random() > 0.5 ? 'WiFi/RC Control' : 'Bluetooth';
              break;
            case '5.8G':
              centerFreq = 5800 + Math.random() * 200;
              protocol = 'FPV Video';
              break;
          }
          
          newDroneSignals.push({
            frequency: centerFreq,
            power: -40 + Math.random() * 20,
            bandwidth: 1 + Math.random() * 5,
            protocol,
            confidence: 60 + Math.random() * 40,
            duration: 1 + Math.random() * 30,
            last_seen: Date.now()
          });
        }
      });
    });
    
    setSpectrumData(newSpectrumData);
    setDroneSignals(newDroneSignals);
    setLastSpectrumUpdate(new Date());
    
    setTimeout(() => setIsLoadingSpectrum(false), 1000);
  };

  const handleSpectrumConfigChange = (panelId: string, config: SpectrumConfig) => {
    setSpectrumConfigs(prev => ({
      ...prev,
      [panelId]: config
    }));
  };

  const getSpectrumConfig = (panelId: string): SpectrumConfig => {
    return spectrumConfigs[panelId] || {
      center_freq: 2450,
      span: 100,
      rbw: 100,
      sweep_time: 0.1,
      gain: 20,
      enabled_bands: ['2.4G']
    };
  };

  // Initial data fetch
  useEffect(() => {
    fetchAircraftData();
    fetchWeatherData();
    fetchGPSData();
    simulateSpectrumData();
  }, []);

  // Periodic updates
  useEffect(() => {
    const aircraftInterval = setInterval(fetchAircraftData, 300000); // Every 5 minutes
    const weatherInterval = setInterval(fetchWeatherData, 300000); // Every 5 minutes
    const gpsInterval = setInterval(fetchGPSData, 5000); // Every 5 seconds
    const spectrumInterval = setInterval(simulateSpectrumData, 2000); // Every 2 seconds

    return () => {
      clearInterval(aircraftInterval);
      clearInterval(weatherInterval);
      clearInterval(gpsInterval);
      clearInterval(spectrumInterval);
    };
  }, [weatherLocation, adsbSettings, spectrumConfigs]);

  // Simulate GPS data updates
  React.useEffect(() => {
    const interval = setInterval(() => {
      setGpsData(prev => ({
        ...prev,
        timestamp: Date.now()
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Handle online/offline status
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

  const handleLayoutChange = (layout: Layout[], layouts: { [key: string]: Layout[] }) => {
    setLayouts(layouts);
  };

  const handlePanelHeaderClick = (panelId: string) => {
    setSelectingPanel(panelId);
  };

  const handlePanelTypeSelect = (panelType: PanelType) => {
    if (selectingPanel) {
      setPanels(prev => prev.map(panel => 
        panel.id === selectingPanel 
          ? { ...panel, type: panelType, title: getPanelTitle(panelType) }
          : panel
      ));
      setSelectingPanel(null);
    }
  };

  const getPanelTitle = (type: PanelType): string => {
    const titles = {
      adsb: 'ADS-B SURVEILLANCE',
      'adsb-demo': 'ADS-B DEMO',
      weather: 'WEATHER CONDITIONS',
      spectrum: 'SPECTRUM ANALYZER',
      tactical: 'TACTICAL DISPLAY',
      video: 'VIDEO SURVEILLANCE',
      map: 'TACTICAL MAP',
      software: 'SOFTWARE STATUS',
      'flight-logger': 'FLIGHT LOGGER',
      comms: 'COMMUNICATIONS',
      navigation: 'NAVIGATION',
      sensors: 'SENSORS',
      intel: 'INTELLIGENCE'
    };
    return titles[type];
  };

  const renderPanel = (panel: PanelItem) => {
    const commonProps = {
      onHeaderClick: () => handlePanelHeaderClick(panel.id),
      isSelecting: selectingPanel === panel.id
    };

    switch (panel.type) {
      case 'adsb':
        return (
          <ADSBPanel
            {...commonProps}
            aircraft={aircraft}
            rtlSdrConnected={rtlSdrConnected}
            lastUpdate={lastUpdate}
            lastRtlUpdate={lastRtlUpdate}
            isLoading={isLoading}
            isLoadingRtl={isLoadingRtl}
            gpsData={gpsData}
            adsbSettings={adsbSettings}
            onSettingsChange={setAdsbSettings}
          />
        );
      case 'adsb-demo':
        return <ADSBDemoPanel {...commonProps} gpsData={gpsData} />;
      case 'weather':
        return (
          <WeatherPanel
            {...commonProps}
            weather={weather}
            lastWeatherUpdate={lastWeatherUpdate}
            isLoadingWeather={isLoadingWeather}
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
            spectrumConfig={getSpectrumConfig(panel.id)}
            lastSpectrumUpdate={lastSpectrumUpdate}
            isLoadingSpectrum={isLoadingSpectrum}
            onConfigChange={(config) => handleSpectrumConfigChange(panel.id, config)}
          />
        );
      case 'tactical':
        return <TacticalPanel {...commonProps} />;
      case 'video':
        return <VideoPanel {...commonProps} />;
      case 'map':
        return (
          <MapPanel
            {...commonProps}
            gpsData={gpsData}
          />
        );
      case 'software':
        return <SoftwarePanel {...commonProps} />;
      case 'flight-logger':
        return <FlightLoggerPanel {...commonProps} />;
      default:
        return (
          <div className="lattice-panel flex flex-col h-full">
            <div className="lattice-header px-4 py-3 cursor-pointer" onClick={commonProps.onHeaderClick}>
              <span className="text-sm font-semibold lattice-text-primary">{panel.title}</span>
            </div>
            <div className="p-4 flex-1 flex items-center justify-center">
              <div className="text-center lattice-text-muted">
                <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Panel coming soon</p>
              </div>
            </div>
          </div>
        );
    }
  };

  const applyGridPreset = (preset: keyof typeof gridPresets) => {
    const newLayouts = generateGridLayout(preset);
    const panelCount = gridPresets[preset].layouts.length;
    
    // Adjust panels array to match preset
    const newPanels = [...panels];
    while (newPanels.length < panelCount) {
      newPanels.push({
        id: `panel-${newPanels.length + 1}`,
        type: 'tactical',
        title: 'TACTICAL DISPLAY'
      });
    }
    while (newPanels.length > panelCount) {
      newPanels.pop();
    }
    
    setPanels(newPanels);
    setLayouts(newLayouts);
    setCurrentGridPreset(preset);
    setShowGridSelector(false);
  };

  const resetLayout = () => {
    setLayouts(defaultLayouts);
    setPanels([
      { id: 'panel-1', type: 'adsb', title: 'ADS-B SURVEILLANCE' },
      { id: 'panel-2', type: 'weather', title: 'WEATHER CONDITIONS' },
      { id: 'panel-3', type: 'spectrum', title: 'SPECTRUM ANALYZER' },
      { id: 'panel-4', type: 'video', title: 'VIDEO SURVEILLANCE' }
    ]);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <Header
        gpsData={gpsData}
        isOnline={isOnline}
        isLocked={isLayoutLocked}
        onToggleLock={() => setIsLayoutLocked(!isLayoutLocked)}
        onShowTimeModal={() => setShowTimeModal(true)}
        onShowGpsModal={() => setShowGpsModal(true)}
        onShowNetworkModal={() => setShowNetworkModal(true)}
        onShowViewportInfo={() => setShowViewportInfo(true)}
      />

      {/* Main Dashboard */}
      <div className="h-[calc(100vh-80px)] flex flex-col">
        <GridLayout
          layouts={layouts}
          onLayoutChange={handleLayoutChange}
          isLocked={true}
          className="flex-1"
        >
          {panels.map((panel) => (
            <div key={panel.id} className="h-full">
              {renderPanel(panel)}
            </div>
          ))}
        </GridLayout>
      </div>

      {/* Panel Selector Modal */}
      {selectingPanel && (
        <PanelSelector
          onSelect={handlePanelTypeSelect}
          onClose={() => setSelectingPanel(null)}
          currentPanel={panels.find(p => p.id === selectingPanel)?.type || 'tactical'}
        />
      )}

      {/* Grid Selector Modal */}
      {showGridSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-[9999]">
          <div className="lattice-panel-elevated p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <Grid3X3 className="h-5 w-5 lattice-status-primary" />
                <h2 className="text-lg font-semibold lattice-text-primary">Grid Layout</h2>
              </div>
              <button
                onClick={() => setShowGridSelector(false)}
                className="lattice-text-muted hover:lattice-text-primary transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {Object.entries(gridPresets).map(([key, preset]) => (
                <button
                  key={key}
                  onClick={() => applyGridPreset(key as keyof typeof gridPresets)}
                  className={`p-4 rounded border-2 text-left transition-all ${
                    currentGridPreset === key
                      ? 'border-cyan-400 bg-cyan-900/20 lattice-glow'
                      : 'lattice-panel hover:border-cyan-400 hover:lattice-glow'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Grid2X2 className="h-6 w-6 lattice-status-primary" />
                    <div>
                      <div className="font-semibold text-sm lattice-text-primary">
                        {preset.name}
                      </div>
                      <div className="text-xs lattice-text-secondary">
                        {preset.description}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Time Modal */}
      {showTimeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-[9999]">
          <div className="lattice-panel-elevated p-6 max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto lattice-scrollbar">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 lattice-status-primary" />
                <h2 className="text-lg font-semibold lattice-text-primary">Time Information</h2>
              </div>
              <button
                onClick={() => setShowTimeModal(false)}
                className="lattice-text-muted hover:lattice-text-primary transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="lattice-panel p-4">
                <div className="text-sm lattice-status-primary mb-2 font-semibold">Local Time</div>
                <div className="text-2xl font-bold lattice-text-primary mb-1">
                  {currentTime.toLocaleTimeString()}
                </div>
                <div className="text-sm lattice-text-secondary">
                  {currentTime.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </div>
                <div className="text-xs lattice-text-muted mt-1">
                  {Intl.DateTimeFormat().resolvedOptions().timeZone}
                </div>
              </div>

              <div className="lattice-panel p-4">
                <div className="text-sm lattice-status-primary mb-2 font-semibold">Zulu Time (UTC)</div>
                <div className="text-2xl font-bold lattice-text-primary mb-1">
                  {currentTime.toUTCString().split(' ')[4]} UTC
                </div>
                <div className="text-sm lattice-text-secondary">
                  {currentTime.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    timeZone: 'UTC'
                  })}
                </div>
                <div className="text-xs lattice-text-muted mt-1">
                  Coordinated Universal Time
                </div>
              </div>

              {/* World Times Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="lattice-panel p-3">
                  <div className="text-xs lattice-status-primary mb-1 font-semibold">New York</div>
                  <div className="text-lg font-bold lattice-text-primary">
                    {currentTime.toLocaleTimeString('en-US', { timeZone: 'America/New_York' })}
                  </div>
                  <div className="text-xs lattice-text-secondary">EST/EDT</div>
                </div>

                <div className="lattice-panel p-3">
                  <div className="text-xs lattice-status-primary mb-1 font-semibold">London</div>
                  <div className="text-lg font-bold lattice-text-primary">
                    {currentTime.toLocaleTimeString('en-GB', { timeZone: 'Europe/London' })}
                  </div>
                  <div className="text-xs lattice-text-secondary">GMT/BST</div>
                </div>

                <div className="lattice-panel p-3">
                  <div className="text-xs lattice-status-primary mb-1 font-semibold">Tokyo</div>
                  <div className="text-lg font-bold lattice-text-primary">
                    {currentTime.toLocaleTimeString('ja-JP', { timeZone: 'Asia/Tokyo' })}
                  </div>
                  <div className="text-xs lattice-text-secondary">JST</div>
                </div>

                <div className="lattice-panel p-3">
                  <div className="text-xs lattice-status-primary mb-1 font-semibold">Sydney</div>
                  <div className="text-lg font-bold lattice-text-primary">
                    {currentTime.toLocaleTimeString('en-AU', { timeZone: 'Australia/Sydney' })}
                  </div>
                  <div className="text-xs lattice-text-secondary">AEST/AEDT</div>
                </div>
              </div>

              {/* Military Time and Julian Date */}
              <div className="grid grid-cols-2 gap-3">
                <div className="lattice-panel p-3">
                  <div className="text-xs lattice-status-primary mb-1 font-semibold">Military Time</div>
                  <div className="text-lg font-bold lattice-text-primary lattice-text-mono">
                    {currentTime.toLocaleTimeString('en-GB', { hour12: false })}
                  </div>
                  <div className="text-xs lattice-text-secondary">24-hour format</div>
                </div>

                <div className="lattice-panel p-3">
                  <div className="text-xs lattice-status-primary mb-1 font-semibold">Julian Date</div>
                  <div className="text-lg font-bold lattice-text-primary lattice-text-mono">
                    {Math.floor((currentTime.getTime() / 86400000) + 2440587.5)}
                  </div>
                  <div className="text-xs lattice-text-secondary">Days since epoch</div>
                </div>
              </div>

              {/* Unix Timestamp */}
              <div className="lattice-panel p-3">
                <div className="text-xs lattice-status-primary mb-1 font-semibold">Unix Timestamp</div>
                <div className="text-lg font-bold lattice-text-primary lattice-text-mono">
                  {Math.floor(currentTime.getTime() / 1000)}
                </div>
                <div className="text-xs lattice-text-secondary">Seconds since January 1, 1970 UTC</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* GPS Modal */}
      {showGpsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-[9999]">
          <div className="lattice-panel-elevated p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <Satellite className="h-5 w-5 lattice-status-primary" />
                <h2 className="text-lg font-semibold lattice-text-primary">GPS Information</h2>
              </div>
              <button
                onClick={() => setShowGpsModal(false)}
                className="lattice-text-muted hover:lattice-text-primary transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {gpsData.connected ? (
                <>
                  <div className="lattice-panel p-4">
                    <div className="text-sm lattice-status-good mb-2 font-semibold">GPS Connected</div>
                    <div className="text-xs space-y-1">
                      {gpsData.latitude && <div>LAT: {gpsData.latitude.toFixed(6)}°</div>}
                      {gpsData.longitude && <div>LON: {gpsData.longitude.toFixed(6)}°</div>}
                      {gpsData.altitude && <div>ALT: {gpsData.altitude.toFixed(1)}m</div>}
                      {gpsData.accuracy && <div>ACC: ±{gpsData.accuracy.toFixed(1)}m</div>}
                      <div>FIX: {gpsData.fix_quality || 'NO_FIX'}</div>
                      {gpsData.satellites && <div>SATS: {gpsData.satellites}</div>}
                    </div>
                  </div>
                </>
              ) : (
                <div className="lattice-panel p-4">
                  <div className="text-sm lattice-status-error mb-2 font-semibold">GPS Disconnected</div>
                  <div className="text-xs lattice-text-secondary">
                    No GPS hardware detected or service unavailable
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Network Modal */}
      {showNetworkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-[9999]">
          <div className="lattice-panel-elevated p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto lattice-scrollbar">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                {isOnline ? (
                  <Wifi className="h-5 w-5 lattice-status-good" />
                ) : (
                  <WifiOff className="h-5 w-5 lattice-status-error" />
                )}
                <h2 className="text-lg font-semibold lattice-text-primary">Network Information</h2>
              </div>
              <button
                onClick={() => setShowNetworkModal(false)}
                className="lattice-text-muted hover:lattice-text-primary transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Connection Status */}
              <div className="lattice-panel p-4">
                <div className={`text-sm mb-2 font-semibold ${isOnline ? 'lattice-status-good' : 'lattice-status-error'}`}>
                  Connection Status
                </div>
                <div className="text-xs space-y-1">
                  <div>Status: <span className={`font-semibold ${isOnline ? 'lattice-status-good' : 'lattice-status-error'}`}>
                    {isOnline ? 'Online' : 'Offline'}
                  </span></div>
                  <div>Online Since: <span className="lattice-text-primary font-semibold">{networkInfo.onlineSince.toLocaleTimeString()}</span></div>
                  {networkInfo.downtime > 0 && <div>Downtime: {networkInfo.downtime}s</div>}
                </div>
              </div>

              {/* IP Addresses */}
              <div className="lattice-panel p-4">
                <div className="text-sm lattice-status-primary mb-2 font-semibold">IP Addresses</div>
                <div className="text-xs space-y-1">
                  <div>Local IP: <span className="lattice-text-primary font-semibold lattice-text-mono">{networkInfo.ipAddress}</span></div>
                  <div>Public IP: <span className="lattice-text-primary font-semibold lattice-text-mono">{networkInfo.publicIp}</span></div>
                </div>
              </div>

              {/* Connection Details */}
              <div className="lattice-panel p-4">
                <div className="text-sm lattice-status-primary mb-2 font-semibold">Connection Details</div>
                <div className="text-xs space-y-1">
                  <div>Type: <span className="lattice-text-primary font-semibold">{networkInfo.connectionType}</span></div>
                  <div>Effective Type: <span className="lattice-text-primary font-semibold">{networkInfo.effectiveType}</span></div>
                  {networkInfo.downlink > 0 && <div>Downlink: <span className="lattice-text-primary font-semibold">{networkInfo.downlink} Mbps</span></div>}
                  {networkInfo.rtt > 0 && <div>RTT: <span className="lattice-text-primary font-semibold">{networkInfo.rtt} ms</span></div>}
                </div>
              </div>

              {/* Browser Information */}
              <div className="lattice-panel p-4">
                <div className="text-sm lattice-status-primary mb-2 font-semibold">Browser Information</div>
                <div className="text-xs space-y-1">
                  <div>Platform: <span className="lattice-text-primary font-semibold">{networkInfo.platform}</span></div>
                  <div>Language: <span className="lattice-text-primary font-semibold">{networkInfo.language}</span></div>
                  <div>Cookies: <span className={`font-semibold ${networkInfo.cookieEnabled ? 'lattice-status-good' : 'lattice-status-error'}`}>
                    {networkInfo.cookieEnabled ? 'Enabled' : 'Disabled'}
                  </span></div>
                  <div>Java: <span className={`font-semibold ${networkInfo.javaEnabled ? 'lattice-status-good' : 'lattice-status-error'}`}>
                    {networkInfo.javaEnabled ? 'Enabled' : 'Disabled'}
                  </span></div>
                </div>
              </div>

              {/* Display Information */}
              <div className="lattice-panel p-4">
                <div className="text-sm lattice-status-primary mb-2 font-semibold">Display Information</div>
                <div className="text-xs space-y-1">
                  <div>Screen: <span className="lattice-text-primary font-semibold">{networkInfo.screenResolution}</span></div>
                  <div>Color Depth: <span className="lattice-text-primary font-semibold">{networkInfo.colorDepth}-bit</span></div>
                  <div>Viewport: <span className="lattice-text-primary font-semibold">{window.innerWidth}x{window.innerHeight}</span></div>
                </div>
              </div>

              {/* Timezone Information */}
              <div className="lattice-panel p-4">
                <div className="text-sm lattice-status-primary mb-2 font-semibold">Timezone Information</div>
                <div className="text-xs space-y-1">
                  <div>Timezone: <span className="lattice-text-primary font-semibold">{networkInfo.timezone}</span></div>
                  <div>UTC Offset: <span className="lattice-text-primary font-semibold">{-networkInfo.timezoneOffset / 60}h</span></div>
                </div>
              </div>
            </div>

            {/* User Agent - Full Width */}
            <div className="lattice-panel p-4 mt-4">
              <div className="text-sm lattice-status-primary mb-2 font-semibold">User Agent</div>
              <div className="text-xs lattice-text-mono lattice-text-primary break-all">
                {networkInfo.userAgent}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Viewport Info Modal */}
      {showViewportInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-[9999]">
          <div className="lattice-panel-elevated p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <Grid3X3 className="h-5 w-5 lattice-status-primary" />
                <h2 className="text-lg font-semibold lattice-text-primary">Viewport Information</h2>
              </div>
              <button
                onClick={() => setShowViewportInfo(false)}
                className="lattice-text-muted hover:lattice-text-primary transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="lattice-panel p-4">
                <div className="text-sm lattice-status-primary mb-2 font-semibold">Window Dimensions</div>
                <div className="text-xs space-y-1">
                  <div>Width: <span className="lattice-text-primary font-semibold">{window.innerWidth}px</span></div>
                  <div>Height: <span className="lattice-text-primary font-semibold">{window.innerHeight}px</span></div>
                  <div>Ratio: <span className="lattice-text-primary font-semibold">{(window.innerWidth / window.innerHeight).toFixed(2)}</span></div>
                </div>
              </div>

              <div className="lattice-panel p-4">
                <div className="text-sm lattice-status-primary mb-2 font-semibold">Grid Container</div>
                <div className="text-xs space-y-1">
                  <div>Available: <span className="lattice-text-primary font-semibold">{window.innerHeight - 80}px</span> <span className="lattice-text-secondary">(window - 80px header)</span></div>
                  <div>Grid Units: <span className="lattice-text-primary font-semibold">{Math.max(...(layouts.lg || []).map(item => item.y + item.h))} units</span></div>
                  <div>Row Height: <span className="lattice-text-primary font-semibold">~{Math.floor((window.innerHeight - 100) / Math.max(...(layouts.lg || []).map(item => item.y + item.h)))}px</span></div>
                </div>
              </div>

              <div className="lattice-panel p-4">
                <div className="text-sm lattice-status-primary mb-2 font-semibold">Layout Status</div>
                <div className="text-xs space-y-1">
                  <div>Panels: <span className="lattice-text-primary font-semibold">{panels.length}</span></div>
                  <div>Preset: <span className="lattice-text-primary font-semibold">{currentGridPreset}</span></div>
                  <div>Locked: <span className={`font-semibold ${isLayoutLocked ? 'lattice-status-good' : 'lattice-status-warning'}`}>{isLayoutLocked ? 'Yes' : 'No'}</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}