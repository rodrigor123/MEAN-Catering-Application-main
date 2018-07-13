/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/things              ->  index
 * POST    /api/things              ->  create
 * GET     /api/things/:id          ->  show
 * PUT     /api/things/:id          ->  update
 * DELETE  /api/things/:id          ->  destroy
 */

'use strict';

import _ from 'lodash';
import Event from './event.model';
import Offer from '../offer/offer.model';
import User from '../user/user.model';
var Promise = require('bluebird');
var mailer = require('../mailer/mailer');
var distance = require('google-distance');
var async = require('async');
let config = require('../../config/environment');
let request = require('request-promise');

const BASE_URL = 'https://api.taxcloud.com';
const API_VERSION = '1.0';

function $getEndPoint(endPoint) {
  "use strict";
  return `${BASE_URL}/${API_VERSION}${endPoint}?apiKey=${config.payments.TAXCLOUD.API_KEY}`;
}

const endpoints = {
  verifyAddress: $getEndPoint('/taxcloud/VerifyAddress'),
  lookup: $getEndPoint('/TaxCloud/Lookup')
};

const TAX_CLOUD_CONFIG = {
  apiLoginId: config.payments.TAXCLOUD.API_LOGIN_ID
};

function $getOptions(body) {
  "use strict";
  return Object.assign({}, TAX_CLOUD_CONFIG, body);
}

function respondWithResult(res, statusCode) {
  statusCode = statusCode || 200;
  return function(entity) {
    if (entity) {
      res.status(statusCode).json(entity);
    }
  };
}

function saveUpdates(updates) {
  return function(entity) {
    let isBrandNew = (entity.status == 'draft' && updates.status == 'sent');

    for (let key in updates) {
      entity[key] = updates[key];
      delete updates[key];
    }
    var updated = _.mergeWith(entity, updates);
    // if (updated.showToCaterers && !isBrandNew) mailer.notifyEvent(updated, 'updated');
    if (isBrandNew) mailer.notifyEvent(updated, 'created');
    return updated.save()
      .then(updated => {
        return updated;
      });
  };
}

function removeEntity(res) {
  return function(entity) {
    if (entity) {
      return entity.remove()
        .then(() => {
          res.status(204).end();
        });
    }
  };
}

function handleEntityNotFound(res) {
  return function(entity) {
    if (!entity) {
      res.status(404).end();
      return null;
    }
    return entity;
  };
}

function handleError(res, statusCode) {
  statusCode = statusCode || 500;
  return function(err) {
    res.status(statusCode).send(err);
  };
}

// Gets a list of Events
export function index(req, res) {
  let query = {};
  if (req.body.userId) {
    query = {userId: req.body.userId}
  } else if (req.body.showToCaterers) {
    query = {showToCaterers: req.body.showToCaterers }
  }
  //else if (req.body.showToCaterers && req.body.sentTo) {
  //  query = {showToCaterers: req.body.showToCaterers, selectedCaterers: {$elemMatch: {$eq: req.body.sentTo } } }
  //}

  return Event.find(query).exec()
    .then(respondWithResult(res))
    .catch(handleError(res));
}

