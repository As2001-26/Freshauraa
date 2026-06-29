const express = require("express");
const router = express.Router();
const Product = require("../models/product");
const verifyToken = require("../middleware/verifyToken");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const ext = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mime = allowedTypes.test(file.mimetype);
    if (ext && mime) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (jpg, png, gif, webp) are allowed'));
    }
  }
});

// Test Route
router.get("/test", (req, res) => {
  res.send("Test Route Working");
});

// Get All Products (Public)
router.get("/", async (req, res) => {
  try {
    const products = await Product.find({ inStock: true }); // ← sirf yahi badla

    res.json(products);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
});

// Add Product (Protected) — now accepts multipart/form-data with image file
router.post("/", verifyToken, upload.single('image'), async (req, res) => {
  try {
    const productData = {
      name: req.body.name,
      price: req.body.price,
      description: req.body.description || '',
      category: req.body.category,
      bogo: req.body.bogo === 'true' || req.body.bogo === true,
    };

    // If a file was uploaded, store its path
    if (req.file) {
      productData.image = '/uploads/' + req.file.filename;
    } else if (req.body.image) {
      // Fallback: if no file but an image URL/path was provided as text
      productData.image = req.body.image;
    }

    const product = new Product(productData);

    await product.save();

    res.status(201).json({
      message: "Product Added Successfully",
      product
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
});

// Update Product (Protected) — now accepts multipart/form-data with image file
router.put("/:id", verifyToken, upload.single('image'), async (req, res) => {
  try {
    const updateData = {
      name: req.body.name,
      price: req.body.price,
      description: req.body.description || '',
      category: req.body.category,
      bogo: req.body.bogo === 'true' || req.body.bogo === true,
    };

    // If a new file was uploaded, update image path
    if (req.file) {
      updateData.image = '/uploads/' + req.file.filename;

      // Delete old image file if it exists in uploads
      const oldProduct = await Product.findById(req.params.id);
      if (oldProduct && oldProduct.image && oldProduct.image.startsWith('/uploads/')) {
        const oldPath = path.join(__dirname, '..', oldProduct.image);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
    } else if (req.body.image) {
      updateData.image = req.body.image;
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true
      }
    );

    if (!product) {
      return res.status(404).json({
        message: "Product Not Found"
      });
    }

    res.json({
      message: "Product Updated Successfully",
      product
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
});

// Delete Product (Protected)
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(
      req.params.id
    );

    if (!product) {
      return res.status(404).json({
        message: "Product Not Found"
      });
    }

    // Delete image file if it exists in uploads
    if (product.image && product.image.startsWith('/uploads/')) {
      const imgPath = path.join(__dirname, '..', product.image);
      if (fs.existsSync(imgPath)) {
        fs.unlinkSync(imgPath);
      }
    }

    res.json({
      message: "Product Deleted Successfully"
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
});

module.exports = router;