import { useContext, useState } from "react";
import { Link } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import ToastContext from "../context/ToastContext";

const Login = () => {
  const { toast } = useContext(ToastContext);
  const { loginUser } = useContext(AuthContext);

  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setCredentials({ ...credentials, [name]: value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!credentials.email.trim() || !credentials.password) {
      toast.error("Please enter both email and password.");
      return;
    }

    const emailReg =
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (!emailReg.test(credentials.email.trim())) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);
    await loginUser({
      email: credentials.email.trim(),
      password: credentials.password,
    });
    setIsSubmitting(false);
  };

  return (
    <div className="row justify-content-center align-items-center" style={{ minHeight: "75vh" }}>
      <div className="col-11 col-sm-9 col-md-7 col-lg-5">
        <div className="card p-4 p-md-5">
          <h3 className="text-center mb-4">SIGN IN</h3>

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group mb-3">
              <label htmlFor="emailInput" className="form-label mb-2">
                EMAIL ADDRESS:
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

            <div className="form-group mb-4">
              <label htmlFor="passwordInput" className="form-label mb-2">
                PASSWORD:
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

            <button
              type="submit"
              className="btn btn-primary w-100 py-2 mb-3"
              disabled={isSubmitting}
            >
              {isSubmitting ? "LOGGING IN..." : "LOGIN"}
            </button>

            <p className="text-center mt-3 mb-0 small" style={{ fontFamily: "var(--cms-font-serif)" }}>
              Don't have an account? <Link to="/register">Create One</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
