
import { useState, useContext } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/layout";
import AuthContext from "../context/AuthContext";
import ToastContext from "../context/ToastContext";

const Register = () => {
  const [credentials, setCredentials] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const { registerUser } = useContext(AuthContext);
  const { toast } = useContext(ToastContext);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setCredentials((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle registration form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    // Check required fields
    if (
      !credentials.name.trim() ||
      !credentials.email.trim() ||
      !credentials.password ||
      !credentials.confirmPassword
    ) {
      toast.error("Please enter all required fields");
      return;
    }

    // Check whether passwords match
    if (credentials.password !== credentials.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    // Remove confirmPassword before sending data to backend
    const userData = {
      name: credentials.name.trim(),
      email: credentials.email.trim(),
      password: credentials.password,
    };

    // Register user through AuthContext
    registerUser(userData);
  };

  return (
    <Layout>
      <h3>Register</h3>

      <form onSubmit={handleSubmit}>
        <div className="form-group my-2">
          <label className="form-label">Name</label>
          <input
            type="text"
            className="form-control"
            name="name"
            value={credentials.name}
            onChange={handleInputChange}
            placeholder="John Doe"
            required
          />
        </div>

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

        <div className="form-group my-2">
          <label className="form-label">Confirm Password</label>
          <input
            type="password"
            className="form-control"
            name="confirmPassword"
            value={credentials.confirmPassword}
            onChange={handleInputChange}
            placeholder="Confirm password"
            required
          />
        </div>

        <button type="submit" className="btn btn-primary my-2">
          Register
        </button>

        <p>
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </form>
    </Layout>
  );
};

export default Register;
