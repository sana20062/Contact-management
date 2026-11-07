import React, { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Spinner from "../components/Spinner";
import ToastContext from "../context/ToastContext";

const EditContact = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { toast } = useContext(ToastContext);

  const [userDetails, setUserDetails] = useState({
    name: "",
    address: "",
    email: "",
    phone: "",
    company: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
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
        }),
      });
      const result = await res.json();
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
          setUserDetails({
            name: result.name || "",
            email: result.email || "",
            address: result.address || "",
            phone: result.phone || "",
            company: result.company || "",
            notes: result.notes || "",
          });
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
        </>
      )}
    </>
  );
};

export default EditContact;
