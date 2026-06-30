const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  image: {
    type: String,
    default: ""
  },
  description: {
    type: String,
    default: ""
  },

  category: {
    type: String,
    required: true,
    default: "Uncategorized"
  },
  bogo: {
    type: Boolean,
    default: true
  },
  inStock: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model("Product", productSchema);