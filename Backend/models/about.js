const mongoose = require('mongoose');

const aboutSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    default: "Let's Talk About FreshAuraa..."
  },
  videoUrl: {
    type: String,
    required: true,
    default: "assets/freshauraa__.mp4"
  }
}, { timestamps: true });

module.exports = mongoose.model('About', aboutSchema);
