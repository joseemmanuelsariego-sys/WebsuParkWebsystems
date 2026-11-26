import { useEffect, useState } from "react";
import {
  ArrowLeft,
  AlertTriangle,
  RefreshCw,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./MyViolations.css";

function MyViolations() {
  const navigate = useNavigate();

  const [violations, setViolations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchViolations = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/violations");
      setViolations(response.data);
    } catch (err) {
      console.error("Unable to load violations:", err);
      setError(
        "Unable to load violation records. Please check your connection.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchViolations();
  }, []);

  const getStatusClass = (status) => {
    const value = (status || "").toLowerCase().replace(/\s+/g, "-");

    if (value === "resolved") return "violation-resolved";
    if (value === "under-review") return "violation-review";

    return "violation-pending";
  };

  const getSeverityClass = (severity) => {
    return (severity || "medium").toLowerCase() === "high"
      ? "severity-high"
      : (severity || "medium").toLowerCase() === "low"
        ? "severity-low"
        : "severity-medium";
  };

  const pendingCount = violations.filter(
    (item) => item.status?.toLowerCase() === "pending",
  ).length;

  const resolvedCount = violations.filter(
    (item) => item.status?.toLowerCase() === "resolved",
  ).length;

  return (
    <div className="violations-page">
      <header className="violations-header">
        <button className="violations-back" onClick={() => navigate("/driver")}>
          <ArrowLeft size={19} />
          Back to Dashboard
        </button>

        <button
          className="violations-refresh"
          onClick={fetchViolations}
          disabled={loading}
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </header>

      <main className="violations-content">
        <div className="violations-title">
          <div>
            <span className="violations-overline">DRIVER PORTAL</span>
            <h1>My Violations</h1>
            <p>
              Review your recorded parking violations and their current status.
            </p>
          </div>

          <div className="violations-title-icon">
            <AlertTriangle size={36} />
          </div>
        </div>

        <section className="violations-summary">
          <div className="violation-summary-card">
            <div className="summary-icon pending-icon">
              <Clock size={22} />
            </div>
            <div>
              <span>Pending Violations</span>
              <h2>{pendingCount}</h2>
            </div>
          </div>

          <div className="violation-summary-card">
            <div className="summary-icon resolved-icon">
              <CheckCircle size={22} />
            </div>
            <div>
              <span>Resolved Violations</span>
              <h2>{resolvedCount}</h2>
            </div>
          </div>

          <div className="violation-summary-card">
            <div className="summary-icon total-icon">
              <AlertTriangle size={22} />
            </div>
            <div>
              <span>Total Records</span>
              <h2>{violations.length}</h2>
            </div>
          </div>
        </section>

        <section className="violations-list-section">
          <div className="violations-list-heading">
            <div>
              <h2>Violation Records</h2>
              <p>Parking incidents associated with your vehicle</p>
            </div>
            <span>{violations.length} records</span>
          </div>

          {loading ? (
            <div className="violations-message">
              Loading violation records...
            </div>
          ) : error ? (
            <div className="violations-error">
              <AlertCircle size={19} />
              {error}
            </div>
          ) : violations.length === 0 ? (
            <div className="violations-empty">
              <CheckCircle size={43} />
              <h3>No Violations Recorded</h3>
              <p>There are currently no violation records to display.</p>
            </div>
          ) : (
            <div className="violations-list">
              {violations.map((violation) => (
                <article className="violation-card" key={violation.id}>
                  <div className="violation-card-heading">
                    <div className="violation-type-icon">
                      <AlertTriangle size={22} />
                    </div>

                    <div className="violation-type-info">
                      <span>{violation.id}</span>
                      <h3>{violation.type || "Parking Violation"}</h3>
                    </div>

                    <span
                      className={`violation-status ${getStatusClass(violation.status)}`}
                    >
                      {violation.status || "Pending"}
                    </span>
                  </div>

                  <div className="violation-details-grid">
                    <div>
                      <span>Plate Number</span>
                      <strong>{violation.plateNumber || "N/A"}</strong>
                    </div>

                    <div>
                      <span>Severity</span>
                      <strong
                        className={`violation-severity ${getSeverityClass(violation.severity)}`}
                      >
                        {violation.severity || "Medium"}
                      </strong>
                    </div>

                    <div>
                      <span>Assigned Slot</span>
                      <strong>
                        <MapPin size={14} />
                        {violation.assignedSlot || "N/A"}
                      </strong>
                    </div>

                    <div>
                      <span>Detected Slot</span>
                      <strong>
                        <MapPin size={14} />
                        {violation.detectedSlot || "N/A"}
                      </strong>
                    </div>
                  </div>

                  <div className="violation-card-footer">
                    <span>
                      <AlertCircle size={15} />
                      Please contact security personnel for questions about this
                      record.
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <footer className="violations-footer">
          WEBSUPARK · Vehicle Tracking and Parking Verification System
        </footer>
      </main>
    </div>
  );
}

export default MyViolations;
