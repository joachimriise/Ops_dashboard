import React from 'react';
import { Video, Settings, Plus, X, Eye, EyeOff, Maximize2, Grid3X3, Monitor, Edit, Trash2, GripVertical, ChevronUp, ChevronDown, Search, Filter } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface NetworkCamera {
  id: string;
  name: string;
  url: string;
  type: 'rtsp' | 'http' | 'hls' | 'webrtc' | 'mjpeg' | 'onvif' | 'webcam';
  username?: string;
  password?: string;
  enabled: boolean;
  status: 'connected' | 'connecting' | 'error' | 'offline';
  lastSeen?: Date;
  resolution?: string;
  framerate?: number;
  codec?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface VideoPanelProps {
  onHeaderClick: () => void;
  isSelecting: boolean;
}

export default function VideoPanel({ onHeaderClick, isSelecting }: VideoPanelProps) {
  const [videoLayer, setVideoLayer] = React.useState<'feeds' | 'settings'>('feeds');
  const [cameras, setCameras] = useLocalStorage<NetworkCamera[]>('videoCameras', [
    {
      id: 'webcam-local',
      name: 'Onboard Webcam',
      url: 'local://webcam',
      type: 'webcam',
      enabled: false,
      status: 'offline',
      resolution: '1280x720',
      framerate: 30,
      codec: 'WebRTC',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '1',
      name: 'Perimeter Cam 1',
      url: 'rtsp://192.168.1.100:554/stream1',
      type: 'rtsp',
      username: 'admin',
      enabled: true,
      status: 'connected',
      lastSeen: new Date(),
      resolution: '1920x1080',
      framerate: 30,
      codec: 'H.264',
      createdAt: new Date(Date.now() - 86400000 * 7), // 7 days ago
      updatedAt: new Date(Date.now() - 3600000) // 1 hour ago
    },
    {
      id: '2',
      name: 'Drone Cam Alpha',
      url: 'rtsp://192.168.1.101:554/live',
      type: 'rtsp',
      enabled: true,
      status: 'connecting',
      resolution: '1280x720',
      framerate: 60,
      codec: 'H.265',
      createdAt: new Date(Date.now() - 86400000 * 3), // 3 days ago
      updatedAt: new Date(Date.now() - 1800000) // 30 minutes ago
    },
    {
      id: '3',
      name: 'Tower Cam North',
      url: 'http://192.168.1.102:8080/video',
      type: 'mjpeg',
      enabled: false,
      status: 'offline',
      resolution: '640x480',
      framerate: 15,
      codec: 'MJPEG',
      createdAt: new Date(Date.now() - 86400000 * 14), // 14 days ago
      updatedAt: new Date(Date.now() - 86400000 * 2) // 2 days ago
    },
    {
      id: '4',
      name: 'HLS Stream',
      url: 'https://example.com/stream.m3u8',
      type: 'hls',
      enabled: false,
      status: 'offline',
      resolution: '1920x1080',
      framerate: 25,
      codec: 'H.264',
      createdAt: new Date(Date.now() - 86400000 * 1), // 1 day ago
      updatedAt: new Date(Date.now() - 7200000) // 2 hours ago
    },
    {
      id: '5',
      name: 'WebRTC Feed',
      url: 'wss://webrtc.example.com/stream',
      type: 'webrtc',
      enabled: false,
      status: 'offline',
      resolution: '1280x720',
      framerate: 30,
      codec: 'VP8',
      createdAt: new Date(Date.now() - 86400000 * 5), // 5 days ago
      updatedAt: new Date(Date.now() - 900000) // 15 minutes ago
    }
  ]);
  const [viewMode, setViewMode] = React.useState<'single' | 'grid'>('grid');
  const [selectedCamera, setSelectedCamera] = useLocalStorage<string>('selectedCamera', '1');
  const [showAddCamera, setShowAddCamera] = React.useState(false);
  const [editingCamera, setEditingCamera] = React.useState<NetworkCamera | null>(null);
  const [draggedCamera, setDraggedCamera] = React.useState<string | null>(null);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<'all' | 'connected' | 'connecting' | 'error' | 'offline'>('all');
  const [sortBy, setSortBy] = React.useState<keyof NetworkCamera>('name');
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('asc');
  const [newCamera, setNewCamera] = React.useState({
    name: '',
    url: '',
    type: 'webcam' as NetworkCamera['type'],
    username: '',
    password: '',
    resolution: '1920x1080',
    framerate: 30
  });
  const webcamStreamRef = React.useRef<MediaStream | null>(null);

  const activeCameras = cameras.filter(cam => cam.enabled);
  const connectedCameras = cameras.filter(cam => cam.enabled && cam.status === 'connected');

  // Filter and sort cameras
  const filteredAndSortedCameras = React.useMemo(() => {
    let filtered = cameras.filter(camera => {
      const matchesSearch = camera.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           camera.url.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || camera.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    return filtered.sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      
      if (aValue === undefined || bValue === undefined) return 0;
      
      let comparison = 0;
      if (aValue < bValue) comparison = -1;
      if (aValue > bValue) comparison = 1;
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [cameras, searchTerm, statusFilter, sortBy, sortOrder]);

  const handleSort = (field: keyof NetworkCamera) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (field: keyof NetworkCamera) => {
    if (sortBy !== field) return null;
    return sortOrder === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />;
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, cameraId: string) => {
    setDraggedCamera(cameraId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedCamera || draggedCamera === targetId) return;

    const draggedIndex = cameras.findIndex(cam => cam.id === draggedCamera);
    const targetIndex = cameras.findIndex(cam => cam.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newCameras = [...cameras];
    const [draggedItem] = newCameras.splice(draggedIndex, 1);
    newCameras.splice(targetIndex, 0, draggedItem);

    setCameras(newCameras);
    setDraggedCamera(null);
  };

  const handleDragEnd = () => {
    setDraggedCamera(null);
  };

  const handleAddCamera = () => {
    if (newCamera.name && newCamera.url) {
      const camera: NetworkCamera = {
        id: Date.now().toString(),
        name: newCamera.name,
        url: newCamera.url,
        username: newCamera.username || undefined,
        password: newCamera.password || undefined,
        type: newCamera.type,
        enabled: true,
        status: 'connecting',
        resolution: newCamera.resolution,
        framerate: newCamera.framerate,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      setCameras(prev => [...prev, camera]);
      setNewCamera({ 
        name: '', 
        url: '', 
        type: 'rtsp', 
        username: '', 
        password: '',
        resolution: '1920x1080',
        framerate: 30
      });
      setShowAddCamera(false);
      
      // Simulate connection attempt
      setTimeout(() => {
        setCameras(prev => prev.map(cam => 
          cam.id === camera.id 
            ? { ...cam, status: Math.random() > 0.3 ? 'connected' : 'error', lastSeen: new Date() }
            : cam
        ));
      }, 2000);
    }
  };

  const handleEditCamera = (camera: NetworkCamera) => {
    setEditingCamera(camera);
    setNewCamera({
      name: camera.name,
      url: camera.url,
      type: camera.type,
      username: camera.username || '',
      password: camera.password || '',
      resolution: camera.resolution || '1920x1080',
      framerate: camera.framerate || 30
    });
  };

  const handleUpdateCamera = () => {
    if (editingCamera && newCamera.name && newCamera.url) {
      setCameras(prev => prev.map(cam => 
        cam.id === editingCamera.id 
          ? {
              ...cam,
              name: newCamera.name,
              url: newCamera.url,
              type: newCamera.type,
              username: newCamera.username || undefined,
              password: newCamera.password || undefined,
              resolution: newCamera.resolution,
              framerate: newCamera.framerate,
              updatedAt: new Date()
            }
          : cam
      ));
      
      setEditingCamera(null);
      setNewCamera({ 
        name: '', 
        url: '', 
        type: 'rtsp', 
        username: '', 
        password: '',
        resolution: '1920x1080',
        framerate: 30
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingCamera(null);
    setNewCamera({ 
      name: '', 
      url: '', 
      type: 'rtsp', 
      username: '', 
      password: '',
      resolution: '1920x1080',
      framerate: 30
    });
  };

  const handleRemoveCamera = (id: string) => {
    if (confirm('Are you sure you want to delete this camera?')) {
      setCameras(prev => prev.filter(cam => cam.id !== id));
      if (editingCamera?.id === id) {
        setEditingCamera(null);
      }
    }
  };

  const getStreamTypeIcon = (type: NetworkCamera['type']) => {
    switch (type) {
      case 'webcam': return '📷';
      case 'rtsp': return '📹';
      case 'http': return '🌐';
      case 'hls': return '📺';
      case 'webrtc': return '🔗';
      case 'mjpeg': return '📸';
      case 'onvif': return '🎥';
      default: return '📹';
    }
  };

  const getStreamTypeLabel = (type: NetworkCamera['type']) => {
    switch (type) {
      case 'webcam': return 'Webcam';
      case 'rtsp': return 'RTSP';
      case 'http': return 'HTTP';
      case 'hls': return 'HLS';
      case 'webrtc': return 'WebRTC';
      case 'mjpeg': return 'MJPEG';
      case 'onvif': return 'ONVIF';
      default: return 'Unknown';
    }
  };

  const toggleCamera = (id: string) => {
    const camera = cameras.find(cam => cam.id === id);
    
    // If disabling a webcam, stop its stream
    if (camera?.type === 'webcam' && camera.enabled && webcamStreamRef.current) {
      webcamStreamRef.current.getTracks().forEach(track => track.stop());
      webcamStreamRef.current = null;
    }
    
    setCameras(prev => prev.map(cam => 
      cam.id === id 
        ? { ...cam, enabled: !cam.enabled, status: cam.enabled ? 'offline' : 'connecting', updatedAt: new Date() }
        : cam
    ));
  };

  // Cleanup webcam stream on unmount
  React.useEffect(() => {
    return () => {
      if (webcamStreamRef.current) {
        webcamStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const renderVideoElement = (camera: NetworkCamera) => {
    const videoProps = {
      className: "w-full h-full object-cover",
      controls: false,
      autoPlay: true,
      muted: true,
      playsInline: true,
      onError: () => {
        setCameras(prev => prev.map(cam => 
          cam.id === camera.id ? { ...cam, status: 'error' } : cam
        ));
      },
      onLoadStart: () => {
        setCameras(prev => prev.map(cam => 
          cam.id === camera.id ? { ...cam, status: 'connecting' } : cam
        ));
      },
      onCanPlay: () => {
        setCameras(prev => prev.map(cam => 
          cam.id === camera.id ? { ...cam, status: 'connected', lastSeen: new Date() } : cam
        ));
      }
    };

    switch (camera.type) {
      case 'webcam':
        return <WebcamVideo camera={camera} webcamStreamRef={webcamStreamRef} setCameras={setCameras} />;
      
      case 'hls':
        // For HLS streams, we need to use a library like hls.js
        return (
          <video {...videoProps} ref={(video) => {
            if (video && window.Hls && window.Hls.isSupported()) {
              const hls = new window.Hls();
              hls.loadSource(camera.url);
              hls.attachMedia(video);
            } else if (video && video.canPlayType('application/vnd.apple.mpegurl')) {
              // Safari native HLS support
              video.src = camera.url;
            }
          }}>
            Your browser does not support HLS video.
          </video>
        );
      
      case 'webrtc':
        // WebRTC would require a more complex implementation with signaling
        return (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <div className="text-xs lattice-status-warning font-semibold mb-2">WebRTC Stream</div>
              <div className="text-xs lattice-text-secondary">
                WebRTC requires additional signaling server setup
              </div>
            </div>
          </div>
        );
      
      case 'mjpeg':
        // MJPEG can be displayed as an image with continuous refresh
        return (
          <img
            src={camera.url}
            alt={camera.name}
            className="w-full h-full object-cover"
            onError={() => {
              setCameras(prev => prev.map(cam => 
                cam.id === camera.id ? { ...cam, status: 'error' } : cam
              ));
            }}
            onLoad={() => {
              setCameras(prev => prev.map(cam => 
                cam.id === camera.id ? { ...cam, status: 'connected', lastSeen: new Date() } : cam
              ));
            }}
          />
        );
      
      case 'rtsp':
        // RTSP requires server-side conversion or WebRTC gateway
        return (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <div className="text-xs lattice-status-warning font-semibold mb-2">RTSP Stream</div>
              <div className="text-xs lattice-text-secondary">
                RTSP requires server-side transcoding to web-compatible format
              </div>
              <div className="text-xs lattice-text-muted mt-2">
                URL: {camera.url}
              </div>
            </div>
          </div>
        );
      
      case 'http':
      default:
        // Standard HTTP video streams
        return (
          <video {...videoProps} src={camera.url}>
            Your browser does not support the video tag.
          </video>
        );
    }
  };

  // Webcam Video Component
  const WebcamVideo = ({ 
    camera, 
    webcamStreamRef, 
    setCameras 
  }: { 
    camera: NetworkCamera; 
    webcamStreamRef: React.MutableRefObject<MediaStream | null>;
    setCameras: React.Dispatch<React.SetStateAction<NetworkCamera[]>>;
  }) => {
    const videoRef = React.useRef<HTMLVideoElement>(null);

    React.useEffect(() => {
      if (camera.enabled && videoRef.current) {
        // Request webcam access
        navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30 }
          } 
        })
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            webcamStreamRef.current = stream;
            
            // Update camera status
            setCameras(prev => prev.map(cam => 
              cam.id === camera.id 
                ? { ...cam, status: 'connected', lastSeen: new Date() }
                : cam
            ));
          }
        })
        .catch((error) => {
          console.error('Error accessing webcam:', error);
          setCameras(prev => prev.map(cam => 
            cam.id === camera.id 
              ? { ...cam, status: 'error' }
              : cam
          ));
        });
      } else if (!camera.enabled && webcamStreamRef.current) {
        // Stop webcam stream when disabled
        webcamStreamRef.current.getTracks().forEach(track => track.stop());
        webcamStreamRef.current = null;
        
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
      }
    }, [camera.enabled, camera.id, webcamStreamRef, setCameras]);

    return (
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        autoPlay
        muted
        playsInline
      />
    );
  };

  const renderVideoFeed = (camera: NetworkCamera, className: string = '', isFullscreen: boolean = false) => {
    return (
      <div key={camera.id} className={`bg-slate-900 military-panel rounded relative ${className}`}>
        {/* Camera Header - Only show in grid view or when not fullscreen */}
        {!isFullscreen && (
          <div className="absolute top-0 left-0 right-0 bg-black/80 backdrop-blur-sm px-3 py-2 z-10 rounded-t-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold lattice-text-primary truncate">{camera.name}</span>
              <div className="flex items-center space-x-1">
                <div className={`w-2 h-2 rounded-full ${
                  camera.status === 'connected' ? 'bg-green-400' :
                  camera.status === 'connecting' ? 'bg-amber-400' :
                  camera.status === 'error' ? 'bg-red-400' :
                  'bg-slate-400'
                }`} />
                <span className="text-xs lattice-text-secondary">
                  {camera.status === 'connected' ? 'Live' :
                   camera.status === 'connecting' ? 'Connecting' :
                   camera.status === 'error' ? 'Error' :
                   'Offline'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Fullscreen Camera Header Overlay */}
        {isFullscreen && (
          <div className="absolute top-4 left-4 right-4 bg-black/60 backdrop-blur-sm px-4 py-2 z-20 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-sm font-semibold lattice-text-primary">{camera.name}</span>
                <span className="text-xs lattice-text-secondary">({getStreamTypeLabel(camera.type)})</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  camera.status === 'connected' ? 'bg-green-400' :
                  camera.status === 'connecting' ? 'bg-amber-400' :
                  camera.status === 'error' ? 'bg-red-400' :
                  'bg-slate-400'
                }`} />
                <span className="text-xs lattice-text-secondary">
                  {camera.status === 'connected' ? 'LIVE' :
                   camera.status === 'connecting' ? 'CONNECTING' :
                   camera.status === 'error' ? 'ERROR' :
                   'OFFLINE'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Video Content */}
        <div className={`w-full h-full flex items-center justify-center ${isFullscreen ? '' : 'pt-10'}`}>
          {camera.status === 'connected' ? (
            <div className="w-full h-full bg-gray-900 rounded-lg overflow-hidden relative">
              {renderVideoElement(camera)}
              
              {/* Video overlay info - Bottom overlay for fullscreen */}
              {isFullscreen ? (
                <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm px-3 py-2 rounded text-xs">
                  <div className="lattice-status-good font-semibold">● LIVE</div>
                  <div className="lattice-text-secondary">
                    {getStreamTypeLabel(camera.type)}
                    {camera.resolution && <span> • {camera.resolution}</span>}
                    {camera.framerate && <span> • {camera.framerate}fps</span>}
                  </div>
                </div>
              ) : (
                <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-xs">
                  <div className="lattice-status-good font-semibold">● LIVE</div>
                  <div className="lattice-text-secondary">
                    {getStreamTypeLabel(camera.type)}
                    {camera.resolution && <span> • {camera.resolution}</span>}
                    {camera.framerate && <span> • {camera.framerate}fps</span>}
                  </div>
                </div>
              )}
            </div>
          ) : camera.status === 'connecting' ? (
            <div className="text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-400 mx-auto mb-2"></div>
              <div className="text-xs lattice-status-warning font-semibold">Connecting...</div>
            </div>
          ) : camera.status === 'error' ? (
            <div className="text-center">
              <X className="h-6 w-6 mx-auto mb-2 lattice-status-error" />
              <div className="text-xs lattice-status-error font-semibold">Connection Error</div>
            </div>
          ) : (
            <div className="text-center">
              <EyeOff className="h-6 w-6 mx-auto mb-2 lattice-text-muted" />
              <div className="text-xs lattice-text-muted">Offline</div>
            </div>
          )}
        </div>

        {/* Fullscreen Camera Controls Overlay */}
        {isFullscreen && (
          <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-sm px-3 py-2 rounded-lg">
            <div className="flex items-center space-x-3 text-xs">
              {camera.lastSeen && (
                <div className="lattice-text-secondary">
                  Last: {camera.lastSeen.toLocaleTimeString()}
                </div>
              )}
              <button className="lattice-text-secondary hover:lattice-text-primary transition-colors">
                <Maximize2 className="h-3 w-3" />
              </button>
            </div>
          </div>
        )}

        {/* Grid View Camera Header (kept for grid mode) */}
        {!isFullscreen && (
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold lattice-text-primary truncate">{camera.name}</span>
            <div className="flex items-center space-x-1">
              <div className={`w-2 h-2 rounded-full ${
                camera.status === 'connected' ? 'bg-green-400' :
                camera.status === 'connecting' ? 'bg-amber-400' :
                camera.status === 'error' ? 'bg-red-400' :
                'bg-slate-400'
              }`} />
              <span className="text-xs lattice-text-secondary">
                {camera.status === 'connected' ? 'Live' :
                 camera.status === 'connecting' ? 'Connecting' :
                 camera.status === 'error' ? 'Error' :
                 'Offline'}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Helper function for URL placeholders
  function getUrlPlaceholder(type: NetworkCamera['type']): string {
    switch (type) {
      case 'webcam':
        return 'Local webcam (no URL needed)';
      case 'http':
        return 'http://example.com/video.mp4';
      case 'hls':
        return 'https://example.com/stream.m3u8';
      case 'mjpeg':
        return 'http://camera.local/mjpeg';
      case 'rtsp':
        return 'rtsp://192.168.1.100:554/stream1';
      case 'webrtc':
        return 'wss://webrtc.example.com/stream';
      case 'onvif':
        return 'http://192.168.1.100/onvif/device_service';
      default:
        return 'Enter stream URL';
    }
  }

  return (
    <div className="lattice-panel flex flex-col h-full">
      {/* Main Header */}
      <div className={`lattice-header px-4 py-3 cursor-pointer transition-all ${
        isSelecting ? 'bg-gradient-to-r from-orange-500 to-amber-500' : ''
      }`} onClick={onHeaderClick}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Video className="h-4 w-4 lattice-status-primary" />
            <span className="text-sm font-semibold lattice-text-primary">Video Surveillance</span>
          </div>
          <span className="text-xs lattice-text-secondary">
            {connectedCameras.length}/{activeCameras.length} cameras online
          </span>
        </div>
      </div>

      {/* Video Tabs */}
      <div className="border-b border-gray-700 px-3 py-2">
        <div className="flex items-center justify-between">
          <div className="flex space-x-1">
            <button
              onClick={() => setVideoLayer('feeds')}
              className={`lattice-tab px-3 py-1 text-xs rounded transition-all ${
                videoLayer === 'feeds'
                  ? 'active'
                  : ''
              }`}
            >
              <Monitor className="h-3 w-3 inline mr-1" />
              Feeds
            </button>
            <button
              onClick={() => setVideoLayer('settings')}
              className={`lattice-tab px-3 py-1 text-xs rounded transition-all ${
                videoLayer === 'settings'
                  ? 'active'
                  : ''
              }`}
            >
              <Settings className="h-3 w-3 inline mr-1" />
              Cameras
            </button>
          </div>
          
          {videoLayer === 'feeds' && activeCameras.length > 0 && (
            <div className="flex items-center space-x-1">
              {/* Camera Selector for Single View */}
              {viewMode === 'single' && (
                <select
                  value={selectedCamera}
                  onChange={(e) => setSelectedCamera(e.target.value)}
                  className="lattice-input text-xs mr-2"
                >
                  {activeCameras.map(camera => (
                    <option key={camera.id} value={camera.id}>
                      {camera.name}
                    </option>
                  ))}
                </select>
              )}
              
              <button
                onClick={() => setViewMode('single')}
                className={`lattice-tab px-2 py-1 text-xs rounded transition-all ${
                  viewMode === 'single'
                    ? 'active'
                    : ''
                }`}
              >
                <Eye className="h-3 w-3" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`lattice-tab px-2 py-1 text-xs rounded transition-all ${
                  viewMode === 'grid'
                    ? 'active'
                    : ''
                }`}
              >
                <Grid3X3 className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Video Content */}
      <div className="flex-1 relative overflow-hidden">
        {/* Feeds Layer */}
        {videoLayer === 'feeds' && (
          <div className="absolute inset-0 p-4">
            {activeCameras.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center lattice-text-muted">
                  <Video className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No cameras configured</p>
                  <p className="text-xs mt-1">Add cameras in settings</p>
                </div>
              </div>
            ) : viewMode === 'single' ? (
              <div className="h-full relative">
                {/* Single Camera View - Fullscreen */}
                <div className="absolute inset-0">
                  {(() => {
                    const camera = activeCameras.find(cam => cam.id === selectedCamera);
                    return camera ? renderVideoFeed(camera, 'h-full', true) : null;
                  })()}
                </div>
              </div>
            ) : (
              /* Grid View */
              <div className="h-full grid grid-cols-2 gap-3">
                {activeCameras.slice(0, 4).map(camera => 
                  renderVideoFeed(camera, 'h-full')
                )}
                {activeCameras.length < 4 && Array.from({ length: 4 - activeCameras.length }).map((_, i) => (
                  <div key={`empty-${i}`} className="lattice-panel flex items-center justify-center">
                    <div className="text-center lattice-text-muted">
                      <Video className="h-6 w-6 mx-auto mb-1 opacity-30" />
                      <div className="text-xs">Empty Slot</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Settings Layer */}
        {videoLayer === 'settings' && (
          <div className="absolute inset-0 p-4 overflow-y-auto lattice-scrollbar">
            {/* Add Camera Button */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => {
                  setShowAddCamera(!showAddCamera);
                  setEditingCamera(null);
                }}
                className="lattice-button-primary text-xs px-3 py-2 flex items-center space-x-1"
              >
                <Plus className="h-3 w-3" />
                <span>Add Camera</span>
              </button>
              
              <div className="text-xs lattice-text-secondary">
                {cameras.length} cameras • {connectedCameras.length} online
              </div>
            </div>

            {/* Add/Edit Camera Form */}
            {(showAddCamera || editingCamera) && (
              <div className="lattice-panel p-4 mb-4">
                <div className="text-sm lattice-status-primary mb-3 font-semibold">
                  {editingCamera ? 'Edit Camera' : 'Add New Camera'}
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs lattice-text-secondary block mb-1">Camera Name</label>
                    <input
                      type="text"
                      value={newCamera.name}
                      onChange={(e) => setNewCamera(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full lattice-input text-xs"
                      placeholder="Camera Name"
                    />
                  </div>
                  <div>
                    <label className="text-xs lattice-text-secondary block mb-1">Stream Type</label>
                    <select
                      value={newCamera.type}
                      onChange={(e) => setNewCamera(prev => ({ ...prev, type: e.target.value as NetworkCamera['type'] }))}
                      className="w-full lattice-input text-xs"
                    >
                      <option value="webcam">Local Webcam</option>
                      <option value="http">HTTP Stream</option>
                      <option value="hls">HLS Stream (.m3u8)</option>
                      <option value="mjpeg">MJPEG Stream</option>
                      <option value="rtsp">RTSP Stream</option>
                      <option value="webrtc">WebRTC Stream</option>
                      <option value="onvif">ONVIF Camera</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs lattice-text-secondary block mb-1">Stream URL</label>
                    <input
                      type="text"
                      value={newCamera.url}
                      onChange={(e) => setNewCamera(prev => ({ ...prev, url: e.target.value }))}
                      className={`w-full lattice-input text-xs ${newCamera.type === 'webcam' ? 'opacity-50' : ''}`}
                      placeholder={getUrlPlaceholder(newCamera.type)}
                      disabled={newCamera.type === 'webcam'}
                      readOnly={newCamera.type === 'webcam'}
                    />
                  </div>
                  
                  {/* Authentication Section */}
                  {(newCamera.type === 'rtsp' || newCamera.type === 'http' || newCamera.type === 'onvif') && newCamera.type !== 'webcam' && (
                    <>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs lattice-text-secondary block mb-1">Username</label>
                          <input
                            type="text"
                            value={newCamera.username}
                            onChange={(e) => setNewCamera(prev => ({ ...prev, username: e.target.value }))}
                            className="w-full lattice-input text-xs"
                            placeholder="admin"
                          />
                        </div>
                        <div>
                          <label className="text-xs lattice-text-secondary block mb-1">Password</label>
                          <input
                            type="password"
                            value={newCamera.password}
                            onChange={(e) => setNewCamera(prev => ({ ...prev, password: e.target.value }))}
                            className="w-full lattice-input text-xs"
                            placeholder="password"
                          />
                        </div>
                      </div>
                    </>
                  )}
                  
                  {/* Video Settings */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs lattice-text-secondary block mb-1">Resolution</label>
                      <select
                        value={newCamera.resolution}
                        onChange={(e) => setNewCamera(prev => ({ ...prev, resolution: e.target.value }))}
                        className="w-full lattice-input text-xs"
                      >
                        <option value="640x480">640x480 (VGA)</option>
                        <option value="1280x720">1280x720 (HD)</option>
                        <option value="1920x1080">1920x1080 (FHD)</option>
                        <option value="2560x1440">2560x1440 (QHD)</option>
                        <option value="3840x2160">3840x2160 (4K)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs lattice-text-secondary block mb-1">Frame Rate</label>
                      <select
                        value={newCamera.framerate}
                        onChange={(e) => setNewCamera(prev => ({ ...prev, framerate: parseInt(e.target.value) }))}
                        className="w-full lattice-input text-xs"
                      >
                        <option value={15}>15 fps</option>
                        <option value={25}>25 fps</option>
                        <option value={30}>30 fps</option>
                        <option value={60}>60 fps</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={editingCamera ? handleUpdateCamera : handleAddCamera}
                    className="lattice-button-primary text-xs px-3 py-1"
                  >
                    {editingCamera ? 'Update' : 'Add'}
                  </button>
                  <button
                    onClick={editingCamera ? handleCancelEdit : () => setShowAddCamera(false)}
                    className="lattice-button text-xs px-3 py-1"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Camera Blocks Grid */}
            <div className="overflow-y-auto lattice-scrollbar">
              {cameras.length === 0 ? (
                <div className="text-center lattice-text-muted py-8">
                  <Video className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No cameras configured</p>
                  <p className="text-xs mt-1">Add cameras to get started</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {cameras.map((camera, index) => (
                    <div 
                      key={camera.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, camera.id)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, camera.id)}
                      onDragEnd={handleDragEnd}
                      className={`lattice-panel p-3 relative cursor-move transition-all ${
                      editingCamera?.id === camera.id ? 'border-cyan-400 lattice-glow' : ''
                      } ${draggedCamera === camera.id ? 'opacity-50' : ''}`}
                    >
                      {/* Drag Handle */}
                      <div className="absolute top-2 right-2">
                        <GripVertical className="h-3 w-3 lattice-text-muted" />
                      </div>
                      
                      {/* Camera Info */}
                      <div className="pr-6">
                        {/* Name and Enable Toggle */}
                        <div className="flex items-center space-x-2 mb-2">
                          <button
                            onClick={() => toggleCamera(camera.id)}
                            className={`w-3 h-3 rounded border flex items-center justify-center flex-shrink-0 ${
                              camera.enabled 
                                ? 'bg-cyan-400 border-cyan-400' 
                                : 'border-gray-400'
                            }`}
                          >
                            {camera.enabled && <div className="w-1.5 h-1.5 bg-white rounded-sm" />}
                          </button>
                          <span className="font-semibold lattice-text-primary text-sm truncate">
                            {camera.name}
                          </span>
                        </div>
                        
                        {/* Status */}
                        <div className="flex items-center space-x-2 mb-2">
                          <div className={`w-2 h-2 rounded-full ${
                            camera.status === 'connected' ? 'bg-green-400' :
                            camera.status === 'connecting' ? 'bg-amber-400' :
                            camera.status === 'error' ? 'bg-red-400' :
                            'bg-slate-400'
                          }`} />
                          <span className={`text-xs font-semibold ${
                            camera.status === 'connected' ? 'lattice-status-good' :
                            camera.status === 'connecting' ? 'lattice-status-warning' :
                            camera.status === 'error' ? 'lattice-status-error' :
                            'lattice-text-secondary'
                          }`}>
                            {camera.status.toUpperCase()}
                          </span>
                        </div>
                        
                        {/* Stream Type */}
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-sm">{getStreamTypeIcon(camera.type)}</span>
                          <span className="text-xs lattice-text-secondary">{getStreamTypeLabel(camera.type)}</span>
                        </div>
                        
                        {/* Resolution & Frame Rate */}
                        {camera.resolution && (
                          <div className="text-xs lattice-text-primary font-semibold mb-2">
                            {camera.resolution}
                            {camera.framerate && <span className="lattice-text-secondary ml-1">@{camera.framerate}fps</span>}
                          </div>
                        )}
                        
                        {/* Action Buttons */}
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEditCamera(camera)}
                            className="lattice-button text-xs px-2 py-1 flex items-center space-x-1"
                          >
                            <Edit className="h-3 w-3" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => handleRemoveCamera(camera.id)}
                            className="lattice-text-secondary hover:lattice-status-error transition-colors"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}