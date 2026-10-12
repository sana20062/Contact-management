import { useContext } from "react";
import { Link } from "react-router-dom";
import AuthContext from "../context/AuthContext";

const Navbar = () => {
  const authContext = useContext(AuthContext);

  // Prevent a crash if the provider is missing
  if (!authContext) {
    return (
      <div className="alert alert-danger">
        AuthContextProvider is missing. Please check App setup.
      </div>
    );
  }

  const { user, logoutUser } = authContext;

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark px-3">
      <Link className="navbar-brand" to="/">
        Contact Manager
      </Link>

      <div className="ms-auto d-flex align-items-center gap-3">
        {user ? (
          <>
            <span className="text-white">
              Welcome, {user.name || user.email || "User"}
            </span>

            <button
              type="button"
              className="btn btn-outline-light"
              onClick={logoutUser}
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link className="btn btn-outline-light" to="/login">
              Login
            </Link>

            <Link className="btn btn-primary" to="/register">
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;