// Weather Widget - Open-Meteo Integration
// Phase 3: Core JavaScript Logic

const GEOCODING_API = 'https://geocoding-api.open-meteo.com/v1/search';
const WEATHER_API = 'https://api.open-meteo.com/v1/forecast';
const DEFAULT_LOCATION = 'New York';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds
const REFRESH_INTERVAL = 30 * 60 * 1000; // 30 minutes

// DOM Elements
const loadingEl = document.getElementById('loading');
const errorEl = document.getElementById('error');
const errorMessageEl = document.getElementById('error-message');
const currentWeatherEl = document.getElementById('current-weather');
const forecastEl = document.getElementById('forecast');
const locationInputEl = document.getElementById('location-input');
const searchBtnEl = document.getElementById('search-btn');
const locationNameEl = document.getElementById('location-name');
const currentTempEl = document.getElementById('current-temp');
const currentConditionEl = document.getElementById('current-condition');
const windSpeedEl = document.getElementById('wind-speed');
const forecastCardsEl = document.getElementById('forecast-cards');
const lastUpdatedEl = document.getElementById('last-updated');

let currentLocation = null; // Store current location for refresh functionality
let isLoading = false; // Track loading state

// Weather code to description mapping
const WEATHER_CODES = {
    0: '☀️ Clear',
    1: '🌤️ Mostly Clear',
    2: '⛅ Partly Cloudy',
    3: '☁️ Cloudy',
    45: '🌫️ Foggy',
    48: '🌫️ Foggy',
    51: '🌧️ Light Drizzle',
    53: '🌧️ Moderate Drizzle',
    55: '🌧️ Heavy Drizzle',
    61: '🌧️ Slight Rain',
    63: '🌧️ Moderate Rain',
    65: '🌧️ Heavy Rain',
    71: '❄️ Light Snow',
    73: '❄️ Moderate Snow',
    75: '❄️ Heavy Snow',
    77: '❄️ Snow Grains',
    80: '🌧️ Slight Rain Showers',
    81: '🌧️ Moderate Rain Showers',
    82: '🌧️ Violent Rain Showers',
    85: '❄️ Slight Snow Showers',
    86: '❄️ Heavy Snow Showers',
    95: '⛈️ Thunderstorm',
    96: '⛈️ Thunderstorm with Hail',
    99: '⛈️ Thunderstorm with Hail'
};

/**
 * Get coordinates for a location name using Open-Meteo Geocoding API
 * @param {string} locationName - Name of the location to search for
 * @returns {Promise<Object>} - Object with latitude, longitude, and name
 */
async function getCoordinates(locationName) {
    try {
        const response = await fetch(
            `${GEOCODING_API}?name=${encodeURIComponent(locationName)}&count=1&language=en&format=json`
        );

        if (!response.ok) {
            throw new Error('Geocoding API error');
        }

        const data = await response.json();

        if (!data.results || data.results.length === 0) {
            throw new Error(`Location "${locationName}" not found`);
        }

        const result = data.results[0];
        return {
            latitude: result.latitude,
            longitude: result.longitude,
            name: `${result.name}${result.admin1 ? ', ' + result.admin1 : ''}${result.country ? ', ' + result.country : ''}`
        };
    } catch (error) {
        console.error('Error fetching coordinates:', error);
        throw error;
    }
}

/**
 * Fetch weather data from Open-Meteo API
 * @param {number} latitude - Latitude of location
 * @param {number} longitude - Longitude of location
 * @returns {Promise<Object>} - Weather data object
 */
