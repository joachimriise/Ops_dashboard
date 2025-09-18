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

// Enhanced RTL-SDR hardware detection
const checkRTLSDR = () => {
  return new Promise((resolve) => {
    // First check USB bus for RTL-SDR devices
    exec('lsusb | grep -E "(RTL|Realtek|0bda:2838|0bda:2832)"', { timeout: 2000 }, (lsusbError, lsusbStdout) => {
      if (lsusbError || !lsusbStdout.trim()) {
        // No RTL-SDR device found on USB bus
        resolve({ status: 'OFFLINE', detail: 'RTL-SDR dongle not detected on USB bus' });
        return;
      }
      
      // Device found on USB, now test if it responds
      exec('rtl_eeprom -d 0', { timeout: 3000 }, (eepromError, eepromStdout, eepromStderr) => {
        if (eepromStderr.includes('usb_claim_interface error -6')) {
          resolve({ status: 'BUSY', detail: 'RTL-SDR detected and in use by dump1090' });
        } else if (eepromError && eepromStderr.includes('No supported devices found')) {
          resolve({ status: 'OFFLINE', detail: 'RTL-SDR device not responding' });
        } else if (eepromStdout.includes('Found') || eepromStdout.includes('EEPROM')) {
          resolve({ status: 'ONLINE', detail: 'RTL-SDR detected and available' });
        } else {
          // Fallback to rtl_test with short timeout
          exec('rtl_test -t -d 0', { timeout: 2000 }, (testError, testStdout, testStderr) => {
            if (testStderr.includes('usb_claim_interface error -6')) {
              resolve({ status: 'BUSY', detail: 'RTL-SDR detected and in use by dump1090' });
            } else if (testStdout.includes('Found 1 device')) {
              resolve({ status: 'ONLINE', detail: 'RTL-SDR detected and available' });
            } else {
              resolve({ status: 'OFFLINE', detail: 'RTL-SDR device not responding properly' });
            }
          });
        }
      });
    });
  });
};

// Check if dump1090 is running and producing data
const checkDump1090Status = () => {
  return new Promise((resolve) => {
    exec('pgrep dump1090', { timeout: 1000 }, (error, stdout) => {
      if (error || !stdout.trim()) {
        resolve({ running: false, detail: 'dump1090 process not running' });
      } else {
        resolve({ running: true, detail: 'dump1090 process active', pid: stdout.trim() });
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
    const dump1090 = await checkDump1090Status();

    const isRecent = fileChecks.aircraftJsonExists &&
                     fileChecks.aircraftJsonStats &&
                     (Date.now() - fileChecks.aircraftJsonStats.mtimeMs < 30000);

    // Determine overall status based on hardware and data freshness
    let overallStatus = 'OFFLINE';
    let statusDetail = '';
    
    if (rtlsdr.status === 'OFFLINE') {
      overallStatus = 'OFFLINE';
      statusDetail = rtlsdr.detail;
    } else if (!isRecent) {
      overallStatus = 'BUSY';
      statusDetail = 'RTL-SDR detected but no recent data - check antenna/dump1090';
    } else if (rtlsdr.status === 'BUSY' || rtlsdr.status === 'ONLINE') {
      overallStatus = 'ONLINE';
      const aircraftCount = fileChecks.aircraftData ? fileChecks.aircraftData.aircraft.length : 0;
      statusDetail = `ADS-B receiver active, ${aircraftCount} aircraft tracked`;
    } else {
      overallStatus = 'OFFLINE';
      statusDetail = 'Unknown hardware state';
    }

    res.json({
      status: overallStatus,
      detail: statusDetail,
      rtl: rtlsdr,
      dump1090: dump1090,
      file: {
        exists: fileChecks.aircraftJsonExists,
        recent: isRecent,
        aircraftCount: fileChecks.aircraftData ? fileChecks.aircraftData.aircraft.length : 0,
        messageCount: fileChecks.aircraftData ? fileChecks.aircraftData.messages : 0
      },
      timestamp: Date.now()
    });
  } catch (err) {
    log('error', 'Health check failed', { error: err.message });
    res.json({
      status: 'OFFLINE',
      detail: `Health check error: ${err.message}`,
      rtl: { status: 'ERROR', detail: `Health check error: ${err.message}` },
      dump1090: { running: false, detail: 'Health check failed' },
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