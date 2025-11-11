require('dotenv').config();
const cors = require('cors');
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

// initialize DB (Sequelize) before routes that use models
const { sequelize } = require('./models');

const apiRoutes = require('./routes/api');
const adminRoutes = require('./routes/admin');

var app = express();
app.use(cors());

// view engine setup (keep if you use admin views)
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api', apiRoutes);
app.use('/api/admin', adminRoutes);

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