import {
  OBJECT_ELEVATED_CM,
  OBJECT_PREDICTIONS,
  SENSORS,
} from "../../utils/constants/MonitorConstants";

export interface ObjectPrediction {
  label: string;
  description: string;
}

// Memprediksi objek dari tinggi ketiga sensor (cm dari dasar), urut mengikuti
// SENSORS: kiri, tengah, kanan. Mengembalikan undefined kalau ada sensor yang
// tidak terbaca — bentuk dari dua titik tidak berarti.
export const predictObject = (
  heights: (number | null)[],
): ObjectPrediction | undefined => {
  if (heights.length !== 3 || heights.some((height) => height === null)) {
    return undefined;
  }
  const [left, middle, right] = heights as number[];

  const peakCm = Math.max(left, middle, right);
  const lowestCm = Math.min(left, middle, right);
  const spreadCm = peakCm - lowestCm;
  const tiltCm = Math.abs(left - right);
  const midDeviationCm = Math.abs(middle - (left + right) / 2);

  const rule = OBJECT_PREDICTIONS.find(
    (item) =>
      (item.minPeakCm === undefined || peakCm >= item.minPeakCm) &&
      (item.maxPeakCm === undefined || peakCm < item.maxPeakCm) &&
      (item.minSpreadCm === undefined || spreadCm >= item.minSpreadCm) &&
      (item.maxSpreadCm === undefined || spreadCm < item.maxSpreadCm) &&
      (item.minTiltCm === undefined || tiltCm >= item.minTiltCm) &&
      (item.maxMidDeviationCm === undefined ||
        midDeviationCm < item.maxMidDeviationCm),
  );
  if (!rule) return undefined;

  // Sensor yang terangkat dari permukaan terendah, mis. "kiri dan tengah"
  const elevated = (heights as number[])
    .map((height, index) =>
      height - lowestCm >= OBJECT_ELEVATED_CM
        ? SENSORS[index].location.toLowerCase()
        : null,
    )
    .filter((name): name is string => name !== null)
    .join(" dan ");
  const higherSide = left > right ? "kiri" : "kanan";

  const fill = (text: string) =>
    text.replace("{posisi}", elevated).replace("{sisiTinggi}", higherSide);
  return { label: fill(rule.label), description: fill(rule.description) };
};