async function fetchWeather(latitude, longitude) {
    try {
        const params = new URLSearchParams({
            latitude: latitude,
            longitude: longitude,
            current: 'temperature_2m,weather_code,wind_speed_10m',
            daily: 'weather_code,temperature_2m_max,temperature_2m_min',
            temperature_unit: 'fahrenheit',
            timezone: 'auto'
        });

        const response = await fetch(`${WEATHER_API}?${params}`);

        if (!response.ok) {
            throw new Error('Weather API error');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching weather:', error);
        throw error;
    }
}

/**
 * Display weather data in the DOM
 * @param {Object} weatherData - Weather data from Open-Meteo API
 * @param {string} locationName - Name of the location
 */
function displayWeather(weatherData, locationName) {
    try {
        // Hide all states first
        hideAll();

        // Store current location for refresh button
        currentLocation = locationName;

        // Display current weather
        const current = weatherData.current;
        const daily = weatherData.daily;

        locationNameEl.textContent = locationName;
        currentTempEl.textContent = `${Math.round(current.temperature_2m)}°F`;
        
        const weatherDescription = WEATHER_CODES[current.weather_code] || '🌤️ Unknown';
        currentConditionEl.textContent = weatherDescription;
        windSpeedEl.textContent = Math.round(current.wind_speed_10m);

        // Update last updated time
        updateLastUpdated();

        currentWeatherEl.classList.remove('hidden');

        // Display 5-day forecast
        if (daily && daily.time && daily.time.length > 1) {
            displayForecast(daily);
        }

        // Re-enable buttons
        setButtonsDisabled(false);
    } catch (error) {
        console.error('Error displaying weather:', error);
        showError('Error displaying weather data');
        setButtonsDisabled(false);
    }
}

/**
 * Display 5-day forecast cards
 * @param {Object} dailyData - Daily weather data from API
 */
function displayForecast(dailyData) {
    forecastCardsEl.innerHTML = '';

    // Show 5 days of forecast (skip today, show next 5 days)
    for (let i = 1; i <= 5 && i < dailyData.time.length; i++) {
        const date = new Date(dailyData.time[i]);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        const weatherCode = dailyData.weather_code[i];
        const maxTemp = Math.round(dailyData.temperature_2m_max[i]);
        const minTemp = Math.round(dailyData.temperature_2m_min[i]);

        const card = document.createElement('div');
        card.className = 'forecast-card';
        card.innerHTML = `
            <div class="forecast-day">${dayName}</div>
            <div class="forecast-icon">${getWeatherIcon(weatherCode)}</div>
            <div class="forecast-temp">${maxTemp}°</div>
            <div class="forecast-temp-range">${minTemp}°</div>
        `;

        forecastCardsEl.appendChild(card);
    }

    forecastEl.classList.remove('hidden');
}

/**

 * Cache weather data in localStorage
 * @param {Object} weatherData - Weather data to cache
 * @param {string} locationName - Location name
 */
function cacheWeather(weatherData, locationName) {
    try {
        const cacheData = {
            weatherData: weatherData,
            locationName: locationName,
            timestamp: Date.now()
        };
        localStorage.setItem('weatherCache', JSON.stringify(cacheData));
    } catch (error) {
        console.warn('Unable to cache weather data:', error);
    }
}

/**
 * Get cached weather data if it exists and is still valid
 * @returns {Object|null} - Cached weather data or null if expired
 */
function getCachedWeather() {
    try {
        const cached = localStorage.getItem('weatherCache');
        if (!cached) return null;

        const cacheData = JSON.parse(cached);
        const age = Date.now() - cacheData.timestamp;

        // Return cache only if it's less than 30 minutes old
        if (age < CACHE_DURATION) {
            return cacheData;
        }

        // Cache expired, remove it
        localStorage.removeItem('weatherCache');
        return null;
    } catch (error) {
        console.warn('Error retrieving cached weather:', error);
        return null;
    }
}

/**
 * Request user's geolocation using browser Geolocation API
 * @returns {Promise<Object>} - Object with latitude and longitude
 */
function requestGeolocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported by this browser'));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                });
            },
            (error) => {
                reject(error);
            },
            {
                timeout: 5000,
                enableHighAccuracy: false
            }
        );
    });
}

/**
 * Get location name from coordinates using reverse geocoding
 * @param {number} latitude - Latitude
 * @param {number} longitude - Longitude
 * @returns {Promise<string>} - Location name
 */
async function getReverseGeocoding(latitude, longitude) {
    try {
        const response = await fetch(
            `${GEOCODING_API}?latitude=${latitude}&longitude=${longitude}&count=1`
        );

        if (!response.ok) {
            throw new Error('Reverse geocoding failed');
        }

        const data = await response.json();

        if (!data.results || data.results.length === 0) {
            return DEFAULT_LOCATION;
        }

        const result = data.results[0];
        return `${result.name}${result.admin1 ? ', ' + result.admin1 : ''}${result.country ? ', ' + result.country : ''}`;
    } catch (error) {
        console.warn('Reverse geocoding failed, using default:', error);
        return DEFAULT_LOCATION;
    }
}

/**
 * Load weather using user's geolocation, with fallback to default location
 */
