import React, { useContext, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import { getInitials } from "../utils/imageHelper";

const getAvatarColor = (name = "") => {
  const colors = [
    "#8C434F",
    "#BF788C",
    "#675C5C",
    "#4A3E40",
    "#9E5D6A",
    "#5A4A4D",
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
      <div className="hero-box p-4 p-md-5 mb-4">
        <h1 className="display-6 fw-bold mb-3">
          WELCOME BACK, {user ? user.name : "USER"}!
        </h1>
        <p className="fs-6 text-muted mb-4" style={{ fontFamily: "var(--cms-font-serif)", maxWidth: "750px" }}>
          Your personal and professional Contact Management System. Store,
          organize, edit, search, and manage your connections securely in one place.
        </p>

        {/* Quick Stats */}
        <div className="d-flex gap-3 mb-4 flex-wrap">
          <div
            className="p-3 rounded border text-center"
            style={{
              backgroundColor: "var(--cms-card-inner)",
              minWidth: "150px",
              borderColor: "var(--cms-border-subtle)",
            }}
          >
            <span className="small text-uppercase fw-bold" style={{ fontFamily: "var(--cms-font-serif)" }}>
              Total Contacts
            </span>
            <h3 className="mb-0 mt-1">{contacts.length}</h3>
          </div>

          <div
            className="p-3 rounded border text-center"
            style={{
              backgroundColor: "var(--cms-card-inner)",
              minWidth: "150px",
              borderColor: "var(--cms-border-subtle)",
            }}
          >
            <span className="small text-uppercase fw-bold" style={{ fontFamily: "var(--cms-font-serif)" }}>
              Favorites
            </span>
            <h3 className="mb-0 mt-1">{favoritesCount}</h3>
          </div>

          <div
            className="p-3 rounded border text-center"
            style={{
              backgroundColor: "var(--cms-card-inner)",
              minWidth: "150px",
              borderColor: "var(--cms-border-subtle)",
            }}
          >
            <span className="small text-uppercase fw-bold" style={{ fontFamily: "var(--cms-font-serif)" }}>
              Upcoming Birthdays
            </span>
            <h3 className="mb-0 mt-1">{upcomingBirthdays.length}</h3>
          </div>
        </div>

        <div className="d-flex gap-3 flex-wrap">
          <Link to="/mycontacts" className="btn btn-primary">
            VIEW ALL CONTACTS
          </Link>
          <Link to="/create" className="btn btn-outline-secondary">
            ADD NEW CONTACT
          </Link>
        </div>
      </div>

      {/* Birthday Reminders Section */}
      <div className="card shadow-sm border-0 mb-4">
        <div
          className="card-header py-3 d-flex justify-content-between align-items-center flex-wrap gap-2"
          style={{
            backgroundColor: "var(--cms-card-inner)",
            borderBottom: "1px solid var(--cms-border-subtle)",
          }}
        >
          <h4 className="mb-0">
            UPCOMING BIRTHDAYS (NEXT 30 DAYS)
          </h4>
          <span
            className="badge"
            style={{ backgroundColor: "var(--cms-input-border)", color: "#FFFFFF" }}
          >
            30 Days
          </span>
        </div>

        <div className="card-body p-4">
          {loading ? (
            <p className="text-muted mb-0" style={{ fontFamily: "var(--cms-font-serif)" }}>
              Checking upcoming birthdays...
            </p>
          ) : upcomingBirthdays.length === 0 ? (
            <div className="text-center py-4">
              <h5 className="mt-2 text-secondary">
                NO UPCOMING BIRTHDAYS IN THE NEXT 30 DAYS
              </h5>
              <p className="text-muted small mb-0" style={{ fontFamily: "var(--cms-font-serif)" }}>
                Add birthdays to your contacts in the Edit or Create forms to see automatic reminders here.
              </p>
            </div>
          ) : (
            <div className="row g-3">
              {upcomingBirthdays.map((item) => (
                <div key={item.contact._id} className="col-md-6 col-lg-4">
                  <div
                    className="card h-100 p-3"
                    style={{
                      backgroundColor: "var(--cms-card-inner)",
                      borderColor: "var(--cms-border-subtle)",
                    }}
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
                            border: "2px solid var(--cms-input-border)",
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
                            fontFamily: "var(--cms-font-heading)",
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
                          <span
                            className="badge border"
                            style={{
                              backgroundColor: "var(--cms-card-bg)",
                              color: "var(--cms-heading-color)",
                            }}
                          >
                            {item.formattedDate}
                          </span>
                          {item.turnsAge && (
                            <span
                              className="badge"
                              style={{
                                backgroundColor: "var(--cms-btn-primary)",
                                color: "var(--cms-btn-text)",
                              }}
                            >
                              Turns {item.turnsAge}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Countdown Badge & Actions */}
                    <div
                      className="mt-3 pt-2 d-flex justify-content-between align-items-center"
                      style={{ borderTop: "1px solid var(--cms-border-subtle)" }}
                    >
                      <div>
                        {item.isToday ? (
                          <span className="badge bg-danger">
                            TODAY
                          </span>
                        ) : item.isTomorrow ? (
                          <span
                            className="badge"
                            style={{
                              backgroundColor: "var(--cms-btn-primary)",
                              color: "var(--cms-btn-text)",
                            }}
                          >
                            TOMORROW
                          </span>
                        ) : (
                          <span className="badge bg-secondary">
                            IN {item.daysLeft} DAYS
                          </span>
                        )}
                      </div>

                      <div className="d-flex gap-1">
                        {item.contact.email && (
                          <a
                            href={`mailto:${item.contact.email}?subject=Happy%20Birthday!`}
                            className="btn btn-sm btn-primary"
                            style={{ padding: "4px 12px", fontSize: "0.75rem" }}
                            title="Send Birthday Email"
                          >
                            WISH
                          </a>
                        )}
                        <Link
                          to={`/edit/${item.contact._id}`}
                          className="btn btn-sm btn-outline-secondary"
                          style={{ padding: "4px 12px", fontSize: "0.75rem" }}
                        >
                          VIEW
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
