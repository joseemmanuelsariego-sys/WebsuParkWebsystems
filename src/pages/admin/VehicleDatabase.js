
import React, { useEffect, useState } from "react";
import { CarFront, Search, RefreshCw } from "lucide-react";

import api from "../../services/api";
import AdminSidebar from "../../components/admin/AdminSidebar";

import "./AdminDashboard.css";
import "./VehicleDatabase.css";

function VehicleDatabase() {
  const [vehicles, setVehicles] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/vehicles");
      setVehicles(response.data);
    } catch (err) {
      setError("Unable to load vehicle records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const filteredVehicles = vehicles.filter((vehicle) =>
    [
      vehicle.plateNumber,
      vehicle.driverName,
      vehicle.vehicleType,
      vehicle.passType,
    ]
      .join(" ")
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  return (
    <div className="admin-layout">
      <AdminSidebar
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        showDashboardSections={true}
      />

      <main className="admin-main vehicle-main">
        <header className="vehicle-topbar">
          <div>
            <h2>Vehicle Database</h2>
            <p>Manage and monitor registered campus vehicles.</p>
          </div>

          <div className="vehicle-admin-profile">
            <div className="vehicle-profile-icon">HS</div>
            <div>
              <strong>Head Security</strong>
              <span>Administrator</span>
            </div>
          </div>
        </header>

        <section className="vehicle-content">
          <div className="vehicle-page-heading">
            <div>
              <h1>Registered Vehicles</h1>
              <p>
                View vehicle information and assigned parking details.
              </p>
            </div>

            <button
              className="vehicle-refresh-button"
              onClick={fetchVehicles}
              disabled={loading}
            >
              <RefreshCw size={17} />
              Refresh
            </button>
          </div>

          <div className="vehicle-summary-card">
            <div className="vehicle-summary-icon">
              <CarFront size={25} />
            </div>

            <div>
              <span>Total Registered Vehicles</span>
              <h2>{vehicles.length}</h2>
            </div>
          </div>

          <div className="vehicle-table-container">
            <div className="vehicle-table-header">
              <div>
                <h3>Vehicle Records</h3>
                <p>Search registered vehicles in the database.</p>
              </div>

              <div className="vehicle-search-box">
                <Search size={18} />

                <input
                  type="text"
                  placeholder="Search plate, driver, or vehicle..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {loading ? (
              <div className="vehicle-message">
                Loading vehicle records...
              </div>
            ) : error ? (
              <div className="vehicle-message vehicle-error">
                {error}
              </div>
            ) : (
              <div className="vehicle-table-wrapper">
                <table className="vehicle-table">
                  <thead>
                    <tr>
                      <th>Plate Number</th>
                      <th>Driver Name</th>
                      <th>Vehicle</th>
                      <th>Color</th>
                      <th>Pass Type</th>
                      <th>Pass Number</th>
                      <th>Assigned Slot</th>
                      <th>Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredVehicles.length > 0 ? (
                      filteredVehicles.map((vehicle) => (
                        <tr key={vehicle.id}>
                          <td>
                            <strong>
                              {vehicle.plateNumber || "N/A"}
                            </strong>
                          </td>

                          <td>{vehicle.driverName || "N/A"}</td>
                          <td>{vehicle.vehicleType || "N/A"}</td>
                          <td>{vehicle.color || "N/A"}</td>
                          <td>{vehicle.passType || "N/A"}</td>

                          <td>
                            {vehicle.passNumber ||
                              vehicle.passId ||
                              "N/A"}
                          </td>

                          <td>{vehicle.assignedSlot || "N/A"}</td>

                          <td>
                            <span
                              className={`vehicle-status ${
                                String(vehicle.status).toLowerCase() ===
                                "active"
                                  ? "status-active"
                                  : "status-inactive"
                              }`}
                            >
                              {vehicle.status || "Unknown"}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="8" className="vehicle-empty">
                          No vehicle records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default VehicleDatabase;
