// Using Message model
const Message = require('../models/Message');

// Middleware to check if a message has expired before allowing an interaction
const checkMessageStatus = async (req, res, next) => {
    try {
        // Find the message by its ID from the URL parameters
        const message = await Message.findById(req.params.postId); 
        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }

        // Update the status of this specific message in case it just expired
        await Message.expireSingleMessage(req.params.postId);

        // Re-fetch the message to get the most up-to-date status
        const updatedMessage = await Message.findById(req.params.postId);

        // Check if the message's status is now 'expired'
        if (updatedMessage.status === 'expired') {
            return res.status(403).json({ message: 'This message has expired and no longer accepts interactions.' });
        }

        // If the message is still 'live', proceed to the next function
        next();
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = checkMessageStatus;