const express = require('express');
const router = express.Router();
const {MongoClient, ObjectID} = require('mongodb');
const bcrypt = require('bcryptjs');
const debug = require('debug')('app:login');

router.get('/', async function(req, res, next) {
  try {
    res.render('login');
  }
  catch (error) {
    next(error)
  }
});

router.post('/', async function(req, res, next) {
  try {
    // Find the user
    const username = req.body.username;
    const user = await findUser(username)
    if (!user) throw Error("Invalid username")

    // Check the password
    const givenPassword = req.body.password;
    const actualPasswordHash = user.PasswordHash    
    const passwordValid = await bcrypt.compare(givenPassword, actualPasswordHash)
    if (!passwordValid) throw Error("Invalid password")

    // Insert new session
    const result = await insertNewSession(username);

    // Get the newly-generated session Id
    const userSessions = result.value.Sessions;
    req.session.sessionId = userSessions[userSessions.length - 1]._id.id.toString('hex');

    res.redirect('browse')
  }
  catch (error) {
    debug(error.message)
    debug(error.stack)
    req.session.flash = {
      status: "error",
      message:  "Sorry, the request failed."
    }
    res.redirect('login')
  }
});


// Database operations for these routes
async function findUser(Username) {
  const client = new MongoClient(process.env.DB_CONNECTION_STRING, { useUnifiedTopology: true });
  try {
    await client.connect();
    const db = await client.db(process.env.DB_DATABASE_NAME);
    return await db.collection('AppUsers').findOne({Username})
  }
  finally {
    await client.close()
  }
}

async function insertNewSession(Username) {
  const client = new MongoClient(process.env.DB_CONNECTION_STRING, { useUnifiedTopology: true });
  try {
    await client.connect();
    const db = await client.db(process.env.DB_DATABASE_NAME);
    return await db.collection('AppUsers').findOneAndUpdate(
      {Username},
      {$push: {
        Sessions: {
          _id: new ObjectID(),
          Expiration: process.env.SESSION_DURATION_MS
        }
      }}, {
       returnOriginal: false 
      }
    )
  }
  finally {
    await client.close()
  }
}

// Middleware functions ---


// Utility functions ---



module.exports.router = router;