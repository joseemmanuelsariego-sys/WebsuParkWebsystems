import { useEffect, useState } from "react";
import {
  ArrowLeft,
  RefreshCw,
  CreditCard,
  CheckCircle,
  Clock,
  AlertCircle,
  Send,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./PassRenewal.css";

function PassRenewal() {
  const navigate = useNavigate();

  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchVehicle = async () => {
      try {
        const response = await api.get("/vehicles");
        setVehicle(response.data[0] || null);
      } catch (err) {
        console.error("Unable to load vehicle:", err);
        setError("Unable to load your vehicle information.");
      } finally {
        setLoading(false);
      }
    };

    fetchVehicle();
  }, []);

  const requestRenewal = async () => {
    if (!vehicle) return;

    setSubmitting(true);
    setMessage("");
    setError("");

    try {
      const response = await api.patch(`/vehicles/${vehicle.id}`, {
        renewalStatus: "Pending",
      });

      setVehicle(response.data);
      setMessage("Your pass renewal request has been submitted.");
    } catch (err) {
      console.error("Unable to submit renewal:", err);
      setError("Unable to submit your renewal request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="renewal-page">
      <header className="renewal-header">
        <button onClick={() => navigate("/driver")} className="renewal-back">
          <ArrowLeft size={19} />
          Back to Dashboard
        </button>
      </header>

      <main className="renewal-content">
        <div className="renewal-title">
          <div>
            <span className="renewal-overline">DRIVER PORTAL</span>
            <h1>Pass Renewal</h1>
            <p>View your parking pass and submit a renewal request.</p>
          </div>

          <div className="renewal-title-icon">
            <CreditCard size={35} />
          </div>
        </div>

        {loading ? (
          <div className="renewal-message">Loading vehicle information...</div>
        ) : error && !vehicle ? (
          <div className="renewal-error">
            <AlertCircle size={18} />
            {error}
          </div>
        ) : !vehicle ? (
          <div className="renewal-message">No registered vehicle found.</div>
        ) : (
          <>
            <section className="renewal-pass-card">
              <div className="renewal-pass-top">
                <div>
                  <span>WEBSUPARK</span>
                  <h2>Parking Pass</h2>
                </div>
                <CreditCard size={32} />
              </div>

              <div className="renewal-pass-number">
                <span>PASS NUMBER</span>
                <h2>{vehicle.passNumber || "Not assigned"}</h2>
              </div>

              <div className="renewal-pass-details">
                <div>
                  <span>Vehicle Plate</span>
                  <strong>{vehicle.plateNumber || "N/A"}</strong>
                </div>
                <div>
                  <span>Pass Type</span>
                  <strong>{vehicle.passType || "N/A"}</strong>
                </div>
                <div>
                  <span>Parking Slot</span>
                  <strong>{vehicle.assignedSlot || "N/A"}</strong>
                </div>
                <div>
                  <span>Current Status</span>
                  <strong>{vehicle.status || "Unknown"}</strong>
                </div>
              </div>
            </section>

            <section className="renewal-request-card">
              <div className="renewal-request-heading">
                <div className="renewal-request-icon">
                  <RefreshCw size={23} />
                </div>
                <div>
                  <h2>Renewal Request</h2>
                  <p>Submit your request for parking pass renewal.</p>
                </div>
              </div>

              <div className="renewal-status">
                {vehicle.renewalStatus === "Pending" ? (
                  <>
                    <Clock size={20} />
                    <div>
                      <strong>Request Pending</strong>
                      <p>
                        Your renewal request is awaiting administrator review.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <CheckCircle size={20} />
                    <div>
                      <strong>No Pending Request</strong>
                      <p>You can submit a renewal request below.</p>
                    </div>
                  </>
                )}
              </div>

              {message && (
                <div className="renewal-success">
                  <CheckCircle size={18} />
                  {message}
                </div>
              )}

              {error && (
                <div className="renewal-error">
                  <AlertCircle size={18} />
                  {error}
                </div>
              )}

              <button
                className="renewal-submit"
                onClick={requestRenewal}
                disabled={submitting || vehicle.renewalStatus === "Pending"}
              >
                <Send size={17} />
                {submitting
                  ? "Submitting..."
                  : vehicle.renewalStatus === "Pending"
                    ? "Request Already Submitted"
                    : "Submit Renewal Request"}
              </button>
            </section>
          </>
        )}

        <footer className="renewal-footer">
          WEBSUPARK · Vehicle Tracking and Parking Verification System
        </footer>
      </main>
    </div>
  );
}

export default PassRenewal;
