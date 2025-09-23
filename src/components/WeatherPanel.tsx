import React from 'react';
import { Cloud, Wind, Eye, Thermometer, Droplets, Gauge, Navigation, MapPin, RefreshCw } from 'lucide-react';

interface WeatherData {
  temperature: number;
  humidity: number;
  pressure: number;
  visibility: number;
  wind_speed: number;
  wind_direction: number;
  wind_gust?: number;
  weather_main: string;
  weather_description: string;
  clouds: number;
  rain?: number;
  snow?: number;
}

interface AviationForecast {
  type: 'TAF' | 'METAR';
  icao_code: string;
  issue_time: string;
  valid_from: string;
  valid_to: string;
  raw_text: string;
  visibility?: {
    value: number;
    unit: string;
  };
  wind?: {
    direction: number;
    speed: number;
    gust?: number;
    unit: string;
  };
  weather_conditions?: string[];
  clouds?: Array<{
    type: string;
    height: number;
    coverage: string;
  }>;
  temperature?: {
    value: number;
    unit: string;
  };
  qnh?: {
    value: number;
    unit: string;
  };
}

interface WeatherPanelProps {
  onHeaderClick: () => void;
  isSelecting: boolean;
  weatherLocation: { lat: number; lon: number; name: string };
  onLocationChange: (location: { lat: number; lon: number; name: string }) => void;
}

// Airport data for aviation forecasts
const airports = [
  // Major Norwegian airports with METAR
  { icao: 'ENGM', lat: 60.1939, lon: 11.1004, name: 'Oslo Gardermoen Airport' },
  { icao: 'ENBR', lat: 60.2934, lon: 5.2181, name: 'Bergen Flesland Airport' },
  { icao: 'ENZV', lat: 58.8764, lon: 5.6378, name: 'Stavanger Sola Airport' },
  { icao: 'ENTC', lat: 69.6833, lon: 18.9189, name: 'Tromsø Langnes Airport' },
  { icao: 'ENBO', lat: 67.2692, lon: 14.3658, name: 'Bodø Airport' },
  { icao: 'ENVA', lat: 63.4578, lon: 10.9239, name: 'Trondheim Værnes Airport' },
  { icao: 'ENKR', lat: 62.5619, lon: 6.1197, name: 'Kristiansund Kvernberget Airport' },
  { icao: 'ENML', lat: 62.7447, lon: 7.3625, name: 'Molde Årø Airport' },
  { icao: 'ENAL', lat: 62.5603, lon: 9.2139, name: 'Alesund Vigra Airport' },
  { icao: 'ENFL', lat: 61.5833, lon: 5.0247, name: 'Florø Airport' },
  { icao: 'ENSG', lat: 61.1561, lon: 7.1356, name: 'Sogndal Airport' },
  { icao: 'ENHA', lat: 70.4867, lon: 23.3714, name: 'Hammerfest Airport' },
  { icao: 'ENHF', lat: 70.6797, lon: 29.6914, name: 'Hasvik Airport' },
  { icao: 'ENHV', lat: 70.9972, lon: 25.9836, name: 'Honningsvåg Valan Airport' },
  { icao: 'ENKB', lat: 78.2467, lon: 15.4656, name: 'Ny-Ålesund Airport' },
  { icao: 'ENSB', lat: 78.8967, lon: 11.8881, name: 'Longyearbyen Airport' },
  { icao: 'ENEV', lat: 68.4914, lon: 16.6781, name: 'Harstad/Narvik Evenes Airport' },
  { icao: 'ENDU', lat: 69.0556, lon: 20.9669, name: 'Bardufoss Airport' },
  { icao: 'ENRA', lat: 69.9756, lon: 23.3544, name: 'Alta Airport' },
  { icao: 'ENVD', lat: 70.0656, lon: 29.8447, name: 'Vadsø Airport' },
  { icao: 'ENKK', lat: 70.9672, lon: 25.9836, name: 'Kirkenes Airport' },
  { icao: 'ENMS', lat: 69.7928, lon: 23.0214, name: 'Mehamn Airport' },
  { icao: 'ENBN', lat: 71.0306, lon: 25.1306, name: 'Berlevåg Airport' },
  { icao: 'ENBV', lat: 70.8714, lon: 29.0344, name: 'Båtsfjord Airport' },
  { icao: 'ENSS', lat: 59.1856, lon: 9.5681, name: 'Sandefjord Torp Airport' },
  { icao: 'ENRY', lat: 59.3789, lon: 10.7856, name: 'Rygge Airport' },
  { icao: 'ENNO', lat: 61.8444, lon: 6.0978, name: 'Notodden Airport' },
  { icao: 'ENRO', lat: 62.1781, lon: 6.2678, name: 'Ørsta-Volda Airport' },
  { icao: 'ENSD', lat: 61.8306, lon: 6.1089, name: 'Sandane Airport' },
  { icao: 'ENST', lat: 61.1561, lon: 7.1356, name: 'Førde Airport' },
  { icao: 'ENBL', lat: 68.7881, lon: 33.0103, name: 'Bjørnøya Airport' },
  { icao: 'ENAS', lat: 69.2931, lon: 16.1439, name: 'Andøya Airport' },
  { icao: 'ENSR', lat: 69.7867, lon: 20.9597, name: 'Sørkjosen Airport' },
  { icao: 'ENRS', lat: 78.2467, lon: 15.4656, name: 'Barentsburg Airport' },
  { icao: 'ENNA', lat: 60.7661, lon: 11.0681, name: 'Hamar Stafsberg Airport' },
  { icao: 'ENOL', lat: 59.6069, lon: 9.2928, name: 'Tønsberg Airport' },
  { icao: 'ENLI', lat: 60.8172, lon: 11.0681, name: 'Lillehammer Airport' },
  { icao: 'ENMO', lat: 64.8378, lon: 11.1403, name: 'Mo i Rana Airport' },
  { icao: 'ENRA', lat: 66.3639, lon: 14.3014, name: 'Sandnessjøen Airport' },
  { icao: 'ENBN', lat: 65.9583, lon: 12.2167, name: 'Brønnøysund Airport' },
  { icao: 'ENRM', lat: 66.8778, lon: 15.0336, name: 'Rørvik Airport' },
  { icao: 'ENOL', lat: 63.6989, lon: 9.6042, name: 'Ørland Airport' },
  { icao: 'ENRN', lat: 64.4722, lon: 11.5781, name: 'Namsos Airport' },
  { icao: 'ENST', lat: 63.1117, lon: 7.8244, name: 'Kristiansund Airport' }
];