// Gets a list of Events for Admin access.
export function adminEvents(req, res) {
  //console.log('req', req.body);
  let query = {},
    eventPromises = [],
    today = new Date(new Date().setHours(0, 0, 0, 0)) /*.toISOString()*/;
  
  query.blocked = { $exists: false };

  //if (!isAdmin) query.date = { $gte: today };
  if (req.body.showFuture) query.date = { $gte: today };
  if (req.body.showPast) query.date = { $lt: today };
  if (req.body.date) {
    if (req.body.paymentList && req.body.date instanceof Object) {
      query.date = {};
      for (let k in req.body.date) {
        if (k === '$lt' || k === '$lte') {
          query.date[k] = new Date(req.body.date[k]).setHours(23, 59, 59, 999);
        } else if (k === '$gt' || k === '$gte') {
          query.date[k] = new Date(req.body.date[k]).setHours(0, 0, 0, 0);
        } else {
          query.date[k] = req.body.date[k];
        }
      }
    } else {
      query.date = req.body.date;
    }
  }

  if (req.body.paymentStatus) query.paymentStatus = req.body.paymentStatus;

  if (req.body.confirmedDate && req.body.createDate && req.body.status) {
    let newExpression = {},
      confirmedExpression = {};

    newExpression.createDate = { $gte: new Date(req.body.createDate)/*.toISOString()*/ };

    confirmedExpression.confirmedDate = { $gte: new Date(req.body.confirmedDate)/*.toISOString()*/ };
    confirmedExpression.status = req.body.status;

    query = { $or: [ _.merge(newExpression, query), _.merge(confirmedExpression, query) ] };
  } else{
    if (req.body.confirmedDate) query.confirmedDate = { $gte: new Date(req.body.confirmedDate)/*.toISOString()*/ };
    if (req.body.createDate) query.createDate = { $gte: new Date(req.body.createDate)/*.toISOString()*/ };
    if (req.body.status) 
      query.status = req.body.status;
    else
      query.$and = [ { status: { $ne: 'completed' } }, { status: { $ne: 'cancelled' } } ];
  }

// console.log(query);
  return Event.find(query).exec().then((events) => {
      // console.log('events', events);

    events.forEach((event, i) => {
      events[i] = events[i].toObject();

      let adminQuery = {eventId: '' + event._id};
      // let adminQuery = {eventId: '' + event._id, status: {$nin: ['completed', 'cancelled']}};

      eventPromises.push(Offer.find(adminQuery).exec().then((offers) => {
        events[i].offers = offers;
        //if (isAdmin) events[i].offer = offers[0];
        return events[i];
      }));      
    });

    return Promise.all(eventPromises).then(() => {
      //return filterWithOffers ? events.filter(event => event.offers.length > 0) : events;
      return events;
    })
    .then(respondWithResult(res))
    .catch(handleError(res));

  });

  // return Event.find({ $and: [{status: { $ne: 'completed'}}, {status: { $ne: 'cancelled' }}]}).exec()
  //   .then(respondWithResult(res))
  //   .catch(handleError(res));
}

