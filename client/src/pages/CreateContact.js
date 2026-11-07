import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import ToastContext from "../context/ToastContext";

const CreateContact = () => {
  const { toast } = useContext(ToastContext);
  const navigate = useNavigate();

  const [userDetails, setUserDetails] = useState({
    name: "",
    address: "",
    email: "",
    phone: "",
    company: "",
    notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setUserDetails({ ...userDetails, [name]: value });
  };

  const validateForm = () => {
    const { name, address, email, phone } = userDetails;

    if (!name.trim() || !address.trim() || !email.trim() || !phone.trim()) {
      toast.error("Please fill in all required fields (Name, Phone, Email, Address).");
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

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) return;

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
        }),
      });
      const result = await res.json();
      if (!result.error) {
        toast.success(`Contact [${userDetails.name}] created successfully!`);
        setUserDetails({
          name: "",
          address: "",
          email: "",
          phone: "",
          company: "",
          notes: "",
        });
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

  return (
    <>
      <h2>Create New Contact</h2>
      <p className="text-muted">Fill out the details below to add a new contact.</p>

      <form onSubmit={handleSubmit} noValidate>
        <div className="row">
          <div className="col-md-6 form-group">
            <label htmlFor="nameInput" className="form-label mt-3">
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
            <label htmlFor="phoneInput" className="form-label mt-3">
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
            {isSubmitting ? "Creating..." : "Add Contact"}
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
    </>
  );
};

export default CreateContact;
