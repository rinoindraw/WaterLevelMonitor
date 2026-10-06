import * as L from "leaflet";
import { FiCrosshair } from "react-icons/fi";
import { useMap } from "react-leaflet";
import {
  DEVICE_LOCATION,
  MAP_ZOOM,
} from "../../../../utils/constants/MonitorConstants";
import styles from "./SensorMapZoomButton.module.scss";

// Tombol "zoom ke stasiun": mengembalikan peta ke posisi dan zoom awal. Harus
// di DALAM <MapContainer> (memakai useMap) dan duduk tepat di bawah tombol
// zoom bawaan Leaflet di kiri atas.
const SensorMapZoomButton = () => {
  const map = useMap();

  return (
    <div
      className={styles.zoomButtonWrapper}
      // Klik & geser di tombol tidak boleh ikut menggerakkan peta
      ref={(element) => {
        if (element) {
          L.DomEvent.disableClickPropagation(element);
          L.DomEvent.disableScrollPropagation(element);
        }
      }}
    >
      <button
        type="button"
        className={styles.zoomButton}
        aria-label="Zoom ke stasiun"
        title="Zoom ke stasiun"
        onClick={() => map.setView(DEVICE_LOCATION, MAP_ZOOM, { animate: true })}
      >
        <FiCrosshair aria-hidden />
      </button>
    </div>
  );
};

export default SensorMapZoomButton;
