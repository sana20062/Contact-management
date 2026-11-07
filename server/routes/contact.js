const { validateContact, Contact } = require("../models/Contact");
const auth = require("../middlewares/auth");
const mongoose = require("mongoose");
const router = require("express").Router();

// create contact
router.post("/contact", auth, async (req, res) => {
  const { error } = validateContact(req.body);

  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  const { name, address, email, phone, company, notes } = req.body;

  try {
    const newContact = new Contact({
      name,
      address,
      email,
      phone,
      company: company || "",
      notes: notes || "",
      postedBy: req.user._id,
    });
    const result = await newContact.save();

    return res.status(201).json({ ...result._doc });
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

// update contact
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

    const { name, address, email, phone, company, notes } = req.body;
    const updatedData = {
      name,
      address,
      email,
      phone,
      company: company !== undefined ? company : contact.company,
      notes: notes !== undefined ? notes : contact.notes,
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

    return res
      .status(200)
      .json({ ...contact._doc, myContacts: myContacts });
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
