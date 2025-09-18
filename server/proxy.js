import express from 'express';
import fs from 'fs';
import path from 'path';
import cors from 'cors';

const app = express();
const PORT = 8080;

// Enable CORS for all routes
app.use(cors());

// Middleware to parse JSON
app.use(express.json());

// Path to the dump1090-mutability aircraft data
const AIRCRAFT_JSON_PATH = '/run/dump1090-mutability/aircraft.json';

// Aircraft data endpoint
app.get('/aircraft.json', (req, res) => {
  try {
    // Check if the file exists
    if (!fs.existsSync(AIRCRAFT_JSON_PATH)) {
      return res.json({
        aircraft: [],
        now: Date.now() / 1000,
        messages: 0,
        aircraft_count: 0
      });
    }

    // Read the aircraft data
    const data = fs.readFileSync(AIRCRAFT_JSON_PATH, 'utf8');
    const aircraftData = JSON.parse(data);

    // Add timestamp for freshness tracking
    aircraftData.timestamp = Date.now();

    res.json(aircraftData);
  } catch (error) {
    console.error('Error reading aircraft data:', error);
    res.json({
      aircraft: [],
      now: Date.now() / 1000,
      messages: 0,
      aircraft_count: 0
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  try {
    // Check if dump1090-mutability data file exists and is readable
    if (!fs.existsSync(AIRCRAFT_JSON_PATH)) {
      return res.json({
        status: 'OFFLINE',
        reason: 'Aircraft data file not found',
        path: AIRCRAFT_JSON_PATH,
        timestamp: Date.now()
      });
    }

    // Try to read and parse the file
    const data = fs.readFileSync(AIRCRAFT_JSON_PATH, 'utf8');
    const aircraftData = JSON.parse(data);

    // Check if the data is recent (within last 30 seconds)
    const fileStats = fs.statSync(AIRCRAFT_JSON_PATH);
    const fileAge = Date.now() - fileStats.mtime.getTime();
    const isRecent = fileAge < 30000; // 30 seconds

    // Additional checks
    const hasAircraftArray = aircraftData && Array.isArray(aircraftData.aircraft);
    
    if (!isRecent) {
      return res.json({
        status: 'OFFLINE',
        reason: 'Data file is stale',
        fileAge: Math.round(fileAge / 1000),
        timestamp: Date.now()
      });
    }

    if (!hasAircraftArray) {
      return res.json({
        status: 'OFFLINE',
        reason: 'Invalid data format',
        timestamp: Date.now()
      });
    }

    // All checks passed
    res.json({
      status: 'ONLINE',
      aircraftCount: aircraftData.aircraft.length,
      dataAge: Math.round(fileAge / 1000),
      timestamp: Date.now()
    });

  } catch (error) {
    console.error('Health check error:', error);
    res.json({
      status: 'OFFLINE',
      reason: 'Error reading data file',
      error: error.message,
      timestamp: Date.now()
    });
  }
});

// Basic info endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'ADS-B Proxy Server',
    version: '1.0.0',
    endpoints: {
      aircraft: '/aircraft.json',
      health: '/health'
    },
    timestamp: Date.now()
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`ADS-B Proxy Server running on port ${PORT}`);
  console.log(`Aircraft data: http://localhost:${PORT}/aircraft.json`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down ADS-B Proxy Server...');
  process.exit(0);
});
