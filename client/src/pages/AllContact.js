import React, { useContext, useEffect, useState } from "react";
import { Modal } from "react-bootstrap";
import { Link } from "react-router-dom";
import Spinner from "../components/Spinner";
import ToastContext from "../context/ToastContext";

const AllContact = () => {
  const { toast } = useContext(ToastContext);

  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [contactToDelete, setContactToDelete] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modalData, setModalData] = useState({});
  const [contacts, setContacts] = useState([]);
  const [searchInput, setSearchInput] = useState("");

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/api/mycontacts`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const result = await res.json();
      if (!result.error) {
        setContacts(result.contacts || []);
      } else {
        toast.error(result.error);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load contacts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const triggerDelete = (contact) => {
    setContactToDelete(contact);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!contactToDelete) return;

    try {
      const res = await fetch(
        `http://localhost:8000/api/delete/${contactToDelete._id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      const result = await res.json();
      if (!result.error) {
        setContacts(result.myContacts || []);
        toast.success(`Deleted contact [${contactToDelete.name}]`);
        setShowDeleteConfirm(false);
        setContactToDelete(null);
        setShowModal(false);
      } else {
        toast.error(result.error);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete contact.");
    }
  };

  // Filter contacts by name, phone, or email as you type
  const filteredContacts = contacts.filter((contact) => {
    const q = searchInput.toLowerCase().trim();
    if (!q) return true;

    const nameMatch = contact.name && contact.name.toLowerCase().includes(q);
    const phoneMatch = contact.phone && contact.phone.toLowerCase().includes(q);
    const emailMatch = contact.email && contact.email.toLowerCase().includes(q);
    const companyMatch =
      contact.company && contact.company.toLowerCase().includes(q);

    return nameMatch || phoneMatch || emailMatch || companyMatch;
  });

  return (
    <>
      <div>
        <div className="d-flex justify-content-between align-items-center my-3 flex-wrap gap-2">
          <div>
            <h1 className="mb-0">Your Contacts</h1>
            <p className="text-muted mb-0">
              Manage your personal and professional connections.
            </p>
          </div>
          <div className="d-flex gap-2">
            <button onClick={fetchContacts} className="btn btn-outline-secondary">
              Refresh
            </button>
            <Link to="/create" className="btn btn-primary">
              + Add Contact
            </Link>
          </div>
        </div>

        <hr className="my-3" />

        {loading ? (
          <Spinner splash="Loading Contacts..." />
        ) : (
          <>
            {contacts.length === 0 ? (
              <div className="text-center py-5">
                <h3>No contacts created yet</h3>
                <p className="text-muted">
                  Get started by adding your first contact.
                </p>
                <Link to="/create" className="btn btn-info mt-2">
                  Add Your First Contact
                </Link>
              </div>
            ) : (
              <>
                {/* Search Bar - Live filter as you type */}
                <div className="row my-3 align-items-center">
                  <div className="col-md-6">
                    <div className="input-group">
                      <input
                        type="text"
                        name="searchInput"
                        id="searchInput"
                        className="form-control"
                        placeholder="Search by name, phone, email, or company..."
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        autoComplete="off"
                      />
                      {searchInput && (
                        <button
                          className="btn btn-outline-secondary"
                          type="button"
                          onClick={() => setSearchInput("")}
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="col-md-6 text-md-end mt-2 mt-md-0">
                    <span className="text-muted">
                      Showing{" "}
                      <strong>{filteredContacts.length}</strong> of{" "}
                      <strong>{contacts.length}</strong> contacts
                    </span>
                  </div>
                </div>

                {filteredContacts.length === 0 ? (
                  <div className="alert alert-warning text-center mt-3">
                    No contacts found matching "<strong>{searchInput}</strong>".
                    <button
                      className="btn btn-link btn-sm ms-2"
                      onClick={() => setSearchInput("")}
                    >
                      Clear search
                    </button>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover align-middle">
                      <thead>
                        <tr className="table-dark">
                          <th scope="col">Name</th>
                          <th scope="col">Company</th>
                          <th scope="col">Email</th>
                          <th scope="col">Phone</th>
                          <th scope="col">Address</th>
                          <th scope="col" className="text-center">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredContacts.map((contact) => (
                          <tr
                            key={contact._id}
                            style={{ cursor: "pointer" }}
                            onClick={() => {
                              setModalData(contact);
                              setShowModal(true);
                            }}
                          >
                            <th scope="row" className="fw-semibold">
                              {contact.name}
                            </th>
                            <td>
                              {contact.company ? (
                                <span className="badge bg-secondary">
                                  {contact.company}
                                </span>
                              ) : (
                                <span className="text-muted">—</span>
                              )}
                            </td>
                            <td>{contact.email}</td>
                            <td>{contact.phone}</td>
                            <td
                              className="text-truncate"
                              style={{ maxWidth: "180px" }}
                            >
                              {contact.address}
                            </td>
                            <td
                              className="text-center"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Link
                                className="btn btn-sm btn-outline-info me-2"
                                to={`/edit/${contact._id}`}
                              >
                                Edit
                              </Link>
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => triggerDelete(contact)}
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Contact Details Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{modalData.name}</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <div className="mb-2">
            <strong>Company:</strong>{" "}
            {modalData.company || <span className="text-muted">—</span>}
          </div>
          <div className="mb-2">
            <strong>Email:</strong>{" "}
            <a href={`mailto:${modalData.email}`}>{modalData.email}</a>
          </div>
          <div className="mb-2">
            <strong>Phone Number:</strong>{" "}
            <a href={`tel:${modalData.phone}`}>{modalData.phone}</a>
          </div>
          <div className="mb-2">
            <strong>Address:</strong> {modalData.address}
          </div>
          {modalData.notes && (
            <div className="mt-3 p-2 bg-light rounded">
              <strong>Notes:</strong>
              <p className="mb-0 text-muted" style={{ whiteSpace: "pre-wrap" }}>
                {modalData.notes}
              </p>
            </div>
          )}
        </Modal.Body>

        <Modal.Footer>
          <Link className="btn btn-info" to={`/edit/${modalData._id}`}>
            Edit
          </Link>
          <button
            className="btn btn-danger"
            onClick={() => {
              setShowModal(false);
              triggerDelete(modalData);
            }}
          >
            Delete
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => setShowModal(false)}
          >
            Close
          </button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        show={showDeleteConfirm}
        onHide={() => setShowDeleteConfirm(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete contact{" "}
          <strong>{contactToDelete?.name}</strong>?
          <p className="text-danger mt-2 mb-0">
            <small>This action cannot be undone.</small>
          </p>
        </Modal.Body>
        <Modal.Footer>
          <button
            className="btn btn-secondary"
            onClick={() => setShowDeleteConfirm(false)}
          >
            Cancel
          </button>
          <button className="btn btn-danger" onClick={confirmDelete}>
            Yes, Delete
          </button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default AllContact;
