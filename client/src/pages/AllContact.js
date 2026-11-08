import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { Modal } from "react-bootstrap";
import { Link } from "react-router-dom";
import Spinner from "../components/Spinner";
import ToastContext from "../context/ToastContext";
import { exportContactsToCSV, downloadCSVTemplate, parseCSVText } from "../utils/csvHelper";
import { getInitials } from "../utils/imageHelper";

const PRESET_GROUPS = ["All", "Work", "Family", "Friends", "Other"];

const getGroupBadgeClass = (group) => {
  switch (group) {
    case "Work":
      return "bg-primary";
    case "Family":
      return "bg-success";
    case "Friends":
      return "bg-info text-dark";
    case "Other":
      return "bg-secondary";
    default:
      return "bg-dark";
  }
};

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

const formatBirthdayDisplay = (dateStr) => {
  if (!dateStr) return null;
  try {
    const [year, month, day] = dateStr.split("-");
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: year && year.length === 4 ? "numeric" : undefined,
    });
  } catch {
    return dateStr;
  }
};

const AllContact = () => {
  const { toast } = useContext(ToastContext);

  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [contactToDelete, setContactToDelete] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modalData, setModalData] = useState({});
  const [contacts, setContacts] = useState([]);

  // Search & Filter state
  const [searchInput, setSearchInput] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("All");
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  // Sorting state: 'name-asc' | 'name-desc' | 'date-desc' | 'date-asc'
  const [sortBy, setSortBy] = useState("name-asc");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10); // 10 or 20 per page

  // CSV Import state
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const importFileInputRef = useRef(null);

  // Bulk Actions state
  const [selectedIds, setSelectedIds] = useState([]);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [showBulkTagModal, setShowBulkTagModal] = useState(false);
  const [bulkTagGroup, setBulkTagGroup] = useState("Work");
  const [bulkCustomTag, setBulkCustomTag] = useState("");
  const [isBulkActionBusy, setIsBulkActionBusy] = useState(false);

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

  // Quick toggle favorite directly from table or modal
  const toggleFavorite = async (contact, e) => {
    if (e) e.stopPropagation();

    const updated = contacts.map((c) =>
      c._id === contact._id ? { ...c, isFavorite: !c.isFavorite } : c
    );
    setContacts(updated);

    if (modalData && modalData._id === contact._id) {
      setModalData({ ...modalData, isFavorite: !modalData.isFavorite });
    }

    try {
      const res = await fetch(
        `http://localhost:8000/api/contact/favorite/${contact._id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      const result = await res.json();
      if (!result.error) {
        toast.info(
          result.isFavorite
            ? `Marked [${result.name}] as Favorite ⭐`
            : `Removed [${result.name}] from Favorites`
        );
      } else {
        toast.error(result.error);
        fetchContacts();
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update favorite status.");
      fetchContacts();
    }
  };

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
        setSelectedIds((prev) => prev.filter((id) => id !== contactToDelete._id));
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

  // CSV Export Handler
  const handleExportCSV = () => {
    try {
      if (contacts.length === 0) {
        toast.warn("No contacts to export.");
        return;
      }
      const dateStr = new Date().toISOString().slice(0, 10);
      exportContactsToCSV(contacts, `contacts_export_${dateStr}.csv`);
      toast.success(`Exported ${contacts.length} contacts to CSV!`);
    } catch (err) {
      toast.error(err.message || "Failed to export CSV.");
    }
  };

  // CSV Import Handler
  const handleImportSubmit = async (e) => {
    e.preventDefault();
    if (!importFile) {
      toast.error("Please select a CSV file to upload.");
      return;
    }

    setIsImporting(true);
    try {
      const text = await importFile.text();
      const parsedContacts = parseCSVText(text);

      if (parsedContacts.length === 0) {
        toast.warn("No valid contacts found in CSV file.");
        setIsImporting(false);
        return;
      }

      const res = await fetch(`http://localhost:8000/api/contact/import`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          contacts: parsedContacts,
          skipDuplicates,
        }),
      });

      const result = await res.json();
      if (!result.error) {
        toast.success(result.message);
        setContacts(result.myContacts || []);
        setShowImportModal(false);
        setImportFile(null);
        if (importFileInputRef.current) importFileInputRef.current.value = "";
      } else {
        toast.error(result.error);
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to import CSV file.");
    } finally {
      setIsImporting(false);
    }
  };

  // Extract all existing groups for filter pills/dropdown
  const allGroups = useMemo(() => {
    const custom = new Set();
    contacts.forEach((c) => {
      if (c.group && !PRESET_GROUPS.includes(c.group)) {
        custom.add(c.group);
      }
    });
    return [...PRESET_GROUPS, ...Array.from(custom)];
  }, [contacts]);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchInput, selectedGroup, onlyFavorites, sortBy, pageSize]);

  // Filter & Sort Pipeline
  const filteredAndSortedContacts = useMemo(() => {
    const q = searchInput.toLowerCase().trim();

    const filtered = contacts.filter((c) => {
      if (selectedGroup !== "All" && c.group !== selectedGroup) return false;
      if (onlyFavorites && !c.isFavorite) return false;

      if (q) {
        const nameMatch = c.name && c.name.toLowerCase().includes(q);
        const phoneMatch = c.phone && c.phone.toLowerCase().includes(q);
        const emailMatch = c.email && c.email.toLowerCase().includes(q);
        const companyMatch = c.company && c.company.toLowerCase().includes(q);
        const groupMatch = c.group && c.group.toLowerCase().includes(q);
        return nameMatch || phoneMatch || emailMatch || companyMatch || groupMatch;
      }
      return true;
    });

    filtered.sort((a, b) => {
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;

      if (sortBy === "name-asc") {
        return (a.name || "").localeCompare(b.name || "");
      }
      if (sortBy === "name-desc") {
        return (b.name || "").localeCompare(a.name || "");
      }
      if (sortBy === "date-desc") {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
      if (sortBy === "date-asc") {
        return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      }
      return 0;
    });

    return filtered;
  }, [contacts, searchInput, selectedGroup, onlyFavorites, sortBy]);

  // Pagination calculation
  const totalItems = filteredAndSortedContacts.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (validCurrentPage - 1) * pageSize;
  const paginatedContacts = filteredAndSortedContacts.slice(
    startIndex,
    startIndex + pageSize
  );

  // Bulk Selection Handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allVisibleIds = paginatedContacts.map((c) => c._id);
      setSelectedIds(Array.from(new Set([...selectedIds, ...allVisibleIds])));
    } else {
      const visibleIdsSet = new Set(paginatedContacts.map((c) => c._id));
      setSelectedIds(selectedIds.filter((id) => !visibleIdsSet.has(id)));
    }
  };

  const handleRowSelect = (id, e) => {
    e.stopPropagation();
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((i) => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const isAllCurrentPageSelected =
    paginatedContacts.length > 0 &&
    paginatedContacts.every((c) => selectedIds.includes(c._id));

  // Bulk Delete Execution
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setIsBulkActionBusy(true);

    try {
      const res = await fetch(`http://localhost:8000/api/contact/bulk-delete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ ids: selectedIds }),
      });
      const result = await res.json();
      if (!result.error) {
        toast.success(result.message || `Deleted ${selectedIds.length} contacts.`);
        setContacts(result.myContacts || []);
        setSelectedIds([]);
        setShowBulkDeleteModal(false);
      } else {
        toast.error(result.error);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete selected contacts.");
    } finally {
      setIsBulkActionBusy(false);
    }
  };

  // Bulk Tag Execution
  const handleBulkTag = async (e) => {
    e.preventDefault();
    if (selectedIds.length === 0) return;

    const targetGroup =
      bulkTagGroup === "Custom"
        ? bulkCustomTag.trim() || "Other"
        : bulkTagGroup;

    setIsBulkActionBusy(true);
    try {
      const res = await fetch(`http://localhost:8000/api/contact/bulk-tag`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ ids: selectedIds, group: targetGroup }),
      });
      const result = await res.json();
      if (!result.error) {
        toast.success(result.message || `Tagged contacts as ${targetGroup}.`);
        setContacts(result.myContacts || []);
        setSelectedIds([]);
        setShowBulkTagModal(false);
        setBulkCustomTag("");
      } else {
        toast.error(result.error);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update tags for selected contacts.");
    } finally {
      setIsBulkActionBusy(false);
    }
  };

  return (
    <>
      <div>
        {/* Header Section */}
        <div className="d-flex justify-content-between align-items-center my-3 flex-wrap gap-2">
          <div>
            <h1 className="mb-0">Your Contacts</h1>
            <p className="text-muted mb-0">
              Manage your personal and professional connections.
            </p>
          </div>
          <div className="d-flex gap-2 flex-wrap">
            <button
              onClick={() => setShowImportModal(true)}
              className="btn btn-outline-info"
              title="Import contacts from CSV"
            >
              📥 Import CSV
            </button>
            <button
              onClick={handleExportCSV}
              className="btn btn-outline-success"
              title="Export contacts to CSV"
            >
              📤 Export CSV
            </button>
            <button
              onClick={fetchContacts}
              className="btn btn-outline-secondary"
            >
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
                  Get started by adding your first contact or importing a CSV file.
                </p>
                <div className="d-flex justify-content-center gap-2 mt-3">
                  <Link to="/create" className="btn btn-info">
                    Add Your First Contact
                  </Link>
                  <button
                    onClick={() => setShowImportModal(true)}
                    className="btn btn-outline-secondary"
                  >
                    Import CSV
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Search Bar + Controls */}
                <div className="row g-2 my-2 align-items-center">
                  <div className="col-lg-5 col-md-6">
                    <div className="input-group">
                      <input
                        type="text"
                        name="searchInput"
                        id="searchInput"
                        className="form-control"
                        placeholder="Search by name, phone, email, group..."
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

                  {/* Sorting Dropdown */}
                  <div className="col-lg-3 col-md-3 col-6">
                    <select
                      className="form-select"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      title="Sort contacts"
                    >
                      <option value="name-asc">Sort: Name (A-Z)</option>
                      <option value="name-desc">Sort: Name (Z-A)</option>
                      <option value="date-desc">Sort: Newest First</option>
                      <option value="date-asc">Sort: Oldest First</option>
                    </select>
                  </div>

                  {/* Page Size Selector (10 or 20) */}
                  <div className="col-lg-2 col-md-3 col-6">
                    <select
                      className="form-select"
                      value={pageSize}
                      onChange={(e) => setPageSize(Number(e.target.value))}
                      title="Contacts per page"
                    >
                      <option value={10}>10 per page</option>
                      <option value={20}>20 per page</option>
                    </select>
                  </div>

                  {/* Favorites Quick Filter */}
                  <div className="col-lg-2 col-12 text-lg-end">
                    <button
                      type="button"
                      className={`btn btn-sm ${
                        onlyFavorites
                          ? "btn-warning text-dark fw-bold"
                          : "btn-outline-warning"
                      } w-100`}
                      onClick={() => setOnlyFavorites(!onlyFavorites)}
                    >
                      {onlyFavorites ? "⭐ Favorites Only" : "⭐ Filter Favorites"}
                    </button>
                  </div>
                </div>

                {/* Group / Tag Filter Pills */}
                <div className="d-flex align-items-center flex-wrap gap-2 my-3">
                  <span className="text-muted me-1 fw-semibold">
                    <small>Filter by Tag:</small>
                  </span>
                  {allGroups.map((grp) => (
                    <button
                      key={grp}
                      type="button"
                      className={`btn btn-sm ${
                        selectedGroup === grp
                          ? "btn-dark fw-bold"
                          : "btn-outline-secondary"
                      }`}
                      onClick={() => setSelectedGroup(grp)}
                    >
                      {grp}
                    </button>
                  ))}
                  {selectedGroup !== "All" && (
                    <button
                      type="button"
                      className="btn btn-sm btn-link text-decoration-none"
                      onClick={() => setSelectedGroup("All")}
                    >
                      Reset Tag
                    </button>
                  )}
                </div>

                {/* Bulk Actions Bar (appears when 1 or more contacts are selected) */}
                {selectedIds.length > 0 && (
                  <div className="alert alert-primary d-flex justify-content-between align-items-center py-2 px-3 my-2 flex-wrap gap-2 shadow-sm border-0">
                    <div className="d-flex align-items-center gap-2">
                      <span className="badge bg-dark fs-6">
                        {selectedIds.length}
                      </span>
                      <strong className="text-primary">
                        contact(s) selected
                      </strong>
                    </div>
                    <div className="d-flex gap-2">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary bg-white"
                        onClick={() => setShowBulkTagModal(true)}
                      >
                        🏷️ Assign Tag
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-danger"
                        onClick={() => setShowBulkDeleteModal(true)}
                      >
                        🗑️ Delete Selected
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary bg-white"
                        onClick={() => setSelectedIds([])}
                      >
                        Deselect All
                      </button>
                    </div>
                  </div>
                )}

                {/* Result count indicator */}
                <div className="d-flex justify-content-between align-items-center my-2 text-muted small">
                  <span>
                    Showing{" "}
                    <strong>
                      {totalItems > 0 ? startIndex + 1 : 0} -{" "}
                      {Math.min(startIndex + pageSize, totalItems)}
                    </strong>{" "}
                    of <strong>{totalItems}</strong> contacts
                    {totalItems !== contacts.length && (
                      <span> (filtered from {contacts.length} total)</span>
                    )}
                  </span>
                  {totalPages > 1 && (
                    <span>
                      Page <strong>{validCurrentPage}</strong> of{" "}
                      <strong>{totalPages}</strong>
                    </span>
                  )}
                </div>

                {filteredAndSortedContacts.length === 0 ? (
                  <div className="alert alert-warning text-center mt-3">
                    No contacts found matching your current search and filters.
                    <button
                      className="btn btn-link btn-sm ms-2"
                      onClick={() => {
                        setSearchInput("");
                        setSelectedGroup("All");
                        setOnlyFavorites(false);
                      }}
                    >
                      Reset all filters
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Contacts Table */}
                    <div className="table-responsive">
                      <table className="table table-hover align-middle">
                        <thead>
                          <tr className="table-dark">
                            <th scope="col" style={{ width: "35px" }}>
                              <input
                                className="form-check-input"
                                type="checkbox"
                                checked={isAllCurrentPageSelected}
                                onChange={handleSelectAll}
                                title="Select/Deselect all on this page"
                              />
                            </th>
                            <th scope="col" style={{ width: "30px" }}></th>
                            <th scope="col" style={{ width: "45px" }}></th>
                            <th scope="col">Name</th>
                            <th scope="col">Tag / Group</th>
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
                          {paginatedContacts.map((contact) => {
                            const isSelected = selectedIds.includes(contact._id);
                            return (
                              <tr
                                key={contact._id}
                                className={isSelected ? "table-active" : ""}
                                style={{ cursor: "pointer" }}
                                onClick={() => {
                                  setModalData(contact);
                                  setShowModal(true);
                                }}
                              >
                                {/* Checkbox Column */}
                                <td onClick={(e) => e.stopPropagation()}>
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={(e) =>
                                      handleRowSelect(contact._id, e)
                                    }
                                  />
                                </td>

                                {/* Favorite Star Button */}
                                <td
                                  onClick={(e) => toggleFavorite(contact, e)}
                                  title={
                                    contact.isFavorite
                                      ? "Starred (Click to remove)"
                                      : "Click to Star"
                                  }
                                  style={{
                                    fontSize: "1.2rem",
                                    cursor: "pointer",
                                  }}
                                  className="text-center"
                                >
                                  {contact.isFavorite ? (
                                    <span style={{ color: "#f59e0b" }}>★</span>
                                  ) : (
                                    <span className="text-muted opacity-50">
                                      ☆
                                    </span>
                                  )}
                                </td>

                                {/* Profile Photo / Avatar Column */}
                                <td>
                                  {contact.photo ? (
                                    <img
                                      src={contact.photo}
                                      alt={contact.name}
                                      style={{
                                        width: "38px",
                                        height: "38px",
                                        borderRadius: "50%",
                                        objectFit: "cover",
                                        border: "1px solid #cbd5e1",
                                      }}
                                    />
                                  ) : (
                                    <div
                                      style={{
                                        width: "38px",
                                        height: "38px",
                                        borderRadius: "50%",
                                        backgroundColor: getAvatarColor(
                                          contact.name
                                        ),
                                        color: "#fff",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontWeight: "bold",
                                        fontSize: "0.85rem",
                                      }}
                                    >
                                      {getInitials(contact.name)}
                                    </div>
                                  )}
                                </td>

                                <th scope="row" className="fw-semibold">
                                  {contact.name}
                                  {contact.isFavorite && (
                                    <span className="badge bg-warning text-dark ms-2 small">
                                      Top
                                    </span>
                                  )}
                                  {contact.birthday && (
                                    <span
                                      className="ms-1"
                                      title={`Birthday: ${formatBirthdayDisplay(
                                        contact.birthday
                                      )}`}
                                    >
                                      🎂
                                    </span>
                                  )}
                                </th>

                                {/* Group / Tag badge */}
                                <td>
                                  <span
                                    className={`badge ${getGroupBadgeClass(
                                      contact.group
                                    )}`}
                                  >
                                    {contact.group || "Other"}
                                  </span>
                                </td>

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
                                  style={{ maxWidth: "160px" }}
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
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                      <nav
                        aria-label="Contact pagination"
                        className="d-flex justify-content-center my-3"
                      >
                        <ul className="pagination mb-0">
                          <li
                            className={`page-item ${
                              validCurrentPage === 1 ? "disabled" : ""
                            }`}
                          >
                            <button
                              className="page-link"
                              onClick={() =>
                                setCurrentPage((p) => Math.max(1, p - 1))
                              }
                            >
                              &laquo; Prev
                            </button>
                          </li>

                          {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                            (pageNumber) => (
                              <li
                                key={pageNumber}
                                className={`page-item ${
                                  validCurrentPage === pageNumber ? "active" : ""
                                }`}
                              >
                                <button
                                  className="page-link"
                                  onClick={() => setCurrentPage(pageNumber)}
                                >
                                  {pageNumber}
                                </button>
                              </li>
                            )
                          )}

                          <li
                            className={`page-item ${
                              validCurrentPage === totalPages ? "disabled" : ""
                            }`}
                          >
                            <button
                              className="page-link"
                              onClick={() =>
                                setCurrentPage((p) =>
                                  Math.min(totalPages, p + 1)
                                )
                              }
                            >
                              Next &raquo;
                            </button>
                          </li>
                        </ul>
                      </nav>
                    )}
                  </>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Contact Details Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="d-flex align-items-center gap-2">
            <span>{modalData.name}</span>
            {modalData.isFavorite && (
              <span title="Favorite" style={{ color: "#f59e0b" }}>
                ★
              </span>
            )}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {/* Contact Photo Header */}
          <div className="text-center mb-3">
            {modalData.photo ? (
              <img
                src={modalData.photo}
                alt={modalData.name}
                style={{
                  width: "90px",
                  height: "90px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "3px solid #cbd5e1",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                }}
              />
            ) : (
              <div
                style={{
                  width: "90px",
                  height: "90px",
                  borderRadius: "50%",
                  backgroundColor: getAvatarColor(modalData.name || ""),
                  color: "#fff",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "bold",
                  fontSize: "2rem",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                }}
              >
                {getInitials(modalData.name || "")}
              </div>
            )}
            <h4 className="mt-2 mb-0">{modalData.name}</h4>
            <span className={`badge mt-1 ${getGroupBadgeClass(modalData.group)}`}>
              {modalData.group || "Other"}
            </span>
          </div>

          <hr />

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
          {modalData.birthday && (
            <div className="mb-2">
              <strong>🎂 Birthday:</strong>{" "}
              <span>{formatBirthdayDisplay(modalData.birthday)}</span>
            </div>
          )}
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
          <button
            className={`btn ${
              modalData.isFavorite ? "btn-warning" : "btn-outline-warning"
            }`}
            onClick={() => toggleFavorite(modalData)}
          >
            {modalData.isFavorite ? "★ Favorited" : "☆ Add to Favorites"}
          </button>
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

      {/* Single Delete Confirmation Modal */}
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

      {/* Bulk Delete Modal */}
      <Modal
        show={showBulkDeleteModal}
        onHide={() => setShowBulkDeleteModal(false)}
        centered
      >
        <Modal.Header closeButton className="bg-danger text-white">
          <Modal.Title>🗑️ Delete Multiple Contacts</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Are you sure you want to permanently delete{" "}
            <strong>{selectedIds.length}</strong> selected contact(s)?
          </p>
          <p className="text-danger mb-0">
            <small>This action cannot be undone.</small>
          </p>
        </Modal.Body>
        <Modal.Footer>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setShowBulkDeleteModal(false)}
            disabled={isBulkActionBusy}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={handleBulkDelete}
            disabled={isBulkActionBusy}
          >
            {isBulkActionBusy ? "Deleting..." : `Delete ${selectedIds.length} Contacts`}
          </button>
        </Modal.Footer>
      </Modal>

      {/* Bulk Tag Modal */}
      <Modal
        show={showBulkTagModal}
        onHide={() => setShowBulkTagModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>🏷️ Assign Tag to {selectedIds.length} Contacts</Modal.Title>
        </Modal.Header>
        <form onSubmit={handleBulkTag}>
          <Modal.Body>
            <p className="text-muted small">
              Select or type a tag to apply to all {selectedIds.length} selected contacts.
            </p>
            <div className="mb-3">
              <label htmlFor="bulkTagSelect" className="form-label fw-semibold">
                Select Tag / Group:
              </label>
              <select
                id="bulkTagSelect"
                className="form-select"
                value={bulkTagGroup}
                onChange={(e) => setBulkTagGroup(e.target.value)}
              >
                {PRESET_GROUPS.filter((g) => g !== "All").map((grp) => (
                  <option key={grp} value={grp}>
                    {grp}
                  </option>
                ))}
                <option value="Custom">+ Custom Tag...</option>
              </select>
            </div>

            {bulkTagGroup === "Custom" && (
              <div className="mb-3">
                <label
                  htmlFor="bulkCustomTagInput"
                  className="form-label fw-semibold"
                >
                  Custom Tag Name:
                </label>
                <input
                  type="text"
                  id="bulkCustomTagInput"
                  className="form-control"
                  placeholder="e.g. Clients, Gym, Project Alpha"
                  value={bulkCustomTag}
                  onChange={(e) => setBulkCustomTag(e.target.value)}
                  required
                />
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowBulkTagModal(false)}
              disabled={isBulkActionBusy}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isBulkActionBusy}
            >
              {isBulkActionBusy ? "Applying..." : "Apply Tag"}
            </button>
          </Modal.Footer>
        </form>
      </Modal>

      {/* CSV Import Modal */}
      <Modal
        show={showImportModal}
        onHide={() => setShowImportModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>📥 Import Contacts from CSV</Modal.Title>
        </Modal.Header>
        <form onSubmit={handleImportSubmit}>
          <Modal.Body>
            <p className="text-muted small">
              Upload a <code>.csv</code> file containing contacts. Columns
              supported: <strong>Name, Phone, Email, Address, Company, Tag, Birthday, Notes, Favorite</strong>.
            </p>

            <div className="mb-3">
              <label htmlFor="csvFileInput" className="form-label fw-semibold">
                Select CSV File:
              </label>
              <input
                type="file"
                id="csvFileInput"
                ref={importFileInputRef}
                className="form-control"
                accept=".csv,text/csv"
                onChange={(e) => setImportFile(e.target.files[0] || null)}
                required
              />
            </div>

            <div className="form-check mb-3">
              <input
                className="form-check-input"
                type="checkbox"
                id="skipDupCheck"
                checked={skipDuplicates}
                onChange={(e) => setSkipDuplicates(e.target.checked)}
              />
              <label className="form-check-label" htmlFor="skipDupCheck">
                Skip duplicates (matching existing email or phone)
              </label>
            </div>

            <div className="border-top pt-2">
              <button
                type="button"
                className="btn btn-sm btn-link p-0 text-decoration-none"
                onClick={downloadCSVTemplate}
              >
                📄 Download sample CSV template
              </button>
            </div>
          </Modal.Body>

          <Modal.Footer>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowImportModal(false)}
              disabled={isImporting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isImporting || !importFile}
            >
              {isImporting ? "Importing..." : "Upload & Import"}
            </button>
          </Modal.Footer>
        </form>
      </Modal>
    </>
  );
};

export default AllContact;
