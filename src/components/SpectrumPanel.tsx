import React from 'react';
import { Activity, Settings, Zap, Wifi } from 'lucide-react';

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

interface SpectrumPanelProps {
  spectrumData: SpectrumData[];
  droneSignals: DroneSignal[];
  spectrumConnected: boolean;
  spectrumConfig: SpectrumConfig;
  lastSpectrumUpdate: Date;
  isLoadingSpectrum: boolean;
  onConfigChange: (config: SpectrumConfig) => void;
  onHeaderClick: () => void;
  isSelecting: boolean;
  panelId?: string;
}

const getFrequencyBands = () => [
  { name: '433M', label: '433 MHz ISM', center: 433, span: 10, description: 'Long range control, telemetry' },
  { name: '900M', label: '900 MHz ISM', center: 915, span: 50, description: 'LoRa, long range data' },
  { name: '1.2G', label: '1.2 GHz', center: 1280, span: 100, description: 'FPV video, rare' },
  { name: '2.4G', label: '2.4 GHz ISM', center: 2450, span: 100, description: 'WiFi, Bluetooth, RC control' },
  { name: '5.8G', label: '5.8 GHz ISM', center: 5800, span: 200, description: 'FPV video, high-speed data' }
];

export default function SpectrumPanel({ 
  spectrumData, 
  droneSignals, 
  spectrumConnected, 
  spectrumConfig, 
  lastSpectrumUpdate, 
  isLoadingSpectrum,
  onConfigChange,
  onHeaderClick,
  isSelecting,
  panelId = 'default'
}: SpectrumPanelProps) {
  const [spectrumLayer, setSpectrumLayer] = React.useState<'analyzer' | 'settings'>('analyzer');

  const handleBandSelect = (band: any) => {
    onConfigChange({
      ...spectrumConfig,
      center_freq: band.center,
      span: band.span
    });
  };

  const handleConfigUpdate = (field: keyof SpectrumConfig, value: any) => {
    onConfigChange({
      ...spectrumConfig,
      [field]: value
    });
  };

  const toggleBand = (bandName: string) => {
    const newBands = spectrumConfig.enabled_bands.includes(bandName)
      ? spectrumConfig.enabled_bands.filter(b => b !== bandName)
      : [...spectrumConfig.enabled_bands, bandName];
    
    onConfigChange({
      ...spectrumConfig,
      enabled_bands: newBands
    });
  };

  // Get frequency-specific signals for this panel
  const panelSignals = droneSignals.filter(signal => {
    const freqRange = spectrumConfig.span / 2;
    return signal.frequency >= (spectrumConfig.center_freq - freqRange) &&
           signal.frequency <= (spectrumConfig.center_freq + freqRange);
  });

  // Get frequency-specific spectrum data for this panel
  const panelSpectrumData = spectrumData.filter(data => {
    const freqRange = spectrumConfig.span / 2;
    return data.frequency >= (spectrumConfig.center_freq - freqRange) &&
           data.frequency <= (spectrumConfig.center_freq + freqRange);
  });

  return (
    <div className="lattice-panel flex flex-col h-full">
      {/* Main Header */}
      <div className={`lattice-header px-4 py-3 cursor-pointer transition-all ${
        isSelecting ? 'bg-gradient-to-r from-orange-500 to-amber-500' : ''
      }`} onClick={onHeaderClick}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="h-4 w-4 lattice-status-primary" />
            <span className="text-sm font-semibold lattice-text-primary">Spectrum Analyzer</span>
          </div>
          <span className="text-xs lattice-text-secondary">
            {spectrumConfig.center_freq}MHz ±{spectrumConfig.span/2}MHz
          </span>
        </div>
      </div>

      {/* Spectrum Analyzer Tabs */}
      <div className="border-b border-gray-700 px-3 py-2">
        <div className="flex items-center justify-between">
          <div className="flex space-x-1">
            <button
              onClick={() => setSpectrumLayer('analyzer')}
              className={`lattice-tab px-3 py-1 text-xs rounded transition-all ${
                spectrumLayer === 'analyzer'
                  ? 'active'
                  : ''
              }`}
            >
              <Activity className="h-3 w-3 inline mr-1" />
              Analyzer
            </button>
            <button
              onClick={() => setSpectrumLayer('settings')}
              className={`lattice-tab px-3 py-1 text-xs rounded transition-all ${
                spectrumLayer === 'settings'
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
              <Zap className={`h-3 w-3 mr-1 ${spectrumConnected ? 'lattice-status-good' : 'lattice-status-error'}`} />
              Spectrum: {spectrumConnected ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
      </div>

      {/* Spectrum Content */}
      <div className="flex-1 relative">
        {/* Analyzer Layer */}
        {spectrumLayer === 'analyzer' && (
          <div className="absolute inset-0 p-4 overflow-hidden">
            <div className="h-full flex gap-4">
              {/* Spectrum Waterfall - Left side, takes most space */}
              <div className="flex-1">
                <div className="text-xs lattice-status-primary mb-2 font-semibold">Spectrum Waterfall</div>
                <div className="lattice-panel p-3 rounded h-[calc(100%-32px)]">
                  {/* Simple spectrum visualization */}
                  <div className="h-full flex flex-col">
                    {/* Frequency scale */}
                    <div className="flex justify-between text-xs lattice-text-secondary mb-2">
                      <span>{(spectrumConfig.center_freq - spectrumConfig.span/2).toFixed(0)}MHz</span>
                      <span>{spectrumConfig.center_freq.toFixed(0)}MHz</span>
                      <span>{(spectrumConfig.center_freq + spectrumConfig.span/2).toFixed(0)}MHz</span>
                    </div>
                    
                    {/* Spectrum bars */}
                    <div className="flex-1 flex items-end space-x-px">
                      {Array.from({ length: 100 }, (_, i) => {
                        const freq = spectrumConfig.center_freq - spectrumConfig.span/2 + (i * spectrumConfig.span / 100);
                        let power = -80 + Math.random() * 10;
                        
                        // Highlight drone signal frequencies
                        panelSignals.forEach(signal => {
                          if (Math.abs(freq - signal.frequency) < signal.bandwidth) {
                            power = Math.max(power, signal.power + Math.random() * 5 - 2.5);
                          }
                        });
                        
                        const height = Math.max(2, ((power + 100) / 60) * 100);
                        const color = power > -50 ? 'bg-red-400' : power > -65 ? 'bg-amber-400' : 'bg-cyan-400';
                        
                        return (
                          <div
                            key={i}
                            className={`flex-1 ${color} opacity-80`}
                            style={{ height: `${height}%` }}
                          />
                        );
                      })}
                    </div>
                    
                    {/* Power scale */}
                    <div className="flex justify-between text-xs lattice-text-secondary mt-2">
                      <span>-100dBm</span>
                      <span>-50dBm</span>
                      <span>0dBm</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Detected Drone Signals - Right side, compact blocks */}
              <div className="w-48 flex-shrink-0">
                <div className="text-xs lattice-status-primary mb-2 font-semibold">Detected Signals ({panelSignals.length})</div>
                <div className="h-[calc(100%-32px)] overflow-y-auto lattice-scrollbar">
                  {panelSignals.length === 0 ? (
                    <div className="text-center lattice-text-muted py-8">
                      <Wifi className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No signals detected</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {panelSignals.map((signal, index) => (
                        <div key={index} className={`lattice-panel p-3 ${
                          signal.confidence > 80 ? 'border-red-400 bg-red-900/30 lattice-glow' :
                          signal.confidence > 60 ? 'border-amber-400 bg-amber-900/30' :
                          ''
                        }`}>
                          <div className="font-semibold lattice-text-primary text-xs mb-1 truncate" title={signal.protocol}>
                            {signal.protocol}
                          </div>
                          <div className={`text-xs font-semibold mb-1 ${
                            signal.confidence > 80 ? 'lattice-status-error' :
                            signal.confidence > 60 ? 'lattice-status-warning' :
                            'lattice-text-secondary'
                          }`}>
                            {signal.confidence.toFixed(0)}% confidence
                          </div>
                          <div className="text-xs space-y-0.5">
                            <div className="lattice-text-secondary">Freq: <span className="lattice-text-primary font-semibold">{signal.frequency.toFixed(2)}MHz</span></div>
                            <div className="lattice-text-secondary">Power: <span className="lattice-text-primary font-semibold">{signal.power.toFixed(1)}dBm</span></div>
                            <div className="lattice-text-secondary">Duration: <span className="lattice-text-primary font-semibold">{signal.duration.toFixed(1)}s</span></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Settings Layer */}
        {spectrumLayer === 'settings' && (
          <div className="absolute inset-0 p-4 overflow-y-auto lattice-scrollbar">
            <div className="h-full flex flex-col">
              {/* Frequency Band Presets */}
              <div className="mb-4">
                <div className="text-xs lattice-status-primary mb-3 font-semibold">Frequency Bands</div>
                <div className="grid grid-cols-2 gap-1">
                  {getFrequencyBands().map((band) => (
                    <div key={band.name} className="lattice-panel p-3">
                      <div className="flex items-center space-x-2 w-full">
                        <input
                          type="checkbox"
                          checked={spectrumConfig.enabled_bands.includes(band.name)}
                          onChange={() => toggleBand(band.name)}
                          className="w-4 h-4 accent-cyan-400 flex-shrink-0"
                        />
                        <button
                          onClick={() => handleBandSelect(band)}
                          className="text-left flex-1 hover:lattice-status-primary transition-colors min-w-0"
                        >
                          <div className="text-sm font-semibold lattice-text-primary truncate">{band.label}</div>
                          <div className="text-xs lattice-text-secondary truncate">{band.center}MHz</div>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Manual Configuration */}
              <div className="flex-1">
                <div className="text-xs lattice-status-primary font-semibold mb-3">Manual Configuration</div>
                
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <label className="text-xs lattice-text-secondary block mb-1">Center Frequency (MHz)</label>
                    <input
                      type="number"
                      value={spectrumConfig.center_freq}
                      onChange={(e) => handleConfigUpdate('center_freq', parseFloat(e.target.value))}
                      className="w-full lattice-input text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs lattice-text-secondary block mb-1">Span (MHz)</label>
                    <input
                      type="number"
                      value={spectrumConfig.span}
                      onChange={(e) => handleConfigUpdate('span', parseFloat(e.target.value))}
                      className="w-full lattice-input text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs lattice-text-secondary block mb-1">RBW (kHz)</label>
                    <input
                      type="number"
                      value={spectrumConfig.rbw}
                      onChange={(e) => handleConfigUpdate('rbw', parseFloat(e.target.value))}
                      className="w-full lattice-input text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs lattice-text-secondary block mb-1">Gain (dB)</label>
                    <input
                      type="number"
                      value={spectrumConfig.gain}
                      onChange={(e) => handleConfigUpdate('gain', parseFloat(e.target.value))}
                      className="w-full lattice-input text-xs"
                    />
                  </div>
                </div>

                {/* Hardware Status */}
                <div className="lattice-panel p-3">
                  <div className="text-xs lattice-status-primary mb-3 font-semibold">Hardware Status</div>
                  <div className="text-xs grid grid-cols-2 gap-2">
                    <div className="lattice-text-secondary">Connection: <span className={`font-semibold ${spectrumConnected ? 'lattice-status-good' : 'lattice-status-error'}`}>
                      {spectrumConnected ? 'Connected' : 'Offline'}
                    </span></div>
                    <div className="lattice-text-secondary">Update Rate: <span className="lattice-text-primary font-semibold">{(1/spectrumConfig.sweep_time).toFixed(1)}Hz</span></div>
                    <div className="lattice-text-secondary">Last Update: <span className="lattice-text-primary font-semibold">{lastSpectrumUpdate.toLocaleTimeString()}</span></div>
                    <div className="lattice-text-secondary">Status: <span className={`font-semibold ${isLoadingSpectrum ? 'lattice-status-warning' : 'lattice-status-good'}`}>
                      {isLoadingSpectrum ? 'Scanning' : 'Ready'}
                    </span></div>
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