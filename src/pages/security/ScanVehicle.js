import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  ArrowLeft,
  ShieldCheck,
  AlertTriangle,
  MapPin,
  Navigation,
  ParkingSquare,
  Camera,
  CameraOff,
  ScanLine,
} from "lucide-react";

import { createWorker } from "tesseract.js";
import api from "../../services/api";
import CampusMap from "../../components/map/CampusMap";
import "./ScanVehicle.css";

// NORMALIZE PASS CODE
function normalizePassCode(value) {
  return String(value || "")
    .toUpperCase()
    .replace(/[\s-]/g, "")
    .trim();
}

// IDENTIFY PASS TYPE
function getPassType(code) {
  if (/^S\d{3}$/.test(code)) return "Student";
  if (/^E\d{3}$/.test(code)) return "Employee";
  if (/^P\d{3}$/.test(code)) return "Parents";
  if (/^\d{3}$/.test(code)) return "Drop-off";

  return "Unknown";
}

// EXTRACT PASS NUMBER FROM OCR TEXT
function extractPassCode(text) {
  const cleanedText = String(text || "").toUpperCase();

  const letterCode = cleanedText.match(
    /(?:^|[^A-Z0-9])([SEP])\s*[-:]?\s*(\d{3})(?!\d)/,
  );

  if (letterCode) {
    return `${letterCode[1]}${letterCode[2]}`;
  }

  const numberCode = cleanedText.match(/(?:^|[^A-Z0-9])(\d{3})(?!\d)/);

  if (numberCode) {
    return numberCode[1];
  }

  return "";
}