async function loadWeatherByGeolocation() {
    try {
        const coords = await requestGeolocation();
        console.log('Geolocation detected:', { latitude: coords.latitude, longitude: coords.longitude });
        
        // Load weather data directly with coordinates (skip reverse geocoding for speed)
        showLoading();
        const weatherData = await fetchWeather(coords.latitude, coords.longitude);
        
        // Store coordinates for later use
        const locationName = `${coords.latitude.toFixed(2)}°, ${coords.longitude.toFixed(2)}°`;
        displayWeather(weatherData, 'Your Location');
        cacheWeather(weatherData, 'Your Location');
        localStorage.setItem('lastWeatherLocation', 'Your Location');
        localStorage.setItem('lastWeatherCoords', JSON.stringify(coords));
    } catch (error) {
        console.warn('Geolocation failed, falling back to default location:', error);
        // Fall back to default location
        loadWeather(DEFAULT_LOCATION);
    }
}

/**
 * Get weather icon emoji based on weather code
 * @param {number} code - Weather code from Open-Meteo
 * @returns {string} - Weather emoji
 */
function getWeatherIcon(code) {
    const description = WEATHER_CODES[code] || '🌤️';
    // Extract emoji from description (first character)
    return description.split(' ')[0];
}

/**
 * Show error message
 * @param {string} message - Error message to display
 */
function showError(message) {
    hideAll();
    errorMessageEl.textContent = message;
    errorEl.classList.remove('hidden');
    setButtonsDisabled(false);
}

/**
 * Update the last updated timestamp
 */
function updateLastUpdated() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    lastUpdatedEl.textContent = `Last updated: ${timeString}`;
}

/**
 * Disable or enable interactive buttons
 * @param {boolean} disabled - Whether to disable buttons
 */
function setButtonsDisabled(disabled) {
    searchBtnEl.disabled = disabled;
    locationInputEl.disabled = disabled;
}

/**
 * Show loading state
 */
function showLoading() {
    hideAll();
    loadingEl.classList.remove('hidden');
    setButtonsDisabled(true);
}

/**
 * Hide all weather content states
 */
function hideAll() {
    loadingEl.classList.add('hidden');
    errorEl.classList.add('hidden');
    currentWeatherEl.classList.add('hidden');
    forecastEl.classList.add('hidden');
}

/**
 * Fetch and display weather for a given location
 * @param {string} locationName - Name of the location
 */
async function loadWeather(locationName) {
    showLoading();

    try {
        // Check cache first
        const cached = getCachedWeather();
        if (cached && cached.locationName === locationName) {
            displayWeather(cached.weatherData, cached.locationName);
            return;
        }

        // Get coordinates for the location
        const coordinates = await getCoordinates(locationName);

        // Fetch weather data
        const weatherData = await fetchWeather(coordinates.latitude, coordinates.longitude);

        // Display the weather
        displayWeather(weatherData, coordinates.name);

        // Cache the data
        cacheWeather(weatherData, coordinates.name);

        // Store in localStorage for future reference
        localStorage.setItem('lastWeatherLocation', coordinates.name);
    } catch (error) {
        console.error('Error loading weather:', error);
        showError(error.message || 'Unable to fetch weather data. Please try another location.');
    }
}

/**
 * Setup auto-refresh timer for weather data
 */
function setupAutoRefresh() {
    setInterval(() => {
        const lastLocation = localStorage.getItem('lastWeatherLocation');
        if (lastLocation) {
            // Clear cache to force fresh fetch
            localStorage.removeItem('weatherCache');
            loadWeather(lastLocation);
        }
    }, REFRESH_INTERVAL);
}

/**
 * Initialize events and load default weather
 */
function init() {
    // Search button click
    searchBtnEl.addEventListener('click', () => {
        const location = locationInputEl.value.trim();
        if (location) {
            loadWeather(location);
            locationInputEl.value = '';
        }
    });

    // Enter key in input
    locationInputEl.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchBtnEl.click();
        }
    });

    // Setup auto-refresh timer
    setupAutoRefresh();

    // Try to load weather by geolocation first, fallback to default or last location
    const lastLocation = localStorage.getItem('lastWeatherLocation');
    
    if (navigator.geolocation) {
        // Try geolocation with a timeout
        loadWeatherByGeolocation();
    } else {
        // Geolocation not available, use last location or default
        const defaultLocation = lastLocation || DEFAULT_LOCATION;
        loadWeather(defaultLocation);
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}