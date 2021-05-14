const express = require('express');
const router = express.Router();
const {MongoClient, ObjectID} = require('mongodb');
const bcrypt = require('bcryptjs');
const debug = require('debug')('signup');
const {FriendlyError} = require('../customError');

router.get('/', async function(req, res, next) {
  try {
    res.render('signup');
  }
  catch (error) {
    next(error)
  }
});

router.post('/', async function(req, res, next) {
  try {
    // Validate inputs
    if (!(req.body.username && req.body.password && req.body.confirmPassword)) throw new FriendlyError("All fields are required.")
    if (req.body.password !== req.body.confirmPassword) throw new FriendlyError("Passwords must match.")

    // Hash the password
    let passwordHash = await new Promise((resolve, reject) => {
      bcrypt.hash(req.body.password, 10, (err, hash) => {
        if (err) reject(err);
        resolve(hash);
      })
    })   

    // Create account
    const user = await createUserWithSession(req.body.username, passwordHash)

    // Get session Id
    const userSessions = user.ops[0].sessions;
    req.session.sessionId = userSessions[0]._id.id.toString('hex');

    req.session.flash = {
      status: "success",
      message: "account was successully created"
    }
    res.redirect('/browse')
  }
  catch (error) {
    debug(error.message)
    req.session.flash = {
      status: "error",
      message:  error instanceof FriendlyError ? error.message : "Sorry, your request could not be processed."
    }
    res.redirect('/signup')
  }
});


// Database operations for these routes
async function createUserWithSession(username, password) {
  const client = new MongoClient(process.env.DB_CONNECTION_STRING, {useUnifiedTopology: true});
  try {
    await client.connect();
    const db = await client.db(process.env.DB_DATABASE_NAME);
    return await db.collection('AppUsers').insertOne({
        username,
        password,
        sessions: [{
          _id: new ObjectID(),
          expiration: process.env.SESSION_DURATION_MS
        }],
        workouts: [],
    })
}
finally {
    await client.close()
}
}

// Middleware functions ---


// Utility functions ---



module.exports.router = router;