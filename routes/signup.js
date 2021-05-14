const express = require('express');
const router = express.Router();
const {MongoClient} = require('mongodb');

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
    if (!(req.body.username && req.body.password && req.body.confirmPassword)) throw Error("All fields are required.")
    if (req.body.password !== req.body.confirmPassword) throw Error("Passwords must match.")

    // Hash the password


    // Create account
    createUser(req.body.username, req.body.password)

    // Create session


    req.session.flash = {
      status: "success",
      message: "account was successully created"
    }
    res.redirect('/browse')
  }
  catch (error) {
    req.session.flash = {
      status: "error",
      message: error.message
    }
    res.redirect('/signup')
  }
});


// Database operations for these routes
async function createUser(username, password) {
  const client = new MongoClient(process.env.DB_CONNECTION_STRING, {useUnifiedTopology: true});
  try {
    await client.connect();
    const db = await client.db(process.env.DB_DATABASE_NAME);
    const result = await db.collection('AppUsers').insertOne({
        username,
        password,
        sessions: [],
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