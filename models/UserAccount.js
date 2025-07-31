
const mongoose = require('mongoose');

// Defines the schema for a user account
const accountSchema = mongoose.Schema({
    email: { 
        type: String,
        required: true,
        minlength: 6,
        maxlength: 256,
        unique: true,
    },
    username: {
        type: String,
        minlength: 3,
        maxlength: 256,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
        minlength: 6,
        maxlength: 1024,
    },
    createdOn: { 
        type: Date,
        default: Date.now,
    },
}, {
    versionKey: false
});

// Creates the 'Account' model in the database
module.exports = mongoose.model('Account', accountSchema); 


