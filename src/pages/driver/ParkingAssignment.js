import { useEffect, useState } from "react";
import {
  ParkingCircle,
  MapPin,
  CarFront,
  CheckCircle,
  Clock,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./ParkingAssignment.css";

function ParkingAssignment() {
  const navigate = useNavigate();

  const [vehicle, setVehicle] = useState(null);
  const [parkingAreas, setParkingAreas] = useState([]);
  const [parkingSlots, setParkingSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchParkingData = async () => {
    setLoading(true);
    setError("");

    try {
      const [vehiclesRes, areasRes, slotsRes] = await Promise.all([
        api.get("/vehicles"),
        api.get("/parkingAreas"),
        api.get("/parkingSlots"),
      ]);

      setVehicle(vehiclesRes.data[0] || null);
      setParkingAreas(areasRes.data);
      setParkingSlots(slotsRes.data);
    } catch (err) {
      console.error("Unable to load parking assignment:", err);
      setError(
        "Unable to load parking information. Please check your connection.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParkingData();
  }, []);

  const totalAvailable = parkingAreas.reduce(
    (total, area) => total + Number(area.availableSpaces || 0),
    0,
  );

  const assignedSlot = parkingSlots.find(
    (slot) => slot.id === vehicle?.assignedSlot,
  );

  return (
    <div className="assignment-page">
      <header className="assignment-header">
        <button className="assignment-back" onClick={() => navigate("/driver")}>
          <ArrowLeft size={19} />
          Back to Dashboard
        </button>

        <button
          className="assignment-refresh"
          onClick={fetchParkingData}
          disabled={loading}
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </header>

      <main className="assignment-content">
        <div className="assignment-title">
          <div>
            <span className="assignment-label">DRIVER PORTAL</span>
            <h1>Parking Assignment</h1>
            <p>View your assigned parking location and available spaces.</p>
          </div>
          <div className="assignment-title-icon">
            <ParkingCircle size={40} />
          </div>
        </div>

        {loading ? (
          <div className="assignment-message">
            Loading parking information...
          </div>
        ) : error ? (
          <div className="assignment-error">{error}</div>
        ) : (
          <>
            <section className="assigned-parking-card">
              <div className="assigned-card-heading">
                <div>
                  <span className="assigned-overline">
                    YOUR ASSIGNED PARKING
                  </span>
                  <h2>{vehicle?.assignedSlot || "No Slot Assigned"}</h2>
                </div>
                <div className="assigned-status">
                  <CheckCircle size={16} />
                  {vehicle?.status === "active" ? "Active" : "Inactive"}
                </div>
              </div>

              <div className="assigned-card-details">
                <div className="assigned-detail">
                  <MapPin size={19} />
                  <div>
                    <span>Parking Area</span>
                    <strong>
                      {vehicle?.assignedArea
                        ? `Parking Area ${vehicle.assignedArea}`
                        : "Not assigned"}
                    </strong>
                  </div>
                </div>

                <div className="assigned-detail">
                  <CarFront size={19} />
                  <div>
                    <span>Vehicle Plate Number</span>
                    <strong>{vehicle?.plateNumber || "Not registered"}</strong>
                  </div>
                </div>

                <div className="assigned-detail">
                  <ParkingCircle size={19} />
                  <div>
                    <span>Parking Pass</span>
                    <strong>
                      {vehicle?.passNumber || "No pass"}
                      {vehicle?.passType ? ` (${vehicle.passType})` : ""}
                    </strong>
                  </div>
                </div>

                <div className="assigned-detail">
                  <Clock size={19} />
                  <div>
                    <span>Slot Status</span>
                    <strong>
                      {assignedSlot?.status
                        ? assignedSlot.status.charAt(0).toUpperCase() +
                          assignedSlot.status.slice(1)
                        : "Not available"}
                    </strong>
                  </div>
                </div>
              </div>

              {!vehicle && (
                <p className="assignment-note">
                  No vehicle record is currently available.
                </p>
              )}
            </section>

            <section className="availability-summary">
              <div className="availability-icon">
                <ParkingCircle size={25} />
              </div>
              <div>
                <span>Total Available Spaces</span>
                <h2>{totalAvailable}</h2>
                <p>Across all listed parking areas</p>
              </div>
            </section>

            <section className="parking-areas-section">
              <div className="parking-section-heading">
                <div>
                  <h2>Parking Areas</h2>
                  <p>Current parking space availability</p>
                </div>
              </div>

              <div className="parking-area-grid">
                {parkingAreas.map((area) => {
                  const occupied = Number(area.occupiedSpaces || 0);
                  const total = Number(area.totalSpaces || 0);
                  const available = Number(area.availableSpaces || 0);
                  const percentage = total > 0 ? (occupied / total) * 100 : 0;
                  const isFull = available <= 0;

                  return (
                    <article className="parking-area-card" key={area.id}>
                      <div className="area-card-top">
                        <div className="area-icon">
                          <MapPin size={21} />
                        </div>
                        <span
                          className={`area-status ${isFull ? "full" : "available"}`}
                        >
                          {isFull ? "Full" : "Available"}
                        </span>
                      </div>

                      <h3>{area.name}</h3>
                      <div className="area-availability">
                        <strong>{available}</strong>
                        <span>spaces available</span>
                      </div>

                      <div className="area-progress">
                        <div style={{ width: `${percentage}%` }} />
                      </div>

                      <div className="area-card-footer">
                        <span>{occupied} occupied</span>
                        <span>{total} total spaces</span>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>

            <section className="parking-slot-section">
              <div className="parking-section-heading">
                <div>
                  <h2>Parking Slot Information</h2>
                  <p>Slots currently listed in the mock database</p>
                </div>
              </div>

              <div className="parking-slot-list">
                {parkingSlots.map((slot) => (
                  <div
                    className={`parking-slot-item ${
                      slot.id === vehicle?.assignedSlot ? "assigned-slot" : ""
                    }`}
                    key={slot.id}
                  >
                    <div className="slot-icon">
                      <ParkingCircle size={21} />
                    </div>

                    <div className="slot-information">
                      <strong>{slot.slotNumber}</strong>
                      <span>Parking Area {slot.area}</span>
                    </div>

                    <span
                      className={`slot-status ${
                        slot.status === "available"
                          ? "slot-available"
                          : "slot-occupied"
                      }`}
                    >
                      {slot.status}
                    </span>

                    {slot.id === vehicle?.assignedSlot && (
                      <span className="your-slot">Your Slot</span>
                    )}
                  </div>
                ))}

                {parkingSlots.length === 0 && (
                  <p className="assignment-message">
                    No parking slots are currently listed.
                  </p>
                )}
              </div>
            </section>

            <div className="assignment-disclaimer">
              <Clock size={18} />
              <p>
                Parking availability is based on the current sample database.
                Actual parking occupancy must be verified by authorized security
                personnel.
              </p>
            </div>
          </>
        )}

        <footer className="assignment-footer">
          WEBSUPARK · Vehicle Tracking and Parking Verification System
        </footer>
      </main>
    </div>
  );
}

export default ParkingAssignment;
