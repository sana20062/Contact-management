const mongoose = require("mongoose");
const Joi = require("joi");

const ContactSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "name is required."],
      trim: true,
    },
    address: {
      type: String,
      required: [true, "address is required."],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "email is required."],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "phone number is required."],
      trim: true,
    },
    company: {
      type: String,
      default: "",
      trim: true,
    },
    notes: {
      type: String,
      default: "",
      trim: true,
    },
    group: {
      type: String,
      default: "Other",
      trim: true,
    },
    birthday: {
      type: String,
      default: "",
      trim: true,
    },
    isFavorite: {
      type: Boolean,
      default: false,
    },
    photo: {
      type: String,
      default: "",
    },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

const Contact = mongoose.model("Contact", ContactSchema);

const validateContact = (data) => {
  const schema = Joi.object({
    name: Joi.string().min(2).max(50).required().messages({
      "string.empty": "Name is required.",
      "string.min": "Name must be at least 2 characters.",
      "string.max": "Name cannot exceed 50 characters.",
    }),
    address: Joi.string().min(2).max(100).required().messages({
      "string.empty": "Address is required.",
      "string.min": "Address must be at least 2 characters.",
      "string.max": "Address cannot exceed 100 characters.",
    }),
    email: Joi.string().email().required().messages({
      "string.empty": "Email is required.",
      "string.email": "Please enter a valid email address.",
    }),
    phone: Joi.string()
      .pattern(/^[0-9+()-\s]{7,20}$/)
      .required()
      .messages({
        "string.empty": "Phone number is required.",
        "string.pattern.base":
          "Please enter a valid phone number (at least 7 digits).",
      }),
    company: Joi.string().max(100).allow("").optional(),
    notes: Joi.string().max(1000).allow("").optional(),
    group: Joi.string().max(50).allow("").optional(),
    birthday: Joi.string().allow("").optional(),
    isFavorite: Joi.boolean().optional(),
    photo: Joi.string().allow("").optional(),
    force: Joi.boolean().optional(),
    id: Joi.string().optional(),
  });

  return schema.validate(data);
};

module.exports = {
  validateContact,
  Contact,
};
