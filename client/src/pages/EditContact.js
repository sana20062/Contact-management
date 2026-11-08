import React, { useContext, useEffect, useRef, useState } from "react";
import { Modal } from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
import Spinner from "../components/Spinner";
import ToastContext from "../context/ToastContext";
import { resizeImage } from "../utils/imageHelper";

const PRESET_GROUPS = ["Work", "Family", "Friends", "Other"];

const EditContact = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const { toast } = useContext(ToastContext);

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
  const [isCustom, setIsCustom] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Duplicate warning state
  const [duplicateWarning, setDuplicateWarning] = useState(null);

  const handleInputChange = (event) => {
    const { name, value, type, checked } = event.target;
    if (name === "group") {
      if (value === "Custom") {
        setIsCustom(true);
      } else {
        setIsCustom(false);
        setUserDetails({ ...userDetails, group: value });
      }
    } else {
      setUserDetails({
        ...userDetails,
        [name]: type === "checkbox" ? checked : value,
      });
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const resized = await resizeImage(file);
      setUserDetails((prev) => ({ ...prev, photo: resized }));
      toast.success("Profile photo updated!");
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

  const submitUpdate = async (force = false) => {
    const finalGroup = isCustom
      ? customGroup.trim() || "Other"
      : userDetails.group;

    setIsSubmitting(true);
    try {
      const res = await fetch(`http://localhost:8000/api/contact`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          id,
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
        toast.success(`Updated [${userDetails.name}] successfully!`);
        navigate("/mycontacts");
      } else {
        toast.error(result.error);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update contact.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    submitUpdate(false);
  };

  useEffect(() => {
    const fetchContact = async () => {
      setLoading(true);
      try {
        const res = await fetch(`http://localhost:8000/api/contact/${id}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        const result = await res.json();
        if (!result.error) {
          const loadedGroup = result.group || "Other";
          const isPreset = PRESET_GROUPS.includes(loadedGroup);

          setUserDetails({
            name: result.name || "",
            email: result.email || "",
            address: result.address || "",
            phone: result.phone || "",
            company: result.company || "",
            notes: result.notes || "",
            group: isPreset ? loadedGroup : "Custom",
            birthday: result.birthday || "",
            isFavorite: Boolean(result.isFavorite),
            photo: result.photo || "",
          });

          if (!isPreset) {
            setIsCustom(true);
            setCustomGroup(loadedGroup);
          }
        } else {
          toast.error(result.error);
          navigate("/mycontacts");
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to fetch contact details.");
      } finally {
        setLoading(false);
      }
    };

    fetchContact();
  }, [id, navigate, toast]);

  return (
    <>
      {loading ? (
        <Spinner splash="Loading Contact..." />
      ) : (
        <>
          <h2>Edit Contact</h2>
          <p className="text-muted">Modify the details for this contact.</p>

          <form onSubmit={handleSubmit} noValidate>
            {/* Profile Photo Section */}
            <div className="card p-3 my-3 bg-light border-0 shadow-sm">
              <div className="d-flex align-items-center gap-3 flex-wrap">
                <div
                  style={{
                    width: "80px",
                    height: "80px",
                    borderRadius: "50%",
                    backgroundColor: "#e2e8f0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                    border: "2px solid #cbd5e1",
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
                    <span className="text-muted" style={{ fontSize: "2rem" }}>
                      👤
                    </span>
                  )}
                </div>

                <div className="flex-grow-1">
                  <label htmlFor="photoInput" className="form-label fw-semibold mb-1">
                    Profile Photo
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
                        Remove Photo
                      </button>
                    )}
                  </div>
                  <small className="text-muted">
                    Accepts JPG, PNG, GIF (automatically resized and optimized).
                  </small>
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-6 form-group">
                <label htmlFor="nameInput" className="form-label mt-2">
                  Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="nameInput"
                  name="name"
                  value={userDetails.name}
                  onChange={handleInputChange}
                  placeholder="e.g. John Doe"
                  required
                />
              </div>

              <div className="col-md-6 form-group">
                <label htmlFor="phoneInput" className="form-label mt-2">
                  Phone Number <span className="text-danger">*</span>
                </label>
                <input
                  type="tel"
                  className="form-control"
                  id="phoneInput"
                  name="phone"
                  value={userDetails.phone}
                  onChange={handleInputChange}
                  placeholder="e.g. +1 (555) 019-2834"
                  required
                />
              </div>
            </div>

            <div className="row">
              <div className="col-md-6 form-group">
                <label htmlFor="emailInput" className="form-label mt-3">
                  Email Address <span className="text-danger">*</span>
                </label>
                <input
                  type="email"
                  className="form-control"
                  id="emailInput"
                  name="email"
                  value={userDetails.email}
                  onChange={handleInputChange}
                  placeholder="e.g. john@example.com"
                  required
                />
              </div>

              <div className="col-md-6 form-group">
                <label htmlFor="companyInput" className="form-label mt-3">
                  Company (Optional)
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="companyInput"
                  name="company"
                  value={userDetails.company}
                  onChange={handleInputChange}
                  placeholder="e.g. Acme Corp"
                />
              </div>
            </div>

            <div className="row">
              <div className="col-md-4 form-group">
                <label htmlFor="groupInput" className="form-label mt-3">
                  Tag / Group
                </label>
                <select
                  className="form-select"
                  id="groupInput"
                  name="group"
                  value={isCustom ? "Custom" : userDetails.group}
                  onChange={handleInputChange}
                >
                  {PRESET_GROUPS.map((grp) => (
                    <option key={grp} value={grp}>
                      {grp}
                    </option>
                  ))}
                  <option value="Custom">+ Custom Tag...</option>
                </select>
                {isCustom && (
                  <input
                    type="text"
                    className="form-control mt-2"
                    placeholder="Enter custom tag (e.g. Clients, Gym, Club)"
                    value={customGroup}
                    onChange={(e) => setCustomGroup(e.target.value)}
                  />
                )}
              </div>

              <div className="col-md-4 form-group">
                <label htmlFor="birthdayInput" className="form-label mt-3">
                  🎂 Birthday (Optional)
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

              <div className="col-md-4 form-group d-flex align-items-center mt-3 pt-md-4">
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
                  >
                    ⭐ Mark as Favorite (Pin to top)
                  </label>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="addressInput" className="form-label mt-3">
                Address <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                className="form-control"
                id="addressInput"
                name="address"
                value={userDetails.address}
                onChange={handleInputChange}
                placeholder="e.g. 123 Main St, Suite 400, New York, NY"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="notesInput" className="form-label mt-3">
                Notes (Optional)
              </label>
              <textarea
                className="form-control"
                id="notesInput"
                name="notes"
                rows="3"
                value={userDetails.notes}
                onChange={handleInputChange}
                placeholder="Add any extra notes or details about this contact..."
              ></textarea>
            </div>

            <div className="mt-4">
              <button
                type="submit"
                className="btn btn-info me-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Save Changes"}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate("/mycontacts")}
              >
                Cancel
              </button>
            </div>
          </form>

          {/* Duplicate Warning Modal */}
          <Modal
            show={Boolean(duplicateWarning)}
            onHide={() => setDuplicateWarning(null)}
            centered
          >
            <Modal.Header closeButton className="bg-warning text-dark">
              <Modal.Title>⚠️ Potential Duplicate Contact</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <p className="mb-2">
                {duplicateWarning?.error ||
                  "Another contact with matching email or phone number already exists."}
              </p>
              <div className="alert alert-secondary py-2 mb-0">
                <strong>Existing Contact:</strong>{" "}
                {duplicateWarning?.existingName}
              </div>
              <p className="mt-3 mb-0 text-muted small">
                Would you like to save these changes anyway, or review the email/phone?
              </p>
            </Modal.Body>
            <Modal.Footer>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setDuplicateWarning(null)}
              >
                Review & Edit
              </button>
              <button
                type="button"
                className="btn btn-warning"
                onClick={() => {
                  setDuplicateWarning(null);
                  submitUpdate(true); // force update
                }}
              >
                Save Anyway
              </button>
            </Modal.Footer>
          </Modal>
        </>
      )}
    </>
  );
};

export default EditContact;
