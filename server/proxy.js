import express from 'express';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const app = express();
const PORT = 8080;

// Enable CORS for all routes
app.use(cors());

// Middleware to parse JSON
app.use(express.json());

// Path to the dump1090-mutability aircraft data
const AIRCRAFT_JSON_PATH = '/run/dump1090-mutability/aircraft.json';

// Enhanced logging function
const log = (level, message, data = null) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  console.log(logMessage);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
};

// Check RTL-SDR hardware
const checkRTLSDR = async () => {
  try {
    log('info', 'Checking RTL-SDR hardware...');
    const { stdout, stderr } = await execAsync('rtl_test -t');
    log('info', 'RTL-SDR test output:', { stdout: stdout.substring(0, 500), stderr });
    return { success: true, output: stdout };
  } catch (error) {
    log('error', 'RTL-SDR hardware check failed', { error: error.message });
    return { success: false, error: error.message };
  }
};

// Check dump1090 service status
const checkDump1090Service = async () => {
  try {
    log('info', 'Checking dump1090 service status...');
    const { stdout, stderr } = await execAsync('systemctl status dump1090-mutability');
    log('info', 'dump1090 service status:', { stdout, stderr });
    return { success: true, output: stdout };
  } catch (error) {
    log('warn', 'dump1090 service check failed (may not be systemd)', { error: error.message });
    
    // Try alternative check
    try {
      const { stdout: psOutput } = await execAsync('ps aux | grep dump1090');
      log('info', 'dump1090 process check:', { output: psOutput });
      return { success: true, output: psOutput };
    } catch (psError) {
      log('error', 'No dump1090 processes found', { error: psError.message });
      return { success: false, error: psError.message };
    }
  }
};

// Check file system permissions and paths
const checkFileSystem = () => {
  log('info', 'Checking file system...');
  
  const checks = {
    aircraftJsonExists: false,
    aircraftJsonReadable: false,
    aircraftJsonStats: null,
    runDirExists: false,
    runDirReadable: false,
    alternativePaths: []
  };
  
  // Check main aircraft.json path
  try {
    checks.aircraftJsonExists = fs.existsSync(AIRCRAFT_JSON_PATH);
    if (checks.aircraftJsonExists) {
      checks.aircraftJsonStats = fs.statSync(AIRCRAFT_JSON_PATH);
      try {
        fs.accessSync(AIRCRAFT_JSON_PATH, fs.constants.R_OK);
        checks.aircraftJsonReadable = true;
      } catch (accessError) {
        log('warn', 'Aircraft JSON file exists but not readable', { path: AIRCRAFT_JSON_PATH });
      }
    }
  } catch (error) {
    log('warn', 'Error checking aircraft JSON file', { error: error.message });
  }
  
  // Check run directory
  const runDir = path.dirname(AIRCRAFT_JSON_PATH);
  try {
    checks.runDirExists = fs.existsSync(runDir);
    if (checks.runDirExists) {
      try {
        fs.accessSync(runDir, fs.constants.R_OK);
        checks.runDirReadable = true;
      } catch (accessError) {
        log('warn', 'Run directory exists but not readable', { path: runDir });
      }
    }
  } catch (error) {
    log('warn', 'Error checking run directory', { error: error.message });
  }
  
  // Check alternative paths
  const alternativePaths = [
    '/var/run/dump1090-mutability/aircraft.json',
    '/tmp/dump1090-mutability/aircraft.json',
    '/usr/share/dump1090-mutability/html/data/aircraft.json',
    '/var/www/html/dump1090/data/aircraft.json'
  ];
  
  alternativePaths.forEach(altPath => {
    if (fs.existsSync(altPath)) {
      checks.alternativePaths.push(altPath);
      log('info', 'Found alternative aircraft.json path', { path: altPath });
    }
  });
  
  log('info', 'File system check results', checks);
  return checks;
};

