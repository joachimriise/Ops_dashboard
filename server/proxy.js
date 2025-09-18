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
    exec('rtl_test -t', { timeout: 5000 }, (error, stdout, stderr) => {
      if (error) {
        if (stderr.includes('usb_claim_interface error -6') || 
            stderr.includes('Device or resource busy')) {
          resolve({ status: 'BUSY', detail: 'Device in use by dump1090' });
        } else if (stderr.includes('No supported devices found') ||
                   stderr.includes('usb_open error')) {
          resolve({ status: 'OFFLINE', detail: 'No RTL-SDR device found' });
        } else {
          resolve({ status: 'ERROR', detail: stderr || error.message });
        }
      } else if (stdout.includes('Found 1 device') || stdout.includes('Found') && stdout.includes('device')) {
        resolve({ status: 'AVAILABLE', detail: 'RTL-SDR device detected' });
      } else {
        resolve({ status: 'UNKNOWN', detail: stdout || stderr || 'Unknown response' });
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
    const rtlsdrCheck = await checkRTLSDR();

    // Check if data is recent (updated within last 30 seconds)
    const isDataRecent = fileChecks.aircraftJsonExists && 
                        fileChecks.aircraftJsonStats &&
                        (Date.now() - fileChecks.aircraftJsonStats.mtimeMs < 30000);

    // Determine overall system status
    let overallStatus = 'OFFLINE';
    let reason = '';

    if (!fileChecks.aircraftJsonExists) {
      reason = 'No aircraft.json file found';
    } else if (!fileChecks.aircraftJsonReadable) {
      reason = 'Cannot read aircraft.json file';
    } else if (!isDataRecent) {
      const fileAgeSec = Math.round((Date.now() - fileChecks.aircraftJsonStats.mtimeMs) / 1000);
      reason = `Data is stale (${fileAgeSec}s old)`;
    } else if (rtlsdrCheck.status === 'OFFLINE') {
      reason = 'RTL-SDR device not found';
    } else if (rtlsdrCheck.status === 'ERROR') {
      reason = `RTL-SDR error: ${rtlsdrCheck.detail}`;
    } else if (rtlsdrCheck.status === 'BUSY' || rtlsdrCheck.status === 'AVAILABLE') {
      // Both BUSY (in use by dump1090) and AVAILABLE are good states
      overallStatus = 'ONLINE';
    } else {
      reason = `RTL-SDR status unknown: ${rtlsdrCheck.status}`;
    }

    const aircraftCount = fileChecks.aircraftData ? fileChecks.aircraftData.aircraft.length : 0;
    const messageCount = fileChecks.aircraftData ? fileChecks.aircraftData.messages || 0 : 0;
    const fileAgeSec = fileChecks.aircraftJsonStats ? 
      Math.round((Date.now() - fileChecks.aircraftJsonStats.mtimeMs) / 1000) : null;

    res.json({
      status: overallStatus,
      reason: reason || undefined,
      messages: messageCount,
      aircraftCount: aircraftCount,
      fileAgeSec,
      lastModified: fileChecks.aircraftJsonStats ? fileChecks.aircraftJsonStats.mtime.toISOString() : null,
      rtlsdr: {
        status: rtlsdrCheck.status,
        detail: rtlsdrCheck.detail
      },
      timestamp: Date.now()
    });
  } catch (err) {
    log('error', 'Health check failed', { error: err.message });
    res.json({ 
      status: 'OFFLINE', 
      reason: `Health check error: ${err.message}`,
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