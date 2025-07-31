const express = require('express');
const router = express.Router();

const protectRoute = require('../middleware/verify-token');
const checkMessageStatus = require('../middleware/post-status-check');
const Message = require('../models/Message');
const Account = require('../models/UserAccount');
const Category = require('../models/Category');
const Reply = require('../models/Reply');

const { validateNewMessage, validateNewReply } = require('../validations/validations');

// Helper function to calculate and add time left to a message
const calculateTimeRemaining = (message) => {
    const timeLeft = message.expiresAt - new Date();
    return {
        ...message.toObject(),
        timeLeftMs: Math.max(0, timeLeft),
        timeLeftHuman: timeLeft > 0 ?
            `${Math.floor(timeLeft / (1000 * 60))} minutes remaining` :
            'Expired'
    };
};

// GET all messages
router.get('/', protectRoute, async (req, res) => {
    try {
        const messages = await Message.find().limit(20)
            .populate('author', '_id username')
            .populate('categories', 'name') 
            .populate('likes', '_id username')
            .populate('dislikes', '_id username')
            .populate({
                path: 'replies', 
                populate: {
                    path: 'author',
                    select: '_id username'
                }
            });
        const messagesWithTime = messages.map(msg => calculateTimeRemaining(msg));
        res.json(messagesWithTime);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET a specific message by ID
router.get('/:messageId', protectRoute, async (req, res) => {
    try {
        const message = await Message.findById(req.params.messageId)
            .populate('author', '_id username')
            .populate('categories', 'name')
            .populate('likes', '_id username')
            .populate('dislikes', '_id username')
            .populate({
                path: 'replies',
                populate: {
                    path: 'author',
                    select: '_id username'
                }
            });
        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }
        res.json(calculateTimeRemaining(message));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST a new message
router.post('/', protectRoute, async (req, res) => {
    try {
        const { error } = validateNewMessage(req.body);
        if (error) return res.status(400).json({ message: error.details[0].message });

        const validCategories = await Category.find({ _id: { $in: req.body.categories } });
        if (validCategories.length !== req.body.categories.length) {
            return res.status(400).json({ message: 'One or more categories are invalid' });
        }

        const message = new Message({
            title: req.body.title,
            categories: req.body.categories,
            content: req.body.content,
            author: req.user._id,
        });
        const savedMessage = await message.save();
        res.status(201).json(calculateTimeRemaining(savedMessage));
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// POST a new reply to a message
router.post('/:postId/reply', [protectRoute, checkMessageStatus], async (req, res) => {
    try {
        const { error } = validateNewReply(req.body);
        if (error) return res.status(400).json({ message: error.details[0].message });

        const message = await Message.findById(req.params.postId);
        const reply = new Reply({
            content: req.body.content,
            author: req.user._id
        });
        const savedReply = await reply.save();
        message.replies.push(savedReply._id);
        await message.save();

        const updatedMessage = await Message.findById(message._id)
            .populate('author', '_id username')
            .populate('categories', 'name')
            .populate('likes', '_id username')
            .populate('dislikes', '_id username')
            .populate({
                path: 'replies',
                populate: {
                    path: 'author',
                    select: '_id username'
                }
            });
        res.json(calculateTimeRemaining(updatedMessage));
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// PATCH to like a message
router.patch('/:postId/like', [protectRoute, checkMessageStatus], async (req, res) => {
    try {
        const message = await Message.findById(req.params.postId);
        const userId = req.user._id;

        if (message.author.toString() === userId.toString()) {
            return res.status(403).json({ message: "You cannot like your own message" });
        }

        message.dislikes = message.dislikes.filter(id => id.toString() !== userId.toString());

        if (message.likes.includes(userId)) {
            message.likes = message.likes.filter(id => id.toString() !== userId.toString());
        } else {
            message.likes.push(userId);
        }
        const updatedMessage = await message.save();
        const populatedMessage = await Message.findById(updatedMessage._id).populate('likes', '_id username').populate('dislikes', '_id username');
        res.json(calculateTimeRemaining(populatedMessage));
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// PATCH to dislike a message
router.patch('/:postId/dislike', [protectRoute, checkMessageStatus], async (req, res) => {
    try {
        const message = await Message.findById(req.params.postId);
        const userId = req.user._id;

        if (message.author.toString() === userId.toString()) {
            return res.status(403).json({ message: "You cannot dislike your own message" });
        }

        message.likes = message.likes.filter(id => id.toString() !== userId.toString());

        if (message.dislikes.includes(userId)) {
            message.dislikes = message.dislikes.filter(id => id.toString() !== userId.toString());
        } else {
            message.dislikes.push(userId);
        }
        const updatedMessage = await message.save();
        const populatedMessage = await Message.findById(updatedMessage._id).populate('likes', '_id username').populate('dislikes', '_id username');
        res.json(calculateTimeRemaining(populatedMessage));
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// GET messages by category ID
router.get('/categories/:categoryId', protectRoute, async (req, res) => {
    try {
        const { status } = req.query;
        const query = { categories: req.params.categoryId };
        if (status && ['live', 'expired'].includes(status)) {
            query.status = status;
        }
        const messages = await Message.find(query).populate('author', '_id username').populate('categories', 'name');
        const messagesWithTime = messages.map(msg => calculateTimeRemaining(msg));
        res.json(messagesWithTime);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET most active message by category
router.get('/categories/:categoryId/active', protectRoute, async (req, res) => {
    try {
        const messages = await Message.find({ categories: req.params.categoryId });
        if (messages.length === 0) {
            return res.status(404).json({ message: 'No messages found for this category' });
        }
        const messagesWithEngagement = messages.map(message => ({
            ...message.toObject(),
            engagementScore: message.likes.length + message.dislikes.length + message.replies.length,
        }));
        const mostActiveMessage = messagesWithEngagement.reduce((prev, current) =>
            (prev.engagementScore > current.engagementScore) ? prev : current
        );
        res.json(calculateTimeRemaining(mostActiveMessage));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET history of expired messages by category
router.get('/categories/:categoryId/history', protectRoute, async (req, res) => {
    try {
        const expiredMessages = await Message.find({
            categories: req.params.categoryId,
            status: 'expired'
        }).populate('author', '_id username').populate('likes', '_id username').populate('dislikes', '_id username');
        res.json(expiredMessages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;