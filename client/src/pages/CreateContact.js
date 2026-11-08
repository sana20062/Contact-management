import React, { useContext, useRef, useState } from "react";
import { Modal } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import ToastContext from "../context/ToastContext";
import { resizeImage } from "../utils/imageHelper";

const PRESET_GROUPS = ["Work", "Family", "Friends", "Other"];

const CreateContact = () => {
  const { toast } = useContext(ToastContext);
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [userDetails, setUserDetails] = useState({
    name: "",
    address: "",
    email: "",
    phone: "",
    company: "",
    notes: "",
    group: "Work",
    birthday: "",
    isFavorite: false,
    photo: "",
  });
  const [customGroup, setCustomGroup] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Duplicate warning state
  const [duplicateWarning, setDuplicateWarning] = useState(null);

  const handleInputChange = (event) => {
    const { name, value, type, checked } = event.target;
    setUserDetails({
      ...userDetails,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const resized = await resizeImage(file);
      setUserDetails((prev) => ({ ...prev, photo: resized }));
      toast.success("Profile photo uploaded!");
    } catch (err) {
      toast.error(err.message || "Failed to process photo.");
    }
  };

  const removePhoto = () => {
    setUserDetails((prev) => ({ ...prev, photo: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const validateForm = () => {
    const { name, address, email, phone } = userDetails;

    if (!name.trim() || !address.trim() || !email.trim() || !phone.trim()) {
      toast.error(
        "Please fill in all required fields (Name, Phone, Email, Address)."
      );
      return false;
    }

    if (name.trim().length < 2) {
      toast.error("Name must be at least 2 characters long.");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      toast.error("Please enter a valid email address.");
      return false;
    }

    const phoneDigits = phone.replace(/[^0-9]/g, "");
    const phoneRegex = /^[0-9+()-\s]{7,20}$/;
    if (!phoneRegex.test(phone.trim()) || phoneDigits.length < 7) {
      toast.error("Please enter a valid phone number (at least 7 digits).");
      return false;
    }

    return true;
  };

  const submitContact = async (force = false) => {
    const finalGroup =
      userDetails.group === "Custom"
        ? customGroup.trim() || "Other"
        : userDetails.group;

    setIsSubmitting(true);
    try {
      const res = await fetch(`http://localhost:8000/api/contact`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          name: userDetails.name.trim(),
          address: userDetails.address.trim(),
          email: userDetails.email.trim(),
          phone: userDetails.phone.trim(),
          company: userDetails.company.trim(),
          notes: userDetails.notes.trim(),
          group: finalGroup,
          birthday: userDetails.birthday,
          isFavorite: userDetails.isFavorite,
          photo: userDetails.photo,
          force,
        }),
      });
      const result = await res.json();

      if (res.status === 409 && result.duplicate) {
        setDuplicateWarning(result);
        setIsSubmitting(false);
        return;
      }

      if (!result.error) {
        toast.success(`Contact [${userDetails.name}] created successfully!`);
        navigate("/mycontacts");
      } else {
        toast.error(result.error);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to create contact. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    submitContact(false);
  };

  return (
    <div className="row justify-content-center py-4">
      <div className="col-12 col-lg-9">
        <div className="card p-4 p-md-5">
          <h2 className="mb-2">CREATE NEW CONTACT</h2>
          <p
            className="text-muted mb-4 small"
            style={{ fontFamily: "var(--cms-font-serif)" }}
          >
            Fill out the details below to add a new connection.
          </p>

          <form onSubmit={handleSubmit} noValidate>
            {/* Profile Photo Section */}
            <div
              className="p-3 mb-4 rounded border"
              style={{
                backgroundColor: "var(--cms-card-inner)",
                borderColor: "var(--cms-border-subtle)",
              }}
            >
              <div className="d-flex align-items-center gap-3 flex-wrap">
                <div
                  style={{
                    width: "75px",
                    height: "75px",
                    borderRadius: "50%",
                    backgroundColor: "#FFFFFF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                    border: "2px solid var(--cms-input-border)",
                  }}
                >
                  {userDetails.photo ? (
                    <img
                      src={userDetails.photo}
                      alt="Avatar preview"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <span
                      style={{
                        fontFamily: "var(--cms-font-heading)",
                        fontWeight: 700,
                        color: "var(--cms-label-color)",
                      }}
                    >
                      PHOTO
                    </span>
                  )}
                </div>

                <div className="flex-grow-1">
                  <label htmlFor="photoInput" className="form-label mb-1">
                    PROFILE PHOTO (OPTIONAL)
                  </label>
                  <div className="d-flex gap-2 align-items-center flex-wrap">
                    <input
                      type="file"
                      id="photoInput"
                      ref={fileInputRef}
                      className="form-control form-control-sm w-auto"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                    />
                    {userDetails.photo && (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={removePhoto}
                      >
                        REMOVE PHOTO
                      </button>
                    )}
                  </div>
                  <small className="text-muted d-block mt-1">
                    JPG, PNG, GIF (optimized and compressed automatically).
                  </small>
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-6 form-group mb-3">
                <label htmlFor="nameInput" className="form-label mb-2">
                  FULL NAME *
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="nameInput"
                  name="name"
                  value={userDetails.name}
                  onChange={handleInputChange}
                  placeholder="John Doe"
                  required
                />
              </div>

              <div className="col-md-6 form-group mb-3">
                <label htmlFor="phoneInput" className="form-label mb-2">
                  PHONE NUMBER *
                </label>
                <input
                  type="tel"
                  className="form-control"
                  id="phoneInput"
                  name="phone"
                  value={userDetails.phone}
                  onChange={handleInputChange}
                  placeholder="+1 (555) 019-2834"
                  required
                />
              </div>
            </div>

            <div className="row">
              <div className="col-md-6 form-group mb-3">
                <label htmlFor="emailInput" className="form-label mb-2">
                  EMAIL ADDRESS *
                </label>
                <input
                  type="email"
                  className="form-control"
                  id="emailInput"
                  name="email"
                  value={userDetails.email}
                  onChange={handleInputChange}
                  placeholder="john@example.com"
                  required
                />
              </div>

              <div className="col-md-6 form-group mb-3">
                <label htmlFor="companyInput" className="form-label mb-2">
                  COMPANY (OPTIONAL)
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="companyInput"
                  name="company"
                  value={userDetails.company}
                  onChange={handleInputChange}
                  placeholder="Acme Corp"
                />
              </div>
            </div>

            <div className="row">
              <div className="col-md-4 form-group mb-3">
                <label htmlFor="groupInput" className="form-label mb-2">
                  TAG / GROUP
                </label>
                <select
                  className="form-select"
                  id="groupInput"
                  name="group"
                  value={userDetails.group}
                  onChange={handleInputChange}
                >
                  {PRESET_GROUPS.map((grp) => (
                    <option key={grp} value={grp}>
                      {grp}
                    </option>
                  ))}
                  <option value="Custom">+ Custom Tag...</option>
                </select>
                {userDetails.group === "Custom" && (
                  <input
                    type="text"
                    className="form-control mt-2"
                    placeholder="Enter tag (e.g. Clients, Club)"
                    value={customGroup}
                    onChange={(e) => setCustomGroup(e.target.value)}
                  />
                )}
              </div>

              <div className="col-md-4 form-group mb-3">
                <label htmlFor="birthdayInput" className="form-label mb-2">
                  BIRTHDAY (OPTIONAL)
                </label>
                <input
                  type="date"
                  className="form-control"
                  id="birthdayInput"
                  name="birthday"
                  value={userDetails.birthday}
                  onChange={handleInputChange}
                />
              </div>

              <div className="col-md-4 form-group mb-3 d-flex align-items-center pt-md-3">
                <div className="form-check mt-3">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="isFavoriteCheck"
                    name="isFavorite"
                    checked={userDetails.isFavorite}
                    onChange={handleInputChange}
                  />
                  <label
                    className="form-check-label fw-semibold"
                    htmlFor="isFavoriteCheck"
                    style={{ fontSize: "0.85rem" }}
                  >
                    MARK AS FAVORITE (PIN TO TOP)
                  </label>
                </div>
              </div>
            </div>

            <div className="form-group mb-3">
              <label htmlFor="addressInput" className="form-label mb-2">
                ADDRESS *
              </label>
              <input
                type="text"
                className="form-control"
                id="addressInput"
                name="address"
                value={userDetails.address}
                onChange={handleInputChange}
                placeholder="123 Main St, Suite 400, New York, NY"
                required
              />
            </div>

            <div className="form-group mb-4">
              <label htmlFor="notesInput" className="form-label mb-2">
                NOTES (OPTIONAL)
              </label>
              <textarea
                className="form-control"
                id="notesInput"
                name="notes"
                rows="3"
                value={userDetails.notes}
                onChange={handleInputChange}
                placeholder="Add notes or details about this contact..."
              ></textarea>
            </div>

            <div className="d-flex gap-2">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? "CREATING..." : "ADD CONTACT"}
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => navigate("/mycontacts")}
              >
                CANCEL
              </button>
            </div>
          </form>

          {/* Duplicate Warning Modal */}
          <Modal
            show={Boolean(duplicateWarning)}
            onHide={() => setDuplicateWarning(null)}
            centered
          >
            <Modal.Header closeButton>
              <Modal.Title>POTENTIAL DUPLICATE CONTACT</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <p className="mb-2">
                {duplicateWarning?.error ||
                  "A contact with matching email or phone number already exists."}
              </p>
              <div
                className="p-3 my-2 rounded border"
                style={{
                  backgroundColor: "var(--cms-card-inner)",
                  borderColor: "var(--cms-border-subtle)",
                }}
              >
                <strong>Existing Contact:</strong>{" "}
                {duplicateWarning?.existingName}
              </div>
              <p
                className="mt-3 mb-0 text-muted small"
                style={{ fontFamily: "var(--cms-font-serif)" }}
              >
                Would you like to save this contact anyway, or go back to edit the details?
              </p>
            </Modal.Body>
            <Modal.Footer>
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setDuplicateWarning(null)}
              >
                REVIEW & EDIT
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setDuplicateWarning(null);
                  submitContact(true);
                }}
              >
                SAVE ANYWAY
              </button>
            </Modal.Footer>
          </Modal>
        </div>
      </div>
    </div>
  );
};

export default CreateContact;
