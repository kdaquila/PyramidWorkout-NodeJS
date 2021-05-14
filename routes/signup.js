const express = require('express');
const router = express.Router();

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

    // Create account

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


// Middleware functions ---


// Utility functions ---



module.exports.router = router;