/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/serviceTypes              ->  index
 * POST    /api/serviceTypes              ->  create
 * GET     /api/serviceTypes/:id          ->  show
 * PUT     /api/serviceTypes/:id          ->  update
 * DELETE  /api/serviceTypes/:id          ->  destroy
 */

'use strict';

import _ from 'lodash';
import ServiceType from './serviceType.model';

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
    var updated = _.merge(entity, updates);
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

// Gets a list of ServiceTypes
export function index(req, res) {
  return ServiceType.find().exec()
    .then(respondWithResult(res))
    .catch(handleError(res));
}

// Gets a single ServiceType from the DB
export function show(req, res) {
  return ServiceType.findById(req.params.id).exec()
    .then(handleEntityNotFound(res))
    .then(respondWithResult(res))
    .catch(handleError(res));
}

// Creates a new ServiceType in the DB
export function create(req, res) {
  return ServiceType.create(req.body)
    .then(respondWithResult(res, 201))
    .catch(handleError(res));
}

// Updates an existing ServiceType in the DB
export function update(req, res) {
  if (req.body._id) {
    delete req.body._id;
  }
  return ServiceType.findById(req.params.id).exec()
    .then(handleEntityNotFound(res))
    .then(saveUpdates(req.body))
    .then(respondWithResult(res))
    .catch(handleError(res));
}

// Deletes a ServiceType from the DB
export function destroy(req, res) {
  return ServiceType.findById(req.params.id).exec()
    .then(handleEntityNotFound(res))
    .then(removeEntity(res))
    .catch(handleError(res));
}
