import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  ScanLine,
  CarFront,
  AlertTriangle,
  MapPin,
  CheckCircle,
  XCircle,
  RefreshCw,
  LogOut,
  ShieldCheck,
  Menu,
  UserCircle,
  FileWarning,
  UserPlus,
  DoorOpen,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { logoutUser } from "../../services/authService";
import api from "../../services/api";
import "./PatrolDashboard.css";

function PatrolDashboard() {
  const navigate = useNavigate();

  const [vehicles, setVehicles] = useState([]);
  const [violations, setViolations] = useState([]);
  const [parkingAreas, setParkingAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [showAllViolations, setShowAllViolations] = useState(false);

  const [showExitModal, setShowExitModal] = useState(false);
  const [showVisitorModal, setShowVisitorModal] = useState(false);

  const [exitPlate, setExitPlate] = useState("");

  const [visitorForm, setVisitorForm] = useState({
    driverName: "",
    plateNumber: "",
    vehicleType: "",
    color: "",
    purpose: "",
    contactNumber: "",
  });

  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");

  // FETCH DASHBOARD DATA
  const fetchDashboardData = async () => {
    setLoading(true);
    setError("");

    try {
      const [vehicleResponse, violationResponse, parkingResponse] =
        await Promise.all([
          api.get("/vehicles"),
          api.get("/violations"),
          api.get("/parkingAreas"),
        ]);

      setVehicles(vehicleResponse.data);
      setViolations(violationResponse.data);
      setParkingAreas(parkingResponse.data);
    } catch (err) {
      console.error("Unable to load security dashboard:", err);
      setError(
        "Unable to load dashboard data. Check if JSON Server is running.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // LOGOUT
  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate("/login");
    } catch (err) {
      console.error("Logout failed:", err);
      alert("Unable to log out. Please try again.");
    }
  };

  // RECORD VEHICLE EXIT
  const handleVehicleExit = async (e) => {
    e.preventDefault();

    const normalizedPlate = exitPlate.trim().toUpperCase();

    if (!normalizedPlate) {
      setActionError("Enter a vehicle plate number.");
      return;
    }

    setActionLoading(true);
    setActionError("");
    setActionMessage("");

    try {
      const [vehicleResponse, visitorResponse] = await Promise.all([
        api.get("/vehicles"),
        api.get("/outsideVehicles"),
      ]);

      const registeredVehicle = vehicleResponse.data.find(
        (item) => item.plateNumber?.trim().toUpperCase() === normalizedPlate,
      );

      const visitorVehicle = visitorResponse.data.find(
        (item) =>
          item.plateNumber?.trim().toUpperCase() === normalizedPlate &&
          item.status?.toLowerCase() !== "exited",
      );

      const foundVehicle = registeredVehicle || visitorVehicle;

      if (!foundVehicle) {
        setActionError(
          "No active vehicle record found with that plate number.",
        );
        return;
      }

      const exitTime = new Date().toISOString();

      await api.post("/entranceLogs", {
        vehicleId: foundVehicle.vehicleId || foundVehicle.id,
        plateNumber: foundVehicle.plateNumber,
        driverName: foundVehicle.driverName || "Unknown",
        vehicleType: foundVehicle.vehicleType || "Not specified",
        checkpoint: "Main Entrance",
        action: "Exit",
        timestamp: exitTime,
        securityPersonnel: "Security Personnel",
        source: "Manual",
      });

      if (visitorVehicle) {
        await api.patch(`/outsideVehicles/${visitorVehicle.id}`, {
          status: "Exited",
          exitTime,
        });
      }

      setActionMessage(
        `Vehicle ${normalizedPlate} exit recorded successfully.`,
      );

      setExitPlate("");
      await fetchDashboardData();
    } catch (err) {
      console.error("Unable to record vehicle exit:", err);
      setActionError("Unable to record vehicle exit. Check JSON Server.");
    } finally {
      setActionLoading(false);
    }
  };

  // REGISTER VISITOR VEHICLE
  const handleVisitorRegistration = async (e) => {
    e.preventDefault();

    const normalizedPlate = visitorForm.plateNumber.trim().toUpperCase();

    if (
      !visitorForm.driverName.trim() ||
      !normalizedPlate ||
      !visitorForm.vehicleType.trim() ||
      !visitorForm.purpose.trim()
    ) {
      setActionError("Please complete all required visitor information.");
      return;
    }

    setActionLoading(true);
    setActionError("");
    setActionMessage("");

    try {
      const existingResponse = await api.get("/outsideVehicles");

      const alreadyInside = existingResponse.data.some(
        (item) =>
          item.plateNumber?.trim().toUpperCase() === normalizedPlate &&
          item.status?.toLowerCase() !== "exited",
      );

      if (alreadyInside) {
        setActionError("This visitor vehicle is already recorded as inside.");
        return;
      }

      const entryTime = new Date().toISOString();

      const visitorRecord = {
        driverName: visitorForm.driverName.trim(),
        plateNumber: normalizedPlate,
        vehicleType: visitorForm.vehicleType.trim(),
        color: visitorForm.color.trim(),
        purpose: visitorForm.purpose.trim(),
        contactNumber: visitorForm.contactNumber.trim(),
        entryTime,
        exitTime: null,
        status: "Inside",
        registeredBy: "Security Personnel",
      };

      const visitorResponse = await api.post("/outsideVehicles", visitorRecord);

      await api.post("/entranceLogs", {
        vehicleId: visitorResponse.data.id,
        plateNumber: normalizedPlate,
        driverName: visitorForm.driverName.trim(),
        vehicleType: visitorForm.vehicleType.trim(),
        checkpoint: "Main Entrance",
        action: "Entry",
        timestamp: entryTime,
        securityPersonnel: "Security Personnel",
        source: "Manual Visitor Registration",
      });

      setActionMessage(
        `Visitor vehicle ${normalizedPlate} registered successfully.`,
      );

      setVisitorForm({
        driverName: "",
        plateNumber: "",
        vehicleType: "",
        color: "",
        purpose: "",
        contactNumber: "",
      });

      await fetchDashboardData();
    } catch (err) {
      console.error("Unable to register visitor:", err);
      setActionError("Unable to register visitor vehicle. Check JSON Server.");
    } finally {
      setActionLoading(false);
    }
  };

  // DASHBOARD STATISTICS
  const pendingViolations = violations.filter(
    (item) => item.status?.toLowerCase() === "pending",
  ).length;

  const activeVehicles = vehicles.filter(
    (item) => item.status?.toLowerCase() === "active",
  ).length;

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

  const displayedViolations = showAllViolations
    ? violations
    : violations.slice(0, 5);

  return (
    <div className="patrol-layout">
      {/* SIDEBAR */}
      <aside className={`patrol-sidebar ${menuOpen ? "show-sidebar" : ""}`}>
        <div className="patrol-brand">
          <div className="patrol-brand-icon">
            <ShieldCheck size={25} />
          </div>

          <div>
            <h2>WEBSUPARK</h2>
            <span>SECURITY PORTAL</span>
          </div>
        </div>

        <div className="patrol-profile">
          <div className="patrol-avatar">
            <UserCircle size={29} />
          </div>

          <div>
            <strong>Security Personnel</strong>
            <span>Patrol Officer</span>
          </div>
        </div>

        <nav className="patrol-navigation">
          <span className="patrol-nav-label">MAIN MENU</span>

          <button
            className="patrol-nav-item active"
            onClick={() => navigate("/security")}
          >
            <LayoutDashboard size={19} />
            Dashboard
          </button>

          <button
            className="patrol-nav-item"
            onClick={() => navigate("/security/scan")}
          >
            <ScanLine size={19} />
            Scan Vehicle
          </button>

          <button
            className="patrol-nav-item"
            onClick={() => navigate("/security/report")}
          >
            <FileWarning size={19} />
            Report Violation
          </button>
        </nav>

        <div className="patrol-sidebar-bottom">
          <div className="patrol-sidebar-status">
            <span className="status-dot"></span>
            System Connected
          </div>

          <button className="patrol-logout" onClick={handleLogout}>
            <LogOut size={18} />
            Log Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="patrol-main">
        <header className="patrol-topbar">
          <button
            className="patrol-menu-button"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <Menu size={23} />
          </button>

          <div>
            <span>SECURITY PERSONNEL</span>
            <h2>Patrol Dashboard</h2>
          </div>

          <button
            className="patrol-refresh"
            onClick={fetchDashboardData}
            disabled={loading}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </header>

        <div className="patrol-content">
          {/* WELCOME */}
          <section className="patrol-welcome">
            <div>
              <span>SECURITY OPERATIONS</span>
              <h1>Welcome, Security Officer</h1>
              <p>
                Monitor registered vehicles, check parking availability, and
                verify campus parking compliance.
              </p>
            </div>

            <div className="patrol-welcome-icon">
              <ShieldCheck size={43} />
            </div>
          </section>

          {error && (
            <div className="patrol-error">
              <AlertTriangle size={18} />
              {error}
            </div>
          )}

          {/* STATISTICS */}
          <section className="patrol-statistics">
            <article className="patrol-stat-card">
              <div className="patrol-stat-icon blue">
                <CarFront size={23} />
              </div>

              <div>
                <span>Registered Vehicles</span>
                <h2>{loading ? "..." : vehicles.length}</h2>
                <p>{activeVehicles} active registrations</p>
              </div>
            </article>

            <article className="patrol-stat-card">
              <div className="patrol-stat-icon red">
                <AlertTriangle size={23} />
              </div>

              <div>
                <span>Pending Violations</span>
                <h2>{loading ? "..." : pendingViolations}</h2>
                <p>Require review</p>
              </div>
            </article>

            <article className="patrol-stat-card">
              <div className="patrol-stat-icon green">
                <CheckCircle size={23} />
              </div>

              <div>
                <span>Available Spaces</span>
                <h2>{loading ? "..." : availableSpaces}</h2>
                <p>Across all parking areas</p>
              </div>
            </article>

            <article className="patrol-stat-card">
              <div className="patrol-stat-icon orange">
                <MapPin size={23} />
              </div>

              <div>
                <span>Occupied Spaces</span>
                <h2>{loading ? "..." : occupiedSpaces}</h2>
                <p>Across all parking areas</p>
              </div>
            </article>
          </section>

          {/* QUICK ACTIONS */}
          <section className="patrol-quick-actions">
            <div className="patrol-section-heading">
              <div>
                <h2>Quick Actions</h2>
                <p>Access your security tools</p>
              </div>
            </div>

            <div className="patrol-actions-grid">
              {/* SCAN VEHICLE */}
              <button
                className="patrol-scan-action"
                onClick={() => navigate("/security/scan")}
              >
                <div className="scan-action-icon">
                  <ScanLine size={27} />
                </div>

                <div>
                  <h3>Scan or Verify Vehicle</h3>
                  <p>
                    Search a vehicle and verify its parking pass and assigned
                    slot.
                  </p>
                </div>

                <span>Open Scanner →</span>
              </button>

              {/* REPORT VIOLATION */}
              <button
                className="patrol-scan-action"
                onClick={() => navigate("/security/report")}
              >
                <div className="scan-action-icon report-action-icon">
                  <FileWarning size={27} />
                </div>

                <div>
                  <h3>Report Violation</h3>
                  <p>Record an unauthorized or incorrectly parked vehicle.</p>
                </div>

                <span>Open Report →</span>
              </button>

              {/* RECORD VEHICLE EXIT */}
              <button
                className="patrol-scan-action"
                onClick={() => {
                  setActionError("");
                  setActionMessage("");
                  setShowExitModal(true);
                }}
              >
                <div className="scan-action-icon">
                  <DoorOpen size={27} />
                </div>

                <div>
                  <h3>Record Vehicle Exit</h3>
                  <p>
                    Manually record a registered or visitor vehicle leaving
                    campus.
                  </p>
                </div>

                <span>Record Exit →</span>
              </button>

              {/* REGISTER VISITOR */}
              <button
                className="patrol-scan-action"
                onClick={() => {
                  setActionError("");
                  setActionMessage("");
                  setShowVisitorModal(true);
                }}
              >
                <div className="scan-action-icon report-action-icon">
                  <UserPlus size={27} />
                </div>

                <div>
                  <h3>Register Visitor Vehicle</h3>
                  <p>
                    Manually register a visitor vehicle entering the campus.
                  </p>
                </div>

                <span>Register Visitor →</span>
              </button>
            </div>
          </section>

          {/* PARKING AREA OVERVIEW */}
          <section className="patrol-parking-section">
            <div className="patrol-section-heading">
              <div>
                <h2>Parking Area Overview</h2>
                <p>Current parking occupancy from system records</p>
              </div>
            </div>

            {loading ? (
              <div className="patrol-loading">Loading parking areas...</div>
            ) : parkingAreas.length === 0 ? (
              <div className="patrol-loading">No parking areas found.</div>
            ) : (
              <div className="patrol-parking-grid">
                {parkingAreas.map((area) => {
                  const total = Number(area.totalSpaces || 0);
                  const occupied = Number(area.occupiedSpaces || 0);
                  const available = Number(area.availableSpaces || 0);

                  const percentage =
                    total > 0 ? Math.min((occupied / total) * 100, 100) : 0;

                  return (
                    <article className="patrol-parking-card" key={area.id}>
                      <div className="parking-card-heading">
                        <div className="parking-area-icon">
                          <MapPin size={20} />
                        </div>

                        <div>
                          <h3>{area.name || `Parking Area ${area.id}`}</h3>
                          <span>{total} total spaces</span>
                        </div>
                      </div>

                      <div className="parking-numbers">
                        <div>
                          <strong>{occupied}</strong>
                          <span>Occupied</span>
                        </div>

                        <div>
                          <strong>{available}</strong>
                          <span>Available</span>
                        </div>
                      </div>

                      <div className="parking-progress">
                        <div
                          className="parking-progress-fill"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>

                      <div className="parking-card-footer">
                        <span>{Math.round(percentage)}% occupied</span>

                        <span
                          className={
                            available === 0 ? "parking-full" : "parking-open"
                          }
                        >
                          {available === 0 ? (
                            <>
                              <XCircle size={13} />
                              Full
                            </>
                          ) : (
                            <>
                              <CheckCircle size={13} />
                              Available
                            </>
                          )}
                        </span>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          {/* VIOLATION RECORDS */}
          <section className="patrol-recent-section">
            <div className="patrol-section-heading">
              <div>
                <h2>Violation Records</h2>
                <p>
                  {showAllViolations
                    ? `Showing all ${violations.length} violation records`
                    : "Latest recorded parking incidents"}
                </p>
              </div>

              {violations.length > 5 && (
                <button
                  className="patrol-view-reports"
                  onClick={() => setShowAllViolations(!showAllViolations)}
                >
                  {showAllViolations
                    ? "Show Recent Records"
                    : "View All Records"}
                </button>
              )}
            </div>

            {loading ? (
              <div className="patrol-loading">Loading records...</div>
            ) : violations.length === 0 ? (
              <div className="patrol-loading">No violation records found.</div>
            ) : (
              <div className="patrol-table-wrapper">
                <table className="patrol-table">
                  <thead>
                    <tr>
                      <th>Record ID</th>
                      <th>Plate Number</th>
                      <th>Violation</th>
                      <th>Severity</th>
                      <th>Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {displayedViolations.map((violation) => (
                      <tr key={violation.id}>
                        <td>{violation.id}</td>
                        <td>{violation.plateNumber || "N/A"}</td>
                        <td>
                          {violation.violationType ||
                            violation.type ||
                            "Parking Violation"}
                        </td>
                        <td>{violation.severity || "N/A"}</td>
                        <td>
                          <span
                            className={`patrol-status ${
                              violation.status?.toLowerCase() === "resolved"
                                ? "status-resolved"
                                : "status-pending"
                            }`}
                          >
                            {violation.status || "Pending"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* VEHICLE EXIT MODAL */}
          {showExitModal && (
            <div className="patrol-modal-overlay">
              <div className="patrol-action-modal">
                <div className="patrol-modal-heading">
                  <div>
                    <h2>Record Vehicle Exit</h2>
                    <p>Enter the plate number of the vehicle leaving campus.</p>
                  </div>

                  <button type="button" onClick={() => setShowExitModal(false)}>
                    ×
                  </button>
                </div>

                <form onSubmit={handleVehicleExit}>
                  <label>Vehicle Plate Number</label>

                  <input
                    type="text"
                    placeholder="Example: ABC-1234"
                    value={exitPlate}
                    onChange={(e) => setExitPlate(e.target.value)}
                    required
                  />

                  {actionError && (
                    <div className="patrol-action-error">{actionError}</div>
                  )}

                  {actionMessage && (
                    <div className="patrol-action-success">{actionMessage}</div>
                  )}

                  <div className="patrol-modal-buttons">
                    <button
                      type="button"
                      className="patrol-modal-cancel"
                      onClick={() => setShowExitModal(false)}
                    >
                      Cancel
                    </button>

                    <button type="submit" disabled={actionLoading}>
                      {actionLoading ? "Recording..." : "Confirm Vehicle Exit"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* VISITOR REGISTRATION MODAL */}
          {showVisitorModal && (
            <div className="patrol-modal-overlay">
              <div className="patrol-action-modal">
                <div className="patrol-modal-heading">
                  <div>
                    <h2>Register Visitor Vehicle</h2>
                    <p>Enter the visitor and vehicle information.</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowVisitorModal(false)}
                  >
                    ×
                  </button>
                </div>

                <form onSubmit={handleVisitorRegistration}>
                  <label>Visitor Name *</label>
                  <input
                    type="text"
                    placeholder="Enter visitor name"
                    value={visitorForm.driverName}
                    onChange={(e) =>
                      setVisitorForm({
                        ...visitorForm,
                        driverName: e.target.value,
                      })
                    }
                    required
                  />

                  <label>Plate Number *</label>
                  <input
                    type="text"
                    placeholder="Example: ABC-1234"
                    value={visitorForm.plateNumber}
                    onChange={(e) =>
                      setVisitorForm({
                        ...visitorForm,
                        plateNumber: e.target.value.toUpperCase(),
                      })
                    }
                    required
                  />

                  <label>Vehicle Type *</label>
                  <input
                    type="text"
                    placeholder="Example: Toyota Vios"
                    value={visitorForm.vehicleType}
                    onChange={(e) =>
                      setVisitorForm({
                        ...visitorForm,
                        vehicleType: e.target.value,
                      })
                    }
                    required
                  />

                  <label>Vehicle Color</label>
                  <input
                    type="text"
                    placeholder="Example: White"
                    value={visitorForm.color}
                    onChange={(e) =>
                      setVisitorForm({
                        ...visitorForm,
                        color: e.target.value,
                      })
                    }
                  />

                  <label>Purpose of Visit *</label>
                  <input
                    type="text"
                    placeholder="Example: Meeting, delivery, appointment"
                    value={visitorForm.purpose}
                    onChange={(e) =>
                      setVisitorForm({
                        ...visitorForm,
                        purpose: e.target.value,
                      })
                    }
                    required
                  />

                  <label>Contact Number</label>
                  <input
                    type="text"
                    placeholder="Visitor contact number"
                    value={visitorForm.contactNumber}
                    onChange={(e) =>
                      setVisitorForm({
                        ...visitorForm,
                        contactNumber: e.target.value,
                      })
                    }
                  />

                  {actionError && (
                    <div className="patrol-action-error">{actionError}</div>
                  )}

                  {actionMessage && (
                    <div className="patrol-action-success">{actionMessage}</div>
                  )}

                  <div className="patrol-modal-buttons">
                    <button
                      type="button"
                      className="patrol-modal-cancel"
                      onClick={() => setShowVisitorModal(false)}
                    >
                      Cancel
                    </button>

                    <button type="submit" disabled={actionLoading}>
                      {actionLoading ? "Registering..." : "Register Visitor"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <footer className="patrol-footer">
            WEBSUPARK · Vehicle Tracking and Parking Verification System
          </footer>
        </div>
      </main>
    </div>
  );
}

export default PatrolDashboard;
