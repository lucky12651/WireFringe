import { useState, useEffect } from 'react';
import styles from './Header.module.css';

export default function WeatherWidget() {
  const [weather, setWeather] = useState(null);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWeather() {
      try {
        // 1. Get location via IP (no API key needed, uses HTTPS)
        const locRes = await fetch('https://ipapi.co/json/');
        const locData = await locRes.json();
        
        if (locData.city) {
          setLocation(locData.city);
          
          // 2. Get weather via Open-Meteo (no API key needed)
          const weatherRes = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${locData.latitude}&longitude=${locData.longitude}&current_weather=true`
          );
          const weatherData = await weatherRes.json();
          
          if (weatherData.current_weather) {
            setWeather({
              temp: Math.round(weatherData.current_weather.temperature),
              code: weatherData.current_weather.weathercode,
              isDay: weatherData.current_weather.is_day
            });
          }
        }
      } catch (err) {
        console.error('Weather fetch failed:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchWeather();
  }, []);

  if (loading || !weather) return null;

  // Simple mapping of WMO weather codes to icons
  const getWeatherIcon = (code, isDay) => {
    if (code === 0) return isDay ? '☀️' : '🌙'; // Clear sky
    if (code <= 3) return isDay ? '⛅' : '☁️'; // Partly cloudy
    if (code <= 48) return '🌫️'; // Fog
    if (code <= 67) return '🌧️'; // Rain
    if (code <= 77) return '❄️'; // Snow
    if (code <= 82) return '🌧️'; // Rain showers
    if (code <= 99) return '⛈️'; // Thunderstorm
    return '🌡️';
  };

  return (
    <div className={styles.weatherWidget}>
      <div className={styles.weatherLocation}>{location || 'Local'}</div>
      <div className={styles.weatherMain}>
        <span className={styles.weatherIcon}>
          {getWeatherIcon(weather.code, weather.isDay)}
        </span>
        <span className={styles.weatherTemp}>{weather.temp}° C</span>
      </div>
    </div>
  );
}
