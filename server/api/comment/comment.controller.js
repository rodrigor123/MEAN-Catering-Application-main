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
import Comment from './comment.model';
import Offer from '../offer/offer.model';
import User from '../user/user.model';
var Promise = require('bluebird');
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

function saveUpdates(updates) {
  return function(entity) {
    for (let key in updates) {
      entity[key] = updates[key];
      delete updates[key];
    }
    var updated = _.mergeWith(entity, updates);

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

// Gets a list of Comments
export function index(req, res) {
  return Comment.find(req.body).exec()
    .then(respondWithResult(res))
    .catch(handleError(res));
}

export function thread(req, res) {
  let query = { offerId: req.params.id };

  //comment: {
  //  _id,
  //  date,
  //  userId,
  //  offerId //thread
  //  parentId,
  //  name,
  //  text,
  //  profileUrl,
  //  children
  //}

  return Comment.find(query).exec()
     .then(respondWithResult(res))
     .catch(handleError(res));
}

export function newComments(req, res) {
  return Comment.find({$query: req.body, $orderby: { date : -1 }}).exec()
     .then(respondWithResult(res))
     .catch(handleError(res));
}

// Gets a single Thing from the DB
export function show(req, res) {
  return Comment.findById(req.params.id).exec()
    .then(handleEntityNotFound(res))
    .then(respondWithResult(res))
    .catch(handleError(res));
}

// Creates a new Thing in the DB
export function create(req, res) {
  return Comment.create(req.body)
    .then((res) => {
      mailer.notifyComment(res);
      return res;
    })
    .then(respondWithResult(res))
    .catch(handleError(res));
}

// Updates an existing Thing in the DB
export function update(req, res) {
  if (req.body._id) {
    delete req.body._id;
  }

  return Comment.findById(req.params.id).exec()
    .then(handleEntityNotFound(res))
    .then(saveUpdates(req.body))
    .then(respondWithResult(res))
    .catch(handleError(res));
}

//export function addChild(req, res) {
//  //update parent.children
//  //find parent by Id
//  //push
//  //create objectId
//
//  req.body._id = mongoose.Types.ObjectId();
//
//
//  console.log(req.body.parentId);
//
//  return Comment.findById(req.body.parentId).exec()
//    .then(handleEntityNotFound(res))
//    .then((res) => {
//      if (res.children) {
//        res.children.push(req.body);
//      } else {
//        res.children = [req.body];
//      }
//      return res;
//    })
//    .then(saveUpdates(res))
//    .then(respondWithResult(res))
//    .catch(handleError(res));
//}

// Deletes a Thing from the DB
export function destroy(req, res) {
  return Comment.findById(req.params.id).exec()
    .then(handleEntityNotFound(res))
    .then(removeEntity(res))
    .catch(handleError(res));
}
