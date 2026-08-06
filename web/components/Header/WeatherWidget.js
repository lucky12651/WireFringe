import { useState, useEffect } from 'react';

export default function WeatherWidget() {
  const [weather, setWeather] = useState(null);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWeather() {
      try {
        const locRes = await fetch('https://ipwho.is/');
        const locData = await locRes.json();

        if (locData.success) {
          setLocation(locData.city);

          const weatherRes = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${locData.latitude}&longitude=${locData.longitude}&current_weather=true`
          );
          const weatherData = await weatherRes.json();

          if (weatherData.current_weather) {
            setWeather({
              temp: Math.round(weatherData.current_weather.temperature),
              code: weatherData.current_weather.weathercode,
              isDay: weatherData.current_weather.is_day,
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

  const getWeatherIcon = (code, isDay) => {
    if (code === 0) return isDay ? '☀️' : '🌙';
    if (code <= 3) return isDay ? '⛅' : '☁️';
    if (code <= 48) return '🌫️';
    if (code <= 67) return '🌧️';
    if (code <= 77) return '❄️';
    if (code <= 82) return '🌧️';
    if (code <= 99) return '⛈️';
    return '🌡️';
  };

  return (
    <div className="flex flex-col items-end gap-0.5 font-mono text-[11px] text-ink-secondary">
      <div className="uppercase tracking-wide text-[10px] text-ink-tertiary">
        {location || 'Local'}
      </div>
      <div className="flex items-center gap-1.5 text-white font-semibold">
        <span className="text-sm leading-none">
          {getWeatherIcon(weather.code, weather.isDay)}
        </span>
        <span>{weather.temp}° C</span>
      </div>
    </div>
  );
}