function ScanVehicle() {
  const navigate = useNavigate();

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const workerRef = useRef(null);

  const [mapFocusTrigger, setMapFocusTrigger] = useState(0);

  const [passCode, setPassCode] = useState("");
  const [observedSlot, setObservedSlot] = useState("");

  const [vehicle, setVehicle] = useState(null);
  const [parkingLocation, setParkingLocation] = useState(null);

  const [parkingAreas, setParkingAreas] = useState([]);
  const [selectedMapArea, setSelectedMapArea] = useState(null);

  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  const [cameraActive, setCameraActive] = useState(false);
  const [scanning, setScanning] = useState(false);

  const [error, setError] = useState("");
  const [locationError, setLocationError] = useState("");
  const [cameraError, setCameraError] = useState("");
  const [scanMessage, setScanMessage] = useState("");

  // FETCH PARKING AREAS
  useEffect(() => {
    const fetchParkingAreas = async () => {
      try {
        const response = await api.get("/parkingAreas");
        setParkingAreas(response.data || []);
      } catch (err) {
        console.error("Unable to load parking areas:", err);
      }
    };

    fetchParkingAreas();
  }, []);

  // STOP CAMERA
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });

      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }

    setCameraActive(false);
  };

  // CLEAN UP CAMERA AND OCR WORKER
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => {
          track.stop();
        });

        streamRef.current = null;
      }

      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  // START DEVICE CAMERA
  const startCamera = async () => {
    try {
      setCameraError("");
      setScanMessage("");

      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError(
          "Camera access requires HTTPS or localhost. Your browser may not support camera access.",
        );
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      streamRef.current = stream;
      setCameraActive(true);
    } catch (err) {
      console.error("Camera error:", err);

      if (err.name === "NotAllowedError") {
        setCameraError(
          "Camera permission denied. Allow camera access in your browser settings.",
        );
      } else if (err.name === "NotFoundError") {
        setCameraError("No camera was found on this device.");
      } else if (err.name === "NotReadableError") {
        setCameraError(
          "The camera is already being used by another application.",
        );
      } else {
        setCameraError(
          "Unable to start the camera. Check your device and browser permissions.",
        );
      }
    }
  };

  // ATTACH CAMERA STREAM AFTER VIDEO ELEMENT RENDERS
  useEffect(() => {
    if (!cameraActive || !videoRef.current || !streamRef.current) {
      return;
    }

    const video = videoRef.current;
    video.srcObject = streamRef.current;

    video.play().catch((err) => {
      console.error("Camera preview error:", err);

      setCameraError("Unable to display the camera preview.");
      stopCamera();
    });
  }, [cameraActive]);

  // GET OR CREATE OCR WORKER
  const getOCRWorker = async () => {
    if (!workerRef.current) {
      setScanMessage("Preparing text recognition...");
      workerRef.current = await createWorker("eng");
    }

    return workerRef.current;
  };

  // SEARCH VEHICLE USING PASS CODE
  const searchByPassCode = async (code) => {
    const normalizedCode = normalizePassCode(code);

    if (
      !/^(S|E|P)\d{3}$/.test(normalizedCode) &&
      !/^\d{3}$/.test(normalizedCode)
    ) {
      setError(
        "Invalid pass code. Use S123, E123, P123, or a three-digit drop-off code.",
      );

      setVehicle(null);
      setParkingLocation(null);
      setSelectedMapArea(null);
      return;
    }

    try {
      setLoading(true);
      setError("");
      setLocationError("");

      setVehicle(null);
      setParkingLocation(null);
      setSelectedMapArea(null);
      setMapFocusTrigger(0);
      setObservedSlot("");

      const response = await api.get("/vehicles");

      const foundVehicle = response.data.find((item) => {
        const storedCode = normalizePassCode(item.passCode || item.passNumber);

        return storedCode === normalizedCode;
      });

      if (!foundVehicle) {
        setError(`No vehicle was found with pass code ${normalizedCode}.`);
        return;
      }

      setVehicle(foundVehicle);

      // FIND VEHICLE PARKING SLOT
      try {
        setLocationLoading(true);

        const slotResponse = await api.get("/parkingSlots", {
          params: {
            vehicleId: foundVehicle.id,
          },
        });

        const foundSlot =
          slotResponse.data.find(
            (slot) =>
              String(slot.vehicleId) === String(foundVehicle.id) &&
              slot.status?.toLowerCase() === "occupied",
          ) ||
          slotResponse.data.find(
            (slot) => String(slot.vehicleId) === String(foundVehicle.id),
          );

        if (!foundSlot) {
          setLocationError(
            "No current parking record was found for this vehicle.",
          );
        } else {
          const areaId = foundSlot.area || foundSlot.areaId;

          if (!areaId) {
            setLocationError(
              "The parking record does not have a parking area assigned.",
            );
          } else {
            const areaResponse = await api.get("/parkingAreas", {
              params: {
                id: areaId,
              },
            });

            const foundArea = areaResponse.data[0];

            setParkingLocation({
              areaId,
              areaName: foundArea?.name || `Parking Area ${areaId}`,
              slotNumber:
                foundSlot.slotNumber || foundSlot.id || "Not specified",
              status: foundSlot.status || "Unknown",
            });

            // SELECT THE VEHICLE'S PARKING AREA
            setSelectedMapArea(areaId);
          }
        }
      } catch (locationErr) {
        console.error("Unable to retrieve parking location:", locationErr);

        setLocationError("Unable to retrieve the vehicle's parking location.");
      } finally {
        setLocationLoading(false);
      }
    } catch (err) {
      console.error("Vehicle search failed:", err);

      setError("Unable to search vehicle. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  // MANUAL PASS CODE SEARCH
  const searchVehicle = async (e) => {
    e.preventDefault();
    await searchByPassCode(passCode);
  };

  // CAPTURE CAMERA IMAGE AND READ PASS NUMBER
  const scanPass = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || !video.videoWidth) {
      setCameraError("The camera is not ready. Please wait and try again.");
      return;
    }

    try {
      setScanning(true);
      setCameraError("");
      setScanMessage("Capturing pass image...");

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const context = canvas.getContext("2d");
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      setScanMessage("Reading vehicle pass number...");

      const worker = await getOCRWorker();
      const result = await worker.recognize(canvas);

      const recognizedText = result.data.text;

      console.log("OCR recognized text:", recognizedText);

      const detectedCode = extractPassCode(recognizedText);

      if (!detectedCode) {
        setScanMessage("");

        setCameraError(
          "No valid pass number detected. Move closer, improve the lighting, and try again.",
        );

        return;
      }

      setPassCode(detectedCode);

      setScanMessage(
        `Detected ${detectedCode} (${getPassType(detectedCode)} pass).`,
      );

      stopCamera();

      await searchByPassCode(detectedCode);
    } catch (err) {
      console.error("Pass scanning failed:", err);

      setCameraError("Unable to read the pass. Please try capturing it again.");

      setScanMessage("");
    } finally {
      setScanning(false);
    }
  };

  // VEHICLE STATUS
  const isActive = vehicle?.status?.toLowerCase() === "active";

  // CHECK PARKING SLOT
  const hasSlotMismatch =
    vehicle &&
    observedSlot.trim() &&
    vehicle.assignedSlot &&
    observedSlot.trim().toUpperCase() !== vehicle.assignedSlot.toUpperCase();

  // LOCATE VEHICLE ON MAP
  const locateOnMap = () => {
    if (!parkingLocation?.areaId) return;

    setSelectedMapArea(parkingLocation.areaId);

    // FORCE THE MAP TO ZOOM AGAIN ON EVERY CLICK
    setMapFocusTrigger((previous) => previous + 1);

    document.getElementById("vehicle-parking-map")?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  };

  const displayedPassCode = normalizePassCode(
    vehicle?.passCode || vehicle?.passNumber,
  );

  return (
    <div className="scan-page">
      <div className="scan-header">
        <button className="back-button" onClick={() => navigate("/security")}>
          <ArrowLeft size={18} />
          Back to Dashboard
        </button>

        <p>SECURITY PERSONNEL</p>
        <h1>Vehicle Verification</h1>

        <span>
          Scan or enter a vehicle pass number to verify its registration.
        </span>
      </div>

      <div className="scan-content">
        {/* VEHICLE PASS SCANNER */}
        <section className="scan-search-card">
          <div className="scan-icon">
            <ScanLine size={28} />
          </div>

          <h2>Vehicle Pass Scanner</h2>

          <p>
            Use your device camera to read the printed pass number, or enter it
            manually.
          </p>

          {/* PASS FORMATS */}
          <div className="pass-format-guide">
            <div>
              <strong>Student</strong>
              <span>S123</span>
            </div>

            <div>
              <strong>Employee</strong>
              <span>E123</span>
            </div>

            <div>
              <strong>Parents</strong>
              <span>P123</span>
            </div>

            <div>
              <strong>Drop-off</strong>
              <span>123</span>
            </div>
          </div>

          {/* CAMERA */}
          <div className="pass-camera-section">
            {!cameraActive ? (
              <button
                type="button"
                className="start-camera-button"
                onClick={startCamera}
                disabled={scanning}
              >
                <Camera size={19} />
                Open Device Camera
              </button>
            ) : (
              <div className="camera-container">
                <div className="camera-preview">
                  <video ref={videoRef} autoPlay muted playsInline />

                  <div className="camera-guide">
                    <span>Position the pass number inside this area</span>
                  </div>
                </div>

                <div className="camera-controls">
                  <button
                    type="button"
                    className="capture-pass-button"
                    onClick={scanPass}
                    disabled={scanning}
                  >
                    <ScanLine size={19} />
                    {scanning ? "Scanning..." : "Capture and Read Pass"}
                  </button>

                  <button
                    type="button"
                    className="stop-camera-button"
                    onClick={stopCamera}
                    disabled={scanning}
                  >
                    <CameraOff size={19} />
                    Close Camera
                  </button>
                </div>
              </div>
            )}

            {cameraError && (
              <div className="scan-error">
                <AlertTriangle size={18} />
                {cameraError}
              </div>
            )}

            {scanMessage && (
              <div className="scan-message">
                <ScanLine size={18} />
                {scanMessage}
              </div>
            )}

            <canvas ref={canvasRef} style={{ display: "none" }} />
          </div>

          {/* MANUAL ENTRY */}
          <div className="pass-divider">
            <span>OR ENTER PASS NUMBER MANUALLY</span>
          </div>

          <form onSubmit={searchVehicle}>
            <label htmlFor="passCode">Vehicle Pass Number</label>

            <input
              id="passCode"
              type="text"
              placeholder="Example: S 123, E123, P123, or 123"
              value={passCode}
              onChange={(e) => setPassCode(e.target.value)}
            />

            <button type="submit" disabled={loading || scanning}>
              <Search size={18} />
              {loading ? "Searching..." : "Verify Vehicle Pass"}
            </button>
          </form>

          {error && (
            <div className="scan-error">
              <AlertTriangle size={18} />
              {error}
            </div>
          )}
        </section>

        {/* VEHICLE RESULT */}
        {vehicle && (
          <section className="vehicle-result-card">
            <div className="result-heading">
              <div>
                <p>VERIFICATION RESULT</p>
                <h2>Vehicle Information</h2>
              </div>

              <span className={isActive ? "status-active" : "status-inactive"}>
                {isActive ? "Active Pass" : "Inactive Pass"}
              </span>
            </div>

            <div className="vehicle-details">
              <div className="vehicle-detail">
                <span>Pass Number</span>
                <strong>{displayedPassCode || "Not available"}</strong>
              </div>

              <div className="vehicle-detail">
                <span>Pass Type</span>
                <strong>
                  {vehicle.passType || getPassType(displayedPassCode)}
                </strong>
              </div>

              <div className="vehicle-detail">
                <span>Plate Number</span>
                <strong>{vehicle.plateNumber}</strong>
              </div>

              <div className="vehicle-detail">
                <span>Driver Name</span>
                <strong>{vehicle.driverName || "Not available"}</strong>
              </div>

              <div className="vehicle-detail">
                <span>Vehicle Type</span>
                <strong>{vehicle.vehicleType || "Not available"}</strong>
              </div>

              <div className="vehicle-detail">
                <span>Vehicle Color</span>
                <strong>{vehicle.color || "Not available"}</strong>
              </div>

              <div className="vehicle-detail">
                <span>Assigned Parking Area</span>
                <strong>{vehicle.assignedArea || "Not assigned"}</strong>
              </div>

              <div className="vehicle-detail">
                <span>Assigned Parking Slot</span>
                <strong>{vehicle.assignedSlot || "Not assigned"}</strong>
              </div>
            </div>

            {/* VERIFICATION STATUS */}
            <div
              className={
                isActive ? "verification-success" : "verification-warning"
              }
            >
              {isActive ? (
                <ShieldCheck size={22} />
              ) : (
                <AlertTriangle size={22} />
              )}

              <div>
                <strong>
                  {isActive
                    ? "Vehicle Pass Verified"
                    : "Vehicle Pass Needs Review"}
                </strong>

                <p>
                  {isActive
                    ? "This vehicle has an active registration in the system."
                    : "This vehicle does not have an active pass. Please review its registration."}
                </p>
              </div>
            </div>

            {/* CURRENT PARKING LOCATION */}
            <div className="slot-verification">
              <div className="slot-title">
                <MapPin size={21} />
                <h2>Current Parking Location</h2>
              </div>

              {locationLoading ? (
                <p>Retrieving parking location...</p>
              ) : parkingLocation ? (
                <div className="vehicle-parking-location">
                  <div className="vehicle-location-detail">
                    <ParkingSquare size={24} />

                    <div>
                      <span>Recorded Parking Area</span>
                      <strong>{parkingLocation.areaName}</strong>
                    </div>
                  </div>

                  <div className="vehicle-location-detail">
                    <MapPin size={24} />

                    <div>
                      <span>Recorded Parking Slot</span>
                      <strong>{parkingLocation.slotNumber}</strong>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="locate-map-button"
                    onClick={locateOnMap}
                  >
                    <Navigation size={18} />
                    Locate on Map
                  </button>

                  <p className="parking-location-note">
                    This location is based on the vehicle's recorded parking
                    slot in the database.
                  </p>
                </div>
              ) : (
                <div className="scan-error">
                  <AlertTriangle size={18} />
                  {locationError ||
                    "No parking location is currently available."}
                </div>
              )}
            </div>

            {/* PARKING SLOT VERIFICATION */}
            <div className="slot-verification">
              <div className="slot-title">
                <MapPin size={21} />
                <h2>Parking Slot Verification</h2>
              </div>

              <p>Enter the actual parking slot where you found this vehicle.</p>

              <label htmlFor="observedSlot">Observed Parking Slot</label>

              <input
                id="observedSlot"
                type="text"
                placeholder="Example: P-1-01"
                value={observedSlot}
                onChange={(e) => setObservedSlot(e.target.value)}
              />

              {observedSlot.trim() && vehicle.assignedSlot && (
                <div
                  className={hasSlotMismatch ? "slot-warning" : "slot-success"}
                >
                  {hasSlotMismatch ? (
                    <AlertTriangle size={22} />
                  ) : (
                    <ShieldCheck size={22} />
                  )}

                  <div>
                    <strong>
                      {hasSlotMismatch
                        ? "Wrong Parking Slot Detected"
                        : "Correct Parking Slot"}
                    </strong>

                    <p>
                      Assigned: {vehicle.assignedSlot} | Observed:{" "}
                      {observedSlot.trim().toUpperCase()}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* VEHICLE LOCATION MAP */}
            {parkingLocation && (
              <div
                id="vehicle-parking-map"
                className="vehicle-location-map-section"
              >
                <div className="slot-title">
                  <MapPin size={21} />
                  <h2>Vehicle Location on Campus Map</h2>
                </div>

                <p>
                  The map is zoomed in on the parking area where this vehicle
                  was recorded.
                </p>

                <div className="vehicle-location-map">
                  {parkingAreas.length > 0 ? (
                    <CampusMap
                      parkingAreas={parkingAreas}
                      selectedArea={selectedMapArea}
                      onSelectArea={setSelectedMapArea}
                      onReset={() => setSelectedMapArea(parkingLocation.areaId)}
                      focusTrigger={mapFocusTrigger}
                    />
                  ) : (
                    <p>Loading campus map...</p>
                  )}
                </div>

                <div className="map-location-information">
                  <MapPin size={18} />

                  <span>
                    Vehicle located in{" "}
                    <strong>{parkingLocation.areaName}</strong>, Slot{" "}
                    <strong>{parkingLocation.slotNumber}</strong>
                  </span>
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

export default ScanVehicle;
