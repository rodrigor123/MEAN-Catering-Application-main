/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/foodTypes              ->  index
 * POST    /api/foodTypes              ->  create
 * GET     /api/foodTypes/:id          ->  show
 * PUT     /api/foodTypes/:id          ->  update
 * DELETE  /api/foodTypes/:id          ->  destroy
 */

'use strict';

import _ from 'lodash';
import FoodType from './foodType.model';

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

// Gets a list of FoodTypes
export function index(req, res) {
  return FoodType.find().exec()
    .then(respondWithResult(res))
    .catch(handleError(res));
}

// Gets a single FoodType from the DB
export function show(req, res) {
  return FoodType.findById(req.params.id).exec()
    .then(handleEntityNotFound(res))
    .then(respondWithResult(res))
    .catch(handleError(res));
}

// Creates a new FoodType in the DB
export function create(req, res) {
  return FoodType.create(req.body)
    .then(respondWithResult(res, 201))
    .catch(handleError(res));
}

// Updates an existing FoodType in the DB
export function update(req, res) {
  if (req.body._id) {
    delete req.body._id;
  }
  return FoodType.findById(req.params.id).exec()
    .then(handleEntityNotFound(res))
    .then(saveUpdates(req.body))
    .then(respondWithResult(res))
    .catch(handleError(res));
}

// Deletes a FoodType from the DB
export function destroy(req, res) {
  return FoodType.findById(req.params.id).exec()
    .then(handleEntityNotFound(res))
    .then(removeEntity(res))
    .catch(handleError(res));
}
