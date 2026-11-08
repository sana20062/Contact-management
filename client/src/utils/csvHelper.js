/**
 * Export array of contacts to CSV file download
 */
export const exportContactsToCSV = (contacts = [], filename = "contacts_export.csv") => {
  if (!contacts || contacts.length === 0) {
    throw new Error("No contacts to export.");
  }

  const headers = [
    "Name",
    "Phone",
    "Email",
    "Address",
    "Company",
    "Tag",
    "Birthday",
    "Notes",
    "Favorite",
    "CreatedAt",
  ];

  const escapeCell = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = contacts.map((c) => [
    escapeCell(c.name),
    escapeCell(c.phone),
    escapeCell(c.email),
    escapeCell(c.address),
    escapeCell(c.company || ""),
    escapeCell(c.group || "Other"),
    escapeCell(c.birthday || ""),
    escapeCell(c.notes || ""),
    escapeCell(c.isFavorite ? "Yes" : "No"),
    escapeCell(c.createdAt ? new Date(c.createdAt).toLocaleDateString() : ""),
  ]);

  const csvContent =
    "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Downloads a sample CSV template for import
 */
export const downloadCSVTemplate = () => {
  const sample = [
    {
      name: "Alice Johnson",
      phone: "+1 555 123 4567",
      email: "alice@example.com",
      address: "123 Market St, San Francisco, CA",
      company: "Tech Corp",
      group: "Work",
      birthday: "1995-11-15",
      notes: "Lead designer",
      isFavorite: "Yes",
    },
    {
      name: "Bob Smith",
      phone: "+1 555 987 6543",
      email: "bob@example.com",
      address: "456 Elm St, Chicago, IL",
      company: "Acme Inc",
      group: "Friends",
      birthday: "1998-04-22",
      notes: "College friend",
      isFavorite: "No",
    },
  ];
  exportContactsToCSV(sample, "contacts_import_template.csv");
};

/**
 * Simple CSV parser handling quotes and commas
 */
export const parseCSVText = (text) => {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) {
    throw new Error("CSV file must contain a header row and at least one contact row.");
  }

  // Parse a CSV line into cells
  const parseLine = (line) => {
    const result = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++; // skip escaped quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const rawHeaders = parseLine(lines[0]).map((h) =>
    h.toLowerCase().replace(/[^a-z0-9]/g, "")
  );

  const getIndex = (aliases) => {
    for (const a of aliases) {
      const idx = rawHeaders.indexOf(a);
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const nameIdx = getIndex(["name", "fullname", "contactname"]);
  const phoneIdx = getIndex(["phone", "phonenumber", "mobile", "tel"]);
  const emailIdx = getIndex(["email", "emailaddress"]);
  const addressIdx = getIndex(["address", "location"]);
  const companyIdx = getIndex(["company", "organization", "org"]);
  const groupIdx = getIndex(["tag", "group", "category", "label"]);
  const bdayIdx = getIndex(["birthday", "bday", "birthdate", "dob"]);
  const notesIdx = getIndex(["notes", "note", "description"]);
  const favIdx = getIndex(["favorite", "isfavorite", "starred"]);

  if (nameIdx === -1 || phoneIdx === -1 || emailIdx === -1) {
    throw new Error(
      "CSV header must contain at least 'Name', 'Phone', and 'Email' columns."
    );
  }

  const contacts = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i]);
    const name = values[nameIdx] || "";
    const phone = values[phoneIdx] || "";
    const email = values[emailIdx] || "";

    if (!name && !email && !phone) continue;

    const favVal = favIdx !== -1 ? (values[favIdx] || "").toLowerCase() : "";
    const isFavorite = favVal === "yes" || favVal === "true" || favVal === "1";

    contacts.push({
      name,
      phone,
      email,
      address: addressIdx !== -1 ? values[addressIdx] || "N/A" : "N/A",
      company: companyIdx !== -1 ? values[companyIdx] || "" : "",
      group: groupIdx !== -1 ? values[groupIdx] || "Other" : "Other",
      birthday: bdayIdx !== -1 ? values[bdayIdx] || "" : "",
      notes: notesIdx !== -1 ? values[notesIdx] || "" : "",
      isFavorite,
    });
  }

  return contacts;
};
