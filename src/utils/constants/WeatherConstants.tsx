import type { IconType } from "react-icons";
import {
  WiCloudy,
  WiDayCloudy,
  WiDaySunny,
  WiFog,
  WiNightAltCloudy,
  WiNightClear,
  WiRain,
  WiShowers,
  WiSnow,
  WiSprinkle,
  WiThunderstorm,
} from "react-icons/wi";

export interface WeatherInfo {
  label: string;
  dayIcon: IconType;
  nightIcon: IconType;
}

// Kode WMO yang dipakai Open-Meteo, dikelompokkan per rentang.
// Dicek berurutan; yang pertama cocok dipakai.
const WEATHER_RULES: { codes: number[]; info: WeatherInfo }[] = [
  { codes: [0], info: { label: "Cerah", dayIcon: WiDaySunny, nightIcon: WiNightClear } },
  { codes: [1], info: { label: "Cerah berawan", dayIcon: WiDayCloudy, nightIcon: WiNightAltCloudy } },
  { codes: [2], info: { label: "Berawan sebagian", dayIcon: WiDayCloudy, nightIcon: WiNightAltCloudy } },
  { codes: [3], info: { label: "Berawan", dayIcon: WiCloudy, nightIcon: WiCloudy } },
  { codes: [45, 48], info: { label: "Berkabut", dayIcon: WiFog, nightIcon: WiFog } },
  { codes: [51, 53, 55, 56, 57], info: { label: "Gerimis", dayIcon: WiSprinkle, nightIcon: WiSprinkle } },
  { codes: [61, 63, 65, 66, 67], info: { label: "Hujan", dayIcon: WiRain, nightIcon: WiRain } },
  { codes: [71, 73, 75, 77, 85, 86], info: { label: "Salju", dayIcon: WiSnow, nightIcon: WiSnow } },
  { codes: [80, 81, 82], info: { label: "Hujan lebat sesaat", dayIcon: WiShowers, nightIcon: WiShowers } },
  { codes: [95, 96, 99], info: { label: "Badai petir", dayIcon: WiThunderstorm, nightIcon: WiThunderstorm } },
];

const UNKNOWN_WEATHER: WeatherInfo = {
  label: "Tidak diketahui",
  dayIcon: WiCloudy,
  nightIcon: WiCloudy,
};

export const getWeatherInfo = (code: number): WeatherInfo =>
  WEATHER_RULES.find((rule) => rule.codes.includes(code))?.info ??
  UNKNOWN_WEATHER;
