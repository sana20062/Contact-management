import React, { useContext, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";

const Home = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  useEffect(() => {
    if (!user && !localStorage.getItem("token")) {
      navigate("/login", { replace: true });
    }
  }, [user, navigate]);

  return (
    <div className="container py-4">
      <div className="p-5 mb-4 bg-light rounded-3 shadow-sm border">
        <h1 className="display-5 fw-bold">
          Welcome back, {user ? user.name : "User"}!
        </h1>
        <p className="col-md-8 fs-5 text-muted">
          Your personal and professional Contact Management System. Store,
          organize, edit, search, and manage your contacts securely in one place.
        </p>
        <hr className="my-4" />
        <div className="d-flex gap-3 flex-wrap">
          <Link to="/mycontacts" className="btn btn-primary btn-lg">
            View All Contacts
          </Link>
          <Link to="/create" className="btn btn-outline-info btn-lg">
            + Add New Contact
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;