const getWindDirection = (degrees: number) => {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  return directions[Math.round(degrees / 22.5) % 16];
};

const getDroneFlightConditions = (weather: WeatherData) => {
  let conditions = [];
  let severity = 'GOOD';
  
  if (weather.wind_speed > 25) {
    conditions.push('HIGH WIND');
    severity = 'POOR';
  } else if (weather.wind_speed > 15) {
    conditions.push('MODERATE WIND');
    severity = 'CAUTION';
  }
  
  if (weather.visibility < 5) {
    conditions.push('LOW VISIBILITY');
    severity = 'POOR';
  } else if (weather.visibility < 8) {
    conditions.push('REDUCED VISIBILITY');
    if (severity === 'GOOD') severity = 'CAUTION';
  }
  
  if (weather.rain && weather.rain > 0.5) {
    conditions.push('PRECIPITATION');
    severity = 'POOR';
  }
  
  if (weather.temperature < -10 || weather.temperature > 40) {
    conditions.push('EXTREME TEMP');
    severity = 'POOR';
  }
  
  return { conditions: conditions.length > 0 ? conditions : ['NOMINAL'], severity };
};

// Get distance between two points in kilometers
const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Parse METAR data from raw text
const parseMETAR = (rawText: string) => {
  try {
    const result: any = {};
    
    // Extract wind information (e.g., "27008KT")
    const windMatch = rawText.match(/(\d{3})(\d{2,3})(G\d{2,3})?(KT|MPS)/);
    if (windMatch) {
      result.wind = {
        direction: parseInt(windMatch[1]),
        speed: parseInt(windMatch[2]),
        unit: windMatch[4] === 'KT' ? 'kts' : 'mps'
      };
      if (windMatch[3]) {
        result.wind.gust = parseInt(windMatch[3].substring(1));
      }
    }
    
    // Extract visibility (e.g., "9999")
    const visMatch = rawText.match(/\s(\d{4})\s/);
    if (visMatch) {
      result.visibility = {
        value: parseInt(visMatch[1]),
        unit: 'm'
      };
    }
    
    // Extract temperature/dewpoint (e.g., "18/12")
    const tempMatch = rawText.match(/\s(M?\d{2})\/(M?\d{2})\s/);
    if (tempMatch) {
      let temp = parseInt(tempMatch[1].replace('M', '-'));
      result.temperature = {
        value: temp,
        unit: 'C'
      };
    }
    
    // Extract QNH (e.g., "Q1013")
    const qnhMatch = rawText.match(/Q(\d{4})/);
    if (qnhMatch) {
      result.qnh = {
        value: parseInt(qnhMatch[1]),
        unit: 'hPa'
      };
    }
    
    // Extract cloud layers (e.g., "FEW035", "SCT120")
    const cloudMatches = rawText.match(/(FEW|SCT|BKN|OVC)(\d{3})/g);
    if (cloudMatches) {
      result.clouds = cloudMatches.map(match => {
        const coverage = match.substring(0, 3);
        const height = parseInt(match.substring(3)) * 100; // Convert to feet
        return { type: coverage, height, coverage: coverage.toLowerCase() };
      });
    }
    
    return result;
  } catch (error) {
    console.error('Error parsing METAR:', error);
    return null;
  }
};

