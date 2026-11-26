import React, { useEffect, useState } from "react";
import {
  CarFront,
  MapPin,
  RefreshCw,
  ParkingCircle,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

import api from "../../services/api";
import AdminSidebar from "../../components/admin/AdminSidebar";

import "./AdminDashboard.css";
import "./ParkingMonitoring.css";

function ParkingMonitoring() {
  const [parkingAreas, setParkingAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const fetchParkingAreas = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/parkingAreas");
      setParkingAreas(response.data);
    } catch (err) {
      setError("Unable to load parking information.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParkingAreas();
  }, []);

  const totalSpaces = parkingAreas.reduce(
    (sum, area) => sum + Number(area.totalSpaces || 0),
    0,
  );

  const occupiedSpaces = parkingAreas.reduce(
    (sum, area) => sum + Number(area.occupiedSpaces || 0),
    0,
  );

  const availableSpaces = parkingAreas.reduce(
    (sum, area) => sum + Number(area.availableSpaces || 0),
    0,
  );

  const getOccupancy = (occupied, total) => {
    if (!total) return 0;
    return Math.round((occupied / total) * 100);
  };

  return (
    <div className="admin-layout">
      <AdminSidebar
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        showDashboardSections={true}
      />

      <main className="admin-main parking-main">
        <header className="parking-topbar">
          <div>
            <h2>Parking Monitoring</h2>
            <p>Monitor campus parking capacity and availability.</p>
          </div>

          <div className="parking-admin-profile">
            <div className="parking-profile-icon">HS</div>
            <div>
              <strong>Head Security</strong>
              <span>Administrator</span>
            </div>
          </div>
        </header>

        <section className="parking-content">
          <div className="parking-page-heading">
            <div>
              <h1>Campus Parking Overview</h1>
              <p>View parking occupancy and available spaces by area.</p>
            </div>

            <button
              className="parking-refresh-button"
              onClick={fetchParkingAreas}
              disabled={loading}
            >
              <RefreshCw size={17} />
              Refresh
            </button>
          </div>

          <div className="parking-summary-grid">
            <div className="parking-summary-card">
              <div className="parking-summary-icon blue">
                <ParkingCircle size={24} />
              </div>
              <div>
                <span>Total Parking Spaces</span>
                <h2>{totalSpaces}</h2>
              </div>
            </div>

            <div className="parking-summary-card">
              <div className="parking-summary-icon orange">
                <CarFront size={24} />
              </div>
              <div>
                <span>Occupied Spaces</span>
                <h2>{occupiedSpaces}</h2>
              </div>
            </div>

            <div className="parking-summary-card">
              <div className="parking-summary-icon green">
                <CheckCircle size={24} />
              </div>
              <div>
                <span>Available Spaces</span>
                <h2>{availableSpaces}</h2>
              </div>
            </div>

            <div className="parking-summary-card">
              <div className="parking-summary-icon purple">
                <MapPin size={24} />
              </div>
              <div>
                <span>Parking Areas</span>
                <h2>{parkingAreas.length}</h2>
              </div>
            </div>
          </div>

          <div className="parking-section-heading">
            <div>
              <h3>Parking Area Details</h3>
              <p>Occupancy status for each designated parking area.</p>
            </div>
          </div>

          {loading ? (
            <div className="parking-message">
              Loading parking information...
            </div>
          ) : error ? (
            <div className="parking-message parking-error">{error}</div>
          ) : parkingAreas.length === 0 ? (
            <div className="parking-message">No parking areas found.</div>
          ) : (
            <div className="parking-area-grid">
              {parkingAreas.map((area) => {
                const total = Number(area.totalSpaces || 0);
                const occupied = Number(area.occupiedSpaces || 0);
                const available = Number(area.availableSpaces || 0);

                const percentage = getOccupancy(occupied, total);
                const isFull = available === 0 && total > 0;

                return (
                  <div className="parking-area-card" key={area.id}>
                    <div className="parking-area-card-header">
                      <div className="parking-area-icon">
                        <MapPin size={23} />
                      </div>

                      <span
                        className={`parking-area-status ${
                          isFull ? "parking-full" : "parking-available"
                        }`}
                      >
                        {isFull ? "Full" : "Available"}
                      </span>
                    </div>

                    <h3>{area.name || `Parking Area ${area.id}`}</h3>

                    <p className="parking-area-description">
                      Parking area capacity and occupancy information
                    </p>

                    <div className="parking-occupancy-heading">
                      <span>Occupancy Rate</span>
                      <strong>{percentage}%</strong>
                    </div>

                    <div className="parking-progress">
                      <div
                        className={`parking-progress-fill ${
                          isFull ? "progress-full" : ""
                        }`}
                        style={{
                          width: `${Math.min(percentage, 100)}%`,
                        }}
                      />
                    </div>

                    <div className="parking-area-stats">
                      <div>
                        <span>Total Spaces</span>
                        <strong>{total}</strong>
                      </div>

                      <div>
                        <span>Occupied</span>
                        <strong>{occupied}</strong>
                      </div>

                      <div>
                        <span>Available</span>
                        <strong>{available}</strong>
                      </div>
                    </div>

                    <div
                      className={`parking-area-notice ${
                        isFull ? "notice-full" : "notice-available"
                      }`}
                    >
                      {isFull ? (
                        <>
                          <AlertTriangle size={16} />
                          Parking area is currently full.
                        </>
                      ) : (
                        <>
                          <CheckCircle size={16} />
                          {available} parking spaces available.
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default ParkingMonitoring;
