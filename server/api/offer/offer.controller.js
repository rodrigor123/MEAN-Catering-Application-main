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
import Offer from './offer.model';
import Event from '../event/event.model';

var mongoose = require('mongoose');
var  mailer = require('../mailer/mailer');

function respondWithResult(res, statusCode) {
  statusCode = statusCode || 200;
  return function(entity) {
    if (entity) {
      res.status(statusCode).json(entity);
    }
  };
}

function saveEventUpdates(eventUpdates) {
  return function(entity) {
      for (let key in eventUpdates) {
        entity[key] = eventUpdates[key];
        delete eventUpdates[key];
      }
      var updated = _.mergeWith(entity, eventUpdates);

      return updated.save()
          .then(updated => {
          return updated;
      });
  };
}

function saveUpdates(updates) {
  return function(entity) {
    for (let key in updates) {
      entity[key] = updates[key];
      delete updates[key];
    }
    var updated = _.mergeWith(entity, updates);

    //mailer.notifyOffer(updated, 'updated');

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
  let query = {
    eventId: req.body.eventId,
    status: { $nin: ['cancelled', 'draft']}
  };
  if (req.body.catererId) {
    query.catererId = req.body.catererId
  }

  return Offer.find(query).exec()
    .then(respondWithResult(res))
    .catch(handleError(res));
}

export function filteredList(req, res) {
  return Offer.find(req.body).exec()
    .then(respondWithResult(res))
    .catch(handleError(res));
}

// Gets a list of Events
export function getState(req, res) {
  return Offer.findById(req.params.id).exec()
    .then(handleEntityNotFound(res))
    .then(respondWithResult({status: res.data.status}))
    .catch(handleError(res));
}

export function isUpdated(req, res) {
  return Offer.findById(req.params.id).exec()
    .then(handleEntityNotFound(res))
    .then(respondWithResult({status: res.data.isUpdated}))
    .catch(handleError(res));
}

// Gets a single Offer from the DB
export function show(req, res) {
  return Offer.findById(req.params.id).exec()
    .then(handleEntityNotFound(res))
    .then(respondWithResult(res))
    .catch(handleError(res));
}

export function total(req, res) {
  return Offer.find({eventId: req.body.eventId, status: { $nin: ['draft', 'cancelled']}}).exec()
    .then(handleEntityNotFound(res))
    .then((res) => {
      return { total: res.length }
    })
    .then(respondWithResult(res))
    .catch(handleError(res));
}

// Creates a new Thing in the DB
export function create(req, res) {
  if (req.body.invoice) {
    req.body.invoice._id = mongoose.Types.ObjectId();
  }
  return Offer.create(req.body)
    .then((res) => {
      if (req.body.status !== 'draft') mailer.notifyOffer(res, 'created');
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
  if (req.body.invoice && !req.body.invoice._id) req.body.invoice._id = mongoose.Types.ObjectId();
  if (req.body.eventId && (req.body.status == 'accepted' || req.body.status == 'confirmed' || req.body.status == 'cancelled')) {

    let eventUpdates = {status: req.body.status};
    if (eventUpdates.status == 'confirmed') {
      eventUpdates.confirmedBy = req.body.userId;
      eventUpdates.confirmedDate = req.body.confirmedDate;
    }

    if (req.body.status == 'accepted') {
      eventUpdates.acceptedDate = req.body.acceptedDate;
    }

    if (eventUpdates.status == 'cancelled') {
      eventUpdates.status = 'sent';
      eventUpdates.acceptedDate = null;
    }

    Event.findById(req.body.eventId).exec()
      .then(saveEventUpdates(eventUpdates));
  }
  return Offer.findById(req.params.id).exec()
    .then(handleEntityNotFound(res))
    .then((res) => {
      if (req.body.status == 'accepted' && res.status !== 'accepted') {
        mailer.notifyOfferAccepted(res, 'accepted');
      }
      if (req.body.status == 'confirmed' && res.status !== 'confirmed') {
        mailer.notifyOffer(res, 'confirmed');
      }
      return res;
    })
    .then(saveUpdates(req.body))
    .then(respondWithResult(res))
    .catch(handleError(res));
}

export function cancelAll(req, res) {
  return Offer.update(req.body, { status: 'cancelled' }, { multi: true }).exec()
    .then((res) => {
      mailer.notifyOffer(updated, 'cancelled');
      respondWithResult(res);
    })
    .catch(handleError(res));
}

// Deletes a Thing from the DB
export function destroy(req, res) {
  return Offer.findById(req.params.id).exec()
    .then(handleEntityNotFound(res))
    .then(removeEntity(res))
    .catch(handleError(res));
}
