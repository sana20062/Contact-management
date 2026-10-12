
import { useState, useContext } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/layout";
import AuthContext from "../context/AuthContext";
import ToastContext from "../context/ToastContext";

const Login = () => {
  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
  });

  const { loginUser } = useContext(AuthContext);
  const { toast } = useContext(ToastContext);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setCredentials((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle login form submission (only one declaration)
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!credentials.email.trim() || !credentials.password) {
      toast.error("Please enter all required fields");
      return;
    }

    loginUser(credentials);
  };

  return (
    <Layout>
      <h3>Login</h3>

      <form onSubmit={handleSubmit}>
        <div className="form-group my-2">
          <label className="form-label">Email address</label>
          <input
            type="email"
            className="form-control"
            name="email"
            value={credentials.email}
            onChange={handleInputChange}
            placeholder="johndoe@example.com"
            required
          />
        </div>

        <div className="form-group my-2">
          <label className="form-label">Password</label>
          <input
            type="password"
            className="form-control"
            name="password"
            value={credentials.password}
            onChange={handleInputChange}
            placeholder="Enter password"
            required
          />
        </div>

        <button type="submit" className="btn btn-primary my-2">
          Login
        </button>

        <p>
          Don't have an account? <Link to="/register">Register here</Link>
        </p>
      </form>
    </Layout>
  );
};

export default Login;
