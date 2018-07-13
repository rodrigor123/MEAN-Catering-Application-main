'use strict';

import express from 'express';
import passport from 'passport';
import {signToken} from '../auth.service';
import History from '../../api/history/history.model';

var router = express.Router();

router.post('/', function(req, res, next) {
  passport.authenticate('local', function(err, user, info) {
    var error = err || info;
    if (error) {
      return res.status(401).json(error);
    }
    if (!user) {
      return res.status(404).json({message: 'Something went wrong, please try again.'});
    }

    var token = signToken(user._id, user.role);

    History.findOneAndUpdate(
      {userId: user._id}, 
      {userId: user._id, isLoggedIn: true, lastLoginDate: new Date()},
      {upsert: true},
      function(err, result) {
        if(err)
          return res.status(401).json(err);
    })
    
    res.json({ token });
  })(req, res, next)
});

router.post('/logout', function(req, res, next) {
  var userId = req.body.userId;

  History.findOneAndUpdate(
    {userId: userId}, 
    {isLoggedIn: false},
    {upsert: true},
    function(err, result) {
      if(err)
        return res.status(401).json(err);

      res.json(result);
  })
})

export default router;
