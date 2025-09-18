import express from 'express';
import fs from 'fs';
import path from 'path';
import cors from 'cors';

const app = express();
const PORT = 3001;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Path to the dump1090-mutability aircraft data
const AIRCRAFT_JSON_PATH = '/run/dump1090-mutability/aircraft.json';

// Enhanced logging function
const log = (level, message, data = null) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  console.log(logMessage);
  if (data) console.log(JSON.stringify(data, null, 2));
};

// Aircraft data endpoint
app.get('/aircraft.json', (req, res) => {
  try {
    if (!fs.existsSync(AIRCRAFT_JSON_PATH)) {
      return res.status(500).json({
        aircraft: [],
        now: Date.now() / 1000,
        messages: 0,
        aircraft_count: 0,
        error: 'Aircraft data file not found'
      });
    }

    const data = fs.readFileSync(AIRCRAFT_JSON_PATH, 'utf8');
    const aircraftData = JSON.parse(data);
    aircraftData.timestamp = Date.now();

    res.json(aircraftData);
  } catch (error) {
    log('error', 'Error reading aircraft.json', { error: error.message });
    res.status(500).json({
      aircraft: [],
      now: Date.now() / 1000,
      messages: 0,
      aircraft_count: 0,
      error: error.message
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  try {
    if (!fs.existsSync(AIRCRAFT_JSON_PATH)) {
      return res.json({ status: 'OFFLINE', reason: 'No aircraft.json' });
    }

    const data = fs.readFileSync(AIRCRAFT_JSON_PATH, 'utf8');
    const aircraftData = JSON.parse(data);

    const fileStats = fs.statSync(AIRCRAFT_JSON_PATH);
    const fileAgeSec = Math.round((Date.now() - fileStats.mtime.getTime()) / 1000);

    res.json({
      status: 'ONLINE',
      messages: aircraftData.messages || 0,
      aircraftCount: aircraftData.aircraft ? aircraftData.aircraft.length : 0,
      fileAgeSec,
      lastModified: fileStats.mtime.toISOString(),
      timestamp: Date.now()
    });
  } catch (err) {
    log('error', 'Health check failed', { error: err.message });
    res.json({ status: 'OFFLINE', reason: err.message });
  }
});

// Diagnostics endpoint
app.get('/diagnostics', (req, res) => {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    system: {
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      uptime: process.uptime()
    },
    rtlsdr: "busy (in use by dump1090)",
    dump1090: null,
    filesystem: null,
    network: {
      port: PORT,
      pid: process.pid
    }
  };

  try {
    // Check dump1090 by looking for aircraft.json
    diagnostics.dump1090 = fs.existsSync(AIRCRAFT_JSON_PATH)
      ? "running"
      : "not found";

    // File system checks
    diagnostics.filesystem = {
      aircraftJsonExists: fs.existsSync(AIRCRAFT_JSON_PATH),
      runDirExists: fs.existsSync(path.dirname(AIRCRAFT_JSON_PATH))
    };

    res.json(diagnostics);
  } catch (error) {
    diagnostics.error = error.message;
    res.json(diagnostics);
  }
});

// Root info endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'ADS-B Proxy Server',
    version: '1.1.0',
    endpoints: {
      aircraft: '/aircraft.json',
      health: '/health',
      diagnostics: '/diagnostics'
    },
    timestamp: Date.now()
  });
});

// Start the server
app.listen(PORT, () => {
  log('info', `ADS-B Proxy Server running on port ${PORT}`);
});
