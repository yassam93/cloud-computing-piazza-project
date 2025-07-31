const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    categories: { 
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }], 
      required: true,
    },
    content: { 
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 10 * 60 * 1000), 
    },
    status: {
      type: String,
      enum: ["live", "expired"],
      default: "live",
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account", 
      required: true,
    },
    replies: { 
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Reply" }], 
      default: [],
    },
    likes: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Account" }], 
    },
    dislikes: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Account" }], 
      default: [],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Custom method to check if a message is expired
messageSchema.methods.isExpired = function () {
  return new Date() > this.expiresAt;
};

// Custom static function to update all expired messages
messageSchema.statics.expireOldMessages = async function () { 
  const now = new Date();
  return this.updateMany(
    { status: "live", expiresAt: { $lt: now } },
    { $set: { status: "expired" } }
  );
};

// Custom static function to update a single expired message
messageSchema.statics.expireSingleMessage = async function (messageId) { 
  const now = new Date();
  return this.updateOne(
    { _id: messageId, status: "live", expiresAt: { $lt: now } },
    { $set: { status: "expired" } }
  );
};

module.exports = mongoose.model("Message", messageSchema); 