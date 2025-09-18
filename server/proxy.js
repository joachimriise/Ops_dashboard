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

// Path to the dump1090 aircraft data
const AIRCRAFT_JSON_PATH = '/run/dump1090/aircraft.json';

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
    // First check if dongle is present on USB bus
    exec("lsusb | grep -i 'Realtek' || true", (err, stdout) => {
      if (!stdout || stdout.trim() === '') {
        return resolve({ status: 'OFFLINE', detail: 'No RTL-SDR dongle detected on USB bus' });
      }

      // If found, run a quick test
      exec('rtl_test -t -d 0', { timeout: 2000 }, (error, stdout, stderr) => {
        if (stdout.includes('No supported devices')) {
          return resolve({ status: 'OFFLINE', detail: 'Device not supported or disconnected' });
        } else if (stderr.includes('usb_claim_interface error -6')) {
          return resolve({ status: 'BUSY', detail: 'Device present but in use by dump1090' });
        } else if (stdout.includes('Found 1 device')) {
          return resolve({ status: 'ONLINE', detail: 'Device detected and available' });
        } else {
          return resolve({ status: 'UNKNOWN', detail: stderr || stdout });
        }
      });
    });
  });
};

// Check dump1090 service status
const checkDump1090Service = () => {
  return new Promise((resolve) => {
    exec('systemctl is-active dump1090.service', (error, stdout, stderr) => {
      const status = stdout.trim();
      if (status === 'active') {
        resolve({ active: true, detail: 'dump1090.service is active' });
      } else {
        resolve({ active: false, detail: `dump1090.service is ${status}` });
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
    const dump1090Service = await checkDump1090Service();

    // Check if aircraft.json is fresh (< 30 seconds old)
    const isRecent = fileChecks.aircraftJsonExists &&
                     fileChecks.aircraftJsonStats &&
                     (Date.now() - fileChecks.aircraftJsonStats.mtimeMs < 30000);

    // Determine overall status based on RTL-SDR, dump1090 service, and data freshness
    let overallStatus = 'OFFLINE';
    
    if (rtlsdr.status === 'OFFLINE' || !dump1090Service.active) {
      // No hardware or service not running
      overallStatus = 'OFFLINE';
    } else if (rtlsdr.status === 'BUSY' && dump1090Service.active && !isRecent) {
      // Hardware detected, service running, but no fresh data
      overallStatus = 'BUSY';
    } else if ((rtlsdr.status === 'BUSY' || rtlsdr.status === 'ONLINE') && dump1090Service.active && isRecent) {
      // Hardware working, service active, and receiving fresh data
      overallStatus = 'ONLINE';
    }

    res.json({
      status: overallStatus,
      rtl: rtlsdr,
      service: dump1090Service,
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
      service: { active: false, detail: 'Service check failed' },
      file: { exists: false, recent: false },
      timestamp: Date.now()
    });
  }
});

// Diagnostics endpoint
app.get('/diagnostics', async (req, res) => {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    system: {
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      uptime: process.uptime()
    },
    dump1090Service: await checkDump1090Service(),
    rtlsdr: await checkRTLSDR(),
    filesystem: null,
    network: {
      port: PORT,
      pid: process.pid
    }
  };

  try {
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