'use strict';

import User from './user.model';
import passport from 'passport';
import config from '../../config/environment';
import jwt from 'jsonwebtoken';
import _ from 'lodash';
import TempUser from '../tempUser/tempUser.model';
var fs = require('fs');
var  mailer = require('../mailer/mailer');
var ActiveCampaign = require('activecampaign');

var ac = new ActiveCampaign(config.activeCampaign.domain, config.activeCampaign.api_key);
ac.debug = true;

var tempPass = 'ninja123';

function validationError(res, statusCode) {
  statusCode = statusCode || 422;
  return function(err) {
    res.status(statusCode).json(err);
  }
}

function handleError(res, statusCode) {
  statusCode = statusCode || 500;
  return function(err) {
    res.status(statusCode).send(err);
  };
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
    for (let key in updates) {
      entity[key] = updates[key];
      delete updates[key];
    }
    var updated = _.mergeWith(entity, updates);
    return updated.save().then(updated => {
        return updated;
    });
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

/**
 * Get list of users
 * restriction: 'admin'
 */
export function index(req, res) {
  return User.find({ status: { $nin: ['pending', 'deleted'] } }, '-salt -password -provider').exec()
    .then(users => {
      res.status(200).json(users);
    })
    .catch(handleError(res));
}

export function caterers(req, res) {
  //console.log('cc', req);
  return User.find({role: 'caterer', status: { $nin: ['pending', 'deleted'] } }, '-salt -password -provider').exec()
    .then(users => {
      res.status(200).json(users);
    })
    .catch(handleError(res));
}

/**
 * Creates a new user
 */
export function create(req, res, next) {
  var newUser = new User(req.body);
  newUser.provider = 'local';
  //newUser.role = 'user';
  newUser.save()
    .then(function(user) {
      var token = jwt.sign({ _id: user._id }, config.secrets.session, {
        expiresIn: 60 * 60 * 5
      });
      res.json({ token });
    })
    .catch(validationError(res));
}

/**
 * Creates a temp user
 */
export function createTemp(req, res, next) {
  var newUser = new TempUser(req.body);
  newUser.provider = 'local';
  //newUser.role = 'user';
  newUser.save()
    .then((user) => {
      mailer.verifyUser(user);
      res.status(200).end();
    })
    .catch(validationError(res));
}

  /**
 * Verifies a temp user
 */
export function verify(req, res, next) {
  return TempUser.findById(req.params.id).exec()
    .then((tempUser) => {
      let tu = tempUser.toObject();
      delete tu._id;
      return tu;
    })
    .then((tu) => {
      let newUser = new User(tu);
      return newUser.save();
    })
    .then((user) => {
      if (!user || user.status == 'deleted') {
        return res.status(401).end();
      } else {
        TempUser.findByIdAndRemove(req.params.id).exec();
        let token = jwt.sign({ _id: user._id }, config.secrets.session, {
            expiresIn: 60 * 60 * 5
          });

        if(user.role == 'user') {
          var contact = {
            "email": user.email,
            "first_name": user.firstname,
            "last_name": user.lastname,
            "p[${config.activeCampaign.user_group}]": config.activeCampaign.user_group,
            "status[${config.activeCampaign.user_group}]": "1"
          }
          var contact_add = ac.api("contact/add", contact);
          contact_add.then(function(result){
            console.log(result);
          });
        } else if (user.role == 'caterer') {
          var contact = {
            "email": user.email,
            "first_name": user.firstname,
            "last_name": user.lastname,
            "p[${config.activeCampaign.catering_group}]": config.activeCampaign.catering_group,
            "status[${config.activeCampaign.catering_group}]": "1"
          }
          var contact_add = ac.api("contact/add", contact);
          contact_add.then(function(result){
            console.log(result);
          });
        }

        return res.status(200).json({token});
      }
    });
}

/**
 * Updates user
 */
export function update(req, res) {  
  if (req.body._id) {
    delete req.body._id;
  }

  // if(!req.body.password)
  //   req.body.password = tempPass;

  return User.findById(req.params.id).exec()
    .then(handleEntityNotFound(res))
    .then(saveUpdates(req.body))
    .then(respondWithResult(res))
    .catch(handleError(res));
}

/**
 * Delete user
 */
export function deleteUser(req, res) {
  if (req.body._id) {
    delete req.body._id;
  }
  return User.findById(req.params.id).exec()
    .then(handleEntityNotFound(res))
    .then(saveUpdates({status: 'deleted'}))
    .then(respondWithResult(res))
    .catch(handleError(res));
}
/**
 * Get a single user
 */
export function show(req, res, next) {
  var userId = req.params.id;

  return User.findById(userId).exec()
    .then(user => {
      if (!user || user.status == 'deleted') {
        return res.status(404).end();
      }
      res.json(user.profile);
    })
    .catch(err => next(err));
}

/**
 * Deletes a user
 * restriction: 'admin'
 */
export function destroy(req, res) {
  return User.findByIdAndRemove(req.params.id).exec()
    .then(function() {
      res.status(204).end();
    })
    .catch(handleError(res));
}

/**
 * Change a users password
 */
export function changePassword(req, res, next) {
  var userId = req.user._id;
  var oldPass = String(req.body.oldPassword);
  var newPass = String(req.body.newPassword);

  return User.findById(userId).exec()
    .then(user => {
      if (user.authenticate(oldPass)) {
        user.password = newPass;
        return user.save()
          .then(() => {
            res.status(204).end();
          })
          .catch(validationError(res));
      } else {
        return res.status(403).end();
      }
    });
}

/**
 * Change a users password
 */
export function reset(req, res, next) {
  return User.findOne({email: req.body.email}).exec()
    .then((user) => {
      let pwd = _.split(user._id);
      user.password = _.shuffle(pwd);
      mailer.reset(user);
      return user.save();
    })
    .then((user) => {
      if (!user || user.status == 'deleted') {
        return res.status(401).end();
      } else {
        return res.status(200).end();
      }
    });
}

/**
 * Get my info
 */
export function me(req, res, next) {
  var userId = req.user._id;

  return User.findOne({ _id: userId }, '-salt -password').exec()
    .then(user => { // don't ever give out the password or salt
      if (!user || user.status == 'deleted') {
        return res.status(401).end();
      }
      res.json(user);
    })
    .catch(err => next(err));
}

/**
 * Authentication callback
 */
export function authCallback(req, res, next) {
  res.redirect('/');
}