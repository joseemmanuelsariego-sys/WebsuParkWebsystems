import React, { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Popup,
  CircleMarker,
  Marker,
  useMap,
} from "react-leaflet";

import L from "leaflet";
import { RotateCcw, MapPin } from "lucide-react";

import "leaflet/dist/leaflet.css";
import "./CampusMap.css";

// WVSU MAIN CAMPUS MAP CENTER
const center = [10.7135, 122.5622];
const defaultZoom = 16;
const parkingZoom = 19;

// DETERMINE PARKING STATUS
const getParkingStatus = (area) => {
  const total = Number(area.totalSpaces || 0);
  const available = Number(area.availableSpaces || 0);

  if (available <= 0 || total <= 0) {
    return "full";
  }

  const percentage = (available / total) * 100;

  if (percentage <= 50) {
    return "limited";
  }

  return "available";
};

// GET STATUS COLOR
const getStatusColor = (status) => {
  const colors = {
    available: "#16a34a",
    limited: "#f59e0b",
    full: "#dc2626",
  };

  return colors[status];
};

// GET STATUS LABEL
const getStatusLabel = (status) => {
  const labels = {
    available: "Parking Available",
    limited: "Limited Availability",
    full: "Parking Full",
  };

  return labels[status];
};

// GET VALID COORDINATES
const getAreaPosition = (area) => {
  const lat = Number(area.lat);
  const lng = Number(area.lng);

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180
  ) {
    return null;
  }

  return [lat, lng];
};

// MAP CONTROLLER
function MapController({ selectedArea, parkingAreas, focusTrigger }) {
  const map = useMap();

  useEffect(() => {
    if (selectedArea === null || selectedArea === undefined) {
      return;
    }

    const area = parkingAreas.find(
      (item) => String(item.id) === String(selectedArea),
    );

    if (!area) return;

    const position = getAreaPosition(area);

    if (!position) return;

    // ZOOM TO THE SELECTED PARKING AREA
    map.flyTo(position, parkingZoom, {
      duration: 1.5,
      easeLinearity: 0.25,
    });
  }, [selectedArea, parkingAreas, focusTrigger, map]);

  return null;
}

function CampusMap({
  parkingAreas = [],
  selectedArea = null,
  onSelectArea,
  onReset,
  focusTrigger = 0,
}) {
  const [mapInstance, setMapInstance] = useState(null);

  // GET ALL VALID PARKING POSITIONS
  const getVisiblePositions = () => {
    return parkingAreas
      .map((area) => getAreaPosition(area))
      .filter((position) => position !== null);
  };

  // RESET MAP VIEW
  const resetMap = () => {
    if (mapInstance) {
      mapInstance.flyTo(center, defaultZoom, {
        duration: 1.2,
      });
    }

    if (onReset) {
      onReset();
    }
  };

  // SHOW ALL VISIBLE PARKING AREAS
  const showAllAreas = () => {
    if (!mapInstance) return;

    const visiblePositions = getVisiblePositions();

    if (visiblePositions.length === 0) return;

    if (visiblePositions.length === 1) {
      mapInstance.flyTo(visiblePositions[0], parkingZoom, {
        duration: 1.2,
      });

      return;
    }

    const bounds = L.latLngBounds(visiblePositions);

    mapInstance.fitBounds(bounds, {
      padding: [50, 50],
      maxZoom: 18,
      animate: true,
    });
  };

  return (
    <div className="campus-map-container">
      {/* MAP LEGEND AND CONTROLS */}
      <div className="map-legend">
        <span>
          <i style={{ background: "#16a34a" }}></i>
          Available
        </span>

        <span>
          <i style={{ background: "#f59e0b" }}></i>
          Limited
        </span>

        <span>
          <i style={{ background: "#dc2626" }}></i>
          Full
        </span>

        <span>
          <i style={{ background: "#2563eb" }}></i>
          Campus Location
        </span>

        <button type="button" className="map-reset-button" onClick={resetMap}>
          <RotateCcw size={15} />
          Reset Map View
        </button>

        <button
          type="button"
          className="map-reset-button"
          onClick={showAllAreas}
        >
          <MapPin size={15} />
          Show All Areas
        </button>
      </div>

      {/* INTERACTIVE MAP */}
      <MapContainer
        center={center}
        zoom={defaultZoom}
        maxZoom={19}
        className="campus-map"
        whenReady={(event) => setMapInstance(event.target)}
      >
        <MapController
          selectedArea={selectedArea}
          parkingAreas={parkingAreas}
          focusTrigger={focusTrigger}
        />

        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
          maxZoom={19}
        />

        {/* CAMPUS MARKER */}
        <Marker position={center}>
          <Popup>
            <strong>WVSU Main Campus</strong>
            <br />
            West Visayas State University
          </Popup>
        </Marker>

        {/* PARKING AREA MARKERS */}
        {parkingAreas.map((area) => {
          const position = getAreaPosition(area);

          if (!position) return null;

          const total = Number(area.totalSpaces || 0);
          const occupied = Number(area.occupiedSpaces || 0);
          const available = Number(area.availableSpaces || 0);

          const occupancy =
            total > 0 ? Math.min((occupied / total) * 100, 100) : 0;

          const status = getParkingStatus(area);
          const color = getStatusColor(status);
          const statusLabel = getStatusLabel(status);

          const isSelected = String(selectedArea) === String(area.id);

          return (
            <CircleMarker
              key={area.id}
              center={position}
              radius={isSelected ? 16 : 13}
              eventHandlers={{
                click: () => {
                  if (onSelectArea) {
                    onSelectArea(area.id);
                  }
                },
              }}
              pathOptions={{
                color: isSelected ? "#1d4ed8" : "#ffffff",
                weight: isSelected ? 4 : 3,
                fillColor: color,
                fillOpacity: 1,
              }}
            >
              <Popup>
                <div className="map-popup-details">
                  <h3>{area.name}</h3>

                  <span className="map-popup-id">Parking Area {area.id}</span>

                  <div className="map-popup-status">
                    <span className={`map-popup-status-dot ${status}`} />

                    <strong style={{ color }}>{statusLabel}</strong>
                  </div>

                  <div className="map-popup-stat">
                    <span>Total Capacity</span>
                    <strong>{total} spaces</strong>
                  </div>

                  <div className="map-popup-stat">
                    <span>Occupied</span>
                    <strong>{occupied}</strong>
                  </div>

                  <div className="map-popup-stat">
                    <span>Available</span>
                    <strong>{available}</strong>
                  </div>

                  <div className="map-popup-occupancy">
                    <div className="map-popup-occupancy-heading">
                      <span>Occupancy</span>
                      <strong>{occupancy.toFixed(0)}%</strong>
                    </div>

                    <div className="map-popup-progress">
                      <div
                        style={{
                          width: `${occupancy}%`,
                          background: color,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}

export default CampusMap;
