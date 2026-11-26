import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CarFront,
  Eye,
  EyeOff,
  Mail,
  Lock,
  ShieldCheck,
  ParkingCircle,
} from "lucide-react";
import { loginUser } from "../../services/authService";
import "./Login.css";

function Login() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const user = await loginUser(email, password);

      if (user.role !== role) {
        setError("The selected role does not match your registered account.");
        setLoading(false);
        return;
      }

      const destinations = {
        driver: "/driver",
        security: "/security",
        admin: "/admin",
      };

      navigate(destinations[user.role], { replace: true });
    } catch (err) {
      setError(err.message || "Unable to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-brand">
          <div className="brand-logo">
            <CarFront size={38} />
          </div>

          <h1>WEBSUPARK</h1>
          <p className="brand-subtitle">SMART PARKING MANAGEMENT SYSTEM</p>

          <div className="brand-divider"></div>

          <h2>
            Smarter Parking.
            <br />
            Safer Campus.
          </h2>

          <p className="brand-description">
            An AI-assisted vehicle tracking and parking verification system
            designed for West Visayas State University.
          </p>

          <div className="brand-features">
            <div>
              <ShieldCheck size={20} />
              <span>Vehicle Verification</span>
            </div>

            <div>
              <ParkingCircle size={20} />
              <span>Smart Parking Monitoring</span>
            </div>

            <div>
              <CarFront size={20} />
              <span>Vehicle Tracking</span>
            </div>
          </div>

          <p className="brand-footer">
            WEST VISAYAS STATE UNIVERSITY
            <br />
            MAIN CAMPUS
          </p>
        </div>

        <div className="login-form-section">
          <form className="login-form" onSubmit={handleLogin}>
            <div className="form-heading">
              <h2>Welcome Back!</h2>
              <p>Sign in to access your WEBSUPARK account.</p>
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address</label>

              <div className="input-wrapper">
                <Mail size={19} />
                <input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>

              <div className="input-wrapper">
                <Lock size={19} />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="role">Account Role</label>

              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                required
              >
                <option value="">Select your role</option>
                <option value="driver">Driver</option>
                <option value="security">Security Personnel</option>
                <option value="admin">Head Security</option>
              </select>
            </div>

            {error && (
              <div className="login-error" role="alert">
                {error}
              </div>
            )}

            <div className="forgot-password">
              <button
                type="button"
                onClick={() => alert("Password recovery will be added later.")}
              >
                Forgot Password?
              </button>
            </div>

            <button type="submit" className="login-button" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </button>

            <div className="login-note">
              <ShieldCheck size={17} />
              <span>Your account information is protected.</span>
            </div>
          </form>

          <div className="login-bottom">
            <p>West Visayas State University</p>
            <span>WEBSUPARK © 2026. All rights reserved.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
