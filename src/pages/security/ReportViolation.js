import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, AlertTriangle, Send } from "lucide-react";
import api from "../../services/api";
import "./ReportViolation.css";

function ReportViolation() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    plateNumber: "",
    violationType: "Wrong Parking Area",
    assignedSlot: "",
    detectedSlot: "",
    severity: "Medium",
    description: "",
  });

  const [vehicles, setVehicles] = useState([]);
  const [parkingSlots, setParkingSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [vehicleResponse, slotResponse] = await Promise.all([
          api.get("/vehicles"),
          api.get("/parkingSlots"),
        ]);

        setVehicles(vehicleResponse.data);
        setParkingSlots(slotResponse.data);
      } catch (error) {
        setMessage("Unable to load vehicle and parking information.");
      }
    };

    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "plateNumber") {
      const normalizedPlate = value.replace(/\s+/g, "").toUpperCase();

      const vehicle = vehicles.find(
        (item) =>
          item.plateNumber.replace(/\s+/g, "").toUpperCase() ===
          normalizedPlate,
      );

      const assignedSlot = vehicle
        ? parkingSlots.find((slot) => slot.vehicleId === vehicle.id)
            ?.slotNumber ||
          vehicle.assignedSlot ||
          ""
        : "";

      setFormData((prev) => ({
        ...prev,
        plateNumber: value,
        assignedSlot,
      }));

      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setMessage("");

      const normalizedPlate = formData.plateNumber
        .replace(/\s+/g, "")
        .toUpperCase();

      const vehicle = vehicles.find(
        (item) =>
          item.plateNumber.replace(/\s+/g, "").toUpperCase() ===
          normalizedPlate,
      );

      if (!vehicle) {
        setMessage("Vehicle not found. Please verify the plate number.");
        return;
      }

      const assignedSlot =
        parkingSlots.find((slot) => slot.vehicleId === vehicle.id)
          ?.slotNumber ||
        vehicle.assignedSlot ||
        "";

      const detectedSlot = formData.detectedSlot.trim().toUpperCase();

      if (!detectedSlot) {
        setMessage("Please enter the detected parking slot.");
        return;
      }

      const validSlot = parkingSlots.some(
        (slot) =>
          slot.slotNumber?.toUpperCase() === detectedSlot ||
          slot.id?.toUpperCase() === detectedSlot,
      );

      if (!validSlot) {
        setMessage("Detected parking slot not found. Check the slot number.");
        return;
      }

      await api.post("/violations", {
        id: `INC-${Date.now()}`,
        vehicleId: vehicle.id,
        plateNumber: vehicle.plateNumber,
        driverName: vehicle.driverName,
        violationType: formData.violationType,
        assignedSlot,
        detectedSlot,
        severity: formData.severity.toLowerCase(),
        description: formData.description,
        status: "pending",
        reportedAt: new Date().toISOString(),
      });

      setMessage("Violation report submitted successfully!");

      setFormData({
        plateNumber: "",
        violationType: "Wrong Parking Area",
        assignedSlot: "",
        detectedSlot: "",
        severity: "Medium",
        description: "",
      });

      e.target.reset();
    } catch (error) {
      console.error("Unable to submit violation:", error);
      setMessage("Unable to submit report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="report-page">
      <header className="report-header">
        <button
          type="button"
          className="back-button"
          onClick={() => navigate("/security")}
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </button>

        <p>SECURITY PERSONNEL</p>
        <h1>Report Parking Violation</h1>
        <span>Record and submit a parking violation for review.</span>
      </header>

      <main className="report-container">
        <section className="report-card">
          <div className="report-title">
            <AlertTriangle size={25} />
            <div>
              <h2>Violation Information</h2>
              <p>Complete the details below.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="report-field">
              <label>Vehicle Plate Number</label>
              <input
                name="plateNumber"
                value={formData.plateNumber}
                onChange={handleChange}
                placeholder="Example: ABC-1234"
                required
              />
            </div>

            <div className="report-field">
              <label>Violation Type</label>
              <select
                name="violationType"
                value={formData.violationType}
                onChange={handleChange}
              >
                <option>Wrong Parking Area</option>
                <option>Unauthorized Parking</option>
                <option>Expired Parking Pass</option>
                <option>Blocking Access</option>
                <option>Improper Parking</option>
                <option>Other</option>
              </select>
            </div>

            <div className="report-row">
              <div className="report-field">
                <label>Assigned Parking Slot</label>
                <input
                  name="assignedSlot"
                  value={formData.assignedSlot}
                  placeholder="Example: P-1-01"
                  readOnly
                />
              </div>

              <div className="report-field">
                <label>Detected Parking Slot</label>
                <input
                  name="detectedSlot"
                  value={formData.detectedSlot}
                  onChange={handleChange}
                  placeholder="Example: P-1-02"
                  required
                />
              </div>
            </div>

            <div className="report-field">
              <label>Violation Severity</label>
              <select
                name="severity"
                value={formData.severity}
                onChange={handleChange}
              >
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
            </div>

            <div className="report-field">
              <label>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe the parking violation..."
                rows="4"
                required
              />
            </div>

            {message && <div className="report-message">{message}</div>}

            <button
              type="submit"
              className="submit-report-button"
              disabled={loading}
            >
              <Send size={18} />
              {loading ? "Submitting..." : "Submit Violation Report"}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}

export default ReportViolation;
