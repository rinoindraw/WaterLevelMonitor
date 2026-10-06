import { useQuery } from "@tanstack/react-query";
import { WeatherService } from "../../services/Weather/WeatherService";
import { WEATHER_REFRESH_MS } from "../../utils/constants/MonitorConstants";

// Cuaca lewat React Query: hasilnya di-cache per lokasi, jadi kartu di Peta dan
// ringkasan di Dashboard berbagi satu permintaan, dan pindah halaman langsung
// menampilkan data yang sudah ada (tanpa memuat ulang selama masih segar).
// Disegarkan tiap WEATHER_REFRESH_MS; kalau penyegaran gagal, data terakhir
// dipertahankan dan isFailed menyala.
export const UseWeather = (latitude: number, longitude: number) => {
  const query = useQuery({
    queryKey: ["weather", latitude, longitude],
    queryFn: () => WeatherService.fetchCurrent(latitude, longitude),
    staleTime: WEATHER_REFRESH_MS,
    refetchInterval: WEATHER_REFRESH_MS,
    retry: 1,
  });

  return {
    weather: query.data ?? null,
    isLoading: query.isPending,
    isFailed: query.isError,
  };
};
