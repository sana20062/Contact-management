import { useContext, useState } from "react";
import { Link } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import ToastContext from "../context/ToastContext";

const Register = () => {
  const { toast } = useContext(ToastContext);
  const { registerUser } = useContext(AuthContext);

  const [credentials, setCredentials] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setCredentials({ ...credentials, [name]: value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (
      !credentials.name.trim() ||
      !credentials.email.trim() ||
      !credentials.password ||
      !credentials.confirmPassword
    ) {
      toast.error("Please fill in all required fields.");
      return;
    }

    if (credentials.name.trim().length > 25) {
      toast.error("Name must be 25 characters or fewer.");
      return;
    }

    const emailReg =
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (!emailReg.test(credentials.email.trim())) {
      toast.error("Please enter a valid email address.");
      return;
    }

    if (credentials.password.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }

    if (credentials.password !== credentials.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    const userData = {
      name: credentials.name.trim(),
      email: credentials.email.trim(),
      password: credentials.password,
    };
    await registerUser(userData);
    setIsSubmitting(false);
  };

  return (
    <div className="row justify-content-center align-items-center py-4" style={{ minHeight: "75vh" }}>
      <div className="col-11 col-sm-9 col-md-7 col-lg-5">
        <div className="card p-4 p-md-5">
          <h3 className="text-center mb-4">CREATE AN ACCOUNT</h3>

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group mb-3">
              <label htmlFor="nameInput" className="form-label mb-2">
                FULL NAME
              </label>
              <input
                type="text"
                className="form-control"
                id="nameInput"
                name="name"
                value={credentials.name}
                onChange={handleInputChange}
                placeholder="John Doe"
                required
              />
            </div>

            <div className="form-group mb-3">
              <label htmlFor="emailInput" className="form-label mb-2">
                EMAIL ADDRESS
              </label>
              <input
                type="email"
                className="form-control"
                id="emailInput"
                name="email"
                value={credentials.email}
                onChange={handleInputChange}
                placeholder="john@example.com"
                required
              />
            </div>

            <div className="form-group mb-3">
              <label htmlFor="passwordInput" className="form-label mb-2">
                PASSWORD (MIN 6 CHARACTERS)
              </label>
              <input
                type="password"
                className="form-control"
                id="passwordInput"
                name="password"
                value={credentials.password}
                onChange={handleInputChange}
                placeholder="••••••••"
                required
              />
            </div>

            <div className="form-group mb-4">
              <label htmlFor="confirmPassword" className="form-label mb-2">
                CONFIRM PASSWORD
              </label>
              <input
                type="password"
                className="form-control"
                id="confirmPassword"
                name="confirmPassword"
                value={credentials.confirmPassword}
                onChange={handleInputChange}
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary w-100 py-2 mb-3"
              disabled={isSubmitting}
            >
              {isSubmitting ? "REGISTERING..." : "REGISTER"}
            </button>

            <p className="text-center mt-3 mb-0 small" style={{ fontFamily: "var(--cms-font-serif)" }}>
              Already have an account? <Link to="/login">Login here</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
