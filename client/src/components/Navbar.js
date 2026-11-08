import { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import ToastContext from "../context/ToastContext";

const Navbar = ({ title = "CONTACT MANAGEMENT SYSTEM" }) => {
  const navigate = useNavigate();
  const { user, setUser } = useContext(AuthContext);
  const { toast } = useContext(ToastContext);

  const handleLogout = () => {
    setUser(null);
    localStorage.clear();
    toast.success("Logged out successfully.");
    navigate("/login", { replace: true });
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-custom shadow-sm">
      <div className="container-fluid px-md-4">
        <Link to="/" className="navbar-brand">
          {title}
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarColor01"
          aria-controls="navbarColor01"
          aria-expanded="false"
          aria-label="Toggle navigation"
          style={{ borderColor: "var(--cms-navbar-text)" }}
        >
          <span
            className="navbar-toggler-icon"
            style={{ filter: "invert(80%) sepia(20%) hue-rotate(300deg)" }}
          ></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarColor01">
          <ul className="navbar-nav ms-auto align-items-center">
            {user ? (
              <>
                <li className="nav-item">
                  <Link to="/mycontacts" className="nav-link">
                    CONTACTS
                  </Link>
                </li>
                <li className="nav-item">
                  <Link to="/create" className="nav-link">
                    ADD CONTACT
                  </Link>
                </li>
                <li className="nav-item ms-lg-3 mt-2 mt-lg-0 d-flex align-items-center gap-2">
                  <span
                    className="badge"
                    style={{
                      backgroundColor: "var(--cms-btn-primary)",
                      color: "var(--cms-btn-text)",
                    }}
                  >
                    {user.name}
                  </span>
                  <button
                    className="btn btn-sm btn-danger py-1 px-3"
                    onClick={handleLogout}
                  >
                    LOGOUT
                  </button>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item">
                  <Link to="/login" className="nav-link">
                    LOGIN
                  </Link>
                </li>
                <li className="nav-item">
                  <Link to="/register" className="nav-link">
                    REGISTER
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
