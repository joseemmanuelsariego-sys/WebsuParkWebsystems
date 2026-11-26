import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  CarFront,
  MapPin,
  Bell,
  AlertTriangle,
  CreditCard,
  Clock,
  CheckCircle,
  Menu,
  LogOut,
  UserCircle,
  ParkingCircle,
  ArrowUpRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { logoutUser } from "../../services/authService";
import api from "../../services/api";
import "./DriverDashboard.css";

function DriverDashboard() {
  const navigate = useNavigate();

  const [vehicle, setVehicle] = useState(null);
  const [parking, setParking] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [vehiclesRes, parkingRes, notificationsRes] = await Promise.all([
          api.get("/vehicles"),
          api.get("/parkingAreas"),
          api.get("/notifications"),
        ]);

        setVehicle(vehiclesRes.data[0] || null);
        setParking(parkingRes.data);
        setNotifications(notificationsRes.data.slice(0, 3));
      } catch (error) {
        console.error("Unable to load dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const availableSpaces = parking.reduce(
    (total, area) => total + (Number(area.availableSpaces) || 0),
    0,
  );

  return (
    <div className="driver-dashboard">
      <aside className={`driver-sidebar ${menuOpen ? "open" : ""}`}>
        <div className="driver-brand">
          <div className="brand-icon">
            <ParkingCircle size={25} />
          </div>
          <div>
            <h2>WEBSUPARK</h2>
            <span>Parking Management</span>
          </div>
        </div>

        <div className="sidebar-label">MENU</div>

        <nav className="driver-nav">
          <button
            className="nav-item active"
            onClick={() => navigate("/driver")}
          >
            <LayoutDashboard size={19} />
            Dashboard
          </button>

          <button
            className="nav-item"
            onClick={() => navigate("/driver/parking")}
          >
            <MapPin size={19} />
            Parking Assignment
          </button>

          <button
            className="nav-item"
            onClick={() => navigate("/driver/notifications")}
          >
            <Bell size={19} />
            Notifications
          </button>

          <button
            className="nav-item"
            onClick={() => navigate("/driver/violations")}
          >
            <AlertTriangle size={19} />
            My Violations
          </button>

          <button
            className="nav-item"
            onClick={() => navigate("/driver/vehicle")}
          >
            <CarFront size={19} />
            My Vehicle
          </button>

          <button
            className="nav-item"
            onClick={() => navigate("/driver/renewal")}
          >
            <CreditCard size={19} />
            Pass Renewal
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-user">
            <UserCircle size={35} />
            <div>
              <strong>Driver Account</strong>
              <span>Registered Driver</span>
            </div>
          </div>

          <button className="logout-button" onClick={handleLogout}>
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      <main className="driver-main">
        <header className="driver-header">
          <button
            className="mobile-menu"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <Menu size={23} />
          </button>

          <div>
            <h3>Driver Dashboard</h3>
            <p>Welcome to your parking management portal.</p>
          </div>

          <div className="header-profile">
            <div className="profile-avatar">
              <UserCircle size={25} />
            </div>
            <div>
              <strong>Driver</strong>
              <span>Driver Account</span>
            </div>
          </div>
        </header>

        <section className="driver-content">
          <div className="welcome-banner">
            <div>
              <span className="welcome-tag">DRIVER PORTAL</span>
              <h1>Welcome back, Driver!</h1>
              <p>
                Keep track of your vehicle, parking assignment, and pass status.
              </p>
            </div>

            <div className="welcome-icon">
              <CarFront size={75} />
            </div>
          </div>

          <div className="section-heading">
            <div>
              <h2>Overview</h2>
              <p>Here is your current parking information.</p>
            </div>
          </div>

          {loading ? (
            <div className="dashboard-loading">
              Loading dashboard information...
            </div>
          ) : (
            <>
              <div className="driver-stats">
                <div className="stat-card">
                  <div className="stat-icon blue">
                    <CarFront size={22} />
                  </div>
                  <span>Registered Vehicle</span>
                  <h2>{vehicle ? "1" : "0"}</h2>
                  <small>
                    {vehicle ? vehicle.plateNumber : "No vehicle registered"}
                  </small>
                </div>

                <div className="stat-card">
                  <div className="stat-icon green">
                    <CheckCircle size={22} />
                  </div>
                  <span>Pass Status</span>
                  <h2>
                    {vehicle?.status === "active" ? "Active" : "Inactive"}
                  </h2>
                  <small>
                    {vehicle ? `${vehicle.passType} Pass` : "No pass assigned"}
                  </small>
                </div>

                <div className="stat-card">
                  <div className="stat-icon purple">
                    <MapPin size={22} />
                  </div>
                  <span>Assigned Parking</span>
                  <h2>{vehicle?.assignedSlot || "N/A"}</h2>
                  <small>
                    {vehicle
                      ? `Parking Area ${vehicle.assignedArea}`
                      : "No assignment"}
                  </small>
                </div>

                <div className="stat-card">
                  <div className="stat-icon orange">
                    <ParkingCircle size={22} />
                  </div>
                  <span>Available Spaces</span>
                  <h2>{availableSpaces}</h2>
                  <small>Across all parking areas</small>
                </div>
              </div>

              <div className="dashboard-grid">
                <section className="dashboard-panel vehicle-panel">
                  <div className="panel-heading">
                    <div>
                      <h3>My Vehicle</h3>
                      <p>Registered vehicle information</p>
                    </div>
                    <CarFront size={23} />
                  </div>

                  {vehicle ? (
                    <>
                      <div className="vehicle-illustration">
                        <CarFront size={65} />
                        <span>REGISTERED VEHICLE</span>
                      </div>

                      <div className="vehicle-details">
                        <div>
                          <span>Plate Number</span>
                          <strong>{vehicle.plateNumber}</strong>
                        </div>

                        <div>
                          <span>Vehicle Model</span>
                          <strong>{vehicle.vehicleType}</strong>
                        </div>

                        <div>
                          <span>Color</span>
                          <strong>{vehicle.color}</strong>
                        </div>

                        <div>
                          <span>Pass Number</span>
                          <strong>{vehicle.passNumber}</strong>
                        </div>

                        <div>
                          <span>Pass Type</span>
                          <strong>{vehicle.passType} Pass</strong>
                        </div>

                        <div>
                          <span>Assigned Slot</span>
                          <strong>{vehicle.assignedSlot}</strong>
                        </div>
                      </div>

                      <button
                        className="panel-link"
                        onClick={() => navigate("/driver/vehicle")}
                      >
                        View vehicle details <ArrowUpRight size={17} />
                      </button>
                    </>
                  ) : (
                    <p className="empty-message">
                      No vehicle information is available.
                    </p>
                  )}
                </section>

                <section className="dashboard-panel parking-panel">
                  <div className="panel-heading">
                    <div>
                      <h3>Parking Availability</h3>
                      <p>Current mock parking data</p>
                    </div>
                    <MapPin size={23} />
                  </div>

                  <div className="parking-list">
                    {parking.map((area) => (
                      <div className="parking-area" key={area.id}>
                        <div className="parking-area-top">
                          <strong>{area.name}</strong>
                          <span>{area.availableSpaces} available</span>
                        </div>

                        <div className="parking-progress">
                          <div
                            style={{
                              width: `${
                                area.totalSpaces
                                  ? (area.occupiedSpaces / area.totalSpaces) *
                                    100
                                  : 0
                              }%`,
                            }}
                          />
                        </div>

                        <small>
                          {area.occupiedSpaces} occupied out of{" "}
                          {area.totalSpaces} spaces
                        </small>
                      </div>
                    ))}
                  </div>

                  <button
                    className="panel-link"
                    onClick={() => navigate("/driver/parking")}
                  >
                    View parking assignment <ArrowUpRight size={17} />
                  </button>
                </section>

                <section className="dashboard-panel notifications-panel">
                  <div className="panel-heading">
                    <div>
                      <h3>Recent Notifications</h3>
                      <p>Latest parking announcements</p>
                    </div>
                    <Bell size={23} />
                  </div>

                  {notifications.length > 0 ? (
                    notifications.map((notification) => (
                      <div className="notification-item" key={notification.id}>
                        <div className="notification-icon">
                          <Bell size={18} />
                        </div>

                        <div>
                          <strong>{notification.title}</strong>
                          <p>{notification.message}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="empty-message">No notifications available.</p>
                  )}
                </section>

                <section className="dashboard-panel reminder-panel">
                  <div className="reminder-icon">
                    <Clock size={27} />
                  </div>

                  <h3>Parking Reminder</h3>
                  <p>
                    Always park in your assigned parking area and make sure your
                    parking pass is valid.
                  </p>

                  <div className="reminder-footer">
                    <CheckCircle size={17} />
                    Follow campus parking guidelines
                  </div>
                </section>
              </div>
            </>
          )}

          <footer className="driver-footer">
            WEBSUPARK · Vehicle Tracking and Parking Verification System
          </footer>
        </section>
      </main>
    </div>
  );
}

export default DriverDashboard;
