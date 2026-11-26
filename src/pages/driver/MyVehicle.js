import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CarFront,
  CreditCard,
  MapPin,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  User,
  Palette,
  Hash,
  ParkingCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./MyVehicle.css";

function MyVehicle() {
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchVehicle = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/vehicles");
      setVehicle(response.data[0] || null);
    } catch (err) {
      console.error("Unable to load vehicle:", err);
      setError(
        "Unable to load vehicle information. Please check your connection.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicle();
  }, []);

  return (
    <div className="my-vehicle-page">
      <header className="my-vehicle-header">
        <button onClick={() => navigate("/driver")} className="vehicle-back">
          <ArrowLeft size={19} />
          Back to Dashboard
        </button>

        <button
          className="vehicle-refresh"
          onClick={fetchVehicle}
          disabled={loading}
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </header>

      <main className="my-vehicle-content">
        <div className="my-vehicle-title">
          <div>
            <span className="vehicle-overline">DRIVER PORTAL</span>
            <h1>My Vehicle</h1>
            <p>View your registered vehicle and parking pass information.</p>
          </div>
          <div className="vehicle-title-icon">
            <CarFront size={38} />
          </div>
        </div>

        {loading ? (
          <div className="vehicle-message">Loading vehicle information...</div>
        ) : error ? (
          <div className="vehicle-error">
            <AlertCircle size={19} />
            {error}
          </div>
        ) : !vehicle ? (
          <div className="vehicle-empty">
            <CarFront size={45} />
            <h2>No Vehicle Registered</h2>
            <p>Your account does not currently have a vehicle record.</p>
          </div>
        ) : (
          <>
            <section className="vehicle-main-card">
              <div className="vehicle-card-top">
                <div className="vehicle-card-icon">
                  <CarFront size={55} />
                </div>
                <div className="vehicle-active-status">
                  <CheckCircle size={16} />
                  {vehicle.status === "active"
                    ? "Active Registration"
                    : "Inactive Registration"}
                </div>
              </div>

              <div className="vehicle-card-info">
                <span>REGISTERED VEHICLE</span>
                <h2>{vehicle.vehicleType}</h2>
                <div className="vehicle-plate">{vehicle.plateNumber}</div>
              </div>
            </section>

            <section className="vehicle-details-section">
              <div className="vehicle-section-heading">
                <h2>Vehicle Information</h2>
                <p>Your registered vehicle details</p>
              </div>

              <div className="vehicle-info-grid">
                <div className="vehicle-info-card">
                  <User size={20} />
                  <div>
                    <span>Registered Driver</span>
                    <strong>{vehicle.driverName}</strong>
                  </div>
                </div>

                <div className="vehicle-info-card">
                  <CarFront size={20} />
                  <div>
                    <span>Vehicle Model</span>
                    <strong>{vehicle.vehicleType}</strong>
                  </div>
                </div>

                <div className="vehicle-info-card">
                  <Palette size={20} />
                  <div>
                    <span>Vehicle Color</span>
                    <strong>{vehicle.color}</strong>
                  </div>
                </div>

                <div className="vehicle-info-card">
                  <Hash size={20} />
                  <div>
                    <span>Plate Number</span>
                    <strong>{vehicle.plateNumber}</strong>
                  </div>
                </div>
              </div>
            </section>

            <section className="vehicle-pass-section">
              <div className="vehicle-section-heading">
                <h2>Parking Pass Information</h2>
                <p>Your current campus parking authorization</p>
              </div>

              <div className="vehicle-pass-card">
                <div className="pass-card-heading">
                  <div className="pass-card-icon">
                    <CreditCard size={27} />
                  </div>
                  <div>
                    <span>PASS TYPE</span>
                    <h3>{vehicle.passType || "Not assigned"} Pass</h3>
                  </div>
                  <span
                    className={`pass-status ${vehicle.status === "active" ? "pass-active" : "pass-inactive"}`}
                  >
                    {vehicle.status === "active" ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="pass-number-container">
                  <span>PASS NUMBER</span>
                  <strong>{vehicle.passNumber || "Not available"}</strong>
                </div>

                <div className="pass-description">
                  {vehicle.passType === "Blue"
                    ? "Blue Pass: Registered vehicle with a designated campus parking assignment."
                    : "Temporary parking authorization. Follow the applicable parking conditions."}
                </div>
              </div>
            </section>

            <section className="vehicle-assignment-section">
              <div className="vehicle-section-heading">
                <h2>Parking Assignment</h2>
                <p>Your designated parking location</p>
              </div>

              <div className="vehicle-assignment-card">
                <div className="assignment-info-icon">
                  <ParkingCircle size={27} />
                </div>
                <div className="assignment-info">
                  <span>ASSIGNED PARKING AREA</span>
                  <h3>
                    {vehicle.assignedArea
                      ? `Parking Area ${vehicle.assignedArea}`
                      : "Not assigned"}
                  </h3>
                  <p>
                    <MapPin size={15} />
                    Parking Slot: {vehicle.assignedSlot || "Not assigned"}
                  </p>
                </div>
                <button
                  className="view-assignment-button"
                  onClick={() => navigate("/driver/parking")}
                >
                  View Assignment
                </button>
              </div>
            </section>

            <div className="vehicle-notice">
              <AlertCircle size={19} />
              <p>
                This page displays sample vehicle records from the WEBSUPARK
                database. Changes to vehicle registration must be handled by
                authorized personnel.
              </p>
            </div>
          </>
        )}

        <footer className="my-vehicle-footer">
          WEBSUPARK · Vehicle Tracking and Parking Verification System
        </footer>
      </main>
    </div>
  );
}

export default MyVehicle;
