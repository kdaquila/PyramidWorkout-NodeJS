const path = require('path');
const express = require('express');
const cookieSession = require('cookie-session')
const logger = require('morgan');
const debug = require('debug')('app:app')
const {MongoClient, ObjectID} = require('mongodb');
const createError = require('http-errors');
const homeRouter = require('./routes/home').router;
const loginRouter = require('./routes/login').router;
const signupRouter = require('./routes/signup').router;
const browseRouter = require('./routes/browse').router;
const detailRouter = require('./routes/detail').router;
const newWorkoutRouter = require('./routes/newWorkout').router;
const logoutRouter = require('./routes/logout').router;

const app = express();

// setup view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// setup logging
app.use(logger('dev'));

// setup req.body
app.use(express.urlencoded({extended: true}))

// setup req.session
app.use(cookieSession({
  name: "pyramid-session",
  keys: [process.env.COOKIE_SECRET1, process.env.COOKIE_SECRET2, process.env.COOKIE_SECRET3]
}))

// save old flash message
app.use((req, res, next) => {
  res.locals.flash = req.session.flash;
  next();
})

// clear old flash message
app.use((req, res, next) => {
  req.session.flash = null;
  next();
})

// setup res.locals.user
app.use(async (req, res, next) => {
  try {
    const sessionId = req.session.sessionId;
    res.locals.user = null;
    if (!sessionId) return next()
    const user = await findUser(sessionId);
    res.locals.user = user;
    next()
  }
  catch(error) {
    next(error)
  }
})


// setup static routes
app.use('/favicon.ico', (req, res, next) => {
  res.sendFile(path.join(__dirname, 'image', 'favicon.ico'));
});
app.use('/image', (req, res, next) => {
  res.sendFile(path.join(__dirname, 'image', req.url));
});
app.use('/css', (req, res, next) => {
  res.sendFile(path.join(__dirname, 'css', req.url));
});
app.use('/javascript', (req, res, next) => {
  res.sendFile(path.join(__dirname, 'javascript', req.url));
});

app.use(['/home', '/'], homeRouter);
app.use('/login', loginRouter);
app.use('/signup', signupRouter);
app.use('/', requireLogIn)
app.use('/logout', logoutRouter);
app.use('/browse', browseRouter);
app.use('/detail', detailRouter);
app.use('/newWorkout', newWorkoutRouter);

app.use(throwError404);
app.use(defaultErrorHandler)


// Middleware functions ----
function throwError404(req, res, next) {
  next(createError(404));
}

function requireLogIn(req,res,next) {
  if(!res.locals.user) return res.redirect('/login');
  next();
}

// Middleware Error functions ---
function defaultErrorHandler(err, req, res, next) {
  debug(err.message)
  debug(`could not display ${req.url}`)
}

// Database functions ---
async function findUser(sessionId) {
  const client = new MongoClient(process.env.DB_CONNECTION_STRING, { useUnifiedTopology: true });
  try {
    await client.connect();
    const db = await client.db(process.env.DB_DATABASE_NAME);
    const result = await db.collection('AppUsers').findOne({
      'sessions._id': {
        $eq: ObjectID(sessionId),
      }
    })
    return result
  }
  finally {
    await client.close()
  }
}

// Utility functions ---


module.exports = app;