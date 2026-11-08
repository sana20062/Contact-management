import React, { useContext, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import { getInitials } from "../utils/imageHelper";

const getAvatarColor = (name = "") => {
  const colors = [
    "#3b82f6",
    "#10b981",
    "#8b5cf6",
    "#ec4899",
    "#f59e0b",
    "#06b6d4",
    "#6366f1",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

/**
 * Calculates days remaining until the next occurrence of a birthday.
 * Returns { daysLeft, turnsAge, formattedDate, isToday, isTomorrow }
 */
const getBirthdayStatus = (birthdayStr) => {
  if (!birthdayStr) return null;

  try {
    const parts = birthdayStr.split("-");
    if (parts.length < 2) return null;

    let birthYear = null;
    let month = null;
    let day = null;

    if (parts.length === 3) {
      birthYear = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10) - 1;
      day = parseInt(parts[2], 10);
    } else {
      month = parseInt(parts[0], 10) - 1;
      day = parseInt(parts[1], 10);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const currentYear = today.getFullYear();
    let nextBday = new Date(currentYear, month, day);
    nextBday.setHours(0, 0, 0, 0);

    if (nextBday < today) {
      nextBday.setFullYear(currentYear + 1);
    }

    const diffMs = nextBday.getTime() - today.getTime();
    const daysLeft = Math.round(diffMs / (1000 * 60 * 60 * 24));

    const turnsAge = birthYear ? nextBday.getFullYear() - birthYear : null;

    const formattedDate = nextBday.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });

    return {
      daysLeft,
      turnsAge,
      formattedDate,
      isToday: daysLeft === 0,
      isTomorrow: daysLeft === 1,
    };
  } catch {
    return null;
  }
};

const Home = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user && !localStorage.getItem("token")) {
      navigate("/login", { replace: true });
      return;
    }

    const fetchContacts = async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/mycontacts`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        const result = await res.json();
        if (!result.error) {
          setContacts(result.contacts || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchContacts();
  }, [user, navigate]);

  // Compute upcoming birthdays in the next 30 days
  const upcomingBirthdays = useMemo(() => {
    const list = [];
    contacts.forEach((contact) => {
      if (contact.birthday) {
        const status = getBirthdayStatus(contact.birthday);
        if (status && status.daysLeft <= 30) {
          list.push({
            contact,
            ...status,
          });
        }
      }
    });

    // Sort by soonest first
    list.sort((a, b) => a.daysLeft - b.daysLeft);
    return list;
  }, [contacts]);

  const favoritesCount = useMemo(
    () => contacts.filter((c) => c.isFavorite).length,
    [contacts]
  );

  return (
    <div className="container py-4">
      {/* Welcome Hero Banner */}
      <div className="p-5 mb-4 bg-light rounded-3 shadow-sm border">
        <h1 className="display-5 fw-bold">
          Welcome back, {user ? user.name : "User"}!
        </h1>
        <p className="col-md-9 fs-5 text-muted">
          Your personal and professional Contact Management System. Store,
          organize, edit, search, and manage your contacts securely in one place.
        </p>

        {/* Quick Stats */}
        <div className="d-flex gap-4 my-3 flex-wrap">
          <div className="bg-white p-3 rounded border shadow-sm text-center" style={{ minWidth: "140px" }}>
            <span className="text-muted small text-uppercase fw-bold">Total Contacts</span>
            <h3 className="mb-0 text-primary">{contacts.length}</h3>
          </div>
          <div className="bg-white p-3 rounded border shadow-sm text-center" style={{ minWidth: "140px" }}>
            <span className="text-muted small text-uppercase fw-bold">Favorites</span>
            <h3 className="mb-0 text-warning">⭐ {favoritesCount}</h3>
          </div>
          <div className="bg-white p-3 rounded border shadow-sm text-center" style={{ minWidth: "140px" }}>
            <span className="text-muted small text-uppercase fw-bold">Upcoming B'days</span>
            <h3 className="mb-0 text-success">🎂 {upcomingBirthdays.length}</h3>
          </div>
        </div>

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

      {/* Birthday Reminders Section */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center flex-wrap gap-2">
          <h4 className="mb-0 d-flex align-items-center gap-2">
            <span>🎂</span>
            <span>Upcoming Birthday Reminders</span>
          </h4>
          <span className="badge bg-secondary">Next 30 Days</span>
        </div>

        <div className="card-body p-4">
          {loading ? (
            <p className="text-muted mb-0">Checking upcoming birthdays...</p>
          ) : upcomingBirthdays.length === 0 ? (
            <div className="text-center py-4">
              <span style={{ fontSize: "2.5rem" }}>🎈</span>
              <h5 className="mt-2 text-secondary">No upcoming birthdays in the next 30 days</h5>
              <p className="text-muted small mb-0">
                Add birthdays to your contacts in the Edit or Create forms to see automatic reminders here!
              </p>
            </div>
          ) : (
            <div className="row g-3">
              {upcomingBirthdays.map((item) => (
                <div key={item.contact._id} className="col-md-6 col-lg-4">
                  <div
                    className={`card h-100 border p-3 shadow-sm ${
                      item.isToday
                        ? "border-danger bg-danger bg-opacity-10"
                        : item.isTomorrow
                        ? "border-warning bg-warning bg-opacity-10"
                        : "bg-white"
                    }`}
                  >
                    <div className="d-flex align-items-center gap-3">
                      {/* Avatar */}
                      {item.contact.photo ? (
                        <img
                          src={item.contact.photo}
                          alt={item.contact.name}
                          style={{
                            width: "50px",
                            height: "50px",
                            borderRadius: "50%",
                            objectFit: "cover",
                            border: "2px solid #cbd5e1",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "50px",
                            height: "50px",
                            borderRadius: "50%",
                            backgroundColor: getAvatarColor(item.contact.name),
                            color: "#fff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: "bold",
                            fontSize: "1.1rem",
                          }}
                        >
                          {getInitials(item.contact.name)}
                        </div>
                      )}

                      {/* Contact Info */}
                      <div className="flex-grow-1 min-w-0">
                        <h6 className="mb-0 text-truncate fw-bold">
                          {item.contact.name}
                        </h6>
                        <small className="text-muted d-block text-truncate">
                          {item.contact.company || item.contact.email}
                        </small>
                        <div className="mt-1 d-flex align-items-center gap-1 flex-wrap">
                          <span className="badge bg-light text-dark border">
                            📅 {item.formattedDate}
                          </span>
                          {item.turnsAge && (
                            <span className="badge bg-info text-dark">
                              Turns {item.turnsAge}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Countdown Badge & Actions */}
                    <div className="mt-3 pt-2 border-top d-flex justify-content-between align-items-center">
                      <div>
                        {item.isToday ? (
                          <span className="badge bg-danger fs-6">
                            🎉 Today!
                          </span>
                        ) : item.isTomorrow ? (
                          <span className="badge bg-warning text-dark fs-6">
                            Tomorrow!
                          </span>
                        ) : (
                          <span className="badge bg-secondary">
                            In {item.daysLeft} days
                          </span>
                        )}
                      </div>

                      <div className="d-flex gap-1">
                        {item.contact.email && (
                          <a
                            href={`mailto:${item.contact.email}?subject=Happy%20Birthday!`}
                            className="btn btn-sm btn-outline-primary"
                            title="Send Birthday Email"
                          >
                            ✉️ Wish
                          </a>
                        )}
                        <Link
                          to={`/edit/${item.contact._id}`}
                          className="btn btn-sm btn-outline-secondary"
                        >
                          View
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
