var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
require('dotenv').config();

// initialize DB (Sequelize) before routes that use models
const { sequelize } = require('./models');

var apiRouter = require('./routes/api');
var adminRouter = require('./routes/admin');

var app = express();

// view engine setup (keep if you use admin views)
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Mount separate route groups
// API routes (mobile/web frontend APIs) namespace: /api/**
app.use('/api', apiRouter);

// Admin app routes (server-rendered admin UI or admin API) namespace: /admin/**
app.use('/admin', adminRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler (keep JSON for API requests)
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // If the request is to /api, return JSON
  if (req.path.startsWith('/api/')) {
    res.status(err.status || 500);
    return res.json({ success: false, message: err.message });
  }

  // render the error page for web/admin views
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;