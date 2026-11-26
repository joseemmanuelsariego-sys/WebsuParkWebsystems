import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  CarFront,
  ParkingSquare,
  AlertTriangle,
  ShieldCheck,
  Users,
  LogOut,
  X,
  MapPin,
} from "lucide-react";

import { logoutUser } from "../../services/authService";
import "./AdminSidebar.css";

function AdminSidebar({ menuOpen = false, setMenuOpen = () => {} }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      alert("Unable to log out. Please try again.");
    }
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <aside
        className={`shared-admin-sidebar ${
          menuOpen ? "shared-sidebar-open" : ""
        }`}
      >
        <div className="shared-admin-brand">
          <div className="shared-brand-icon">
            <ShieldCheck size={27} />
          </div>

          <div>
            <h2>WEBSUPARK</h2>
            <span>Management System</span>
          </div>

          <button
            className="shared-close-menu"
            onClick={closeMenu}
            type="button"
          >
            <X size={21} />
          </button>
        </div>

        <div className="shared-admin-profile">
          <div className="shared-profile-icon">
            <Users size={22} />
          </div>

          <div>
            <strong>Head Security</strong>
            <span>Administrator</span>
          </div>
        </div>

        <p className="shared-menu-label">MAIN MENU</p>

        <nav className="shared-admin-navigation">
          <NavLink
            to="/admin"
            end
            onClick={closeMenu}
            className={({ isActive }) =>
              isActive
                ? "shared-admin-nav-link active"
                : "shared-admin-nav-link"
            }
          >
            <LayoutDashboard size={19} />
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/admin/vehicles"
            onClick={closeMenu}
            className={({ isActive }) =>
              isActive
                ? "shared-admin-nav-link active"
                : "shared-admin-nav-link"
            }
          >
            <CarFront size={19} />
            <span>Vehicle Database</span>
          </NavLink>

          <NavLink
            to="/admin/parking"
            onClick={closeMenu}
            className={({ isActive }) =>
              isActive
                ? "shared-admin-nav-link active"
                : "shared-admin-nav-link"
            }
          >
            <ParkingSquare size={19} />
            <span>Parking Monitoring</span>
          </NavLink>

          <NavLink
            to="/campus-map"
            onClick={closeMenu}
            className={({ isActive }) =>
              isActive
                ? "shared-admin-nav-link active"
                : "shared-admin-nav-link"
            }
          >
            <MapPin size={19} />
            <span>Campus Map</span>
          </NavLink>

          <NavLink
            to="/admin/violations"
            onClick={closeMenu}
            className={({ isActive }) =>
              isActive
                ? "shared-admin-nav-link active"
                : "shared-admin-nav-link"
            }
          >
            <AlertTriangle size={19} />
            <span>Violation Management</span>
          </NavLink>
        </nav>

        <div className="shared-sidebar-bottom">
          <button
            type="button"
            className="shared-admin-nav-link"
            onClick={handleLogout}
          >
            <LogOut size={19} />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {menuOpen && (
        <div className="shared-sidebar-overlay" onClick={closeMenu} />
      )}
    </>
  );
}

export default AdminSidebar;
