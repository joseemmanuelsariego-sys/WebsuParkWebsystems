import React, { useEffect, useState } from "react";
import {
  MapPin,
  CarFront,
  ParkingSquare,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Search,
  Activity,
  X,
  Info,
  LocateFixed,
  Menu,
} from "lucide-react";

import AdminSidebar from "../../components/admin/AdminSidebar";
import CampusMap from "../../components/map/CampusMap";
import api from "../../services/api";

import "./CampusMapPage.css";

const getParkingStatus = (area) => {
  const total = Number(area.totalSpaces || 0);
  const available = Number(area.availableSpaces || 0);

  if (available <= 0 || total <= 0) return "full";

  const availabilityPercentage = (available / total) * 100;

  if (availabilityPercentage <= 50) return "limited";

  return "available";
};

const normalizePlateNumber = (value) =>
  String(value || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");

function CampusMapPage() {
  const [parkingAreas, setParkingAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [menuOpen, setMenuOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedArea, setSelectedArea] = useState(null);
  const [detailsArea, setDetailsArea] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [sortOrder, setSortOrder] = useState("default");

  const [compareAreas, setCompareAreas] = useState([]);
  const [showComparison, setShowComparison] = useState(false);

  const [plateNumber, setPlateNumber] = useState("");
  const [locatingVehicle, setLocatingVehicle] = useState(false);
  const [vehicleError, setVehicleError] = useState("");
  const [locatedVehicle, setLocatedVehicle] = useState(null);
  const [mapFocusTrigger, setMapFocusTrigger] = useState(0);

  const isAreaCompared = (areaId) =>
    compareAreas.some((id) => String(id) === String(areaId));

  const fetchParkingAreas = async (initialLoad = false) => {
    try {
      if (initialLoad) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError("");

      const response = await api.get("/parkingAreas");

      setParkingAreas(response.data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Unable to load parking areas:", err);
      setError("Unable to load parking information.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchParkingAreas(true);

    const interval = setInterval(() => {
      fetchParkingAreas(false);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!detailsArea) return;

    const updatedArea = parkingAreas.find(
      (area) => String(area.id) === String(detailsArea.id),
    );

    if (updatedArea && updatedArea !== detailsArea) {
      setDetailsArea(updatedArea);
    }
  }, [parkingAreas, detailsArea]);

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

  const fullAreas = parkingAreas.filter(
    (area) => getParkingStatus(area) === "full",
  ).length;

  const limitedAreas = parkingAreas.filter(
    (area) => getParkingStatus(area) === "limited",
  ).length;

  const availableAreas = parkingAreas.filter(
    (area) => getParkingStatus(area) === "available",
  ).length;

  const occupancyPercentage =
    totalSpaces > 0 ? (occupiedSpaces / totalSpaces) * 100 : 0;

  const filteredParkingAreas = parkingAreas.filter((area) => {
    const matchesSearch =
      (area.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(area.id).toLowerCase().includes(searchTerm.toLowerCase());

    const status = getParkingStatus(area);
    const matchesStatus = statusFilter === "all" || statusFilter === status;

    return matchesSearch && matchesStatus;
  });

  const sortedParkingAreas = [...filteredParkingAreas].sort((a, b) => {
    if (sortOrder === "most") {
      return Number(b.availableSpaces || 0) - Number(a.availableSpaces || 0);
    }

    if (sortOrder === "least") {
      return Number(a.availableSpaces || 0) - Number(b.availableSpaces || 0);
    }

    return 0;
  });

  const locateVehicle = async () => {
    const normalizedSearch = normalizePlateNumber(plateNumber);

    if (!normalizedSearch) {
      setVehicleError("Please enter a vehicle plate number.");
      setLocatedVehicle(null);
      return;
    }

    try {
      setLocatingVehicle(true);
      setVehicleError("");
      setLocatedVehicle(null);

      const vehiclesResponse = await api.get("/vehicles");

      const vehicle = vehiclesResponse.data.find(
        (item) => normalizePlateNumber(item.plateNumber) === normalizedSearch,
      );

      if (!vehicle) {
        setVehicleError("Vehicle not found. Please check the plate number.");
        return;
      }

      const slotsResponse = await api.get("/parkingSlots");

      const parkingSlot = slotsResponse.data.find(
        (slot) => String(slot.vehicleId) === String(vehicle.id),
      );

      const areaId =
        parkingSlot?.area ||
        parkingSlot?.areaId ||
        vehicle.assignedArea ||
        vehicle.areaId;

      if (!areaId) {
        setVehicleError(
          "Vehicle found, but it does not have an assigned parking area.",
        );
        return;
      }

      const area = parkingAreas.find(
        (item) => String(item.id) === String(areaId),
      );

      if (!area) {
        setVehicleError(
          `Vehicle found, but parking area ${areaId} could not be found on the map.`,
        );
        return;
      }

      setSelectedArea(area.id);
      setDetailsArea(area);
      setSearchTerm("");
      setStatusFilter("all");

      setLocatedVehicle({
        ...vehicle,
        parkingSlot: parkingSlot || null,
        parkingArea: area,
      });

      setMapFocusTrigger((previous) => previous + 1);

      setTimeout(() => {
        document.getElementById("campus-parking-map")?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 100);
    } catch (err) {
      console.error("Unable to locate vehicle:", err);
      setVehicleError("Unable to locate vehicle. Please try again.");
    } finally {
      setLocatingVehicle(false);
    }
  };

  const handlePlateKeyDown = (event) => {
    if (event.key === "Enter") locateVehicle();
  };

  const clearVehicleSearch = () => {
    setPlateNumber("");
    setVehicleError("");
    setLocatedVehicle(null);
  };

  const toggleCompareArea = (areaId) => {
    setCompareAreas((previous) => {
      const alreadySelected = previous.some(
        (id) => String(id) === String(areaId),
      );

      if (alreadySelected) {
        return previous.filter((id) => String(id) !== String(areaId));
      }

      return [...previous, areaId];
    });

    setShowComparison(false);
  };

  const openComparison = () => {
    if (compareAreas.length >= 2) setShowComparison(true);
  };

  const openAreaDetails = (area) => {
    setSelectedArea(area.id);
    setDetailsArea(area);
  };

  const detailsStatus = detailsArea ? getParkingStatus(detailsArea) : "full";

  const detailsOccupancy = detailsArea
    ? Number(detailsArea.totalSpaces) > 0
      ? Math.min(
          (Number(detailsArea.occupiedSpaces || 0) /
            Number(detailsArea.totalSpaces)) *
            100,
          100,
        )
      : 0
    : 0;

  const selectedComparisonAreas = parkingAreas.filter((area) =>
    isAreaCompared(area.id),
  );

  return (
    <div className="admin-layout">
      <AdminSidebar menuOpen={menuOpen} setMenuOpen={setMenuOpen} />

      <main className="admin-main">
        <header className="admin-topbar">
          <button
            type="button"
            className="admin-menu-button"
            onClick={() => setMenuOpen(true)}
          >
            <Menu size={23} />
          </button>

          <div className="admin-topbar-title">
            <h2>Campus Map</h2>
            <p>Western Visayas State University</p>
          </div>

          <button
            type="button"
            className="admin-refresh-button"
            onClick={() => fetchParkingAreas(false)}
            disabled={loading || refreshing}
          >
            <RefreshCw size={17} />
            <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
          </button>
        </header>

        <div className="admin-content">
          <div className="campus-map-page">
            {/* PAGE HEADER */}
            <header className="campus-map-header">
              <div className="campus-map-heading">
                <div className="campus-map-heading-icon">
                  <MapPin size={25} />
                </div>

                <div>
                  <h1>Campus Map</h1>
                  <p>West Visayas State University Main Campus</p>

                  <div className="campus-map-live-status">
                    <span className="campus-map-live-dot"></span>
                    <span>LIVE</span>

                    <span className="campus-map-last-updated">
                      Last updated:{" "}
                      {lastUpdated
                        ? lastUpdated.toLocaleTimeString()
                        : "Waiting for data..."}
                    </span>
                  </div>
                </div>
              </div>
            </header>

            {/* VEHICLE LOCATOR */}
            <section className="vehicle-locator-section">
              <div className="vehicle-locator-heading">
                <div className="vehicle-locator-icon">
                  <LocateFixed size={22} />
                </div>

                <div>
                  <h2>Locate Vehicle</h2>
                  <p>
                    Find a vehicle's parking location using its plate number.
                  </p>
                </div>
              </div>

              <div className="vehicle-locator-controls">
                <div className="vehicle-locator-input">
                  <Search size={19} />

                  <input
                    type="text"
                    placeholder="Enter plate number (e.g. ABC-1234)"
                    value={plateNumber}
                    onChange={(event) => {
                      setPlateNumber(event.target.value);
                      setVehicleError("");
                    }}
                    onKeyDown={handlePlateKeyDown}
                  />

                  {plateNumber && (
                    <button
                      type="button"
                      className="vehicle-locator-clear"
                      onClick={clearVehicleSearch}
                      aria-label="Clear plate number"
                    >
                      <X size={17} />
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  className="vehicle-locator-button"
                  onClick={locateVehicle}
                  disabled={locatingVehicle || loading}
                >
                  <LocateFixed size={17} />
                  {locatingVehicle ? "Locating..." : "Locate Vehicle"}
                </button>
              </div>

              {vehicleError && (
                <p className="vehicle-locator-error">{vehicleError}</p>
              )}

              {locatedVehicle && (
                <div className="vehicle-locator-result">
                  <div className="vehicle-locator-result-icon">
                    <CheckCircle size={21} />
                  </div>

                  <div className="vehicle-locator-result-info">
                    <strong>Vehicle located successfully</strong>

                    <p>
                      <b>{locatedVehicle.plateNumber}</b>
                      {" • "}
                      {locatedVehicle.ownerName ||
                        locatedVehicle.owner ||
                        "Vehicle"}
                    </p>

                    <p>
                      Parking Area: <b>{locatedVehicle.parkingArea.name}</b>
                      {" • "}
                      Parking Slot:{" "}
                      <b>
                        {locatedVehicle.parkingSlot?.slotNumber ||
                          locatedVehicle.assignedSlot ||
                          "Not specified"}
                      </b>
                    </p>
                  </div>

                  <button
                    type="button"
                    className="vehicle-locator-view-button"
                    onClick={() => {
                      setMapFocusTrigger((previous) => previous + 1);

                      document
                        .getElementById("campus-parking-map")
                        ?.scrollIntoView({
                          behavior: "smooth",
                          block: "center",
                        });
                    }}
                  >
                    <MapPin size={16} />
                    View on Map
                  </button>
                </div>
              )}
            </section>

            {/* PARKING SUMMARY */}
            <section className="campus-map-summary">
              <div className="campus-summary-card">
                <div className="campus-summary-icon blue">
                  <ParkingSquare size={23} />
                </div>
                <div>
                  <span>Total Parking Spaces</span>
                  <h2>{loading ? "..." : totalSpaces}</h2>
                </div>
              </div>

              <div className="campus-summary-card">
                <div className="campus-summary-icon orange">
                  <CarFront size={23} />
                </div>
                <div>
                  <span>Occupied Spaces</span>
                  <h2>{loading ? "..." : occupiedSpaces}</h2>
                </div>
              </div>

              <div className="campus-summary-card">
                <div className="campus-summary-icon green">
                  <CheckCircle size={23} />
                </div>
                <div>
                  <span>Available Spaces</span>
                  <h2>{loading ? "..." : availableSpaces}</h2>
                </div>
              </div>

              <div className="campus-summary-card">
                <div className="campus-summary-icon red">
                  <AlertTriangle size={23} />
                </div>
                <div>
                  <span>Full Parking Areas</span>
                  <h2>{loading ? "..." : fullAreas}</h2>
                </div>
              </div>
            </section>

            {/* AVAILABILITY OVERVIEW */}
            <section className="parking-availability-overview">
              <div className="availability-overview-header">
                <div className="availability-overview-icon">
                  <Activity size={21} />
                </div>

                <div>
                  <h2>Parking Availability Overview</h2>
                  <p>Current parking occupancy across all areas</p>
                </div>
              </div>

              <div className="availability-overview-content">
                <div className="availability-overview-stats">
                  <div>
                    <span>Available Areas</span>
                    <h3 className="available-text">
                      {loading ? "..." : availableAreas}
                    </h3>
                  </div>

                  <div>
                    <span>Limited Areas</span>
                    <h3 className="limited-text">
                      {loading ? "..." : limitedAreas}
                    </h3>
                  </div>

                  <div>
                    <span>Full Areas</span>
                    <h3 className="full-text">{loading ? "..." : fullAreas}</h3>
                  </div>

                  <div>
                    <span>Occupancy Rate</span>
                    <h3>
                      {loading ? "..." : `${occupancyPercentage.toFixed(1)}%`}
                    </h3>
                  </div>
                </div>

                <div className="availability-progress-section">
                  <div className="availability-progress-label">
                    <span>Occupied Spaces</span>
                    <strong>
                      {loading ? "..." : `${occupiedSpaces} / ${totalSpaces}`}
                    </strong>
                  </div>

                  <div className="availability-progress-track">
                    <div
                      className="availability-progress-fill"
                      style={{
                        width: `${Math.min(occupancyPercentage, 100)}%`,
                      }}
                    />
                  </div>

                  <div className="availability-progress-label">
                    <span>
                      Available: {loading ? "..." : availableSpaces} spaces
                    </span>
                    <span>
                      {loading
                        ? "..."
                        : `${Math.max(0, 100 - occupancyPercentage).toFixed(
                            1,
                          )}% available`}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* MAP AND PARKING PANEL */}
            <section className="campus-map-content">
              <div className="campus-map-section" id="campus-parking-map">
                <div className="campus-section-heading">
                  <div>
                    <h2>Campus Parking Map</h2>
                    <p>
                      View parking locations and their current availability.
                    </p>
                  </div>
                </div>

                <CampusMap
                  parkingAreas={parkingAreas}
                  selectedArea={selectedArea}
                  onSelectArea={(id) => {
                    setSelectedArea(id);

                    const area = parkingAreas.find(
                      (item) => String(item.id) === String(id),
                    );

                    if (area) setDetailsArea(area);
                  }}
                  onReset={() => {
                    setSelectedArea(null);
                    setDetailsArea(null);
                  }}
                  focusTrigger={mapFocusTrigger}
                />
              </div>

              {/* PARKING AREAS PANEL */}
              <aside className="campus-parking-panel">
                <div className="campus-section-heading">
                  <div>
                    <h2>Parking Areas</h2>
                    <p>Current parking status</p>
                  </div>
                </div>

                <div className="campus-parking-controls">
                  <div className="campus-parking-search">
                    <Search size={17} />
                    <input
                      type="text"
                      placeholder="Search parking area..."
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                    />
                  </div>

                  <select
                    className="campus-parking-filter"
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                  >
                    <option value="all">All Areas</option>
                    <option value="available">Available</option>
                    <option value="limited">Limited</option>
                    <option value="full">Full</option>
                  </select>

                  <select
                    className="campus-parking-sort"
                    value={sortOrder}
                    onChange={(event) => setSortOrder(event.target.value)}
                  >
                    <option value="default">Default Order</option>
                    <option value="most">Most Available Spaces</option>
                    <option value="least">Fewest Available Spaces</option>
                  </select>
                </div>

                {loading ? (
                  <p className="campus-panel-message">
                    Loading parking areas...
                  </p>
                ) : error && parkingAreas.length === 0 ? (
                  <p className="campus-panel-error">{error}</p>
                ) : sortedParkingAreas.length === 0 ? (
                  <p className="campus-panel-message">
                    No matching parking areas found.
                  </p>
                ) : (
                  <div className="campus-parking-list">
                    {sortedParkingAreas.map((area) => {
                      const status = getParkingStatus(area);

                      const occupancy =
                        Number(area.totalSpaces) > 0
                          ? (Number(area.occupiedSpaces || 0) /
                              Number(area.totalSpaces)) *
                            100
                          : 0;

                      const statusLabel = {
                        available: "Available",
                        limited: "Limited",
                        full: "Full",
                      }[status];

                      const availabilityPercentage =
                        Number(area.totalSpaces) > 0
                          ? (
                              (Number(area.availableSpaces || 0) /
                                Number(area.totalSpaces)) *
                              100
                            ).toFixed(1)
                          : "0.0";

                      return (
                        <div
                          className={`campus-parking-card ${
                            String(selectedArea) === String(area.id)
                              ? "selected"
                              : ""
                          }`}
                          key={area.id}
                          onClick={() => openAreaDetails(area)}
                        >
                          <div className="campus-parking-card-top">
                            <div>
                              <h3>{area.name}</h3>
                              <span>Area {area.id}</span>
                            </div>

                            <div className="campus-parking-card-actions">
                              <span
                                className={`campus-parking-status ${status}`}
                              >
                                {statusLabel}
                              </span>

                              <div
                                className={`campus-compare-option ${
                                  isAreaCompared(area.id) ? "selected" : ""
                                }`}
                                onClick={(event) => event.stopPropagation()}
                              >
                                <input
                                  type="checkbox"
                                  checked={isAreaCompared(area.id)}
                                  onClick={(event) => event.stopPropagation()}
                                  onChange={() => toggleCompareArea(area.id)}
                                />
                                <span>Compare</span>
                              </div>
                            </div>
                          </div>

                          <div className="campus-parking-progress">
                            <div
                              className={`campus-progress-fill ${status}`}
                              style={{
                                width: `${Math.min(occupancy, 100)}%`,
                              }}
                            />
                          </div>

                          <div className="campus-parking-details">
                            <span>
                              Occupied: <strong>{area.occupiedSpaces}</strong>
                            </span>
                            <span>
                              Available: <strong>{area.availableSpaces}</strong>
                            </span>
                          </div>

                          <div className="campus-availability-percentage">
                            <span>Available Capacity</span>
                            <strong>{availabilityPercentage}%</strong>
                          </div>

                          <p className="campus-parking-total">
                            Total capacity: {area.totalSpaces} spaces
                          </p>

                          <span className="campus-card-details-link">
                            <Info size={13} />
                            View Details
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                <button
                  type="button"
                  className="campus-compare-button"
                  onClick={openComparison}
                  disabled={compareAreas.length < 2}
                >
                  Compare Selected Areas ({compareAreas.length})
                </button>

                {error && parkingAreas.length > 0 && (
                  <p className="campus-panel-error">{error}</p>
                )}
              </aside>
            </section>

            {/* COMPARISON */}
            {showComparison && (
              <section className="campus-compare-section">
                <div className="campus-compare-header">
                  <div>
                    <h2>Parking Area Comparison</h2>
                    <p>
                      Compare the capacity and availability of selected areas.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="parking-details-close"
                    onClick={() => setShowComparison(false)}
                    aria-label="Close comparison"
                  >
                    <X size={18} />
                  </button>
                </div>

                {selectedComparisonAreas.length >= 2 ? (
                  <div className="campus-comparison-results">
                    <table className="campus-comparison-table">
                      <thead>
                        <tr>
                          <th>Parking Area</th>
                          <th>Total</th>
                          <th>Occupied</th>
                          <th>Available</th>
                          <th>Availability</th>
                        </tr>
                      </thead>

                      <tbody>
                        {selectedComparisonAreas.map((area) => {
                          const percentage =
                            Number(area.totalSpaces) > 0
                              ? (
                                  (Number(area.availableSpaces || 0) /
                                    Number(area.totalSpaces)) *
                                  100
                                ).toFixed(1)
                              : "0.0";

                          return (
                            <tr key={area.id}>
                              <td>
                                <strong>{area.name}</strong>
                              </td>
                              <td>{area.totalSpaces}</td>
                              <td>{area.occupiedSpaces}</td>
                              <td>{area.availableSpaces}</td>
                              <td>{percentage}%</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="campus-panel-message">
                    Select at least two parking areas to compare.
                  </p>
                )}
              </section>
            )}

            {/* PARKING DETAILS MODAL */}
            {detailsArea && (
              <div
                className="parking-details-overlay"
                onClick={() => setDetailsArea(null)}
              >
                <div
                  className="parking-details-modal"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="parking-details-header">
                    <div>
                      <span>PARKING AREA DETAILS</span>
                      <h2>{detailsArea.name}</h2>
                      <p>Parking Area {detailsArea.id}</p>
                    </div>

                    <button
                      type="button"
                      className="parking-details-close"
                      onClick={() => setDetailsArea(null)}
                      aria-label="Close details"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <div className="parking-details-status">
                    <span className={`campus-parking-status ${detailsStatus}`}>
                      {detailsStatus === "full"
                        ? "Parking Full"
                        : detailsStatus === "limited"
                          ? "Limited Availability"
                          : "Parking Available"}
                    </span>
                  </div>

                  <div className="parking-details-grid">
                    <div>
                      <span>Total Capacity</span>
                      <h3>{detailsArea.totalSpaces}</h3>
                      <small>Parking spaces</small>
                    </div>

                    <div>
                      <span>Occupied</span>
                      <h3>{detailsArea.occupiedSpaces}</h3>
                      <small>Currently occupied</small>
                    </div>

                    <div>
                      <span>Available</span>
                      <h3>{detailsArea.availableSpaces}</h3>
                      <small>Open spaces</small>
                    </div>
                  </div>

                  <div className="parking-details-occupancy">
                    <div className="parking-details-occupancy-heading">
                      <strong>Occupancy Rate</strong>
                      <strong>{detailsOccupancy.toFixed(1)}%</strong>
                    </div>

                    <div className="availability-progress-track">
                      <div
                        className="availability-progress-fill"
                        style={{
                          width: `${detailsOccupancy}%`,
                          background:
                            detailsStatus === "full"
                              ? "#dc2626"
                              : detailsStatus === "limited"
                                ? "#f59e0b"
                                : "#2563eb",
                        }}
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    className="parking-details-done"
                    onClick={() => setDetailsArea(null)}
                  >
                    Close Details
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default CampusMapPage;
