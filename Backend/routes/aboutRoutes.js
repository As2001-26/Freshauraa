const express = require('express');
const router = express.Router();
const About = require('../models/about');

// GET /api/about
router.get('/', async (req, res) => {
  try {
    let about = await About.findOne();
    if (!about) {
      // If it doesn't exist, create a default one
      about = await About.create({
        content: `At Fresh Auraa, we believe in creating a cleaner, healthier, and more vibrant living environment. Our mission is to offer a range of high-quality products that cater to your home cleaning, pooja needs, household supplies, and personal care. We are committed to providing solutions that not only meet your daily needs but also enhance your lifestyle with freshness and purity.\n\nOur journey began with a simple idea: to make household chores easier and more enjoyable with products that are both effective and safe. Today, Fresh Auraa stands as a trusted brand known for its excellence and dedication to customer satisfaction.`,
        videoUrl: 'assets/freshauraa__.mp4'
      });
    }
    res.json(about);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PUT /api/about
router.put('/', async (req, res) => {
  try {
    const { content, videoUrl } = req.body;
    let about = await About.findOne();
    
    if (about) {
      about.content = content || about.content;
      about.videoUrl = videoUrl || about.videoUrl;
      await about.save();
    } else {
      about = await About.create({ content, videoUrl });
    }
    
    res.json({ message: 'About section updated successfully', about });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'about-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
  fileFilter: function (req, file, cb) {
    const allowedTypes = /mp4|webm|ogg|mov|mkv/;
    const ext = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mime = allowedTypes.test(file.mimetype);
    if (ext && mime) {
      cb(null, true);
    } else {
      cb(new Error('Only video files (mp4, webm, ogg, mov, mkv) are allowed'));
    }
  }
});

// POST /api/about/upload
router.post('/upload', upload.single('video'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    // Return relative path for frontend to use
    const fileUrl = 'uploads/' + req.file.filename;
    res.json({ message: 'Video uploaded successfully', fileUrl });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
