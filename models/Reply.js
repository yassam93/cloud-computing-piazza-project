const mongoose = require('mongoose');

const replySchema = mongoose.Schema({ 
    content: { 
        type: String,
        required: true,
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account', 
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
}, {
    versionKey: false
});

module.exports = mongoose.model('Reply', replySchema); 