import React from 'react';
import { Plane, Play, Square, Clock, FileText, Trash2, Calendar } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface FlightLog {
  id: string;
  callsign: string;
  droneType: string;
  comment: string;
  startTime: Date;
  endTime: Date;
  flightTime: number; // in seconds
  date: string; // YYYY-MM-DD format
}

interface FlightLoggerPanelProps {
  onHeaderClick: () => void;
  isSelecting: boolean;
}

const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

const formatFlightTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  const decimalHours = (seconds / 3600).toFixed(1);
  return `${decimalHours}h`;
};

export default function FlightLoggerPanel({ onHeaderClick, isSelecting }: FlightLoggerPanelProps) {
  const [flightLogs, setFlightLogs] = useLocalStorage<FlightLog[]>('flightLogs', []);
  const [currentFlight, setCurrentFlight] = React.useState<{
    callsign: string;
    droneType: string;
    comment: string;
    startTime: Date;
  } | null>(null);
  const [flightTime, setFlightTime] = React.useState(0);
  const [callsign, setCallsign] = useLocalStorage('flightCallsign', '');
  const [droneType, setDroneType] = useLocalStorage('flightDroneType', '');
  const [comment, setComment] = useLocalStorage('flightComment', '');
  const [logLayer, setLogLayer] = React.useState<'logger' | 'history'>('logger');
  const [selectedDate, setSelectedDate] = React.useState(new Date().toISOString().split('T')[0]);
  const [showClearConfirmation, setShowClearConfirmation] = React.useState(false);

  // Flight timer
  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (currentFlight) {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - currentFlight.startTime.getTime()) / 1000);
        setFlightTime(elapsed);
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentFlight]);

  const handleLaunch = () => {
    if (!callsign.trim()) {
      alert('Please enter a callsign');
      return;
    }
    
    setCurrentFlight({
      callsign: callsign.trim(),
      droneType: droneType.trim() || 'Unknown',
      comment: comment.trim(),
      startTime: new Date()
    });
    setFlightTime(0);
  };

  const handleLand = () => {
    if (!currentFlight) return;
    
    const endTime = new Date();
    const flightDuration = Math.floor((endTime.getTime() - currentFlight.startTime.getTime()) / 1000);
    
    const newLog: FlightLog = {
      id: Date.now().toString(),
      callsign: currentFlight.callsign,
      droneType: currentFlight.droneType,
      comment: currentFlight.comment,
      startTime: currentFlight.startTime,
      endTime: endTime,
      flightTime: flightDuration,
      date: currentFlight.startTime.toISOString().split('T')[0]
    };
    
    setFlightLogs(prev => [newLog, ...prev]);
    setCurrentFlight(null);
    setFlightTime(0);
  };

  const handleDeleteLog = (logId: string) => {
    if (confirm('Are you sure you want to delete this flight log?')) {
      setFlightLogs(prev => prev.filter(log => log.id !== logId));
    }
  };

  const handleClearAllData = () => {
    // Clear all flight logs
    setFlightLogs([]);
    
    // Clear all input fields
    setCallsign('');
    setDroneType('');
    setComment('');
    
    // Stop current flight if active
    if (currentFlight) {
      setCurrentFlight(null);
      setFlightTime(0);
    }
    
    setShowClearConfirmation(false);
  };

  // Get logs for selected date
  const selectedDateLogs = flightLogs.filter(log => log.date === selectedDate);
  const dailyFlightTime = selectedDateLogs.reduce((total, log) => total + log.flightTime, 0);

  // Get unique dates for date selector
  const availableDates = [...new Set(flightLogs.map(log => log.date))].sort().reverse();

  return (
    <div className="lattice-panel flex flex-col h-full">
      {/* Main Header */}
      <div className={`lattice-header px-4 py-3 cursor-pointer transition-all ${
        isSelecting ? 'bg-gradient-to-r from-orange-500 to-amber-500' : ''
      }`} onClick={onHeaderClick}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Plane className="h-4 w-4 lattice-status-primary" />
            <span className="text-sm font-semibold lattice-text-primary">Flight Logger</span>
          </div>
          {currentFlight && (
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs lattice-status-good font-semibold">FLIGHT ACTIVE</span>
            </div>
          )}
        </div>
      </div>

      {/* Logger Tabs */}
      <div className="border-b border-gray-700 px-3 py-2">
        <div className="flex space-x-1">
          <button
            onClick={() => setLogLayer('logger')}
            className={`lattice-tab px-3 py-1 text-xs rounded transition-all ${
              logLayer === 'logger'
                ? 'active'
                : ''
            }`}
          >
            <Play className="h-3 w-3 inline mr-1" />
            Logger
          </button>
          <button
            onClick={() => setLogLayer('history')}
            className={`lattice-tab px-3 py-1 text-xs rounded transition-all ${
              logLayer === 'history'
                ? 'active'
                : ''
            }`}
          >
            <FileText className="h-3 w-3 inline mr-1" />
            History
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 relative overflow-hidden">
        {/* Logger Layer */}
        {logLayer === 'logger' && (
          <div className="absolute inset-0 p-4">
            <div className="h-full flex flex-col">
              {/* Flight Timer Display */}
              {currentFlight && (
                <div className="lattice-panel border-green-400 p-4 mb-4 lattice-glow-accent">
                  <div className="text-center">
                    <div className="text-xs lattice-status-good mb-2 font-semibold">FLIGHT IN PROGRESS</div>
                    <div className="text-2xl font-bold lattice-text-primary mb-2 font-mono">
                      {formatTime(flightTime)}
                    </div>
                    <div className="text-sm lattice-text-secondary mb-3">
                      {currentFlight.callsign} • {currentFlight.droneType}
                    </div>
                    <button
                      onClick={handleLand}
                      className="lattice-button bg-red-600 hover:bg-red-500 border-red-500 text-white px-6 py-3 text-sm font-semibold flex items-center space-x-2 mx-auto"
                    >
                      <Square className="h-4 w-4" />
                      <span>LAND</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Flight Input Form */}
              {!currentFlight && (
                <div className="lattice-panel p-4 mb-4">
                  <div className="text-sm lattice-status-primary mb-3 font-semibold">New Flight</div>
                  <div className="space-y-2">
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-xs lattice-text-secondary block mb-1">Callsign *</label>
                        <input
                          type="text"
                          value={callsign}
                          onChange={(e) => setCallsign(e.target.value)}
                          className="w-full lattice-input text-xs"
                          placeholder="e.g., DRONE-01, UAV-ALPHA"
                          maxLength={20}
                        />
                      </div>
                      <div>
                        <label className="text-xs lattice-text-secondary block mb-1">Drone Type</label>
                        <input
                          type="text"
                          value={droneType}
                          onChange={(e) => setDroneType(e.target.value)}
                          className="w-full lattice-input text-xs"
                          placeholder="e.g., DJI Mavic, Custom Quad"
                          maxLength={30}
                        />
                      </div>
                      <div>
                        <label className="text-xs lattice-text-secondary block mb-1">Comment</label>
                        <input
                          type="text"
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          className="w-full lattice-input text-xs"
                          placeholder="Mission notes, weather conditions, etc."
                          maxLength={100}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Launch Button */}
              {!currentFlight && (
                <div className="text-center">
                  <button
                    onClick={handleLaunch}
                    disabled={!callsign.trim()}
                    className="lattice-button-primary disabled:opacity-50 disabled:cursor-not-allowed px-8 py-4 text-lg font-semibold flex items-center space-x-3 mx-auto"
                  >
                    <Play className="h-6 w-6" />
                    <span>LAUNCH</span>
                  </button>
                </div>
              )}

              {/* Today's Summary */}
              <div className="mt-auto">
                <div className="lattice-panel p-3">
                  <div className="text-xs lattice-status-primary mb-2 font-semibold">Today's Summary</div>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <div className="lattice-text-secondary">Flights:</div>
                      <div className="lattice-text-primary font-semibold">
                        {flightLogs.filter(log => log.date === new Date().toISOString().split('T')[0]).length}
                      </div>
                    </div>
                    <div>
                      <div className="lattice-text-secondary">Flight Time:</div>
                      <div className="lattice-text-primary font-semibold">
                        {formatFlightTime(flightLogs
                          .filter(log => log.date === new Date().toISOString().split('T')[0])
                          .reduce((total, log) => total + log.flightTime, 0)
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* History Layer */}
        {logLayer === 'history' && (
          <div className="absolute inset-0 p-4 overflow-y-auto lattice-scrollbar">
            <div className="h-full flex flex-col">
              {/* Date Selector */}
              <div className="lattice-panel p-3 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm lattice-status-primary font-semibold">Flight History</div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-3 w-3 lattice-text-secondary" />
                    <select
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="lattice-input text-xs"
                    >
                      <option value={new Date().toISOString().split('T')[0]}>Today</option>
                      {availableDates.map(date => (
                        <option key={date} value={date}>
                          {new Date(date).toLocaleDateString()}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                {/* Daily Summary */}
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <div className="lattice-text-secondary">Total Flights:</div>
                    <div className="lattice-text-primary font-semibold">{selectedDateLogs.length}</div>
                  </div>
                  <div>
                    <div className="lattice-text-secondary">Total Flight Time:</div>
                    <div className="lattice-text-primary font-semibold">{formatFlightTime(dailyFlightTime)}</div>
                  </div>
                </div>
                
                {/* Clear All Data Button */}
                <div className="mt-3 pt-3 border-t border-gray-600">
                  <button
                    onClick={() => setShowClearConfirmation(true)}
                    className="w-full lattice-button bg-red-600 hover:bg-red-500 border-red-500 text-white text-xs py-2 flex items-center justify-center space-x-2"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Clear All Flight Data</span>
                  </button>
                </div>
              </div>

              {/* Flight Logs */}
              <div className="flex-1 overflow-y-auto lattice-scrollbar">
                {selectedDateLogs.length === 0 ? (
                  <div className="text-center lattice-text-muted py-8">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No flights logged for this date</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedDateLogs.map((log) => (
                      <div key={log.id} className="lattice-panel p-3">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <Plane className="h-4 w-4 lattice-status-primary" />
                            <span className="font-semibold lattice-text-primary">{log.callsign}</span>
                            <span className="text-xs lattice-text-secondary">({log.droneType})</span>
                          </div>
                          <button
                            onClick={() => handleDeleteLog(log.id)}
                            className="lattice-text-secondary hover:lattice-status-error transition-colors"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                          <div>
                            <div className="lattice-text-secondary">Start:</div>
                            <div className="lattice-text-primary font-semibold">
                              {new Date(log.startTime).toLocaleTimeString()}
                            </div>
                          </div>
                          <div>
                            <div className="lattice-text-secondary">Duration:</div>
                            <div className="lattice-text-primary font-semibold">
                              {formatFlightTime(log.flightTime)}
                            </div>
                          </div>
                        </div>
                        
                        {log.comment && (
                          <div className="text-xs lattice-text-secondary italic">
                            "{log.comment}"
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Clear Confirmation Modal */}
      {showClearConfirmation && (
        <div className="absolute inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="lattice-panel-elevated p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Trash2 className="h-5 w-5 lattice-status-error" />
                <h3 className="text-lg font-semibold lattice-status-error">Clear All Flight Data</h3>
              </div>
            </div>

            <div className="space-y-4">
              <div className="lattice-panel border-red-400 p-4 bg-red-900/30">
                <div className="text-sm lattice-status-error font-semibold mb-2">⚠️ WARNING</div>
                <div className="text-xs lattice-text-primary space-y-1">
                  <p>This will permanently delete:</p>
                  <ul className="list-disc list-inside ml-2 space-y-0.5">
                    <li>ALL flight logs ({flightLogs.length} flights)</li>
                    <li>All saved input fields (callsign, drone type, comment)</li>
                    <li>Current flight session (if active)</li>
                  </ul>
                  <p className="font-semibold mt-2">This action cannot be undone.</p>
                </div>
              </div>

              <div className="text-center text-sm lattice-text-secondary">
                Are you sure you want to continue?
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowClearConfirmation(false)}
                  className="flex-1 lattice-button text-sm py-2"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearAllData}
                  className="flex-1 lattice-button bg-red-600 hover:bg-red-500 border-red-500 text-white text-sm py-2"
                >
                  Delete All Data
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}