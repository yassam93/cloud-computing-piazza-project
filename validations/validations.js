
const Joi = require('joi');

// Validator for new account registration
const validateNewAccount = (data) => {
    const registrationSchema = Joi.object({
        username: Joi.string().min(3).max(256).required(),
        email: Joi.string().min(6).max(256).required().email(),
        password: Joi.string().min(6).max(1024).required()
    });
    return registrationSchema.validate(data);
};

// Validator for account login
const validateLogin = (data) => {
    const loginSchema = Joi.object({
        email: Joi.string().min(6).max(256).required().email(),
        password: Joi.string().min(6).max(1024).required()
    });
    return loginSchema.validate(data);
};

// Validator for new message creation
const validateNewMessage = (data) => {
    const messageSchema = Joi.object({
        title: Joi.string().min(3).max(256).required(),
        categories: Joi.array().items(Joi.string().length(24)).min(1).required(), // Checks for valid MongoDB IDs
        content: Joi.string().min(3).required()
    });
    return messageSchema.validate(data);
};

// Validator for new reply creation
const validateNewReply = (data) => {
    const replySchema = Joi.object({
        content: Joi.string().min(1).required()
    });
    return replySchema.validate(data);
};

module.exports.validateNewAccount = validateNewAccount;
module.exports.validateLogin = validateLogin;
module.exports.validateNewMessage = validateNewMessage;
module.exports.validateNewReply = validateNewReply;
