const path = require('path');
const express = require('express');
const logger = require('morgan');
const createError = require('http-errors');
const homeRouter = require('./routes/home').router;

const app = express();

// setup view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// setup logging
app.use(logger('dev'));

// setup route to the public folder
app.use('/image', (req, res, next) => {
  res.sendFile(path.join(__dirname, 'image', req.url));
});
app.use('/css', (req, res, next) => {
  res.sendFile(path.join(__dirname, 'css', req.url));
});
app.use('/javascript', (req, res, next) => {
  res.sendFile(path.join(__dirname, 'javascript', req.url));
});

app.use('/', homeRouter);

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