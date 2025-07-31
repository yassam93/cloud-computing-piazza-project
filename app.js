const express = require("express");
const app = express();
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
require("dotenv/config");

// IMPORT ROUTES AND MODELS 
// authentication route
const authRoute = require('./routes/auth');

const messageRoutes = require('./routes/posts'); 
const categoryRoutes = require('./routes/topic');
// imports  Message model for the expiration timer
const Message = require('./models/Message'); 

app.use(bodyParser.json());

// USE ROUTES
//  authentication route
app.use('/api/v1/accounts', authRoute);

app.use('/api/v1/messages', messageRoutes); 
app.use('/api/v1/categories', categoryRoutes);

// DATABASE CONNECTION
mongoose.connect(process.env.DB_CONNECTOR).then(() => {
  console.log("Database connection has been successful.");
});

// CHECK FOR EXPIRED POSTS 
// This  runs a check every 60 seconds
setInterval(async () => {
  try {
    // Uses the custom function from Message model
    await Message.expireOldMessages(); 
    console.log("Checked for expired messages.");
  } catch (error) {
    console.error("Error checking for expired messages:", error);
  }
}, 60000); //  1 minute

// START THE SERVER
app.listen(3000, () => {
  console.log("Server has set up and is running on the port 3000.");
});
