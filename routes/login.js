const express = require('express');
const router = express.Router();

router.get('/', async function(req, res, next) {
  try {
    res.render('login');
  }
  catch (error) {
    next(error)
  }
});


// Database operations for these routes


// Middleware functions ---


// Utility functions ---



module.exports.router = router;