// Parse TAF data from raw text
const parseTAF = (rawText: string) => {
  try {
    const result: any = {};
    
    // Extract wind information (e.g., "27010KT")
    const windMatch = rawText.match(/(\d{3})(\d{2,3})(G\d{2,3})?(KT|MPS)/);
    if (windMatch) {
      result.wind = {
        direction: parseInt(windMatch[1]),
        speed: parseInt(windMatch[2]),
        unit: windMatch[4] === 'KT' ? 'kts' : 'mps'
      };
      if (windMatch[3]) {
        result.wind.gust = parseInt(windMatch[3].substring(1));
      }
    }
    
    // Extract visibility (e.g., "9999")
    const visMatch = rawText.match(/\s(\d{4})\s/);
    if (visMatch) {
      result.visibility = {
        value: parseInt(visMatch[1]),
        unit: 'm'
      };
    }
    
    // Extract cloud layers (e.g., "SCT040")
    const cloudMatches = rawText.match(/(FEW|SCT|BKN|OVC)(\d{3})/g);
    if (cloudMatches) {
      result.clouds = cloudMatches.map(match => {
        const coverage = match.substring(0, 3);
        const height = parseInt(match.substring(3)) * 100; // Convert to feet
        return { type: coverage, height, coverage: coverage.toLowerCase() };
      });
    }
    
    return result;
  } catch (error) {
    console.error('Error parsing TAF:', error);
    return null;
  }
};

// Parse cloud coverage
const parseCloudCoverage = (coverage: string): string => {
  switch (coverage.toLowerCase()) {
    case 'few': return 'Few (1-2/8)';
    case 'sct': case 'scattered': return 'Scattered (3-4/8)';
    case 'bkn': case 'broken': return 'Broken (5-7/8)';
    case 'ovc': case 'overcast': return 'Overcast (8/8)';
    case 'clr': case 'clear': return 'Clear';
    default: return coverage;
  }
};

// Format aviation time
const formatAviationTime = (isoString: string): string => {
  const date = new Date(isoString);
  return `${date.getUTCDate().toString().padStart(2, '0')}${date.getUTCHours().toString().padStart(2, '0')}${date.getUTCMinutes().toString().padStart(2, '0')}Z`;
};

