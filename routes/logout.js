const express = require('express');
const router = express.Router();
const {MongoClient, ObjectID} = require('mongodb');
const debug = require('debug')('app:logout');

router.post('/', async function(req, res, next) {
  try {
    if (!res.locals.user) throw Error("Cannot logout, because not logged in.")

    // Delete all of users's sessions on server
    const username = res.locals.user.Username;
    await deleteSessions(username)

    // Delete user's session cookie
    req.session.sessionId = "";

    req.session.flash = {
      status: "success",
      message: "Success, you are logged out!"
    }
    res.redirect('home')
  }
  catch (error) {
    debug(error.message)
    debug(error.stack)
    req.session.flash = {
      status: "error",
      message:  "Sorry, the request to logout failed."
    }
    res.redirect('home')
  }
});


// Database operations for these routes
async function deleteSessions(Username) {
  const client = new MongoClient(process.env.DB_CONNECTION_STRING, { useUnifiedTopology: true });
  try {
    await client.connect();
    const db = await client.db(process.env.DB_DATABASE_NAME);
    return await db.collection('AppUsers').updateOne(
      {Username},
      {$set: {
        Sessions: []
      }}
    )
  }
  finally {
    await client.close()
  }
}

// Middleware functions ---


// Utility functions ---



module.exports.router = router;