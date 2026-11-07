import { createContext, useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ToastContext from "./ToastContext";

const AuthContext = createContext();

export const AuthContextProvider = ({ children }) => {
  const { toast } = useContext(ToastContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(null);

  useEffect(() => {
    checkUserLoggedIn();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // check if the user is logged in
  const checkUserLoggedIn = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      if (
        location.pathname !== "/login" &&
        location.pathname !== "/register"
      ) {
        navigate("/login", { replace: true });
      }
      return;
    }

    try {
      const res = await fetch(`http://localhost:8000/api/me`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const result = await res.json();
      if (!result.error) {
        setUser(result);
        if (
          location.pathname === "/login" ||
          location.pathname === "/register"
        ) {
          navigate("/", { replace: true });
        }
      } else {
        localStorage.removeItem("token");
        setUser(null);
        if (
          location.pathname !== "/login" &&
          location.pathname !== "/register"
        ) {
          navigate("/login", { replace: true });
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // login request
  const loginUser = async (userData) => {
    try {
      const res = await fetch(`http://localhost:8000/api/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });
      const result = await res.json();
      if (!result.error) {
        localStorage.setItem("token", result.token);
        setUser(result.user);
        toast.success(`Welcome back, ${result.user.name}!`);
        navigate("/", { replace: true });
      } else {
        toast.error(result.error);
      }
    } catch (err) {
      console.error(err);
      toast.error("Login failed. Please check your network connection.");
    }
  };

  // register request
  const registerUser = async (userData) => {
    try {
      const res = await fetch(`http://localhost:8000/api/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });
      const result = await res.json();

      if (!result.error) {
        toast.success("Account created successfully! Please log in.");
        navigate("/login", { replace: true });
      } else {
        toast.error(result.error);
      }
    } catch (err) {
      console.error(err);
      toast.error("Registration failed. Please check your network connection.");
    }
  };

  return (
    <AuthContext.Provider value={{ loginUser, registerUser, user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
