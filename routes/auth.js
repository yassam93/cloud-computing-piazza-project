
const express = require('express');
const router = express.Router();
const Account = require('../models/UserAccount'); 
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
// Importing validation functions from validations.js file
const { validateNewAccount, validateLogin } = require('../validations/validations');

// Route for handling new account registration
router.post('/register', async (req, res) => {
    // First, validate the incoming user data
    const { error } = validateNewAccount(req.body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }

    // Second, check if the email is already in the database
    const emailAlreadyExists = await Account.findOne({ email: req.body.email });
    if (emailAlreadyExists) {
        return res.status(400).json({ message: 'An account with this email already exists.' });
    }

    // Third, check if the username is already taken
    const usernameTaken = await Account.findOne({ username: req.body.username });
    if (usernameTaken) {
        return res.status(400).json({ message: 'This username is already taken.' });
    }

    // If all checks pass, hash the password for security
    const salt = await bcrypt.genSalt(10); 
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    // Create a new account object to be saved
    const newAccount = new Account({
        username: req.body.username,
        email: req.body.email,
        password: hashedPassword
    });

    // Save the new account to the database
    try {
        const newAccountRecord = await newAccount.save();
        res.status(201).json({ userId: newAccountRecord._id, username: newAccountRecord.username }); 
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Route for handling user login
router.post('/login', async (req, res) => {
    // First, validate the login data
    const { error } = validateLogin(req.body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }

    // Second, check if an account with that email exists
    const account = await Account.findOne({ email: req.body.email });
    if (!account) {
        return res.status(400).json({ message: 'Invalid email or password.' });
    }

    // Third, compare the provided password with the stored hashed password
    const isPasswordCorrect = await bcrypt.compare(req.body.password, account.password);
    if (!isPasswordCorrect) {
        return res.status(400).json({ message: 'Invalid email or password.' });
    }

    // If login is successful, create and assign a JSON Web Token (JWT)
    const token = jwt.sign({ _id: account._id }, process.env.TOKEN_SECRET);
    res.header('auth-token', token).json({ 'auth_token': token });
});

module.exports = router;



