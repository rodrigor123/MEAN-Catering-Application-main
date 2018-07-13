/**
 * Main application file
 */

'use strict';

import express from 'express';
import mongoose from 'mongoose';
import async from 'async';
mongoose.Promise = require('bluebird');
import config from './config/environment';
import http from 'http';

var bodyParser = require("body-parser");
var mailer = require('./api/mailer/mailer');
var schedule = require('node-schedule');
var fs = require('fs');
var https = require('https');
var NodeSession = require('node-session');

// init
var session = new NodeSession({
  secret: 'Q3UBzdH9GEfiRCTKbi5MTPyChpzXLsTD',
  'driver': 'database',
  'lifetime': 24 * 60 * 60 * 1000
});

const stripeController = require('./api/payments/stripe.controller');

var rule = new schedule.RecurrenceRule();
rule.minute = 0;
rule.hour = 23;

// Connect to MongoDB
mongoose.connect(config.mongo.uri, config.mongo.options);
mongoose.connection.on('error', function(err) {
  console.error('MongoDB connection error: ' + err);
  process.exit(-1);
});

// Populate databases with sample data
if (config.seedDB) { require('./config/seed'); }

// Setup server
var privateKey  = fs.readFileSync('ninja-prod.key');
var certificate = fs.readFileSync('app_cateringninja_com.crt');
var credentials = {key: privateKey, cert: certificate};
var app = express();

app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));

 if(config.env == 'development'){
   var server = http.createServer(app);
 }else if( config.env == 'production'){
   var server = https.createServer(credentials, app);
 }
//var server = https.createServer(credentials, app);

var socketio = require('socket.io')(server, {
  serveClient: config.env !== 'production',
  path: '/socket.io-client'
});
require('./config/socketio').default(socketio);
require('./config/express').default(app);
require('./routes').default(app);

var j = schedule.scheduleJob(rule, function(){
  mailer.report();
});

// Changed time of job running here
var paymentJobs = schedule.scheduleJob('*/5 * * * *', function() {

  var moment = +Date.now();
  var next72h = new Date(moment + 72 * 60 * 60 * 1000);
  var next24h = new Date(moment + 24 * 60 * 60 * 1000);
  var promises = [];
  var $events = null;

  console.log('job started', moment);

  promises.push(mongoose.model('Event').find({
    status: 'confirmed',
    paymentStatus: {
      $nin: ['hold', 'paid']
    },
    date: {
      $lte: next72h
    }
  }).then(function(events) {
    // console.log('Auth', events);
    return events.map(event => {
      return mongoose.model('Offer').find({
        status: 'confirmed',
        eventId: event._id
      }).then(function(offers) {
        return offers.map(offer => stripeController.$auth(offer._id).then(response => console.log('JOB', response)));
      });
    })
  }));
  promises.push(mongoose.model('Event').find({
    status: 'confirmed',
    paymentStatus: {
      $in: ['hold']
    },
    date: {
      $lte: next24h
    }
  })
  .then(function(events) {
    console.log('Capture', events);
    $events = events;
    let eventPromises = events.map((event) => {
      // event.blocked = true;
      return event.save();
    });
    return Promise.all(eventPromises);
  })
  .then(function() {
    let offerPromises = $events.map(event => {
      console.log('block by job', event.name, event.blocked);
      return mongoose.model('Offer').find({
        status: 'confirmed',
        eventId: event._id
      }).then(function(offers) {
        return offers.map(offer => stripeController.$capture(offer._id).then(response => console.log('JOB2', response)));
      });
    });
    return Promise.all(offerPromises);
  }));
  return Promise.all(promises);
});

function startServer() {
  // start session for an http request - response
  // this will define a session property to the request object
  // session.startSession(req, res, callback);

  app.angularFullstack = server.listen(config.port, config.ip, function() {
    console.log('Express server listening on %d, in %s mode', config.port, app.get('env'));
  });
}

setImmediate(startServer);

// Expose app
exports = module.exports = app;
