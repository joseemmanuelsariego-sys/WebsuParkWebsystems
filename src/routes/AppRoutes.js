import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "../pages/auth/Login";

// DRIVER PAGES
import DriverDashboard from "../pages/driver/DriverDashboard";
import ParkingAssignment from "../pages/driver/ParkingAssignment";
import MyVehicle from "../pages/driver/MyVehicle";
import Notifications from "../pages/driver/Notifications";
import MyViolations from "../pages/driver/MyViolations";
import PassRenewal from "../pages/driver/PassRenewal";

// SECURITY PAGES
import PatrolDashboard from "../pages/security/PatrolDashboard";
import ScanVehicle from "../pages/security/ScanVehicle";
import ReportViolation from "../pages/security/ReportViolation";

// ADMIN PAGES
import AdminDashboard from "../pages/admin/AdminDashboard";
import VehicleDatabase from "../pages/admin/VehicleDatabase";
import ParkingMonitoring from "../pages/admin/ParkingMonitoring";
import ViolationRecords from "../pages/admin/ViolationRecords";

// MAP
import CampusMapPage from "../pages/map/CampusMapPage";

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />

        {/* DRIVER */}
        <Route path="/driver" element={<DriverDashboard />} />
        <Route path="/driver/assignment" element={<ParkingAssignment />} />
        <Route path="/driver/parking" element={<ParkingAssignment />} />
        <Route path="/driver/vehicle" element={<MyVehicle />} />
        <Route path="/driver/notifications" element={<Notifications />} />
        <Route path="/driver/violations" element={<MyViolations />} />
        <Route path="/driver/renewal" element={<PassRenewal />} />

        {/* SECURITY */}
        <Route path="/security" element={<PatrolDashboard />} />
        <Route path="/security/scan" element={<ScanVehicle />} />
        <Route path="/security/report" element={<ReportViolation />} />
        

        {/* HEAD SECURITY */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/vehicles" element={<VehicleDatabase />} />
        <Route path="/admin/parking" element={<ParkingMonitoring />} />
        <Route path="/admin/violations" element={<ViolationRecords />} />

        {/* CAMPUS MAP */}
        <Route path="/campus-map" element={<CampusMapPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
