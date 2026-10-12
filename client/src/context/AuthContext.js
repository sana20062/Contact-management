import { createContext, useState, useEffect, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import ToastContext from "./ToastContext";

const AuthContext = createContext();

export const AuthContextProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const { toast } = useContext(ToastContext);
  const navigate = useNavigate();
  const location = useLocation();

  // Check whether the user is already logged in
  const checkUserLoggedIn = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setUser(null);
      return;
    }

    try {
      const res = await fetch("http://localhost:8000/api/me", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await res.json();

      if (res.ok && !result.error) {
        setUser(result.user || result);

        if (
          location.pathname === "/login" ||
          location.pathname === "/register"
        ) {
          navigate("/", { replace: true });
        }
      } else {
        localStorage.removeItem("token");
        setUser(null);
      }
    } catch (error) {
      console.error("Check login error:", error);
    }
  };

  useEffect(() => {
    checkUserLoggedIn();
  }, []);

  // Login
  const loginUser = async (userData) => {
    try {
      const res = await fetch("http://localhost:8000/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      const result = await res.json();

      if (res.ok && !result.error) {
        if (!result.token || !result.user) {
          toast.error("Login response is missing user or token");
          return;
        }

        localStorage.setItem("token", result.token);
        setUser(result.user);

        toast.success(
          `Logged in as ${
            result.user.name || result.user.email || "User"
          }`
        );

        navigate("/", { replace: true });
      } else {
        toast.error(result.error || "Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Unable to connect to the server");
    }
  };

  // Register
  const registerUser = async (userData) => {
    try {
      const res = await fetch("http://localhost:8000/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      const result = await res.json();

      if (res.ok && !result.error) {
        toast.success(
          "Registration successful! Please log in."
        );

        navigate("/login", { replace: true });
      } else {
        toast.error(result.error || "Registration failed");
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("Unable to connect to the server");
    }
  };

  // Logout
  const logoutUser = () => {
    localStorage.removeItem("token");
    setUser(null);
    toast.success("Logged out successfully");
    navigate("/login", { replace: true });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loginUser,
        registerUser,
        logoutUser,
        checkUserLoggedIn,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;