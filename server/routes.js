/**
 * Main application routes
 */

'use strict';

import errors from './components/errors';
import path from 'path';

var bodyParser = require("body-parser");

export default function(app) {

  app.use(bodyParser.json({limit: '50mb'}));
  app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));


  app.use('/api/things', require('./api/thing'));
  app.use('/api/events', require('./api/event'));
  app.use('/api/offers', require('./api/offer'));
  app.use('/api/users', require('./api/user'));
  app.use('/api/foodTypes', require('./api/foodType'));
  app.use('/api/serviceTypes', require('./api/serviceType'));
  app.use('/api/templates', require('./api/template'));
  app.use('/api/includedInPrice', require('./api/includedInPrice'));
  app.use('/api/payments', require('./api/payments'));
  app.use('/api/comments', require('./api/comment'));
  // app.use('/api/histories', require('./api/history'));

  app.use('/auth', require('./auth').default);

  app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  });
  
  // All undefined asset or api routes should return a 404
  app.route('/:url(api|auth|components|app)/*')
    .get(errors[404]);

  // All other routes should redirect to the index.html
  app.route('/*')
    .get((req, res) => {
      res.sendFile(path.resolve(app.get('appPath') + '/index.html'));
  });

}
