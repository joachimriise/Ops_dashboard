import React from 'react';
import { X, Navigation, Cloud, Activity, Target, Video, Radio, Compass, Radar, Brain, Map, Package, Clock } from 'lucide-react';

type PanelType = 'adsb' | 'adsb-demo' | 'weather' | 'spectrum' | 'tactical' | 'video' | 'map' | 'software' | 'comms' | 'navigation' | 'sensors' | 'intel';

interface PanelOption {
  type: PanelType;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  status: 'active' | 'coming-soon';
}

interface PanelSelectorProps {
  onSelect: (panelType: PanelType) => void;
  onClose: () => void;
  currentPanel: PanelType;
}

const panelOptions: PanelOption[] = [
  {
    type: 'adsb',
    name: 'ADS-B SURVEILLANCE',
    description: 'Aircraft tracking and identification',
    icon: Navigation,
    status: 'active'
  },
  {
    type: 'adsb-demo',
    name: 'ADS-B SURVEILLANCE DEMO',
    description: 'Demo aircraft tracking around Trondheim Airport',
    icon: Navigation,
    status: 'active'
  },
  {
    type: 'weather',
    name: 'WEATHER CONDITIONS',
    description: 'Meteorological data and flight conditions',
    icon: Cloud,
    status: 'active'
  },
  {
    type: 'spectrum',
    name: 'SPECTRUM ANALYZER',
    description: 'RF spectrum monitoring and drone detection',
    icon: Activity,
    status: 'active'
  },
  {
    type: 'tactical',
    name: 'TACTICAL DISPLAY',
    description: 'Mission planning and tactical overview',
    icon: Target,
    status: 'active'
  },
  {
    type: 'video',
    name: 'VIDEO SURVEILLANCE',
    description: 'Network cameras and live video feeds',
    icon: Video,
    status: 'active'
  },
  {
    type: 'map',
    name: 'TACTICAL MAP',
    description: 'Interactive map with positioning and measurement tools',
    icon: Map,
    status: 'active'
  },
  {
    type: 'software',
    name: 'SOFTWARE STATUS',
    description: 'System version control and OTA update management',
    icon: Package,
    status: 'active'
  },
  {
    type: 'flight-logger',
    name: 'FLIGHT LOGGER',
    description: 'Flight time tracking and logging system',
    icon: Clock,
    status: 'active'
  },
  {
    type: 'comms',
    name: 'COMMUNICATIONS',
    description: 'Radio communications and frequency monitoring',
    icon: Radio,
    status: 'coming-soon'
  },
  {
    type: 'navigation',
    name: 'NAVIGATION',
    description: 'GPS tracking and waypoint management',
    icon: Compass,
    status: 'coming-soon'
  },
  {
    type: 'sensors',
    name: 'SENSORS',
    description: 'Multi-sensor data fusion and analysis',
    icon: Radar,
    status: 'coming-soon'
  },
  {
    type: 'intel',
    name: 'INTELLIGENCE',
    description: 'Threat analysis and intelligence gathering',
    icon: Brain,
    status: 'coming-soon'
  }
];

export default function PanelSelector({ onSelect, onClose, currentPanel }: PanelSelectorProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-[9999]">
      <div className="lattice-panel-elevated p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto lattice-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Target className="h-5 w-5 lattice-status-primary" />
            <h2 className="text-lg font-semibold lattice-text-primary">Select Panel Module</h2>
          </div>
          <button
            onClick={onClose}
            className="lattice-text-muted hover:lattice-text-primary transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Panel Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {panelOptions.map((panel) => {
            const Icon = panel.icon;
            const isSelected = panel.type === currentPanel;
            const isComingSoon = panel.status === 'coming-soon';
            
            return (
              <button
                key={panel.type}
                onClick={() => !isComingSoon && onSelect(panel.type)}
                disabled={isComingSoon}
                className={`p-4 rounded border-2 text-left transition-all ${
                  isSelected
                    ? 'border-cyan-400 bg-cyan-900/20 lattice-glow'
                    : isComingSoon
                    ? 'border-gray-600 bg-gray-700/50 opacity-60 cursor-not-allowed'
                    : 'lattice-panel hover:border-cyan-400 hover:lattice-glow'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <Icon className={`h-6 w-6 mt-1 ${
                    isSelected ? 'lattice-status-primary' : 
                    isComingSoon ? 'lattice-text-muted' : 'lattice-status-primary'
                  }`} />
                  <div className="flex-1">
                    <div className={`font-semibold text-sm mb-1 ${
                      isSelected ? 'lattice-status-primary' : 
                      isComingSoon ? 'lattice-text-muted' : 'lattice-text-primary'
                    }`}>
                      {panel.name}
                      {isSelected && <span className="ml-2 text-xs">(Current)</span>}
                      {isComingSoon && <span className="ml-2 text-xs">(Coming Soon)</span>}
                    </div>
                    <div className={`text-xs ${
                      isComingSoon ? 'lattice-text-muted' : 'lattice-text-secondary'
                    }`}>
                      {panel.description}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-gray-600">
          <div className="text-xs lattice-text-secondary text-center">
            Click on any panel header to reconfigure • ESC to close
          </div>
        </div>
      </div>
    </div>
  );
}