export function dataset(req, res) {
  // console.log('req', req.body);
  let query = {},
    isUser = (req.body.userId ? true : false),
    isCaterer = (req.body.catererId ? true : false),
    isAdmin = !isUser && !isCaterer,
    filterWithOffers = isCaterer && checkStatus(req.body.status, 'completed') && checkStatus(req.body.paymentStatus, 'completed'),
    eventPromises = [],
    today = new Date(new Date().setHours(0, 0, 0, 0)) /*.toISOString()*/;

  // console.log('isCaterer', isCaterer);

  if (isUser) {
    query = {
      userId: req.body.userId
    }
    if (!req.body.status) query.status = { $nin: ['cancelled', 'deleted']};
  } else if (isCaterer) {
    query = {
      showToCaterers: req.body.showToCaterers /*, selectedCaterers: {$elemMatch: {$eq: req.body.sentTo } }*/
    }
    /*if (req.body.foodTypes && req.body.foodTypes.length) {
      query.foodTypes = { $in: req.body.foodTypes }
    }
    if (req.body.serviceTypes && req.body.serviceTypes.length) {
      query.serviceTypes = { $in: req.body.serviceTypes }
    }*/

    if (!req.body.status) query.status = { $nin: ['cancelled', 'draft', 'deleted']};
  }

  query.blocked = { $exists: false };

  //if (!isAdmin) query.date = { $gte: today };
  if (req.body.showFuture) query.date = { $gte: today };
  if (req.body.showPast) query.date = { $lt: today };
  if (req.body.date) {
    if (req.body.paymentList && req.body.date instanceof Object) {
      query.date = {};
      for (let k in req.body.date) {
        if (k === '$lt' || k === '$lte') {
          query.date[k] = new Date(req.body.date[k]).setHours(23, 59, 59, 999);
        } else if (k === '$gt' || k === '$gte') {
          query.date[k] = new Date(req.body.date[k]).setHours(0, 0, 0, 0);
        } else {
          query.date[k] = req.body.date[k];
        }
      }
    } else {
      query.date = req.body.date;
    }
  }

  if (req.body.paymentStatus) query.paymentStatus = req.body.paymentStatus;

  if (req.body.confirmedDate && req.body.createDate && req.body.status) {
    let newExpression = {},
      confirmedExpression = {};

    newExpression.createDate = { $gte: new Date(req.body.createDate)/*.toISOString()*/ };

    confirmedExpression.confirmedDate = { $gte: new Date(req.body.confirmedDate)/*.toISOString()*/ };
    confirmedExpression.status = req.body.status;

    query = { $or: [ _.merge(newExpression, query), _.merge(confirmedExpression, query) ] };
  } else {
    if (req.body.confirmedDate) query.confirmedDate = { $gte: new Date(req.body.confirmedDate)/*.toISOString()*/ };
    if (req.body.createDate) query.createDate = { $gte: new Date(req.body.createDate)/*.toISOString()*/ };
    if (req.body.status) query.status = req.body.status;
  }

  if (req.body.datePaid) {
    let date = new Date(req.body.datePaid);
    query.datePaid = date;
  } else if (checkStatus(req.body.status, 'completed') && checkStatus(req.body.paymentStatus, 'completed')) {
    query.datePaid = {
      $exists: true
    }
  }

  // console.log('dataset', query);

  return Event.find(query).exec().then((events) => {
      // console.log('events', events);
    if (isCaterer && !req.body.paymentList) {
      events = _.filter(events, (event) => {
        let catererft = req.body.foodTypes || [],
          catererst = req.body.serviceTypes || [],
          eventft = event.foodTypes || [],
          eventst = event.serviceTypes || [],
          intersectFT = _.intersection(eventft, catererft),
          intersectST = _.intersection(eventst, catererst),
          predicate = false;
        if (!eventft.length && !eventst.length) {
          predicate = true;
        } else if (eventft.length && !eventst.length) {
          predicate = !!(intersectFT.length);
        } else if (!eventft.length && eventst.length) {
          predicate = !!(intersectST.length);
        } else if (eventft.length && eventst.length) {
          predicate = !!(intersectFT.length && intersectST.length);
        }

        return !(
          !req.body.veganOffers && event.vegetarianMeals ||
          event.selectedCaterers.length && _.indexOf(event.selectedCaterers, req.body.catererId) === -1 ||
          !predicate);
      })     
    }

    async.forEachSeries(events, function (event, next) {
      event = event.toObject();      
      let total = { eventId: '' + event._id, status: { $nin: ['cancelled', 'draft']} },
        catererQuery = { eventId: '' + event._id, catererId: req.body.catererId /*, status: {$in: ['confirmed', 'completed', 'sent']}*/ },
        adminQuery = {eventId: '' + event._id, status: {$in: ['confirmed', 'completed']}};

      if (isAdmin) {
          Offer.find(adminQuery).exec().then((offers) => {
            event.offers = offers;
            eventPromises.push(event);
            next();
          });
      } else if (isCaterer) {
        Offer.find(total).exec()
          .then((offersTotal) => {
            event.offersTotal = offersTotal.length;
          })
          .then(() => {
            return User.findById(event.userId).exec();
          })
          .then((user) => {
            if(user)
              event.customer = user.firstname + ' ' + user.lastname;
            else
              event.customer = '';
          })
          .then(() => {
            return Offer.find(catererQuery).exec();
          })
          .then((offers) => {
            event.offers = offers;
            // eventPromises.push(event);
            // next();
            
            let catererAddress = req.body.catererAddress.City + ', ' + req.body.catererAddress.State;
            let eventAddress = event.address.City + ', ' + event.address.State;

            distance.get(
            {
              origin: catererAddress,
              destination: eventAddress,
              units: 'imperial'
            },function(err, data) {
              if (err) return console.log(err);

              var mi = data.distanceValue * 0.00062137;
              event.distance = mi;
              eventPromises.push(event);
              next();
            });
          });
      } else {
        Offer.find(total).exec().then((offers) => {
          event.offers = offers;
          eventPromises.push(event);
          next();
        });
      }
    }, function(err){
      if(err)
        return console.log(err);
      else{
          return Promise.all(eventPromises).then(() => {
            //return filterWithOffers ? events.filter(event => event.offers.length > 0) : events;
             return eventPromises;
          })
          .then(respondWithResult(res))
          .catch(handleError(res));
      }
    })
  });
}

export function payments(req, res) {
  let query = {
    $or:[{"paymentStatus":"hold"},{"paymentStatus": "paid"}],
    userId: req.body.userId
  };

  return Event.find(query).exec().then((events) => {
    let eventPromises = [];

    events.forEach((event, i) => {
      events[i] = events[i].toObject();
      eventPromises.push(Offer.findById(event.offerId).exec()
        .then((offer) => {
          events[i].offer = offer;
          console.log(offer);
          return events[i];
        }));
    });

    return Promise.all(eventPromises).then(() => {
      return events;
    })
    .then(respondWithResult(res))
    .catch(handleError(res));
  })
}

