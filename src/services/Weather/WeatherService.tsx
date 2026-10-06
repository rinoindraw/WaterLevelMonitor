import { WEATHER_API_URL } from "../../utils/constants/MonitorConstants";

// [NEW] Bentuk respons Open-Meteo. Nama field berasal dari API, jadi
// dibiarkan apa adanya.
interface WeatherResponse {
  current: {
    time: string; // ISO lokal, mis. "2026-10-04T16:00"
    temperature_2m: number;
    relative_humidity_2m: number;
    precipitation: number; // mm
    weather_code: number; // kode WMO
    is_day: number; // 1 siang, 0 malam
  };
  hourly: {
    precipitation_probability: number[];
  };
}

export interface WeatherCurrent {
  time: string;
  temperatureC: number;
  humidityPercent: number;
  precipitationMm: number;
  // Peluang hujan jam berjalan. Tidak ada di blok `current`, jadi diambil
  // dari `hourly` (forecast_hours=1). Null kalau API tidak mengirimnya.
  rainChancePercent: number | null;
  weatherCode: number;
  isDay: boolean;
}

export const WeatherService = {
  fetchCurrent: async (
    latitude: number,
    longitude: number,
  ): Promise<WeatherCurrent> => {
    const params = new URLSearchParams({
      latitude: String(latitude),
      longitude: String(longitude),
      current:
        "temperature_2m,relative_humidity_2m,precipitation,weather_code,is_day",
      hourly: "precipitation_probability",
      forecast_hours: "1",
      timezone: "auto",
    });

    const response = await fetch(`${WEATHER_API_URL}?${params}`);
    if (!response.ok) throw new Error(`Cuaca gagal dimuat (${response.status})`);

    const data = (await response.json()) as WeatherResponse;
    return {
      time: data.current.time,
      temperatureC: data.current.temperature_2m,
      humidityPercent: data.current.relative_humidity_2m,
      precipitationMm: data.current.precipitation,
      rainChancePercent: data.hourly?.precipitation_probability?.[0] ?? null,
      weatherCode: data.current.weather_code,
      isDay: data.current.is_day === 1,
    };
  },
};
