const { validateContact, Contact } = require("../models/Contact");
const auth = require("../middlewares/auth");
const mongoose = require("mongoose");
const router = require("express").Router();

// Check for duplicates (live check endpoint)
router.post("/contact/check-duplicate", auth, async (req, res) => {
  const { email, phone, excludeId } = req.body;

  try {
    const query = {
      postedBy: req.user._id,
      $or: [],
    };

    if (email && email.trim()) {
      query.$or.push({ email: email.trim() });
    }
    if (phone && phone.trim()) {
      query.$or.push({ phone: phone.trim() });
    }

    if (query.$or.length === 0) {
      return res.status(200).json({ duplicate: false });
    }

    if (excludeId && mongoose.isValidObjectId(excludeId)) {
      query._id = { $ne: excludeId };
    }

    const existing = await Contact.findOne(query);
    if (existing) {
      const matchReason =
        existing.email === email?.trim() && existing.phone === phone?.trim()
          ? "email and phone"
          : existing.email === email?.trim()
          ? "email"
          : "phone";

      return res.status(200).json({
        duplicate: true,
        matchReason,
        existingContact: {
          id: existing._id,
          name: existing.name,
          email: existing.email,
          phone: existing.phone,
        },
      });
    }

    return res.status(200).json({ duplicate: false });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

// create contact (with duplicate check unless force=true)
router.post("/contact", auth, async (req, res) => {
  const { error } = validateContact(req.body);

  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  const {
    name,
    address,
    email,
    phone,
    company,
    notes,
    group,
    birthday,
    isFavorite,
    photo,
    force,
  } = req.body;

  try {
    // Duplicate warning check
    if (!force) {
      const existing = await Contact.findOne({
        postedBy: req.user._id,
        $or: [{ email: email.trim() }, { phone: phone.trim() }],
      });

      if (existing) {
        const matchField =
          existing.email.toLowerCase() === email.trim().toLowerCase()
            ? "email"
            : "phone";
        return res.status(409).json({
          duplicate: true,
          error: `A contact with this ${matchField} already exists (${existing.name}).`,
          existingName: existing.name,
          matchField,
        });
      }
    }

    const newContact = new Contact({
      name,
      address,
      email,
      phone,
      company: company || "",
      notes: notes || "",
      group: group || "Other",
      birthday: birthday || "",
      isFavorite: Boolean(isFavorite),
      photo: photo || "",
      postedBy: req.user._id,
    });
    const result = await newContact.save();

    return res.status(201).json({ ...result._doc });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

// bulk delete contacts
router.post("/contact/bulk-delete", auth, async (req, res) => {
  const { ids } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: "No contact IDs specified for deletion." });
  }

  try {
    const validIds = ids.filter((id) => mongoose.isValidObjectId(id));
    await Contact.deleteMany({
      _id: { $in: validIds },
      postedBy: req.user._id,
    });

    const myContacts = await Contact.find({ postedBy: req.user._id })
      .populate("postedBy", "-password")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      message: `Successfully deleted ${validIds.length} contact(s).`,
      deletedCount: validIds.length,
      myContacts,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

// bulk tag / update group for contacts
router.post("/contact/bulk-tag", auth, async (req, res) => {
  const { ids, group } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: "No contact IDs specified for tagging." });
  }

  if (!group || !group.trim()) {
    return res.status(400).json({ error: "Tag / group cannot be empty." });
  }

  try {
    const validIds = ids.filter((id) => mongoose.isValidObjectId(id));
    await Contact.updateMany(
      { _id: { $in: validIds }, postedBy: req.user._id },
      { $set: { group: group.trim() } }
    );

    const myContacts = await Contact.find({ postedBy: req.user._id })
      .populate("postedBy", "-password")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      message: `Successfully tagged ${validIds.length} contact(s) as "${group.trim()}".`,
      updatedCount: validIds.length,
      myContacts,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

// bulk import contacts from CSV
router.post("/contact/import", auth, async (req, res) => {
  const { contacts: importedList, skipDuplicates = true } = req.body;

  if (!Array.isArray(importedList) || importedList.length === 0) {
    return res.status(400).json({ error: "No contacts provided for import." });
  }

  try {
    const existingContacts = await Contact.find({ postedBy: req.user._id });
    const existingEmails = new Set(
      existingContacts.map((c) => c.email.toLowerCase())
    );
    const existingPhones = new Set(existingContacts.map((c) => c.phone));

    const toInsert = [];
    let skipped = 0;

    for (const item of importedList) {
      if (!item.name || !item.email || !item.phone || !item.address) {
        skipped++;
        continue;
      }

      const emailLower = item.email.trim().toLowerCase();
      const phoneClean = item.phone.trim();

      if (
        skipDuplicates &&
        (existingEmails.has(emailLower) || existingPhones.has(phoneClean))
      ) {
        skipped++;
        continue;
      }

      toInsert.push({
        name: item.name.trim(),
        email: item.email.trim(),
        phone: item.phone.trim(),
        address: item.address.trim(),
        company: item.company ? item.company.trim() : "",
        notes: item.notes ? item.notes.trim() : "",
        group: item.group ? item.group.trim() : "Other",
        birthday: item.birthday ? item.birthday.trim() : "",
        isFavorite: item.isFavorite === true || item.isFavorite === "true",
        photo: item.photo || "",
        postedBy: req.user._id,
      });

      existingEmails.add(emailLower);
      existingPhones.add(phoneClean);
    }

    if (toInsert.length > 0) {
      await Contact.insertMany(toInsert);
    }

    const myContacts = await Contact.find({ postedBy: req.user._id })
      .populate("postedBy", "-password")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      message: `Successfully imported ${toInsert.length} contacts (${skipped} skipped).`,
      importedCount: toInsert.length,
      skippedCount: skipped,
      myContacts,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

// fetch all contacts for logged-in user
router.get("/mycontacts", auth, async (req, res) => {
  try {
    const myContacts = await Contact.find({ postedBy: req.user._id })
      .populate("postedBy", "-password")
      .sort({ createdAt: -1 });

    return res.status(200).json({ contacts: myContacts });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

// update contact (with duplicate check unless force=true)
router.put("/contact", auth, async (req, res) => {
  const { id } = req.body;

  if (!id) return res.status(400).json({ error: "no id specified." });
  if (!mongoose.isValidObjectId(id))
    return res.status(400).json({ error: "please enter a valid id" });

  const { error } = validateContact(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  try {
    const contact = await Contact.findOne({ _id: id });
    if (!contact) {
      return res.status(404).json({ error: "Contact not found" });
    }

    if (req.user._id.toString() !== contact.postedBy.toString()) {
      return res
        .status(401)
        .json({ error: "You can't edit other people's contacts!" });
    }

    const {
      name,
      address,
      email,
      phone,
      company,
      notes,
      group,
      birthday,
      isFavorite,
      photo,
      force,
    } = req.body;

    // Duplicate check excluding self
    if (!force) {
      const duplicate = await Contact.findOne({
        _id: { $ne: id },
        postedBy: req.user._id,
        $or: [{ email: email.trim() }, { phone: phone.trim() }],
      });

      if (duplicate) {
        const matchField =
          duplicate.email.toLowerCase() === email.trim().toLowerCase()
            ? "email"
            : "phone";
        return res.status(409).json({
          duplicate: true,
          error: `Another contact with this ${matchField} already exists (${duplicate.name}).`,
          existingName: duplicate.name,
          matchField,
        });
      }
    }

    const updatedData = {
      name,
      address,
      email,
      phone,
      company: company !== undefined ? company : contact.company,
      notes: notes !== undefined ? notes : contact.notes,
      group: group !== undefined ? group : contact.group,
      birthday: birthday !== undefined ? birthday : contact.birthday,
      isFavorite:
        isFavorite !== undefined ? Boolean(isFavorite) : contact.isFavorite,
      photo: photo !== undefined ? photo : contact.photo,
    };

    const result = await Contact.findByIdAndUpdate(id, updatedData, {
      new: true,
    });

    return res.status(200).json({ ...result._doc });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

// toggle favorite status for a contact
router.put("/contact/favorite/:id", auth, async (req, res) => {
  const { id } = req.params;

  if (!id) return res.status(400).json({ error: "no id specified." });
  if (!mongoose.isValidObjectId(id))
    return res.status(400).json({ error: "please enter a valid id" });

  try {
    const contact = await Contact.findOne({ _id: id });
    if (!contact) return res.status(404).json({ error: "No contact found" });

    if (req.user._id.toString() !== contact.postedBy.toString()) {
      return res
        .status(401)
        .json({ error: "You can't edit other people's contacts!" });
    }

    contact.isFavorite = !contact.isFavorite;
    const result = await contact.save();

    return res.status(200).json({ ...result._doc });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

// delete contact
router.delete("/delete/:id", auth, async (req, res) => {
  const { id } = req.params;

  if (!id) return res.status(400).json({ error: "no id specified." });
  if (!mongoose.isValidObjectId(id))
    return res.status(400).json({ error: "please enter a valid id" });

  try {
    const contact = await Contact.findOne({ _id: id });
    if (!contact) return res.status(404).json({ error: "No contact found" });

    if (req.user._id.toString() !== contact.postedBy.toString()) {
      return res
        .status(401)
        .json({ error: "You can't delete other people's contacts!" });
    }

    await Contact.deleteOne({ _id: id });
    const myContacts = await Contact.find({ postedBy: req.user._id })
      .populate("postedBy", "-password")
      .sort({ createdAt: -1 });

    return res.status(200).json({ ...contact._doc, myContacts: myContacts });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

// get a single contact
router.get("/contact/:id", auth, async (req, res) => {
  const { id } = req.params;

  if (!id) return res.status(400).json({ error: "no id specified." });
  if (!mongoose.isValidObjectId(id))
    return res.status(400).json({ error: "please enter a valid id" });

  try {
    const contact = await Contact.findOne({ _id: id, postedBy: req.user._id });
    if (!contact) {
      return res.status(404).json({ error: "Contact not found" });
    }

    return res.status(200).json({ ...contact._doc });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
