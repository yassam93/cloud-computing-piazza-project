const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const protectRoute = require('../middleware/verify-token');

// GET all categories
router.get('/', protectRoute, async (req, res) => {
    try {
        const categories = await Category.find();
        res.json(categories);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST a new category
router.post('/', protectRoute, async (req, res) => {
    const category = new Category({
        name: req.body.name,
    });
    try {
        const savedCategory = await category.save();
        res.status(201).json(savedCategory);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;