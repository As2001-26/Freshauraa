require("dotenv").config();
const mongoose = require("mongoose");
const Product = require("./models/product");

const products = [
  { name: "Freshauraa Phenyl", category: "Home Cleaning", price: 300, image: "phenyl1.jpg", bogo: true, inStock: true },
  { name: "Food Wrapping Paper", category: "Uncategorized", price: 325, image: "food1.jpg", bogo: true, inStock: true },
  { name: "Aluminium Foil Roll", category: "Household Supplies", price: 920, image: "aluminium1.jpg", bogo: true, inStock: true },
  { name: "Facial-Car Tissue Box 100", category: "Personal Care", price: 75, image: "tissue1.jpg", bogo: true, inStock: true },
  { name: "Toilet Roll Pack of 10", category: "Household Supplies", price: 390, image: "toiletroll1.jpg", bogo: true, inStock: true },
  { name: "Glass Cleaner 2X Shine", category: "Home Cleaning", price: 99, image: "glass2.jpg", bogo: true, inStock: true },
  { name: "Dishwash Gel 100 Lemons", category: "Home Cleaning", price: 160, image: "dish1.jpg", bogo: true, inStock: true },
  { name: "Floor Cleaner 10X Lemon", category: "Home Cleaning", price: 125, image: "floor1.jpg", bogo: true, inStock: true },
  { name: "Toilet Cleaner", category: "Home Cleaning", price: 145, image: "toiletCleaner.jpg", bogo: true, inStock: true },
  { name: "Disinfectant", category: "Home Cleaning", price: 180, image: "disinfectant.jpg", bogo: true, inStock: true },
];

const mongoURI = process.env.MONGO_URI || process.env.Mongo_URI;

mongoose.connect(mongoURI)
  .then(async () => {
    console.log("MongoDB Connected");
    await Product.deleteMany({});
    console.log("Old products cleared");
    await Product.insertMany(products);
    console.log("✅ Products seeded successfully!");
    mongoose.disconnect();
  })
  .catch((err) => {
    console.error("Error:", err);
    mongoose.disconnect();
  });