// Aircraft data endpoint
app.get('/aircraft.json', (req, res) => {
  log('info', 'Aircraft data requested');
  
  try {
    // Check if the file exists
    if (!fs.existsSync(AIRCRAFT_JSON_PATH)) {
      log('warn', 'Aircraft JSON file not found', { path: AIRCRAFT_JSON_PATH });
      return res.status(500).json({
        aircraft: [],
        now: Date.now() / 1000,
        messages: 0,
        aircraft_count: 0,
        error: 'Aircraft data file not found'
      });
    }

    // Read the aircraft data
    log('info', 'Reading aircraft data file', { path: AIRCRAFT_JSON_PATH });
    const data = fs.readFileSync(AIRCRAFT_JSON_PATH, 'utf8');
    log('info', 'Aircraft data file read successfully', { 
      size: data.length,
      preview: data.substring(0, 100) + '...'
    });
    
    const aircraftData = JSON.parse(data);
    log('info', 'Aircraft data parsed successfully', { 
      aircraftCount: aircraftData.aircraft ? aircraftData.aircraft.length : 0 
    });

    // Add timestamp for freshness tracking
    aircraftData.timestamp = Date.now();

    res.json(aircraftData);
  } catch (error) {
    log('error', 'Error reading aircraft data', { 
      error: error.message,
      stack: error.stack,
      path: AIRCRAFT_JSON_PATH
    });
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
  log('info', 'Health check requested');
  
  try {
    // Check if dump1090-mutability data file exists and is readable
    if (!fs.existsSync(AIRCRAFT_JSON_PATH)) {
      log('warn', 'Health check: Aircraft data file not found');
      return res.status(500).json({
        status: 'OFFLINE',
        reason: 'Aircraft data file not found',
        path: AIRCRAFT_JSON_PATH,
        timestamp: Date.now(),
        checks: checkFileSystem()
      });
    }

    // Try to read and parse the file
    log('info', 'Health check: Reading aircraft data file');
    const data = fs.readFileSync(AIRCRAFT_JSON_PATH, 'utf8');
    const aircraftData = JSON.parse(data);

    // Check if the data is recent (within last 30 seconds)
    const fileStats = fs.statSync(AIRCRAFT_JSON_PATH);
    const fileAge = Date.now() - fileStats.mtime.getTime();
    const isRecent = fileAge < 30000; // 30 seconds
    
    log('info', 'Health check: File age analysis', {
      fileAge: Math.round(fileAge / 1000),
      isRecent,
      lastModified: fileStats.mtime.toISOString()
    });

    // Additional checks
    const hasAircraftArray = aircraftData && Array.isArray(aircraftData.aircraft);
    log('info', 'Health check: Data structure analysis', {
      hasAircraftArray,
      aircraftCount: hasAircraftArray ? aircraftData.aircraft.length : 0
    });
    
    if (!isRecent) {
      log('warn', 'Health check: Data file is stale');
      return res.status(500).json({
        status: 'OFFLINE',
        reason: 'Data file is stale',
        fileAge: Math.round(fileAge / 1000),
        timestamp: Date.now(),
        lastModified: fileStats.mtime.toISOString()
      });
    }

    if (!hasAircraftArray) {
      log('warn', 'Health check: Invalid data format');
      return res.status(500).json({
        status: 'OFFLINE',
        reason: 'Invalid data format',
        timestamp: Date.now(),
        dataPreview: JSON.stringify(aircraftData).substring(0, 200)
      });
    }

    // All checks passed
    log('info', 'Health check: All checks passed', {
      aircraftCount: aircraftData.aircraft.length,
      dataAge: Math.round(fileAge / 1000)
    });
    
    res.json({
      status: 'ONLINE',
      aircraftCount: aircraftData.aircraft.length,
      dataAge: Math.round(fileAge / 1000),
      timestamp: Date.now(),
      lastModified: fileStats.mtime.toISOString()
    });

  } catch (error) {
    log('error', 'Health check error', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      status: 'OFFLINE',
      reason: 'Error reading data file',
      error: error.message,
      timestamp: Date.now(),
      checks: checkFileSystem()
    });
  }
});

// Diagnostic endpoint for RTL-SDR troubleshooting
app.get('/diagnostics', async (req, res) => {
  log('info', 'Diagnostics requested');
  
  const diagnostics = {
    timestamp: new Date().toISOString(),
    system: {
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      uptime: process.uptime()
    },
    rtlsdr: null,
    dump1090: null,
    filesystem: null,
    network: {
      port: PORT,
      pid: process.pid
    }
  };
  
  // Run all diagnostic checks
  try {
    log('info', 'Running RTL-SDR diagnostics...');
    diagnostics.rtlsdr = await checkRTLSDR();
    diagnostics.dump1090 = await checkDump1090Service();
    diagnostics.filesystem = checkFileSystem();
    
    log('info', 'Diagnostics completed', diagnostics);
    res.json(diagnostics);
  } catch (error) {
    log('error', 'Diagnostics failed', { error: error.message });
    diagnostics.error = error.message;
    res.json(diagnostics);
  }
});

// Basic info endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'ADS-B Proxy Server',
    version: '1.0.0',
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
  log('info', `ADS-B Proxy Server starting on port ${PORT}`);
  log('info', `Aircraft data: http://localhost:${PORT}/aircraft.json`);
  log('info', `Health check: http://localhost:${PORT}/health`);
  log('info', `Diagnostics: http://localhost:${PORT}/diagnostics`);
  
  // Run initial diagnostics
  setTimeout(async () => {
    log('info', 'Running startup diagnostics...');
    try {
      const rtlsdrCheck = await checkRTLSDR();
      const dump1090Check = await checkDump1090Service();
      const fsCheck = checkFileSystem();
      
      log('info', 'Startup diagnostics completed', {
        rtlsdr: rtlsdrCheck.success,
        dump1090: dump1090Check.success,
        aircraftFile: fsCheck.aircraftJsonExists
      });
    } catch (error) {
      log('error', 'Startup diagnostics failed', { error: error.message });
    }
  }, 1000);
});

// Graceful shutdown
process.on('SIGINT', () => {
  log('info', 'Shutting down ADS-B Proxy Server...');
  process.exit(0);
});
