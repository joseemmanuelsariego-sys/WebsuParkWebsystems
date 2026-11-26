import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import {
  CarFront,
  ParkingSquare,
  AlertTriangle,
  ShieldCheck,
  Menu,
  RefreshCw,
  Clock,
  CheckCircle,
  Activity,
  MapPin,
  Navigation,
  Search,
  LogIn,
  LogOut,
  Users,
} from "lucide-react";

import api from "../../services/api";
import AdminSidebar from "../../components/admin/AdminSidebar";
import "./AdminDashboard.css";

function AdminDashboard() {
  const [vehicles, setVehicles] = useState([]);
  const [violations, setViolations] = useState([]);
  const [parkingAreas, setParkingAreas] = useState([]);

  const [yellowPasses, setYellowPasses] = useState([]);
  const [outsideVehicles, setOutsideVehicles] = useState([]);
  const [entranceLogs, setEntranceLogs] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const [yellowSearch, setYellowSearch] = useState("");
  const [outsideSearch, setOutsideSearch] = useState("");
  const [entranceSearch, setEntranceSearch] = useState("");

  // FETCH DASHBOARD DATA
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        vehicleResponse,
        violationResponse,
        parkingResponse,
        yellowResponse,
        outsideResponse,
        entranceResponse,
      ] = await Promise.all([
        api.get("/vehicles"),
        api.get("/violations"),
        api.get("/parkingAreas"),
        api.get("/yellowPasses").catch(() => ({ data: [] })),
        api.get("/outsideVehicles").catch(() => ({ data: [] })),
        api.get("/entranceLogs").catch(() => ({ data: [] })),
      ]);

      setVehicles(vehicleResponse.data || []);
      setViolations(violationResponse.data || []);
      setParkingAreas(parkingResponse.data || []);

      setYellowPasses(yellowResponse.data || []);
      setOutsideVehicles(outsideResponse.data || []);
      setEntranceLogs(entranceResponse.data || []);
    } catch (err) {
      console.error("Dashboard loading error:", err);
      setError(
        "Unable to load dashboard information. Please check JSON Server.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // DATE FORMAT
  const formatDate = (value) => {
    if (!value) return "N/A";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // STATUS CLASS
  const getStatusClass = (status) => {
    const value = (status || "pending").toLowerCase();

    if (
      ["active", "inside", "approved", "entered", "recorded"].includes(value)
    ) {
      return "monitor-status-active";
    }

    if (["expired", "rejected", "exited"].includes(value)) {
      return "monitor-status-expired";
    }

    return "monitor-status-pending";
  };

  // DASHBOARD STATISTICS
  const pendingViolations = violations.filter(
    (item) => item.status?.toLowerCase() === "pending",
  ).length;

  const resolvedViolations = violations.filter(
    (item) =>
      item.status?.toLowerCase() === "resolved" ||
      item.status?.toLowerCase() === "confirmed",
  ).length;

  const totalSpaces = parkingAreas.reduce(
    (total, area) => total + Number(area.totalSpaces || 0),
    0,
  );

  const occupiedSpaces = parkingAreas.reduce(
    (total, area) => total + Number(area.occupiedSpaces || 0),
    0,
  );

  const availableSpaces = parkingAreas.reduce(
    (total, area) => total + Number(area.availableSpaces || 0),
    0,
  );

  // YELLOW PASS STATISTICS
  const activeYellowPasses = yellowPasses.filter((pass) =>
    ["active", "recorded"].includes((pass.status || "recorded").toLowerCase()),
  ).length;

  // GET THE LATEST ENTRY OR EXIT RECORD FOR EACH VEHICLE
  const latestEntranceRecords = Object.values(
    entranceLogs.reduce((records, log) => {
      const plate = (log.plateNumber || "").trim().toUpperCase();

      if (!plate) return records;

      const logTime = new Date(
        log.timestamp || log.entryTime || log.exitTime || 0,
      ).getTime();

      const existing = records[plate];

      const existingTime = existing
        ? new Date(
            existing.timestamp || existing.entryTime || existing.exitTime || 0,
          ).getTime()
        : -1;

      if (!existing || logTime >= existingTime) {
        records[plate] = log;
      }

      return records;
    }, {}),
  );

  const vehiclesCurrentlyInside = latestEntranceRecords.filter(
    (log) => (log.action || "").toLowerCase() === "entry",
  ).length;

  const vehiclesExited = entranceLogs.filter(
    (log) => (log.action || "").toLowerCase() === "exit",
  ).length;

  // SEARCH FILTERS
  const filteredYellowPasses = yellowPasses.filter((pass) => {
    const search = yellowSearch.toLowerCase();

    return (
      (pass.plateNumber || "").toLowerCase().includes(search) ||
      (pass.driverName || pass.visitorName || "")
        .toLowerCase()
        .includes(search) ||
      (pass.passNumber || "").toLowerCase().includes(search) ||
      (pass.purpose || "").toLowerCase().includes(search)
    );
  });

  const filteredOutsideVehicles = outsideVehicles.filter((vehicle) => {
    const search = outsideSearch.toLowerCase();

    return (
      (vehicle.plateNumber || "").toLowerCase().includes(search) ||
      (vehicle.visitorName || vehicle.driverName || "")
        .toLowerCase()
        .includes(search) ||
      (vehicle.purpose || "").toLowerCase().includes(search) ||
      (vehicle.vehicleType || "").toLowerCase().includes(search)
    );
  });

  const filteredEntranceLogs = entranceLogs.filter((log) => {
    const search = entranceSearch.toLowerCase();

    return (
      (log.plateNumber || "").toLowerCase().includes(search) ||
      (log.driverName || "").toLowerCase().includes(search) ||
      (log.checkpoint || "").toLowerCase().includes(search) ||
      (log.action || "").toLowerCase().includes(search)
    );
  });

  return (
    <div className="admin-layout">
      <AdminSidebar
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        showDashboardSections={true}
      />

      <main className="admin-main">
        {/* TOPBAR */}
        <header className="admin-topbar">
          <button
            type="button"
            className="admin-menu-button"
            onClick={() => setMenuOpen(true)}
          >
            <Menu size={23} />
          </button>

          <div className="admin-topbar-title">
            <h2>Head Security Dashboard</h2>
            <p>Western Visayas State University</p>
          </div>

          <button
            type="button"
            className="admin-refresh-button"
            onClick={loadDashboardData}
            disabled={loading}
          >
            <RefreshCw size={17} />
            <span>{loading ? "Loading..." : "Refresh"}</span>
          </button>
        </header>

        <div className="admin-content">
          {/* WELCOME SECTION */}
          <section className="admin-welcome">
            <div>
              <p className="admin-eyebrow">WEBSUPARK ADMINISTRATION</p>
              <h1>Welcome, Head Security!</h1>
              <p>
                Monitor vehicle registration, parking activity, and security
                reports across the campus.
              </p>
            </div>

            <div className="admin-welcome-icon">
              <ShieldCheck size={54} />
            </div>
          </section>

          {error && <div className="admin-error">{error}</div>}

          {/* SYSTEM OVERVIEW */}
          <section className="admin-section">
            <div className="admin-section-heading">
              <div>
                <h2>System Overview</h2>
                <p>Current parking and security information</p>
              </div>

              <span className="admin-live-label">
                <span className="admin-live-dot" />
                System Overview
              </span>
            </div>

            <div className="admin-stats-grid">
              <div className="admin-stat-card">
                <div className="admin-stat-icon blue">
                  <CarFront size={23} />
                </div>

                <div>
                  <p>Registered Vehicles</p>
                  <h3>{loading ? "..." : vehicles.length}</h3>
                  <span>Vehicles in database</span>
                </div>
              </div>

              <div className="admin-stat-card">
                <div className="admin-stat-icon green">
                  <ParkingSquare size={23} />
                </div>

                <div>
                  <p>Occupied Spaces</p>
                  <h3>{loading ? "..." : occupiedSpaces}</h3>
                  <span>Out of {totalSpaces} parking spaces</span>
                </div>
              </div>

              <div className="admin-stat-card">
                <div className="admin-stat-icon orange">
                  <AlertTriangle size={23} />
                </div>

                <div>
                  <p>Pending Violations</p>
                  <h3>{loading ? "..." : pendingViolations}</h3>
                  <span>Reports awaiting review</span>
                </div>
              </div>

              <div className="admin-stat-card">
                <div className="admin-stat-icon purple">
                  <ShieldCheck size={23} />
                </div>

                <div>
                  <p>Yellow Passes</p>
                  <h3>{loading ? "..." : yellowPasses.length}</h3>
                  <span>Recorded temporary passes</span>
                </div>
              </div>
            </div>
          </section>

          {/* CAMPUS MAP */}
          <section className="admin-section">
            <div className="admin-section-heading">
              <div>
                <h2>Campus Map</h2>
                <p>View parking locations and locate registered vehicles.</p>
              </div>

              <NavLink to="/campus-map" className="admin-view-link">
                Open Campus Map
              </NavLink>
            </div>

            <NavLink to="/campus-map" className="admin-campus-map-card">
              <div className="admin-campus-map-icon">
                <MapPin size={30} />
              </div>

              <div className="admin-campus-map-info">
                <h3>Campus Parking Map</h3>
                <p>
                  Monitor parking areas, check available spaces, and locate
                  vehicles using their plate numbers.
                </p>

                <span>
                  <Navigation size={15} />
                  View Interactive Map
                </span>
              </div>

              <div className="admin-campus-map-arrow">
                <Navigation size={22} />
              </div>
            </NavLink>
          </section>

          {/* PARKING AREA MONITORING */}
          <section className="admin-section">
            <div className="admin-section-heading">
              <div>
                <h2>Parking Area Monitoring</h2>
                <p>Current occupancy of registered parking areas</p>
              </div>

              <NavLink to="/admin/parking" className="admin-view-link">
                View Details
              </NavLink>
            </div>

            <div className="admin-parking-grid">
              {parkingAreas.map((area) => {
                const percentage =
                  Number(area.totalSpaces) > 0
                    ? Math.round(
                        (Number(area.occupiedSpaces || 0) /
                          Number(area.totalSpaces)) *
                          100,
                      )
                    : 0;

                return (
                  <div className="admin-parking-card" key={area.id}>
                    <div className="admin-parking-card-top">
                      <div className="admin-parking-icon">
                        <ParkingSquare size={22} />
                      </div>

                      <span
                        className={
                          Number(area.availableSpaces) === 0
                            ? "admin-area-status full"
                            : "admin-area-status available"
                        }
                      >
                        {Number(area.availableSpaces) === 0
                          ? "Full"
                          : "Available"}
                      </span>
                    </div>

                    <h3>{area.name || `Parking Area ${area.id}`}</h3>

                    <div className="admin-parking-numbers">
                      <strong>{area.occupiedSpaces || 0}</strong>
                      <span>/ {area.totalSpaces || 0} occupied</span>
                    </div>

                    <div className="admin-progress-track">
                      <div
                        className="admin-progress-fill"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>

                    <p className="admin-available-text">
                      {area.availableSpaces || 0} available spaces
                    </p>
                  </div>
                );
              })}

              {!loading && parkingAreas.length === 0 && (
                <p className="admin-empty">No parking area data found.</p>
              )}
            </div>

            <div className="admin-parking-summary">
              <div>
                <span>Total Spaces</span>
                <strong>{loading ? "..." : totalSpaces}</strong>
              </div>

              <div>
                <span>Occupied</span>
                <strong>{loading ? "..." : occupiedSpaces}</strong>
              </div>

              <div>
                <span>Available</span>
                <strong>{loading ? "..." : availableSpaces}</strong>
              </div>
            </div>
          </section>

          {/* YELLOW PASS MONITORING */}
          <section className="admin-section" id="yellow-passes">
            <div className="admin-section-heading">
              <div>
                <h2>Yellow Pass Monitoring</h2>
                <p>
                  Monitor temporary passes and their recorded vehicle
                  information.
                </p>
              </div>

              <span className="admin-live-label">
                <span className="admin-live-dot" />
                {activeYellowPasses} Recorded Passes
              </span>
            </div>

            <div className="monitor-summary-grid">
              <div className="monitor-summary-card">
                <ShieldCheck size={22} />
                <div>
                  <span>Total Yellow Passes</span>
                  <strong>{yellowPasses.length}</strong>
                </div>
              </div>

              <div className="monitor-summary-card">
                <CheckCircle size={22} />
                <div>
                  <span>Recorded Passes</span>
                  <strong>{activeYellowPasses}</strong>
                </div>
              </div>

              <div className="monitor-summary-card">
                <Clock size={22} />
                <div>
                  <span>Expired Passes</span>
                  <strong>
                    {
                      yellowPasses.filter(
                        (pass) =>
                          (pass.status || "").toLowerCase() === "expired",
                      ).length
                    }
                  </strong>
                </div>
              </div>
            </div>

            <div className="monitor-panel">
              <div className="monitor-panel-toolbar">
                <h3>Temporary Pass Records</h3>

                <div className="monitor-search">
                  <Search size={17} />
                  <input
                    value={yellowSearch}
                    onChange={(e) => setYellowSearch(e.target.value)}
                    placeholder="Search plate, driver, pass number..."
                  />
                </div>
              </div>

              <div className="admin-table-wrapper">
                <table className="admin-table monitor-table">
                  <thead>
                    <tr>
                      <th>Pass Number</th>
                      <th>Plate Number</th>
                      <th>Driver</th>
                      <th>Vehicle Type</th>
                      <th>Scan Time</th>
                      <th>Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredYellowPasses.map((pass) => (
                      <tr key={pass.id}>
                        <td>{pass.passNumber || pass.id}</td>
                        <td>{pass.plateNumber || "N/A"}</td>
                        <td>{pass.driverName || pass.visitorName || "N/A"}</td>
                        <td>
                          {pass.vehicleType || pass.vehicleModel || "N/A"}
                        </td>
                        <td>{formatDate(pass.scannedAt || pass.timestamp)}</td>
                        <td>
                          <span
                            className={`monitor-status ${getStatusClass(
                              pass.status || "Recorded",
                            )}`}
                          >
                            {pass.status || "Recorded"}
                          </span>
                        </td>
                      </tr>
                    ))}

                    {!loading && filteredYellowPasses.length === 0 && (
                      <tr>
                        <td colSpan="6" className="admin-table-empty">
                          No Yellow Pass records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* OUTSIDE VEHICLES */}
          <section className="admin-section" id="outside-vehicles">
            <div className="admin-section-heading">
              <div>
                <h2>Outside Vehicles</h2>
                <p>Monitor visitor and outside vehicles entering the campus.</p>
              </div>

              <span className="admin-live-label">
                <span className="admin-live-dot" />
                {outsideVehicles.length} Recorded Visitors
              </span>
            </div>

            <div className="monitor-summary-grid">
              <div className="monitor-summary-card">
                <Users size={22} />
                <div>
                  <span>Total Visitor Vehicles</span>
                  <strong>{outsideVehicles.length}</strong>
                </div>
              </div>

              <div className="monitor-summary-card">
                <CarFront size={22} />
                <div>
                  <span>Currently Inside</span>
                  <strong>
                    {
                      outsideVehicles.filter(
                        (vehicle) =>
                          (vehicle.status || "").toLowerCase() === "inside",
                      ).length
                    }
                  </strong>
                </div>
              </div>

              <div className="monitor-summary-card">
                <LogOut size={22} />
                <div>
                  <span>Already Exited</span>
                  <strong>
                    {
                      outsideVehicles.filter(
                        (vehicle) =>
                          (vehicle.status || "").toLowerCase() === "exited",
                      ).length
                    }
                  </strong>
                </div>
              </div>
            </div>

            <div className="monitor-panel">
              <div className="monitor-panel-toolbar">
                <h3>Visitor Vehicle Records</h3>

                <div className="monitor-search">
                  <Search size={17} />
                  <input
                    value={outsideSearch}
                    onChange={(e) => setOutsideSearch(e.target.value)}
                    placeholder="Search plate, visitor, purpose..."
                  />
                </div>
              </div>

              <div className="admin-table-wrapper">
                <table className="admin-table monitor-table">
                  <thead>
                    <tr>
                      <th>Plate Number</th>
                      <th>Visitor Name</th>
                      <th>Vehicle Type</th>
                      <th>Purpose</th>
                      <th>Entry Time</th>
                      <th>Exit Time</th>
                      <th>Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredOutsideVehicles.map((vehicle) => (
                      <tr key={vehicle.id}>
                        <td>{vehicle.plateNumber || "N/A"}</td>
                        <td>
                          {vehicle.visitorName || vehicle.driverName || "N/A"}
                        </td>
                        <td>
                          {vehicle.vehicleType || vehicle.vehicleModel || "N/A"}
                        </td>
                        <td>{vehicle.purpose || "N/A"}</td>
                        <td>{formatDate(vehicle.entryTime)}</td>
                        <td>{formatDate(vehicle.exitTime)}</td>
                        <td>
                          <span
                            className={`monitor-status ${getStatusClass(
                              vehicle.status,
                            )}`}
                          >
                            {vehicle.status || "Pending"}
                          </span>
                        </td>
                      </tr>
                    ))}

                    {!loading && filteredOutsideVehicles.length === 0 && (
                      <tr>
                        <td colSpan="7" className="admin-table-empty">
                          No outside vehicle records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* ENTRANCE MONITORING */}
          <section className="admin-section" id="entrance-monitoring">
            <div className="admin-section-heading">
              <div>
                <h2>Entrance Monitoring</h2>
                <p>
                  Review vehicle entry and exit activity at campus checkpoints.
                </p>
              </div>

              <span className="admin-live-label">
                <span className="admin-live-dot" />
                {vehiclesCurrentlyInside} Vehicles Inside
              </span>
            </div>

            <div className="monitor-summary-grid">
              <div className="monitor-summary-card">
                <Activity size={22} />
                <div>
                  <span>Total Entrance Logs</span>
                  <strong>{entranceLogs.length}</strong>
                </div>
              </div>

              <div className="monitor-summary-card">
                <LogIn size={22} />
                <div>
                  <span>Vehicles Inside</span>
                  <strong>{vehiclesCurrentlyInside}</strong>
                </div>
              </div>

              <div className="monitor-summary-card">
                <LogOut size={22} />
                <div>
                  <span>Total Exit Records</span>
                  <strong>{vehiclesExited}</strong>
                </div>
              </div>
            </div>

            <div className="monitor-panel">
              <div className="monitor-panel-toolbar">
                <h3>Vehicle Entry and Exit Logs</h3>

                <div className="monitor-search">
                  <Search size={17} />
                  <input
                    value={entranceSearch}
                    onChange={(e) => setEntranceSearch(e.target.value)}
                    placeholder="Search plate, driver, checkpoint..."
                  />
                </div>
              </div>

              <div className="admin-table-wrapper">
                <table className="admin-table monitor-table">
                  <thead>
                    <tr>
                      <th>Plate Number</th>
                      <th>Driver Name</th>
                      <th>Checkpoint</th>
                      <th>Action</th>
                      <th>Date and Time</th>
                      <th>Security Personnel</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredEntranceLogs
                      .slice()
                      .sort(
                        (a, b) =>
                          new Date(
                            b.timestamp || b.entryTime || b.exitTime || 0,
                          ).getTime() -
                          new Date(
                            a.timestamp || a.entryTime || a.exitTime || 0,
                          ).getTime(),
                      )
                      .map((log) => (
                        <tr key={log.id}>
                          <td>{log.plateNumber || "N/A"}</td>
                          <td>{log.driverName || "N/A"}</td>
                          <td>{log.checkpoint || "N/A"}</td>
                          <td>
                            <span
                              className={`monitor-status ${
                                (log.action || "").toLowerCase() === "entry"
                                  ? "monitor-status-active"
                                  : "monitor-status-expired"
                              }`}
                            >
                              {log.action || "N/A"}
                            </span>
                          </td>
                          <td>
                            {formatDate(
                              log.timestamp || log.entryTime || log.exitTime,
                            )}
                          </td>
                          <td>{log.securityPersonnel || "N/A"}</td>
                        </tr>
                      ))}

                    {!loading && filteredEntranceLogs.length === 0 && (
                      <tr>
                        <td colSpan="6" className="admin-table-empty">
                          No entrance logs found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* RECENT VIOLATION REPORTS */}
          <section className="admin-section">
            <div className="admin-section-heading">
              <div>
                <h2>Recent Violation Reports</h2>
                <p>Latest reports submitted by security personnel</p>
              </div>

              <NavLink to="/admin/violations" className="admin-view-link">
                View All
              </NavLink>
            </div>

            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Report ID</th>
                    <th>Plate Number</th>
                    <th>Violation Type</th>
                    <th>Severity</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {violations.slice(0, 5).map((violation) => (
                    <tr key={violation.id}>
                      <td>{violation.id}</td>
                      <td>{violation.plateNumber}</td>
                      <td>
                        {violation.violationType || violation.type || "N/A"}
                      </td>
                      <td>
                        <span
                          className={`admin-severity ${(
                            violation.severity || "medium"
                          ).toLowerCase()}`}
                        >
                          {violation.severity || "Medium"}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`admin-status ${(
                            violation.status || "pending"
                          ).toLowerCase()}`}
                        >
                          {violation.status || "Pending"}
                        </span>
                      </td>
                    </tr>
                  ))}

                  {!loading && violations.length === 0 && (
                    <tr>
                      <td colSpan="5" className="admin-table-empty">
                        No violation reports found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* BOTTOM SUMMARY */}
          <section className="admin-bottom-summary">
            <div>
              <Activity size={21} />
              <span>Resolved Violations</span>
              <strong>{loading ? "..." : resolvedViolations}</strong>
            </div>

            <div>
              <CheckCircle size={21} />
              <span>Available Parking Spaces</span>
              <strong>{loading ? "..." : availableSpaces}</strong>
            </div>

            <div>
              <Clock size={21} />
              <span>Total Violation Reports</span>
              <strong>{loading ? "..." : violations.length}</strong>
            </div>
          </section>

          <footer className="admin-footer">
            <p>WEBSUPARK | Head Security Management System</p>
            <span>Western Visayas State University</span>
          </footer>
        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;
