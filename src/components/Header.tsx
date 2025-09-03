import React from 'react';
import { Clock, Satellite, Wifi, WifiOff, Target, Grid3X3, RotateCcw, X, Globe, MapPin, Router } from 'lucide-react';

export interface GPSData {
  connected: boolean;
  latitude?: number;
  longitude?: number;
  altitude?: number;
  accuracy?: number;
  satellites?: number;
  fix_quality?: 'NO_FIX' | '2D' | '3D' | 'DGPS';
  hdop?: number;
  speed?: number;
  course?: number;
  timestamp?: number;
}

interface HeaderProps {
  gpsData: GPSData;
  isOnline: boolean;
  isLocked: boolean;
  onToggleLock: () => void;
  onShowTimeModal: () => void;
  onShowGpsModal: () => void;
  onShowNetworkModal: () => void;
  onShowViewportInfo: () => void;
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

export default function Header({
  gpsData,
  isOnline,
  isLocked,
  onToggleLock,
  onShowTimeModal,
  onShowGpsModal,
  onShowNetworkModal,
  onShowViewportInfo,
}: HeaderProps) {
  const [currentTime, setCurrentTime] = React.useState(new Date());

  // Update time every second
  React.useEffect(() => {
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timeInterval);
  }, []);

  const getGPSStatusColor = () => {
    if (!gpsData.connected) return 'lattice-status-error';
    if (gpsData.fix_quality === '3D') return 'lattice-status-good';
    if (gpsData.fix_quality === '2D') return 'lattice-status-warning';
    return 'lattice-status-error';
  };

  const getGPSStatusText = () => {
    if (!gpsData.connected) return 'NO GPS';
    return gpsData.fix_quality || 'NO FIX';
  };

  return (
    <div className="lattice-header px-6 py-4 flex items-center justify-between">
      {/* Left side - Logo, Title, and Controls */}
      <div className="flex items-center space-x-4">
        {/* Logo and Title */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onToggleLock}
            className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
            title={isLocked ? 'Unlock layout' : 'Lock layout'}
          >
            {isLocked ? (
              <Target className="h-6 w-6 lattice-status-primary" />
            ) : (
              <Target className="h-6 w-6 lattice-status-warning" />
            )}
          </button>
          <div>
            <h1 className="text-lg font-bold lattice-text-primary">MilUAS</h1>
            <p className="text-xs lattice-text-secondary">Operator Dashboard</p>
          </div>
        </div>
        
        {/* Grid and Reset Controls - only show when unlocked */}
        {!isLocked && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('showGridSelector'))}
              className="lattice-button text-xs px-3 py-1 flex items-center space-x-1"
              title="Change grid layout"
            >
              <Grid3X3 className="h-3 w-3" />
              <span>Grid</span>
            </button>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('resetLayout'))}
              className="lattice-button text-xs px-3 py-1 flex items-center space-x-1"
              title="Reset layout"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset</span>
            </button>
            <button
              onClick={onShowViewportInfo}
              className="lattice-button text-xs px-3 py-1 flex items-center space-x-1"
              title="Show viewport info"
            >
              <Grid3X3 className="h-3 w-3" />
              <span>Info</span>
            </button>
          </div>
        )}
      </div>

      {/* Right side - Status Indicators */}
      <div className="flex items-center space-x-3">
        {/* Time Status */}
        <button 
          onClick={onShowTimeModal}
          className="lattice-panel px-3 py-1.5 rounded flex items-center space-x-2 hover:lattice-glow transition-all cursor-pointer"
        >
          <Clock className="h-3 w-3 lattice-status-primary" />
          <span className="text-xs font-semibold lattice-text-primary">{currentTime.toLocaleDateString()}</span>
          <span className="text-xs font-semibold lattice-text-primary">{currentTime.toLocaleTimeString()}</span>
        </button>

        {/* GPS Status */}
        <button 
          onClick={onShowGpsModal}
          className="lattice-panel px-3 py-1.5 rounded flex items-center space-x-2 hover:lattice-glow transition-all cursor-pointer"
        >
          <Satellite className={`h-3 w-3 ${getGPSStatusColor()}`} />
          <span className={`text-xs font-semibold ${getGPSStatusColor()}`}>
            {getGPSStatusText()}
          </span>
        </button>

        {/* Network Status */}
        <button 
          onClick={onShowNetworkModal}
          className="lattice-panel px-3 py-1.5 rounded flex items-center space-x-2 hover:lattice-glow transition-all cursor-pointer"
        >
          {isOnline ? (
            <Wifi className="h-3 w-3 lattice-status-good" />
          ) : (
            <WifiOff className="h-3 w-3 lattice-status-error" />
          )}
          <span className={`text-xs font-semibold ${isOnline ? 'lattice-status-good' : 'lattice-status-error'}`}>
            {isOnline ? 'ONLINE' : 'OFFLINE'}
          </span>
        </button>
      </div>
    </div>
  );
}