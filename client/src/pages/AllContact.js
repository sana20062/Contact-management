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
      return "bg-dark text-white";
    case "Family":
      return "bg-secondary text-white";
    case "Friends":
      return "bg-light text-dark border";
    case "Other":
      return "bg-secondary text-white";
    default:
      return "bg-dark text-white";
  }
};

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
            ? `Marked [${result.name}] as Favorite`
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
    <div className="py-2">
      {/* Header Section */}
      <div className="d-flex justify-content-between align-items-center my-3 flex-wrap gap-2">
        <div>
          <h1 className="mb-1">YOUR CONTACTS</h1>
          <p
            className="text-muted mb-0 small"
            style={{ fontFamily: "var(--cms-font-serif)" }}
          >
            Manage your personal and professional connections.
          </p>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          <button
            onClick={() => setShowImportModal(true)}
            className="btn btn-outline-secondary"
            title="Import contacts from CSV"
          >
            IMPORT CSV
          </button>
          <button
            onClick={handleExportCSV}
            className="btn btn-outline-secondary"
            title="Export contacts to CSV"
          >
            EXPORT CSV
          </button>
          <button
            onClick={fetchContacts}
            className="btn btn-outline-secondary"
          >
            REFRESH
          </button>
          <Link to="/create" className="btn btn-primary">
            ADD CONTACT
          </Link>
        </div>
      </div>

      <hr style={{ borderColor: "var(--cms-border-subtle)" }} />

      {loading ? (
        <Spinner splash="LOADING CONTACTS..." />
      ) : (
        <>
          {contacts.length === 0 ? (
            <div className="card text-center py-5 my-4">
              <h3 className="mb-2">NO CONTACTS CREATED YET</h3>
              <p
                className="text-muted small mb-4"
                style={{ fontFamily: "var(--cms-font-serif)" }}
              >
                Get started by adding your first contact or importing a CSV file.
              </p>
              <div className="d-flex justify-content-center gap-2">
                <Link to="/create" className="btn btn-primary">
                  ADD FIRST CONTACT
                </Link>
                <button
                  onClick={() => setShowImportModal(true)}
                  className="btn btn-outline-secondary"
                >
                  IMPORT CSV
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
                        CLEAR
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
                    className={`btn ${
                      onlyFavorites
                        ? "btn-primary"
                        : "btn-outline-secondary"
                    } w-100`}
                    onClick={() => setOnlyFavorites(!onlyFavorites)}
                  >
                    {onlyFavorites ? "FAVORITES ONLY" : "FILTER FAVORITES"}
                  </button>
                </div>
              </div>

              {/* Group / Tag Filter Pills */}
              <div className="d-flex align-items-center flex-wrap gap-2 my-3">
                <span
                  className="small fw-semibold me-1 text-uppercase"
                  style={{ fontFamily: "var(--cms-font-serif)" }}
                >
                  Filter Tag:
                </span>
                {allGroups.map((grp) => (
                  <button
                    key={grp}
                    type="button"
                    className={`btn btn-sm ${
                      selectedGroup === grp
                        ? "btn-primary"
                        : "btn-outline-secondary"
                    }`}
                    style={{ padding: "4px 12px", fontSize: "0.75rem" }}
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
                    style={{ fontSize: "0.8rem" }}
                  >
                    Reset Tag
                  </button>
                )}
              </div>

              {/* Bulk Actions Bar */}
              {selectedIds.length > 0 && (
                <div
                  className="p-3 my-3 rounded d-flex justify-content-between align-items-center flex-wrap gap-2 shadow-sm border"
                  style={{
                    backgroundColor: "var(--cms-card-bg)",
                    borderColor: "var(--cms-input-border)",
                  }}
                >
                  <div className="d-flex align-items-center gap-2">
                    <span
                      className="badge bg-dark fs-6"
                      style={{ padding: "6px 12px" }}
                    >
                      {selectedIds.length}
                    </span>
                    <strong style={{ fontFamily: "var(--cms-font-heading)", letterSpacing: "1px" }}>
                      CONTACT(S) SELECTED
                    </strong>
                  </div>
                  <div className="d-flex gap-2 flex-wrap">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => setShowBulkTagModal(true)}
                    >
                      ASSIGN TAG
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-danger"
                      onClick={() => setShowBulkDeleteModal(true)}
                    >
                      DELETE SELECTED
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => setSelectedIds([])}
                    >
                      DESELECT ALL
                    </button>
                  </div>
                </div>
              )}

              {/* Result count indicator */}
              <div
                className="d-flex justify-content-between align-items-center my-2 small text-muted"
                style={{ fontFamily: "var(--cms-font-serif)" }}
              >
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
                <div className="card p-4 text-center my-3">
                  <p className="mb-2">
                    No contacts found matching your current search and filters.
                  </p>
                  <div>
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => {
                        setSearchInput("");
                        setSelectedGroup("All");
                        setOnlyFavorites(false);
                      }}
                    >
                      RESET FILTERS
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Contacts Table */}
                  <div className="table-responsive">
                    <table className="table align-middle mb-0">
                      <thead>
                        <tr>
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
                          <th scope="col">NAME</th>
                          <th scope="col">TAG / GROUP</th>
                          <th scope="col">COMPANY</th>
                          <th scope="col">EMAIL</th>
                          <th scope="col">PHONE</th>
                          <th scope="col">ADDRESS</th>
                          <th scope="col" className="text-center">
                            ACTIONS
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
                                  <span style={{ color: "#BF788C" }}>★</span>
                                ) : (
                                  <span style={{ color: "#B89298" }}>
                                    ☆
                                  </span>
                                )}
                              </td>

                              {/* Profile Photo Column */}
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
                                      border: "1.5px solid var(--cms-input-border)",
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
                                      fontFamily: "var(--cms-font-heading)",
                                    }}
                                  >
                                    {getInitials(contact.name)}
                                  </div>
                                )}
                              </td>

                              <th scope="row" className="fw-semibold">
                                {contact.name}
                                {contact.isFavorite && (
                                  <span
                                    className="badge ms-2"
                                    style={{
                                      backgroundColor: "var(--cms-btn-primary)",
                                      color: "var(--cms-btn-text)",
                                    }}
                                  >
                                    TOP
                                  </span>
                                )}
                              </th>

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
                                  className="btn btn-sm btn-outline-secondary me-2"
                                  style={{ padding: "4px 10px", fontSize: "0.75rem" }}
                                  to={`/edit/${contact._id}`}
                                >
                                  EDIT
                                </Link>
                                <button
                                  className="btn btn-sm btn-danger"
                                  style={{ padding: "4px 10px", fontSize: "0.75rem" }}
                                  onClick={() => triggerDelete(contact)}
                                >
                                  DELETE
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
                      className="d-flex justify-content-center my-4"
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
                            &laquo; PREV
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
                            NEXT &raquo;
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

      {/* Contact Details Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{modalData.name}</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {/* Contact Photo Header */}
          <div className="text-center mb-3">
            {modalData.photo ? (
              <img
                src={modalData.photo}
                alt={modalData.name}
                style={{
                  width: "85px",
                  height: "85px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "2px solid var(--cms-input-border)",
                }}
              />
            ) : (
              <div
                style={{
                  width: "85px",
                  height: "85px",
                  borderRadius: "50%",
                  backgroundColor: getAvatarColor(modalData.name || ""),
                  color: "#fff",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "bold",
                  fontSize: "1.8rem",
                  fontFamily: "var(--cms-font-heading)",
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

          <hr style={{ borderColor: "var(--cms-border-subtle)" }} />

          <div className="mb-2">
            <strong style={{ fontFamily: "var(--cms-font-serif)", textTransform: "uppercase" }}>Company:</strong>{" "}
            {modalData.company || <span className="text-muted">—</span>}
          </div>
          <div className="mb-2">
            <strong style={{ fontFamily: "var(--cms-font-serif)", textTransform: "uppercase" }}>Email:</strong>{" "}
            <a href={`mailto:${modalData.email}`}>{modalData.email}</a>
          </div>
          <div className="mb-2">
            <strong style={{ fontFamily: "var(--cms-font-serif)", textTransform: "uppercase" }}>Phone:</strong>{" "}
            <a href={`tel:${modalData.phone}`}>{modalData.phone}</a>
          </div>
          <div className="mb-2">
            <strong style={{ fontFamily: "var(--cms-font-serif)", textTransform: "uppercase" }}>Address:</strong>{" "}
            {modalData.address}
          </div>
          {modalData.birthday && (
            <div className="mb-2">
              <strong style={{ fontFamily: "var(--cms-font-serif)", textTransform: "uppercase" }}>Birthday:</strong>{" "}
              <span>{formatBirthdayDisplay(modalData.birthday)}</span>
            </div>
          )}
          {modalData.notes && (
            <div
              className="mt-3 p-3 rounded border"
              style={{
                backgroundColor: "var(--cms-card-inner)",
                borderColor: "var(--cms-border-subtle)",
              }}
            >
              <strong style={{ fontFamily: "var(--cms-font-serif)", textTransform: "uppercase" }}>Notes:</strong>
              <p className="mb-0 text-muted small mt-1" style={{ whiteSpace: "pre-wrap" }}>
                {modalData.notes}
              </p>
            </div>
          )}
        </Modal.Body>

        <Modal.Footer>
          <button
            className={`btn ${
              modalData.isFavorite ? "btn-primary" : "btn-outline-secondary"
            }`}
            onClick={() => toggleFavorite(modalData)}
          >
            {modalData.isFavorite ? "FAVORITED" : "ADD TO FAVORITES"}
          </button>
          <Link className="btn btn-outline-secondary" to={`/edit/${modalData._id}`}>
            EDIT
          </Link>
          <button
            className="btn btn-danger"
            onClick={() => {
              setShowModal(false);
              triggerDelete(modalData);
            }}
          >
            DELETE
          </button>
          <button
            className="btn btn-outline-secondary"
            onClick={() => setShowModal(false)}
          >
            CLOSE
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
          <Modal.Title>CONFIRM DELETE</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete contact{" "}
          <strong>{contactToDelete?.name}</strong>?
          <p className="text-danger mt-2 mb-0 small">
            This action cannot be undone.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <button
            className="btn btn-outline-secondary"
            onClick={() => setShowDeleteConfirm(false)}
          >
            CANCEL
          </button>
          <button className="btn btn-danger" onClick={confirmDelete}>
            YES, DELETE
          </button>
        </Modal.Footer>
      </Modal>

      {/* Bulk Delete Modal */}
      <Modal
        show={showBulkDeleteModal}
        onHide={() => setShowBulkDeleteModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>DELETE MULTIPLE CONTACTS</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Are you sure you want to permanently delete{" "}
            <strong>{selectedIds.length}</strong> selected contact(s)?
          </p>
          <p className="text-danger mb-0 small">
            This action cannot be undone.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={() => setShowBulkDeleteModal(false)}
            disabled={isBulkActionBusy}
          >
            CANCEL
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={handleBulkDelete}
            disabled={isBulkActionBusy}
          >
            {isBulkActionBusy ? "DELETING..." : `DELETE ${selectedIds.length} CONTACTS`}
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
          <Modal.Title>ASSIGN TAG TO {selectedIds.length} CONTACTS</Modal.Title>
        </Modal.Header>
        <form onSubmit={handleBulkTag}>
          <Modal.Body>
            <p
              className="text-muted small"
              style={{ fontFamily: "var(--cms-font-serif)" }}
            >
              Select or enter a tag to apply to all {selectedIds.length} selected contacts.
            </p>
            <div className="mb-3">
              <label htmlFor="bulkTagSelect" className="form-label mb-2">
                SELECT TAG / GROUP:
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
                  className="form-label mb-2"
                >
                  CUSTOM TAG NAME:
                </label>
                <input
                  type="text"
                  id="bulkCustomTagInput"
                  className="form-control"
                  placeholder="e.g. Clients, Club, VIP"
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
              className="btn btn-outline-secondary"
              onClick={() => setShowBulkTagModal(false)}
              disabled={isBulkActionBusy}
            >
              CANCEL
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isBulkActionBusy}
            >
              {isBulkActionBusy ? "APPLYING..." : "APPLY TAG"}
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
          <Modal.Title>IMPORT CONTACTS FROM CSV</Modal.Title>
        </Modal.Header>
        <form onSubmit={handleImportSubmit}>
          <Modal.Body>
            <p
              className="text-muted small"
              style={{ fontFamily: "var(--cms-font-serif)" }}
            >
              Upload a <code>.csv</code> file containing contacts. Columns
              supported: <strong>Name, Phone, Email, Address, Company, Tag, Birthday, Notes, Favorite</strong>.
            </p>

            <div className="mb-3">
              <label htmlFor="csvFileInput" className="form-label mb-2">
                SELECT CSV FILE:
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
              <label className="form-check-label small" htmlFor="skipDupCheck">
                Skip duplicates (matching existing email or phone)
              </label>
            </div>

            <div className="border-top pt-2">
              <button
                type="button"
                className="btn btn-sm btn-link p-0"
                onClick={downloadCSVTemplate}
              >
                Download sample CSV template
              </button>
            </div>
          </Modal.Body>

          <Modal.Footer>
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => setShowImportModal(false)}
              disabled={isImporting}
            >
              CANCEL
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isImporting || !importFile}
            >
              {isImporting ? "IMPORTING..." : "UPLOAD & IMPORT"}
            </button>
          </Modal.Footer>
        </form>
      </Modal>
    </div>
  );
};

export default AllContact;
