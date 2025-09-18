import express from 'express';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import { exec } from 'child_process';

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

// Check RTL-SDR hardware status
const checkRTLSDR = () => {
  return new Promise((resolve) => {
    exec('rtl_test -t', { timeout: 3000 }, (error, stdout, stderr) => {
      if (stdout.includes('No supported devices')) {
        resolve({ status: 'OFFLINE', detail: 'No device detected' });
      } else if (stderr.includes('usb_claim_interface error -6')) {
        resolve({ status: 'BUSY', detail: 'Device present (in use by dump1090)' });
      } else if (stdout.includes('Found 1 device')) {
        resolve({ status: 'ONLINE', detail: 'Device detected and available' });
      } else {
        resolve({ status: 'UNKNOWN', detail: stderr || stdout });
      }
    });
  });
};

// Check file system status
const checkFileSystem = () => {
  try {
    const aircraftJsonExists = fs.existsSync(AIRCRAFT_JSON_PATH);
    let aircraftJsonStats = null;
    let aircraftJsonReadable = false;
    let aircraftData = null;

    if (aircraftJsonExists) {
      aircraftJsonStats = fs.statSync(AIRCRAFT_JSON_PATH);
      try {
        const data = fs.readFileSync(AIRCRAFT_JSON_PATH, 'utf8');
        aircraftData = JSON.parse(data);
        aircraftJsonReadable = true;
      } catch (err) {
        log('error', 'Error reading aircraft.json', { error: err.message });
      }
    }

    return {
      aircraftJsonExists,
      aircraftJsonStats,
      aircraftJsonReadable,
      aircraftData
    };
  } catch (error) {
    return {
      aircraftJsonExists: false,
      aircraftJsonStats: null,
      aircraftJsonReadable: false,
      aircraftData: null,
      error: error.message
    };
  }
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
app.get('/health', async (req, res) => {
  try {
    const fileChecks = checkFileSystem();
    const rtlsdr = await checkRTLSDR();

    const isRecent = fileChecks.aircraftJsonExists &&
                     fileChecks.aircraftJsonStats &&
                     (Date.now() - fileChecks.aircraftJsonStats.mtimeMs < 30000);

    let overallStatus = 'OFFLINE';
    if (rtlsdr.status === 'OFFLINE') {
      overallStatus = 'OFFLINE';
    } else if (isRecent && (rtlsdr.status === 'BUSY' || rtlsdr.status === 'ONLINE')) {
      overallStatus = 'ONLINE';
    }

    res.json({
      status: overallStatus,
      rtl: rtlsdr,
      file: {
        exists: fileChecks.aircraftJsonExists,
        recent: isRecent
      },
      timestamp: Date.now()
    });
  } catch (err) {
    log('error', 'Health check failed', { error: err.message });
    res.json({
      status: 'OFFLINE',
      rtl: { status: 'ERROR', detail: `Health check error: ${err.message}` },
      file: { exists: false, recent: false },
      timestamp: Date.now()
    });
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
    rtlsdr: rtlsdr,
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