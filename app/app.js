var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var session = require('express-session');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

import { serverApi, uploadSetting } from './services'
import api from './routes';

/**
 * load settings
 */
uploadSetting.loadConfig();

var app = express();

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
//app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use('/', express.static(path.join(__dirname, '..', 'src', 'app')));
app.use('/dist', express.static(path.join(__dirname, '..', 'src', 'dist')));
app.use('/lib', express.static(path.join(__dirname, '..', 'src', 'lib')));
app.use('/assets', express.static(path.join(__dirname, '..', 'src', 'assets')));
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: true }
}));
app.use((req, res, next) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST,GET,OPTIONS');
  res.set('Access-Control-Allow-Headers', 'origin, content-type, accept');
  next();
});
app.use((req, res, next) => {
  if(req.params.token){
    serverApi.setAuthToken(req.params.token);
  }
  else if(req.body.token) {
    serverApi.setAuthToken(req.body.token);
  }
  next();
});
app.use(api);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.json({
    stack: err.stack,
    message: err.message,
    error: {}
  });
});


module.exports = app;
