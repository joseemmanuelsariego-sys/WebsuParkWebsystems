import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Bell,
  CheckCircle,
  Clock,
  RefreshCw,
  AlertCircle,
  Check,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./Notifications.css";

function Notifications() {
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchNotifications = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/notifications");
      setNotifications(response.data);
    } catch (err) {
      console.error("Unable to load notifications:", err);
      setError("Unable to load notifications. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}`, { read: true });

      setNotifications((previous) =>
        previous.map((notification) =>
          notification.id === id
            ? { ...notification, read: true }
            : notification,
        ),
      );
    } catch (err) {
      console.error("Unable to update notification:", err);
      alert("Unable to mark notification as read.");
    }
  };

  const markAllAsRead = async () => {
    try {
      const unread = notifications.filter((item) => !item.read);

      await Promise.all(
        unread.map((item) =>
          api.patch(`/notifications/${item.id}`, { read: true }),
        ),
      );

      setNotifications((previous) =>
        previous.map((item) => ({ ...item, read: true })),
      );
    } catch (err) {
      console.error("Unable to update notifications:", err);
      alert("Unable to mark all notifications as read.");
      fetchNotifications();
    }
  };

  const unreadCount = notifications.filter((item) => !item.read).length;

  return (
    <div className="notifications-page">
      <header className="notifications-header">
        <button
          className="notifications-back"
          onClick={() => navigate("/driver")}
        >
          <ArrowLeft size={19} />
          Back to Dashboard
        </button>

        <button
          className="notifications-refresh"
          onClick={fetchNotifications}
          disabled={loading}
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </header>

      <main className="notifications-content">
        <div className="notifications-title">
          <div>
            <span className="notifications-overline">DRIVER PORTAL</span>
            <h1>Notifications</h1>
            <p>Stay updated with parking reminders and campus announcements.</p>
          </div>

          <div className="notifications-title-icon">
            <Bell size={36} />
          </div>
        </div>

        <section className="notifications-summary">
          <div className="notification-summary-icon">
            <Bell size={24} />
          </div>

          <div>
            <span>Unread Notifications</span>
            <h2>{unreadCount}</h2>
          </div>

          {unreadCount > 0 && (
            <button className="mark-all-button" onClick={markAllAsRead}>
              <Check size={16} />
              Mark all as read
            </button>
          )}
        </section>

        <section className="notifications-list-section">
          <div className="notifications-list-heading">
            <div>
              <h2>All Notifications</h2>
              <p>Your latest parking updates</p>
            </div>

            <span>{notifications.length} total</span>
          </div>

          {loading ? (
            <div className="notifications-message">
              Loading notifications...
            </div>
          ) : error ? (
            <div className="notifications-error">
              <AlertCircle size={19} />
              {error}
            </div>
          ) : notifications.length === 0 ? (
            <div className="notifications-empty">
              <Bell size={42} />
              <h3>No Notifications Yet</h3>
              <p>You don't have any parking updates at the moment.</p>
            </div>
          ) : (
            <div className="notifications-list">
              {notifications.map((notification) => (
                <article
                  className={`notification-card ${
                    notification.read ? "is-read" : "is-unread"
                  }`}
                  key={notification.id}
                >
                  <div className="notification-card-icon">
                    {notification.type === "reminder" ? (
                      <Clock size={21} />
                    ) : (
                      <Bell size={21} />
                    )}
                  </div>

                  <div className="notification-card-content">
                    <div className="notification-card-top">
                      <h3>{notification.title}</h3>

                      {!notification.read && (
                        <span className="unread-label">NEW</span>
                      )}
                    </div>

                    <p>{notification.message}</p>

                    <div className="notification-card-footer">
                      <span>{notification.type || "Announcement"}</span>

                      {notification.read ? (
                        <span className="read-status">
                          <CheckCircle size={14} />
                          Read
                        </span>
                      ) : (
                        <button
                          className="mark-read-button"
                          onClick={() => markAsRead(notification.id)}
                        >
                          <Check size={14} />
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <footer className="notifications-footer">
          WEBSUPARK · Vehicle Tracking and Parking Verification System
        </footer>
      </main>
    </div>
  );
}

export default Notifications;
