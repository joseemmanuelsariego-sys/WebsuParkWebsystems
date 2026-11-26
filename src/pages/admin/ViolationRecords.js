import React, { useEffect, useState } from "react";
import {
  ShieldAlert,
  Search,
  RefreshCw,
  Eye,
  X,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  CarFront,
  MapPin,
  FileText,
  AlertTriangle,
} from "lucide-react";

import api from "../../services/api";
import AdminSidebar from "../../components/admin/AdminSidebar";

import "../security/ReportViolation.css";
import "./AdminDashboard.css";
import "./ViolationRecords.css";

function ViolationRecords() {
  const [violations, setViolations] = useState([]);
  const [selectedViolation, setSelectedViolation] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState("");

  const fetchViolations = async () => {
    try {
      setLoading(true);
      const response = await api.get("/violations");
      setViolations(response.data);
    } catch (error) {
      console.error("Error fetching violations:", error);
      setMessage("Unable to load violation records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchViolations();
  }, []);

  const normalizedStatus = (status) => (status || "pending").toLowerCase();

  const pendingCount = violations.filter(
    (item) => normalizedStatus(item.status) === "pending",
  ).length;

  const confirmedCount = violations.filter(
    (item) => normalizedStatus(item.status) === "confirmed",
  ).length;

  const rejectedCount = violations.filter(
    (item) => normalizedStatus(item.status) === "rejected",
  ).length;

  const filteredViolations = violations.filter((violation) => {
    const search = searchTerm.toLowerCase();

    const matchesSearch =
      (violation.plateNumber || "").toLowerCase().includes(search) ||
      (violation.driverName || "").toLowerCase().includes(search) ||
      (violation.violationType || violation.type || "")
        .toLowerCase()
        .includes(search) ||
      (violation.id || "").toLowerCase().includes(search);

    const status = normalizedStatus(violation.status);

    const matchesStatus = statusFilter === "all" || status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateValue) => {
    if (!dateValue) return "Date unavailable";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) return "Date unavailable";

    return date.toLocaleString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleDecision = async (decision) => {
    if (!selectedViolation || processing) return;

    try {
      setProcessing(true);
      setMessage("");

      const response = await api.patch(
        `/violations/${encodeURIComponent(selectedViolation.id)}`,
        {
          status: decision,
          reviewedAt: new Date().toISOString(),
        },
      );

      const updatedViolation = response.data;

      setViolations((previous) =>
        previous.map((item) =>
          item.id === updatedViolation.id ? updatedViolation : item,
        ),
      );

      setSelectedViolation(updatedViolation);

      setMessage(
        decision === "confirmed"
          ? "Violation confirmed successfully."
          : "Violation report rejected successfully.",
      );
    } catch (error) {
      console.error("Error updating violation:", error);
      setMessage("Unable to update the report. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const getStatusClass = (status) => {
    const value = normalizedStatus(status);

    if (value === "confirmed") return "status-confirmed";
    if (value === "rejected") return "status-rejected";

    return "status-pending";
  };

  return (
    <div className="violation-management-layout">
      <AdminSidebar />

      <main className="violation-management-main">
        <div className="violation-management-header">
          <div>
            <p className="violation-page-subtitle">HEAD SECURITY</p>
            <h1>Violation Management</h1>
            <p>Review submitted parking violation reports and their details.</p>
          </div>

          <button
            type="button"
            className="violation-refresh-button"
            onClick={fetchViolations}
            disabled={loading}
          >
            <RefreshCw size={17} />
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {message && (
          <div className="violation-notice">
            {message}
            <button type="button" onClick={() => setMessage("")}>
              <X size={16} />
            </button>
          </div>
        )}

        <section className="violation-summary">
          <div className="violation-summary-card">
            <div className="summary-icon total-icon">
              <FileText size={22} />
            </div>
            <div>
              <span>Total Reports</span>
              <h2>{violations.length}</h2>
            </div>
          </div>

          <div className="violation-summary-card">
            <div className="summary-icon pending-icon">
              <Clock size={22} />
            </div>
            <div>
              <span>Pending Review</span>
              <h2>{pendingCount}</h2>
            </div>
          </div>

          <div className="violation-summary-card">
            <div className="summary-icon confirmed-icon">
              <CheckCircle size={22} />
            </div>
            <div>
              <span>Confirmed</span>
              <h2>{confirmedCount}</h2>
            </div>
          </div>

          <div className="violation-summary-card">
            <div className="summary-icon rejected-icon">
              <XCircle size={22} />
            </div>
            <div>
              <span>Rejected</span>
              <h2>{rejectedCount}</h2>
            </div>
          </div>
        </section>

        <section className="violation-records-section">
          <div className="violation-records-heading">
            <div>
              <h2>Submitted Reports</h2>
              <p>Open a report to inspect its details and make a decision.</p>
            </div>
          </div>

          <div className="violation-toolbar">
            <div className="violation-search">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search plate, driver, report ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="violation-status-filter"
            >
              <option value="all">All Reports</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div className="violation-table-wrapper">
            <table className="violation-table">
              <thead>
                <tr>
                  <th>Report ID</th>
                  <th>Plate Number</th>
                  <th>Violation Type</th>
                  <th>Assigned Slot</th>
                  <th>Detected Slot</th>
                  <th>Severity</th>
                  <th>Date Reported</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredViolations.length > 0 ? (
                  filteredViolations.map((violation) => (
                    <tr key={violation.id}>
                      <td>{violation.id}</td>
                      <td>{violation.plateNumber || "N/A"}</td>
                      <td>
                        {violation.violationType || violation.type || "N/A"}
                      </td>
                      <td>{violation.assignedSlot || "N/A"}</td>
                      <td>{violation.detectedSlot || "N/A"}</td>
                      <td>
                        <span
                          className={`severity-label severity-${(
                            violation.severity || "medium"
                          ).toLowerCase()}`}
                        >
                          {violation.severity || "Medium"}
                        </span>
                      </td>
                      <td>{formatDate(violation.reportedAt)}</td>
                      <td>
                        <span
                          className={`violation-status-label ${getStatusClass(
                            violation.status,
                          )}`}
                        >
                          {normalizedStatus(violation.status)}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="view-violation-button"
                          onClick={() => {
                            setSelectedViolation(violation);
                            setMessage("");
                          }}
                        >
                          <Eye size={16} />
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" className="violation-empty-state">
                      <ShieldAlert size={28} />
                      <p>No violation reports found.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {selectedViolation && (
        <div
          className="violation-modal-overlay"
          onClick={() => {
            if (!processing) setSelectedViolation(null);
          }}
        >
          <div className="violation-modal" onClick={(e) => e.stopPropagation()}>
            <div className="violation-modal-header">
              <div>
                <span>REPORT DETAILS</span>
                <h2>{selectedViolation.id}</h2>
              </div>

              <button
                type="button"
                className="violation-modal-close"
                onClick={() => setSelectedViolation(null)}
                disabled={processing}
              >
                <X size={22} />
              </button>
            </div>

            <div className="violation-modal-body">
              <div className="violation-detail-status">
                <span>Status</span>
                <span
                  className={`violation-status-label ${getStatusClass(
                    selectedViolation.status,
                  )}`}
                >
                  {normalizedStatus(selectedViolation.status)}
                </span>
              </div>

              <div className="violation-detail-grid">
                <div className="violation-detail-item">
                  <CarFront size={18} />
                  <div>
                    <span>Plate Number</span>
                    <strong>{selectedViolation.plateNumber || "N/A"}</strong>
                  </div>
                </div>

                <div className="violation-detail-item">
                  <FileText size={18} />
                  <div>
                    <span>Driver Name</span>
                    <strong>{selectedViolation.driverName || "N/A"}</strong>
                  </div>
                </div>

                <div className="violation-detail-item">
                  <AlertTriangle size={18} />
                  <div>
                    <span>Violation Type</span>
                    <strong>
                      {selectedViolation.violationType ||
                        selectedViolation.type ||
                        "N/A"}
                    </strong>
                  </div>
                </div>

                <div className="violation-detail-item">
                  <MapPin size={18} />
                  <div>
                    <span>Assigned Slot</span>
                    <strong>{selectedViolation.assignedSlot || "N/A"}</strong>
                  </div>
                </div>

                <div className="violation-detail-item">
                  <MapPin size={18} />
                  <div>
                    <span>Detected Slot</span>
                    <strong>{selectedViolation.detectedSlot || "N/A"}</strong>
                  </div>
                </div>

                <div className="violation-detail-item">
                  <Calendar size={18} />
                  <div>
                    <span>Date Reported</span>
                    <strong>{formatDate(selectedViolation.reportedAt)}</strong>
                  </div>
                </div>

                <div className="violation-detail-item">
                  <AlertTriangle size={18} />
                  <div>
                    <span>Severity</span>
                    <strong>{selectedViolation.severity || "Medium"}</strong>
                  </div>
                </div>
              </div>

              <div className="violation-description-section">
                <h3>Description</h3>
                <p>
                  {selectedViolation.description?.trim() ||
                    "No description was provided."}
                </p>
              </div>
            </div>

            <div className="violation-modal-footer">
              {normalizedStatus(selectedViolation.status) === "pending" ? (
                <>
                  <button
                    type="button"
                    className="reject-violation-button"
                    onClick={() => handleDecision("rejected")}
                    disabled={processing}
                  >
                    <XCircle size={18} />
                    {processing ? "Processing..." : "Reject Report"}
                  </button>

                  <button
                    type="button"
                    className="confirm-violation-button"
                    onClick={() => handleDecision("confirmed")}
                    disabled={processing}
                  >
                    <CheckCircle size={18} />
                    {processing ? "Processing..." : "Confirm Violation"}
                  </button>
                </>
              ) : (
                <p className="violation-already-reviewed">
                  This report has already been reviewed.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ViolationRecords;