export default function WeatherPanel({ 
  onHeaderClick, 
  isSelecting,
  weatherLocation,
  onLocationChange
}: WeatherPanelProps) {
  const [weatherLayer, setWeatherLayer] = React.useState<'conditions' | 'aviation'>('conditions');
  const [weather, setWeather] = React.useState<WeatherData | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = React.useState(false);
  const [lastWeatherUpdate, setLastWeatherUpdate] = React.useState<Date>(new Date());
  const [weatherError, setWeatherError] = React.useState<string | null>(null);
  
  const [aviationForecast, setAviationForecast] = React.useState<AviationForecast[]>([]);
  const [isLoadingAviation, setIsLoadingAviation] = React.useState(false);
  const [lastAviationUpdate, setLastAviationUpdate] = React.useState<Date>(new Date());
  const [aviationError, setAviationError] = React.useState<string | null>(null);
  const [nearestAirport, setNearestAirport] = React.useState<{ icao: string; name: string }>({ 
    icao: 'ENGM', 
    name: 'Oslo Gardermoen Airport' 
  });

  // Fetch weather data from Yr API
  const fetchWeatherData = React.useCallback(async () => {
    setIsLoadingWeather(true);
    setWeatherError(null);

    try {
      // In production, we need to use a CORS proxy or direct API call
      // For now, we'll use a public CORS proxy service
      const apiUrl = `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${weatherLocation.lat}&lon=${weatherLocation.lon}`;
      const proxyUrl = import.meta.env.DEV 
        ? `/api/weather?lat=${weatherLocation.lat}&lon=${weatherLocation.lon}`
        : `https://corsproxy.io/?${encodeURIComponent(apiUrl)}`;
      
      const response = await fetch(proxyUrl, {
        signal: AbortSignal.timeout(10000),
        headers: {
          'User-Agent': 'MilUAS-Dashboard/1.0 (contact@example.com)'
        }
      });

      // Read response text once
      const responseText = await response.text();

      if (!response.ok) {
        throw new Error(`Weather API Error: ${response.status} - ${responseText}`);
      }

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.startsWith('application/json')) {
        throw new Error(`Expected JSON response, got: ${contentType}. Response: ${responseText.substring(0, 100)}`);
      }

      const data = JSON.parse(responseText);
      
      if (!data.properties || !data.properties.timeseries || data.properties.timeseries.length === 0) {
        throw new Error('Invalid weather data format');
      }

      // Get current weather from first timeseries entry
      const current = data.properties.timeseries[0];
      const instant = current.data.instant.details;
      const next1h = current.data.next_1_hours?.details;
      const next6h = current.data.next_6_hours?.details;

      const weatherData: WeatherData = {
        temperature: instant.air_temperature || 0,
        humidity: instant.relative_humidity || 0,
        pressure: instant.air_pressure_at_sea_level || 1013,
        visibility: instant.fog_area_fraction ? (1 - instant.fog_area_fraction) * 10 : 10, // Estimate visibility
        wind_speed: instant.wind_speed || 0,
        wind_direction: instant.wind_from_direction || 0,
        wind_gust: instant.wind_speed_of_gust,
        weather_main: next1h?.precipitation_amount > 0 ? 'Rain' : 'Clear',
        weather_description: next1h?.precipitation_amount > 0 ? 'light rain' : 'clear sky',
        clouds: instant.cloud_area_fraction ? instant.cloud_area_fraction * 100 : 0,
        rain: next1h?.precipitation_amount,
        snow: next1h?.precipitation_amount // Yr doesn't separate rain/snow in this endpoint
      };

      setWeather(weatherData);
      setLastWeatherUpdate(new Date());
    } catch (error: any) {
      console.error('Error fetching weather data:', error);
      setWeatherError(error.message);
      setWeather(null);
    } finally {
      setIsLoadingWeather(false);
    }
  }, [weatherLocation.lat, weatherLocation.lon]);

  // Fetch aviation forecast data from Yr API
  const fetchAviationForecast = React.useCallback(async () => {
    setIsLoadingAviation(true);
    setAviationError(null);

    try {
      // Find nearest airport
      let nearestAirport = airports[0];
      let minDistance = getDistance(weatherLocation.lat, weatherLocation.lon, nearestAirport.lat, nearestAirport.lon);
      
      airports.forEach(airport => {
        const distance = getDistance(weatherLocation.lat, weatherLocation.lon, airport.lat, airport.lon);
        if (distance < minDistance) {
          minDistance = distance;
          nearestAirport = airport;
        }
      });
      
      setNearestAirport(nearestAirport);
      
      const forecasts: AviationForecast[] = [];
      
      try {
        // Use different URLs for development vs production
        const apiUrl = `https://api.met.no/weatherapi/tafmetar/1.0/tafmetar.txt?icao=${nearestAirport.icao}`;
        const metnoUrl = import.meta.env.DEV 
          ? `/api/aviation?icao=${nearestAirport.icao}`
          : `https://corsproxy.io/?${encodeURIComponent(apiUrl)}`;
        
        const response = await fetch(metnoUrl, {
          signal: AbortSignal.timeout(10000),
          headers: {
            'User-Agent': 'MilUAS-Dashboard/1.0 (contact@example.com)'
          }
        });
        
        if (response.ok) {
          // Check if response is text (METAR/TAF data)
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.startsWith('application/json')) {
            const responseText = await response.text();
            throw new Error(`Expected text response for aviation data, got JSON: ${responseText.substring(0, 100)}`);
          }

          const rawText = await response.text();
          
          
          // Parse the raw METAR/TAF text
          const lines = rawText.split('\n').filter(line => line.trim());
          
          lines.forEach(line => {
            const trimmedLine = line.trim();
            if (trimmedLine.startsWith(nearestAirport.icao)) {
              const now = new Date();
              
              if (trimmedLine.includes('METAR') || (!trimmedLine.includes('TAF') && !trimmedLine.includes('FC'))) {
                // This is a METAR
                const metar = parseMETAR(trimmedLine);
                if (metar) {
                  forecasts.push({
                    type: 'METAR',
                    icao_code: nearestAirport.icao,
                    issue_time: now.toISOString(),
                    valid_from: now.toISOString(),
                    valid_to: now.toISOString(),
                    raw_text: trimmedLine,
                    ...metar
                  });
                }
              } else if (trimmedLine.includes('TAF') || trimmedLine.includes('FC')) {
                // This is a TAF
                const taf = parseTAF(trimmedLine);
                if (taf) {
                  forecasts.push({
                    type: 'TAF',
                    icao_code: nearestAirport.icao,
                    issue_time: now.toISOString(),
                    valid_from: now.toISOString(),
                    valid_to: new Date(now.getTime() + 24 * 60 * 60000).toISOString(),
                    raw_text: trimmedLine,
                    ...taf
                  });
                }
              }
            }
          });
        } else {
          const errorText = await response.text();
          throw new Error(`Aviation API Error: ${response.status} - ${errorText}`);
        }
      } catch (error: any) {
        console.error('Aviation API error:', error);
        setAviationError(error.message);
      }
      
      setAviationForecast(forecasts);
      setLastAviationUpdate(new Date());
    } catch (error: any) {
      console.error('Error fetching aviation forecast:', error);
      setAviationError(error.message);
      setAviationForecast([]);
    } finally {
      setIsLoadingAviation(false);
    }
  }, [weatherLocation.lat, weatherLocation.lon]);

  // Fetch data on component mount and location change
  React.useEffect(() => {
    fetchWeatherData();
    fetchAviationForecast();
  }, [fetchWeatherData, fetchAviationForecast]);

  return (
    <div className="lattice-panel flex flex-col h-full">
      <div className={`lattice-header px-4 py-3 cursor-pointer transition-all ${
        isSelecting ? 'bg-gradient-to-r from-orange-500 to-amber-500' : ''
      }`} onClick={onHeaderClick}>
        <div className="flex items-center space-x-2">
          <Cloud className="h-4 w-4 lattice-status-primary" />
          <span className="text-sm font-semibold lattice-text-primary">Weather Conditions</span>
          <span className="text-xs lattice-text-secondary">{weatherLocation.name.split(',')[0]}</span>
        </div>
      </div>
      
      {/* Weather Tabs */}
      <div className="border-b border-gray-700 px-3 py-2">
        <div className="flex items-center justify-between">
          <div className="flex space-x-1">
            <button
              onClick={() => setWeatherLayer('conditions')}
              className={`lattice-tab px-3 py-1 text-xs rounded transition-all ${
                weatherLayer === 'conditions'
                  ? 'active'
                  : ''
              }`}
            >
              <Cloud className="h-3 w-3 inline mr-1" />
              Conditions
            </button>
            <button
              onClick={() => setWeatherLayer('aviation')}
              className={`lattice-tab px-3 py-1 text-xs rounded transition-all ${
                weatherLayer === 'aviation'
                  ? 'active'
                  : ''
              }`}
            >
              <Navigation className="h-3 w-3 inline mr-1" />
              Aviation
            </button>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => weatherLayer === 'conditions' ? fetchWeatherData() : fetchAviationForecast()}
              disabled={isLoadingWeather || isLoadingAviation}
              className="lattice-button disabled:opacity-50 text-xs px-2 py-1 flex items-center space-x-1"
            >
              <RefreshCw className={`h-3 w-3 ${(isLoadingWeather || isLoadingAviation) ? 'lattice-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 flex-1 overflow-y-auto lattice-scrollbar">
        {/* Conditions Layer */}
        {weatherLayer === 'conditions' && (
          <div className="h-full overflow-y-auto lattice-scrollbar">
            {isLoadingWeather ? (
              <div className="text-center lattice-text-muted py-8">
                <Cloud className="h-8 w-8 mx-auto mb-2 opacity-50 lattice-spin" />
                <p>Loading weather data...</p>
              </div>
            ) : weatherError ? (
              <div className="text-center lattice-text-muted py-8">
                <Cloud className="h-8 w-8 mx-auto mb-2 lattice-status-error" />
                <p className="lattice-status-error">Error loading weather</p>
                <p className="text-xs mt-2 lattice-text-secondary">{weatherError}</p>
                <button
                  onClick={fetchWeatherData}
                  className="lattice-button text-xs px-3 py-1 mt-3"
                >
                  Retry
                </button>
              </div>
            ) : weather ? (
              <div className="space-y-4">
                {/* Flight Conditions Alert */}
                <div className={`border p-3 rounded ${
                  getDroneFlightConditions(weather).severity === 'GOOD' ? 'border-green-400 bg-green-900/30 lattice-glow' :
                  getDroneFlightConditions(weather).severity === 'CAUTION' ? 'border-amber-400 bg-amber-900/30' :
                  'border-red-400 bg-red-900/30'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold lattice-status-primary">Flight Conditions</span>
                    <span className={`text-xs font-bold ${
                      getDroneFlightConditions(weather).severity === 'GOOD' ? 'lattice-status-good' :
                      getDroneFlightConditions(weather).severity === 'CAUTION' ? 'lattice-status-warning' :
                      'lattice-status-error'
                    }`}>
                      {getDroneFlightConditions(weather).severity}
                    </span>
                  </div>
                  <div className="text-xs space-y-1">
                    {getDroneFlightConditions(weather).conditions.map((condition, index) => (
                      <div key={index}>• {condition}</div>
                    ))}
                  </div>
                </div>

                {/* Current Conditions */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="lattice-panel p-3">
                    <div className="flex items-center space-x-2 mb-2">
                      <Thermometer className="h-4 w-4 lattice-status-primary" />
                      <span className="text-xs lattice-status-primary font-semibold">Temperature</span>
                    </div>
                    <div className="text-lg font-semibold lattice-text-primary">{Math.round(weather.temperature)}°C</div>
                    <div className="text-xs lattice-text-secondary">Humidity: {Math.round(weather.humidity)}%</div>
                  </div>

                  <div className="lattice-panel p-3">
                    <div className="flex items-center space-x-2 mb-2">
                      <Wind className="h-4 w-4 lattice-status-primary" />
                      <span className="text-xs lattice-status-primary font-semibold">Wind</span>
                    </div>
                    <div className="text-lg font-semibold lattice-text-primary">{Math.round(weather.wind_speed * 3.6)} km/h</div>
                    <div className="text-xs lattice-text-secondary">
                      {getWindDirection(weather.wind_direction)} ({Math.round(weather.wind_direction)}°)
                      {weather.wind_gust && <div>Gusts: {Math.round(weather.wind_gust * 3.6)} km/h</div>}
                    </div>
                  </div>

                  <div className="lattice-panel p-3">
                    <div className="flex items-center space-x-2 mb-2">
                      <Eye className="h-4 w-4 lattice-status-primary" />
                      <span className="text-xs lattice-status-primary font-semibold">Visibility</span>
                    </div>
                    <div className="text-lg font-semibold lattice-text-primary">{Math.round(weather.visibility)} km</div>
                    <div className="text-xs lattice-text-secondary">Clouds: {Math.round(weather.clouds)}%</div>
                  </div>

                  <div className="lattice-panel p-3">
                    <div className="flex items-center space-x-2 mb-2">
                      <Gauge className="h-4 w-4 lattice-status-primary" />
                      <span className="text-xs lattice-status-primary font-semibold">Pressure</span>
                    </div>
                    <div className="text-lg font-semibold lattice-text-primary">{Math.round(weather.pressure)} hPa</div>
                    <div className="text-xs lattice-text-secondary capitalize">{weather.weather_description}</div>
                  </div>
                </div>

                {/* Precipitation */}
                {(weather.rain || weather.snow) && (
                  <div className="lattice-panel border-amber-400 p-3 lattice-glow-warning">
                    <div className="flex items-center space-x-2 mb-2">
                      <Droplets className="h-4 w-4 lattice-status-warning" />
                      <span className="text-xs lattice-status-warning font-semibold">Precipitation</span>
                    </div>
                    {weather.rain && <div className="text-sm lattice-text-primary">Rain: {Math.round(weather.rain)} mm/h</div>}
                    {weather.snow && <div className="text-sm lattice-text-primary">Snow: {Math.round(weather.snow)} mm/h</div>}
                  </div>
                )}

                {/* Last Update */}
                <div className="text-xs lattice-text-muted text-center">
                  Last updated: {lastWeatherUpdate.toLocaleTimeString()}
                </div>
              </div>
            ) : (
              <div className="text-center lattice-text-muted py-8">
                <Cloud className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No weather data available</p>
              </div>
            )}
          </div>
        )}

        {/* Aviation Layer */}
        {weatherLayer === 'aviation' && (
          <div className="h-full overflow-y-auto lattice-scrollbar">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm lattice-status-primary font-semibold">Aviation Forecast</div>
              <button
                onClick={fetchAviationForecast}
                disabled={isLoadingAviation}
                className="lattice-button disabled:opacity-50 text-xs px-3 py-1 flex items-center space-x-1"
              >
                <Navigation className={`h-3 w-3 ${isLoadingAviation ? 'lattice-spin' : ''}`} />
                <span>{isLoadingAviation ? 'Loading...' : 'Refresh'}</span>
              </button>
            </div>

            {/* Airport Information */}
            <div className="lattice-panel p-3 mb-4">
              <div className="text-xs lattice-status-primary mb-2 font-semibold">Nearest Airport</div>
              <div className="text-sm lattice-text-primary font-semibold">{nearestAirport.name}</div>
              <div className="text-xs lattice-text-secondary">ICAO: {nearestAirport.icao}</div>
              <div className="text-xs lattice-text-secondary">
                Last updated: {lastAviationUpdate.toLocaleTimeString()}
              </div>
              <div className="text-xs lattice-text-muted">
                Distance: {getDistance(weatherLocation.lat, weatherLocation.lon, 
                  airports.find(a => a.icao === nearestAirport.icao)?.lat || 0,
                  airports.find(a => a.icao === nearestAirport.icao)?.lon || 0
                ).toFixed(1)}km
              </div>
            </div>

            {isLoadingAviation ? (
              <div className="text-center lattice-text-muted py-8">
                <Navigation className="h-8 w-8 mx-auto mb-2 opacity-50 lattice-spin" />
                <p>Loading aviation forecast...</p>
              </div>
            ) : aviationError ? (
              <div className="text-center lattice-text-muted py-8">
                <Navigation className="h-8 w-8 mx-auto mb-2 lattice-status-error" />
                <p className="lattice-status-error">Error loading aviation data</p>
                <p className="text-xs mt-2 lattice-text-secondary">{aviationError}</p>
                <button
                  onClick={fetchAviationForecast}
                  className="lattice-button text-xs px-3 py-1 mt-3"
                >
                  Retry
                </button>
              </div>
            ) : aviationForecast.length === 0 ? (
              <div className="text-center lattice-text-muted py-8">
                <Navigation className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No aviation forecast available</p>
                <p className="text-xs mt-2">for {nearestAirport.name}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {aviationForecast.map((forecast, index) => (
                  <div key={index} className="lattice-panel p-4">
                    {/* Forecast Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className={`text-sm font-bold px-2 py-1 rounded ${
                          forecast.type === 'METAR' 
                            ? 'lattice-panel lattice-status-good' 
                            : 'lattice-panel lattice-status-primary'
                        }`}>
                          {forecast.type}
                        </span>
                        <span className="text-sm lattice-text-primary font-semibold">
                          {forecast.icao_code}
                        </span>
                      </div>
                      <div className="text-xs lattice-text-secondary">
                        {formatAviationTime(forecast.issue_time)}
                      </div>
                    </div>

                    {/* Raw Text */}
                    <div className="lattice-panel p-2 mb-3">
                      <div className="text-xs lattice-text-mono lattice-text-primary break-all">
                        {forecast.raw_text || 'No raw text available'}
                      </div>
                    </div>

                    {/* Parsed Data */}
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      {/* Wind */}
                      {forecast.wind && (
                        <div className="lattice-panel p-2">
                          <div className="lattice-status-primary font-semibold mb-1">Wind</div>
                          <div className="lattice-text-primary">
                            {forecast.wind.direction}° at {forecast.wind.speed}{forecast.wind.unit}
                            {forecast.wind.gust && (
                              <div className="lattice-status-warning">
                                Gusts: {forecast.wind.gust}{forecast.wind.unit}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Visibility */}
                      {forecast.visibility && (
                        <div className="lattice-panel p-2">
                          <div className="lattice-status-primary font-semibold mb-1">Visibility</div>
                          <div className="lattice-text-primary">
                            {forecast.visibility.value === 9999 
                              ? '10km+' 
                              : `${(forecast.visibility.value / 1000).toFixed(1)}km`
                            }
                          </div>
                        </div>
                      )}

                      {/* Temperature */}
                      {forecast.temperature && (
                        <div className="lattice-panel p-2">
                          <div className="lattice-status-primary font-semibold mb-1">Temperature</div>
                          <div className="lattice-text-primary">
                            {forecast.temperature.value}°{forecast.temperature.unit}
                          </div>
                        </div>
                      )}

                      {/* QNH */}
                      {forecast.qnh && (
                        <div className="lattice-panel p-2">
                          <div className="lattice-status-primary font-semibold mb-1">QNH</div>
                          <div className="lattice-text-primary">
                            {forecast.qnh.value} {forecast.qnh.unit}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Clouds */}
                    {forecast.clouds && forecast.clouds.length > 0 && (
                      <div className="mt-3">
                        <div className="text-xs lattice-status-primary font-semibold mb-2">Cloud Layers</div>
                        <div className="space-y-1">
                          {forecast.clouds.map((cloud, cloudIndex) => (
                            <div key={cloudIndex} className="lattice-panel p-2 text-xs">
                              <span className="lattice-text-primary font-semibold">
                                {parseCloudCoverage(cloud.coverage)}
                              </span>
                              <span className="lattice-text-secondary ml-2">
                                at {cloud.height}ft
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Weather Conditions */}
                    {forecast.weather_conditions && forecast.weather_conditions.length > 0 && (
                      <div className="mt-3">
                        <div className="text-xs lattice-status-primary font-semibold mb-2">Weather</div>
                        <div className="flex flex-wrap gap-1">
                          {forecast.weather_conditions.map((condition, condIndex) => (
                            <span key={condIndex} className="lattice-panel px-2 py-1 text-xs lattice-text-primary">
                              {condition}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Valid Period (for TAF) */}
                    {forecast.type === 'TAF' && (
                      <div className="mt-3 pt-2 border-t border-gray-600">
                        <div className="text-xs lattice-text-secondary">
                          Valid: {formatAviationTime(forecast.valid_from)} - {formatAviationTime(forecast.valid_to)}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}