function checkStatus(status, value) {
  return status && (status === value || status.$in instanceof Array && status.$in.indexOf(value) !== -1);
}

// Gets a list of Events
export function filteredList(req, res) {
  return Event.find(req.body).exec()
    .then(respondWithResult(res))
    .catch(handleError(res));
}

// Gets a list of Events
export function getState(req, res) {
  return Event.findById(req.params.id).exec()
    .then(handleEntityNotFound(res))
    .then(respondWithResult({status: res.data.status}))
    .catch(handleError(res));
}

export function isSentTo(req, res) {
  return Event.findById(req.params.id).exec()
    .then(handleEntityNotFound(res))
    .then(respondWithResult({status: res.data.sentTo}))
    .catch(handleError(res));
}

export function isUpdated(req, res) {
  return Event.findById(req.params.id).exec()
    .then(handleEntityNotFound(res))
    .then(respondWithResult({status: res.data.isUpdated}))
    .catch(handleError(res));
}

// Gets a single Thing from the DB
export function show(req, res) {
  return Event.findById(req.params.id).exec()
    .then(handleEntityNotFound(res))
    .then(respondWithResult(res))
    .catch(handleError(res));
}

// Creates a new Thing in the DB
export function create(req, res) {
  return Event.create(req.body)
    .then((res) => {
      if (req.body.showToCaterers) mailer.notifyEvent(req.body, 'created');
      return res;
    })
    .then(respondWithResult(res, 201))
    .catch(handleError(res));
}

// Updates an existing Thing in the DB
export function update(req, res) {
  if (req.body._id) {
    delete req.body._id;
  }

  return Event.findById(req.params.id).exec()
    .then(handleEntityNotFound(res))
    .then(saveUpdates(req.body))
    .then((res) => {
      Offer.find({eventId: ''+req.params.id}).exec()
        .then((offers) => {
          offers.forEach((offer, i) => {
            if(offer.status == 'sent'){

              var total = res.pricePerPerson * res.people;
              if (offer.counter) {
                total = offer.counter * res.people;
              }
              total = +total.toFixed(2);

              var lookupParams = {
                customerId: res.userId,
                destination: res.address,
                origin: res.address,
                cartItems: [
                  {
                    Index: 0,
                    ItemID: res._id,
                    TIC: '00000',
                    Price: total,
                    Qty: 1
                  }
                ],
                deliveredBySeller: true
              }

              request.post(endpoints.lookup, {
                headers: {
                  "accept": "application/json",
                  "content-type": "application/json"
                },
                body: JSON.stringify($getOptions(lookupParams))
              })
              .then((result) => {
                result = JSON.parse(result);
                if (result.ResponseType === 3) {
                  var tax = result.CartItemsResponse[0].TaxAmount;
                }else{
                  var tax = offer.invoice.tax;
                }

                // Add Tip count - Marcin.
                var tip = 0;
                if(res.tip){
                  if(res.tipType == '%'){
                    tip = res.tip/100 * (total + tax);
                  }else if(res.tipType == '$'){
                    tip = res.tip;
                  }            
                }else{
                  tip = 0;
                }

                offer.invoice = {
                  pricePerPerson: res.pricePerPerson,
                  people: res.people,
                  counter: offer.counter || 0,
                  service: total,
                  tax: tax,
                  tip: tip,
                  total: total + tax + tip
                };

                Offer.update({_id: offer._id}, {invoice: offer.invoice}).exec();

              })            
            }
          })
        })

      return res;
    })
    .then(respondWithResult(res))
    .catch(handleError(res));
}

// Updates an existing Thing in the DB
export function deleteEvent(req, res) {
  if (req.body._id) {
    delete req.body._id;
  }

  return Event.findById(req.params.id).exec()
    .then(handleEntityNotFound(res))
    .then(saveUpdates({ status: 'deleted' }))
    .then((res) => {
      return res;
    })
    .then(respondWithResult(res))
    .catch(handleError(res));
}

// Deletes a Thing from the DB
export function destroy(req, res) {
  return Event.findById(req.params.id).exec()
    .then(handleEntityNotFound(res))
    .then(removeEntity(res))
    .catch(handleError(res));
}

