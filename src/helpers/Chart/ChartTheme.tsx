// Palet teks/garis chart ECharts yang mengikuti tema. ECharts menggambar ke
// canvas, jadi warnanya dari config JS, bukan CSS. Nilainya diselaraskan
// dengan token di _colors.scss.
export interface ChartTheme {
  labelStrong: string;
  labelMuted: string;
  splitLine: string;
  axisLine: string;
  tooltipBackground: string;
  // Pita ambang di chart sensor. Mode gelap butuh takaran sendiri: arsiran
  // setipis mode terang hampir hilang di atas latar gelap.
  dangerBand: string;
  alertBand: string;
  // [NEW] Bentuk objek di chart profil. Netral (slate), bukan warna sensor:
  // yang digambar objeknya, bukan identitas satu sensor.
  objectLine: string;
  objectFill: string;
}

export const getChartTheme = (isDark: boolean): ChartTheme =>
  isDark
    ? {
        // [CHANGED] mengikuti latar gelap netral (#1a1d24)
        labelStrong: "#e7e8ee",
        labelMuted: "#9b9fb0",
        splitLine: "rgba(255, 255, 255, 0.07)",
        axisLine: "#2b2f3a",
        tooltipBackground: "#1a1d24",
        // Latar netral tidak lagi menggeser kuning jadi hijau, jadi takarannya
        // bisa lebih tipis dari sebelumnya (0.28 / 0.30)
        dangerBand: "rgba(208, 59, 59, 0.22)",
        alertBand: "rgba(250, 178, 25, 0.18)",
        objectLine: "#9b9fb0",
        objectFill: "rgba(155, 159, 176, 0.2)",
      }
    : {
        // [CHANGED]
        labelStrong: "#4a4f5c",
        labelMuted: "#8a8fa0",
        splitLine: "#eeeff8",
        axisLine: "#e4e5f4",
        tooltipBackground: "#fbfbff", // sama dengan warna kartu
        dangerBand: "rgba(208, 59, 59, 0.10)",
        alertBand: "rgba(250, 178, 25, 0.12)",
        objectLine: "#6b7080",
        objectFill: "rgba(107, 112, 128, 0.16)",
      };
