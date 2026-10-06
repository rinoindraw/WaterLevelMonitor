import "leaflet/dist/leaflet.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./styles/global.scss";

// Data sensor datang dari listener Firebase (tanpa polling). React Query hanya
// dipakai untuk data HTTP biasa seperti cuaca (Open-Meteo): hasilnya di-cache,
// jadi pindah halaman tidak memuat ulang dari nol.
const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false } },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
);
