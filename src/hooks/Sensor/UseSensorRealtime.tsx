import { useEffect, useState } from "react";
import { SensorService } from "../../services/Sensor/SensorService";
import {
  UseSensorStore,
  type SensorSample,
} from "../../stores/Sensor/SensorStore";
import {
  CONNECTION_TIMEOUT_MS,
  SENSORS,
  SNAPSHOT_SETTLE_MS,
} from "../../utils/constants/MonitorConstants";

export type ConnectionState = "connecting" | "live" | "offline";

// Dipanggil SEKALI di AppContent, bukan per halaman, supaya buffer tetap
// terisi saat user sedang di halaman Map.
export const UseSensorRealtime = (): ConnectionState => {
  const appendSample = UseSensorStore((state) => state.appendSample);
  const [connection, setConnection] = useState<ConnectionState>("connecting");

  useEffect(() => {
    let settleTimer: ReturnType<typeof setTimeout> | undefined;

    // [NEW] Tanpa ini spinner berputar selamanya saat Firebase tak terjangkau
    const connectTimer = setTimeout(
      () => setConnection((previous) => (previous === "connecting" ? "offline" : previous)),
      CONNECTION_TIMEOUT_MS,
    );

    const unsubscribeData = SensorService.subscribeSnapshot(
      (snapshot) => {
        // Satu loop() ESP32 = beberapa event beruntun (jarak_cm lalu status,
        // per sensor). Tunggu sampai tenang, baru catat SATU titik dari
        // snapshot terakhir.
        clearTimeout(settleTimer);
        settleTimer = setTimeout(() => {
          const readings: SensorSample["readings"] = {};
          for (const sensor of SENSORS) {
            const node = snapshot[sensor.id];
            if (typeof node?.jarak_cm === "number") {
              readings[sensor.id] = { distanceCm: node.jarak_cm, status: node.status };
            }
          }
          appendSample({ time: Date.now(), readings });
        }, SNAPSHOT_SETTLE_MS);
      },
      () => setConnection("offline"),
    );

    // .info/connected bernilai false sebelum socket pertama tersambung —
    // saat itu tetap "connecting", bukan "offline".
    const unsubscribeConnection = SensorService.subscribeConnection((isConnected) =>
      setConnection((previous) =>
        isConnected ? "live" : previous === "connecting" ? "connecting" : "offline",
      ),
    );

    return () => {
      clearTimeout(settleTimer);
      clearTimeout(connectTimer);
      unsubscribeData();
      unsubscribeConnection();
    };
  }, [appendSample]);

  return connection;
};
