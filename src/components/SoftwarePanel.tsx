import React from 'react';
import { Download, RefreshCw, CheckCircle, AlertCircle, XCircle, Package, Server, Wifi, WifiOff, Clock, Shield } from 'lucide-react';

interface SoftwareVersion {
  name: string;
  type: 'core' | 'panel';
  currentVersion: string;
  availableVersion?: string;
  status: 'up-to-date' | 'update-available' | 'updating' | 'error';
  lastChecked?: Date;
  size?: string;
  description: string;
}

interface UpdateServer {
  url: string;
  connected: boolean;
  lastContact?: Date;
  latency?: number;
}

interface SoftwarePanelProps {
  onHeaderClick: () => void;
  isSelecting: boolean;
}

export default function SoftwarePanel({ onHeaderClick, isSelecting }: SoftwarePanelProps) {
  const [softwareLayer, setSoftwareLayer] = React.useState<'status' | 'updates' | 'settings'>('status');
  const [isCheckingUpdates, setIsCheckingUpdates] = React.useState(false);
  const [lastUpdateCheck, setLastUpdateCheck] = React.useState<Date>(new Date());
  const [autoUpdateEnabled, setAutoUpdateEnabled] = React.useState(false);
  const [updateServer, setUpdateServer] = React.useState<UpdateServer>({
    url: 'https://updates.miluas.local',
    connected: true,
    lastContact: new Date(),
    latency: 45
  });

  // Complete software versions list - all panels in the system
  const [softwareVersions, setSoftwareVersions] = React.useState<SoftwareVersion[]>([
    {
      name: 'MilUAS Core',
      type: 'core',
      currentVersion: '1.2.3',
      availableVersion: '1.2.4',
      status: 'update-available',
      lastChecked: new Date(),
      size: '15.2 MB',
      description: 'Core system framework and dashboard'
    },
    {
      name: 'ADS-B Panel',
      type: 'panel',
      currentVersion: '2.1.0',
      status: 'up-to-date',
      lastChecked: new Date(),
      description: 'Aircraft surveillance and tracking'
    },
    {
      name: 'Weather Panel',
      type: 'panel',
      currentVersion: '1.5.2',
      availableVersion: '1.6.0',
      status: 'update-available',
      lastChecked: new Date(),
      size: '3.1 MB',
      description: 'Meteorological conditions and forecasts'
    },
    {
      name: 'Spectrum Panel',
      type: 'panel',
      currentVersion: '1.0.8',
      status: 'up-to-date',
      lastChecked: new Date(),
      description: 'RF spectrum analysis and drone detection'
    },
    {
      name: 'Video Panel',
      type: 'panel',
      currentVersion: '0.9.5',
      availableVersion: '1.0.0',
      status: 'update-available',
      lastChecked: new Date(),
      size: '8.7 MB',
      description: 'Network camera surveillance system'
    },
    {
      name: 'Map Panel',
      type: 'panel',
      currentVersion: '1.3.1',
      status: 'up-to-date',
      lastChecked: new Date(),
      description: 'Tactical mapping and positioning tools'
    },
    {
      name: 'Tactical Panel',
      type: 'panel',
      currentVersion: '0.5.0',
      status: 'up-to-date',
      lastChecked: new Date(),
      description: 'Mission planning and tactical overview'
    },
    {
      name: 'Software Panel',
      type: 'panel',
      currentVersion: '1.0.0',
      status: 'up-to-date',
      lastChecked: new Date(),
      description: 'System version control and OTA update management'
    },
    {
      name: 'Communications Panel',
      type: 'panel',
      currentVersion: '0.2.1',
      availableVersion: '0.3.0',
      status: 'update-available',
      lastChecked: new Date(),
      size: '2.4 MB',
      description: 'Radio communications and frequency monitoring'
    },
    {
      name: 'Navigation Panel',
      type: 'panel',
      currentVersion: '0.1.5',
      status: 'up-to-date',
      lastChecked: new Date(),
      description: 'GPS tracking and waypoint management'
    },
    {
      name: 'Sensors Panel',
      type: 'panel',
      currentVersion: '0.4.2',
      availableVersion: '0.5.0',
      status: 'update-available',
      lastChecked: new Date(),
      size: '5.8 MB',
      description: 'Multi-sensor data fusion and analysis'
    },
    {
      name: 'Intelligence Panel',
      type: 'panel',
      currentVersion: '0.1.0',
      status: 'up-to-date',
      lastChecked: new Date(),
      description: 'Threat analysis and intelligence gathering'
    }
  ]);

  const handleCheckUpdates = async () => {
    setIsCheckingUpdates(true);
    
    // Simulate checking for updates
    setTimeout(() => {
      setLastUpdateCheck(new Date());
      setIsCheckingUpdates(false);
      
      // Simulate finding new updates
      setSoftwareVersions(prev => prev.map(software => {
        if (Math.random() > 0.7) {
          const currentParts = software.currentVersion.split('.').map(Number);
          const newPatch = currentParts[2] + 1;
          return {
            ...software,
            availableVersion: `${currentParts[0]}.${currentParts[1]}.${newPatch}`,
            status: 'update-available' as const,
            lastChecked: new Date(),
            size: `${(Math.random() * 20 + 1).toFixed(1)} MB`
          };
        }
        return { ...software, lastChecked: new Date() };
      }));
    }, 3000);
  };

  const handleInstallUpdate = (softwareName: string) => {
    setSoftwareVersions(prev => prev.map(software => 
      software.name === softwareName 
        ? { ...software, status: 'updating' as const }
        : software
    ));

    // Simulate update installation
    setTimeout(() => {
      setSoftwareVersions(prev => prev.map(software => {
        if (software.name === softwareName) {
          return {
            ...software,
            currentVersion: software.availableVersion || software.currentVersion,
            availableVersion: undefined,
            status: 'up-to-date' as const,
            lastChecked: new Date()
          };
        }
        return software;
      }));
    }, 5000);
  };

  const handleInstallAllUpdates = () => {
    const updatesAvailable = softwareVersions.filter(s => s.status === 'update-available');
    updatesAvailable.forEach(software => {
      handleInstallUpdate(software.name);
    });
  };

  const getStatusIcon = (status: SoftwareVersion['status']) => {
    switch (status) {
      case 'up-to-date':
        return <CheckCircle className="h-4 w-4 military-status-good" />;
      case 'update-available':
        return <AlertCircle className="h-4 w-4 military-status-warning" />;
      case 'updating':
        return <RefreshCw className="h-4 w-4 military-status-warning animate-spin" />;
      case 'error':
        return <XCircle className="h-4 w-4 military-status-error" />;
      default:
        return <Package className="h-4 w-4 text-slate-400" />;
    }
  };

  const getStatusText = (status: SoftwareVersion['status']) => {
    switch (status) {
      case 'up-to-date':
        return 'UP TO DATE';
      case 'update-available':
        return 'UPDATE AVAILABLE';
      case 'updating':
        return 'UPDATING...';
      case 'error':
        return 'ERROR';
      default:
        return 'UNKNOWN';
    }
  };

  const updatesAvailable = softwareVersions.filter(s => s.status === 'update-available').length;
  const totalSize = softwareVersions
    .filter(s => s.status === 'update-available' && s.size)
    .reduce((total, s) => total + parseFloat(s.size!), 0);

  return (
    <div className="lattice-panel flex flex-col h-full">
      {/* Main Header */}
      <div className={`lattice-header px-4 py-3 cursor-pointer transition-all ${
        isSelecting ? 'bg-gradient-to-r from-orange-500 to-amber-500' : ''
      }`} onClick={onHeaderClick}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Package className="h-4 w-4 lattice-status-primary" />
            <span className="text-sm font-semibold lattice-text-primary">Software Status</span>
          </div>
          <div className="flex items-center space-x-2">
            {updatesAvailable > 0 && (
              <span className="text-xs lattice-status-warning">
                {updatesAvailable} updates available
              </span>
            )}
            <span className="text-xs lattice-text-secondary">
              v{softwareVersions.find(s => s.type === 'core')?.currentVersion}
            </span>
          </div>
        </div>
      </div>

      {/* Software Tabs */}
      <div className="border-b border-gray-700 px-3 py-2">
        <div className="flex items-center justify-between">
          <div className="flex space-x-1">
            <button
              onClick={() => setSoftwareLayer('status')}
              className={`lattice-tab px-3 py-1 text-xs rounded transition-all ${
                softwareLayer === 'status'
                  ? 'active'
                  : ''
              }`}
            >
              <Package className="h-3 w-3 inline mr-1" />
              Status
            </button>
            <button
              onClick={() => setSoftwareLayer('updates')}
              className={`lattice-tab px-3 py-1 text-xs rounded transition-all ${
                softwareLayer === 'updates'
                  ? 'active'
                  : ''
              }`}
            >
              <Download className="h-3 w-3 inline mr-1" />
              Updates
              {updatesAvailable > 0 && (
                <span className="ml-1 bg-amber-500 text-black rounded-full px-1.5 py-0.5 text-xs font-semibold">
                  {updatesAvailable}
                </span>
              )}
            </button>
            <button
              onClick={() => setSoftwareLayer('settings')}
              className={`lattice-tab px-3 py-1 text-xs rounded transition-all ${
                softwareLayer === 'settings'
                  ? 'active'
                  : ''
              }`}
            >
              <Server className="h-3 w-3 inline mr-1" />
              Server
            </button>
          </div>
          
          <div className="flex items-center space-x-1 ml-auto px-2 py-1 lattice-panel rounded">
            <span className="text-xs lattice-text-secondary flex items-center">
              {updateServer.connected ? (
                <Wifi className="h-3 w-3 mr-1 lattice-status-good" />
              ) : (
                <WifiOff className="h-3 w-3 mr-1 lattice-status-error" />
              )}
              Server: {updateServer.connected ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
      </div>

      {/* Software Content */}
      <div className="flex-1 relative overflow-hidden">
        {/* Status Layer */}
        {softwareLayer === 'status' && (
          <div className="absolute inset-0 p-4 overflow-y-auto lattice-scrollbar">
            <div className="h-full flex flex-col lattice-scrollbar">
              {/* System Overview */}
              <div className="lattice-panel p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm lattice-status-primary font-semibold">System Overview</div>
                  <button
                    onClick={handleCheckUpdates}
                    disabled={isCheckingUpdates}
                    className="lattice-button disabled:opacity-50 text-xs px-3 py-1 flex items-center space-x-1"
                  >
                    <RefreshCw className={`h-3 w-3 ${isCheckingUpdates ? 'lattice-spin' : ''}`} />
                    <span>{isCheckingUpdates ? 'Checking...' : 'Check Updates'}</span>
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-4 text-xs">
                  <div className="text-center">
                    <div className="text-lg font-semibold lattice-text-primary">{softwareVersions.length}</div>
                    <div className="lattice-text-secondary">Components</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold lattice-status-warning">{updatesAvailable}</div>
                    <div className="lattice-text-secondary">Updates</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold lattice-status-good">
                      {softwareVersions.filter(s => s.status === 'up-to-date').length}
                    </div>
                    <div className="lattice-text-secondary">Up to Date</div>
                  </div>
                </div>
              </div>

              {/* Software List */}
              <div className="flex-1 overflow-y-auto lattice-scrollbar">
                <div className="space-y-2">
                  {softwareVersions.map((software) => (
                    <div key={software.name} className="lattice-panel p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(software.status)}
                          <span className="font-semibold lattice-text-primary">{software.name}</span>
                          <span className={`text-xs px-2 py-0.5 rounded font-bold ${
                            software.type === 'core' 
                              ? 'lattice-panel lattice-status-primary' 
                              : 'lattice-panel lattice-text-secondary'
                          }`}>
                            {software.type.charAt(0).toUpperCase() + software.type.slice(1)}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold lattice-text-primary">v{software.currentVersion}</div>
                          <div className={`text-xs font-semibold ${
                            software.status === 'up-to-date' ? 'lattice-status-good' :
                            software.status === 'update-available' ? 'lattice-status-warning' :
                            software.status === 'updating' ? 'lattice-status-warning' :
                            'lattice-status-error'
                          }`}>
                            {getStatusText(software.status)}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs lattice-text-secondary mb-2">{software.description}</div>
                      {software.availableVersion && (
                        <div className="text-xs">
                          <span className="lattice-text-secondary">Available: </span>
                          <span className="lattice-text-primary font-semibold">v{software.availableVersion}</span>
                          {software.size && (
                            <span className="lattice-text-secondary ml-2">({software.size})</span>
                          )}
                        </div>
                      )}
                      {software.lastChecked && (
                        <div className="text-xs lattice-text-muted mt-1">
                          Last checked: {software.lastChecked.toLocaleTimeString()}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Updates Layer */}
        {softwareLayer === 'updates' && (
          <div className="absolute inset-0 p-4 overflow-y-auto lattice-scrollbar">
            <div className="h-full flex flex-col">
              {updatesAvailable > 0 ? (
                <>
                  {/* Update Summary */}
                  <div className="lattice-panel border-amber-400 p-4 mb-4 lattice-glow-warning">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm lattice-status-warning font-semibold">
                        {updatesAvailable} Updates Available
                      </div>
                      <button
                        onClick={handleInstallAllUpdates}
                        className="lattice-button-primary text-xs px-3 py-1 flex items-center space-x-1"
                      >
                        <Download className="h-3 w-3" />
                        <span>Install All</span>
                      </button>
                    </div>
                    <div className="text-xs lattice-text-secondary">
                      Total download size: {totalSize.toFixed(1)} MB
                    </div>
                  </div>

                  {/* Available Updates */}
                  <div className="flex-1 overflow-y-auto lattice-scrollbar">
                    <div className="space-y-2">
                      {softwareVersions
                        .filter(s => s.status === 'update-available' || s.status === 'updating')
                        .map((software) => (
                        <div key={software.name} className="lattice-panel p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(software.status)}
                              <span className="font-semibold lattice-text-primary">{software.name}</span>
                            </div>
                            <button
                              onClick={() => handleInstallUpdate(software.name)}
                              disabled={software.status === 'updating'}
                              className="lattice-button disabled:opacity-50 text-xs px-3 py-1 flex items-center space-x-1"
                            >
                              {software.status === 'updating' ? (
                                <>
                                  <RefreshCw className="h-3 w-3 lattice-spin" />
                                  <span>Updating...</span>
                                </>
                              ) : (
                                <>
                                  <Download className="h-3 w-3" />
                                  <span>Install</span>
                                </>
                              )}
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-xs">
                            <div>
                              <div className="lattice-text-secondary">Current Version:</div>
                              <div className="lattice-text-primary font-semibold">v{software.currentVersion}</div>
                            </div>
                            <div>
                              <div className="lattice-text-secondary">Available Version:</div>
                              <div className="lattice-status-warning font-semibold">v{software.availableVersion}</div>
                            </div>
                          </div>
                          {software.size && (
                            <div className="text-xs lattice-text-secondary mt-2">
                              Download size: {software.size}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center lattice-text-muted">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 lattice-status-good" />
                    <p className="text-lg font-semibold lattice-text-primary">All Software Up to Date</p>
                    <p className="text-sm mt-2 lattice-text-secondary">No updates available at this time</p>
                    <p className="text-xs mt-2 lattice-text-muted">
                      Last checked: {lastUpdateCheck.toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Server Settings Layer */}
        {softwareLayer === 'settings' && (
          <div className="absolute inset-0 p-4 overflow-y-auto lattice-scrollbar">
            <div className="space-y-4">
              {/* Update Server Status */}
              <div className="lattice-panel p-4">
                <div className="text-sm lattice-status-primary mb-3 font-semibold">Update Server</div>
                <div className="grid grid-cols-2 gap-4 text-xs mb-3">
                  <div>
                    <div className="lattice-text-secondary">Server URL:</div>
                    <div className="lattice-text-primary lattice-text-mono">{updateServer.url}</div>
                  </div>
                  <div>
                    <div className="lattice-text-secondary">Connection Status:</div>
                    <div className={`font-semibold ${updateServer.connected ? 'lattice-status-good' : 'lattice-status-error'}`}>
                      {updateServer.connected ? 'Connected' : 'Disconnected'}
                    </div>
                  </div>
                  {updateServer.lastContact && (
                    <div>
                      <div className="lattice-text-secondary">Last Contact:</div>
                      <div className="lattice-text-primary font-semibold">{updateServer.lastContact.toLocaleTimeString()}</div>
                    </div>
                  )}
                  {updateServer.latency && (
                    <div>
                      <div className="lattice-text-secondary">Latency:</div>
                      <div className="lattice-text-primary font-semibold">{updateServer.latency}ms</div>
                    </div>
                  )}
                </div>
                <button className="lattice-button text-xs px-3 py-1">
                  Test Connection
                </button>
              </div>

              {/* Auto Update Settings */}
              <div className="lattice-panel p-4">
                <div className="text-sm lattice-status-primary mb-3 font-semibold">Auto Update Settings</div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm lattice-text-primary">Enable Automatic Updates</span>
                    <button
                      onClick={() => setAutoUpdateEnabled(!autoUpdateEnabled)}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        autoUpdateEnabled ? 'bg-green-600' : 'bg-gray-600'
                      }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                        autoUpdateEnabled ? 'translate-x-6' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>
                  <div className="text-xs lattice-text-secondary">
                    When enabled, critical security updates will be installed automatically
                  </div>
                </div>
              </div>

              {/* System Information */}
              <div className="lattice-panel p-4">
                <div className="text-sm lattice-status-primary mb-3 font-semibold">System Information</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="lattice-text-secondary">Platform: <span className="lattice-text-primary font-semibold">Raspberry Pi 4</span></div>
                  <div className="lattice-text-secondary">OS: <span className="lattice-text-primary font-semibold">Raspberry Pi OS</span></div>
                  <div className="lattice-text-secondary">Architecture: <span className="lattice-text-primary font-semibold">ARM64</span></div>
                  <div className="lattice-text-secondary">Node.js: <span className="lattice-text-primary font-semibold">v18.17.0</span></div>
                  <div className="lattice-text-secondary">Storage: <span className="lattice-text-primary font-semibold">45.2 GB Free</span></div>
                  <div className="lattice-text-secondary">Memory: <span className="lattice-text-primary font-semibold">3.8 GB Available</span></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}