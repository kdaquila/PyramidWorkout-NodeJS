const express = require('express');
const router = express.Router();
const {MongoClient, ObjectID} = require('mongodb');
const bcrypt = require('bcryptjs');
const debug = require('debug')('app:signup');
const validator = require('validator');

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
    let username = req.body.username
    let password = req.body.password
    
    // Validate username
    if (!username) throw Error("Missing username")
    username = validator.stripLow(validator.trim(username))
    if (username.length < 5) throw Error("Username is too short")

    // Validate password
    if (!password) throw Error("Missing password")
    password = validator.stripLow(validator.trim(password))
    if (password.length < 5) throw Error("Password is too short")   

    // Hash the password
    let passwordHash = await new Promise((resolve, reject) => {
      bcrypt.hash(req.body.password, 10, (err, hash) => {
        if (err) reject(err);
        resolve(hash);
      })
    })   

    // Create account
    const user = await createUserWithSession(req.body.username, passwordHash)

    // Get the auto-generated session Id
    const userSessions = user.ops[0].Sessions;
    req.session.sessionId = userSessions[0]._id.id.toString('hex');

    req.session.flash = {
      status: "success",
      message: "Success, your account was successully created!"
    }
    res.redirect('/browse')
  }
  catch (error) {
    debug(error.message)
    debug(error.stack)
    req.session.flash = {
      status: "error",
      message:  "Sorry, the request failed."
    }
    res.redirect('/signup')
  }
});


// Database operations for these routes
async function createUserWithSession(Username, PasswordHash) {
  const client = new MongoClient(process.env.DB_CONNECTION_STRING, { useUnifiedTopology: true });
  try {
    await client.connect();
    const db = await client.db(process.env.DB_DATABASE_NAME);
    return await db.collection('AppUsers').insertOne({
      Username,
      PasswordHash,
      Sessions: [{
        _id: new ObjectID(),
        Expiration: Number(process.env.SESSION_DURATION_MS)
      }],
      Workouts: [],
    })
  }
  finally {
    await client.close()
  }
}

// Middleware functions ---


// Utility functions ---



module.exports.router = router;