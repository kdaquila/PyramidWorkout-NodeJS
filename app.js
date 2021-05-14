const path = require('path');
const express = require('express');
const cookieSession = require('cookie-session')
const logger = require('morgan');
const createError = require('http-errors');
const homeRouter = require('./routes/home').router;
const loginRouter = require('./routes/login').router;
const signupRouter = require('./routes/signup').router;
const emailVerifyRouter = require('./routes/emailVerify').router;
const forgotPasswordRouter = require('./routes/forgotPassword').router;
const browseRouter = require('./routes/browse').router;
const detailRouter = require('./routes/detail').router;
const newWorkoutRouter = require('./routes/newWorkout').router;
const accountRouter = require('./routes/account').router;

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

// setup static routes
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
app.use('/emailVerify', emailVerifyRouter);
app.use('/forgotPassword', forgotPasswordRouter);
app.use('/browse', browseRouter);
app.use('/detail', detailRouter);
app.use('/newWorkout', newWorkoutRouter);
app.use('/account', accountRouter);

app.use(throwError404);
app.use(defaultErrorHandler)


// Middleware functions ----
function throwError404(req, res, next) {
  next(createError(404));
}

// Middleware Error functions ---
function defaultErrorHandler(err, req, res, next) {
  console.log(`could not display ${req.url}`)
}

// Database functions ---


// Utility functions ---


module.exports = app;