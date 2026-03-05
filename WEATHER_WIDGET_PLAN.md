# Open-Meteo Weather Widget - Tech Brief & Implementation Plan

## Tech Brief

### Architecture Overview
```
User's Homepage → JavaScript (Fetch) → Open-Meteo API → Weather Data → Rendered Widget
```

**Key Components:**
1. **Geolocation** - Get user's coordinates (via browser's Geolocation API or IP-based fallback)
2. **Geocoding API** - Convert location name to coordinates
3. **Weather API** - Fetch current conditions and forecast
4. **Frontend** - HTML/CSS for display + JavaScript to manage data flow

### Why Open-Meteo?
- **No authentication required** - API calls work without an API key
- **CORS enabled** - Works directly from browser (client-side)
- **Accurate data** - Uses multiple weather models
- **Free limits** - 500k requests/month is more than enough for a homepage
- **Fast response times** - Typically <200ms per request

### Data Flow
1. On page load, request user's location (with fallback to default city)
2. Call Weather API with coordinates to get current + forecast data
3. Parse JSON response and update the DOM
4. Cache data in localStorage to reduce API calls during same session
5. Refresh every 30-60 minutes or on user request

---

## Step-by-Step Implementation Plan

### Phase 1: Basic HTML Structure
- [ ] Add weather widget container to `index.html`
- [ ] Create semantic markup for current conditions, temperature, forecast cards, etc.
- [ ] Add a location input field + search button

### Phase 2: CSS Styling
- [ ] Style the widget to match your site's Figtree font and overall design
- [ ] Create responsive grid/flex layout for forecast cards
- [ ] Add weather icons (using SVG or Unicode symbols as fallback)
- [ ] Style loading states and error messages

### Phase 3: JavaScript - Core Logic
- [ ] Create `weather.js` file with main functions
- [ ] Implement `getCoordinates()` - Get lat/long from location name
- [ ] Implement `fetchWeather()` - Call Open-Meteo API
- [ ] Implement `displayWeather()` - Render data to DOM
- [ ] Add error handling for API failures or invalid locations

### Phase 4: Geolocation & Defaults
- [ ] Request browser geolocation on page load
- [ ] Implement fallback to default city if geolocation denied
- [ ] Add localStorage caching to avoid repeated API calls
- [ ] Implement refresh timer (check for new data every 30min)

### Phase 5: Polish & Testing
- [ ] Add loading spinner while fetching
- [ ] Test with multiple locations
- [ ] Verify mobile responsiveness
- [ ] Test on Vercel deployment
- [ ] Add weather icons for better UX

---

## Technical Details

### API Endpoints We'll Use

**Geocoding API** (convert location to coordinates)
```
GET https://geocoding-api.open-meteo.com/v1/search?name={location}&count=1
```

**Weather API** (fetch weather data)
```
GET https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lng}&current=temperature_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min
```

### Sample Response Structure
```json
{
  "current": {
    "temperature_2m": 72.5,
    "weather_code": 1,
    "wind_speed_10m": 8.3
  },
  "daily": {
    "temperature_2m_max": [75, 78, 72],
    "temperature_2m_min": [62, 65, 60]
  }
}
```

### Estimated File Changes
- **index.html**: +15-20 lines (widget container + script tag)
- **style.css**: +40-60 lines (widget styling)
- **weather.js**: ~150-200 lines (new file, core logic)

---

## Questions Before Implementation

1. **Location**: Should it use the user's browser geolocation, or hard-code to a specific city?
2. **Display style**: Do you want current conditions only, or a 5-7 day forecast?
3. **Temperature units**: Fahrenheit, Celsius, or user choice?
4. **Position on page**: Where should the widget appear on your homepage?

---

## Next Steps

Answer the questions above, and we can start implementing Phase 1!
