let config = require('../../config/environment');
let Promise = require('bluebird');
let request = require('request-promise');
let mongoose = require('mongoose');
let _ = require('lodash');

let dwollaController = require('./dwolla.controller');
let stripeController = require('./stripe.controller');

class AdminPayController {

  pay(req, res) {

    if (!req.user.dwollaTokens && !req.body.items || req.body.items.length === 0) {
      return Promise.reject({});
    }

    const datePaid = new Date();

    return Promise.all(req.body.items.map(item => mongoose.model('Offer').findById(item)))
      .then(offers => {

        let promises = [];

        offers.forEach((offer, index) => {
          promises.push(mongoose.model('Event').findById(offer.eventId).then((event) => {
            offers[index].event = event;
          }));
        });

        return Promise.all(promises).then(() => offers);

      })

      .then(offers => {

      return Promise.all(offers.map(item => mongoose.model('User').findById(item.catererId))).then(caterers => {

        let promises = [];
        let items = [];

        offers.forEach((offer, index) => {
          console.log(offer);
          if (offer.invoice.refund) {
            promises.push(stripeController.$refund(offer.paymentId));
          } else {
            let amount = (offer.invoice.total * ((100 - offer.invoice.commission) / 100) - offer.invoice.adjustment.caterer).toFixed(2);
            let item = {
              "_links": {
                "destination": caterers[index].payableAccount.links.account
              },
              "amount": {
                "currency": "USD",
                "value": amount
              },
              "metadata": {
                "notes": offer.event.name
              }
            };
            if (offer.invoice.adjustment.client) {
              promises.push(stripeController.$refund(offer.paymentId, offer.invoice.adjustment.client));
            }
            items.push(item);
          }
        });

        if (items.length) {
          promises.push(dwollaController.pay(items, req.user).catch((err) => {
            return mongoose.model('User').findOne({_id: req.user._id}).then((user) => {
              user.dwollaTokens = null;
              return user.save().then(() => {
                return Promise.reject(err);
              });
            });
          }));
        }

        return Promise.all(promises).then(() => {
          if (!promises.length) {
            return Promise.reject({});
          }
          return Promise.all(offers.map(offer => {
            offer.status = 'completed';
            offer.paymentStatus = 'completed';
            return offer.save();
          })).then((updatedOffers) => {
            return Promise.all(updatedOffers.map(offer => mongoose.model('Event').findById(offer.eventId))).then(events => {
              return Promise.all(events.map(event => {
                event.status = 'completed';
                event.paymentStatus = 'completed';
                event.datePaid = datePaid;
                return event.save();
              })).then(respondWithResult(res))
                 .catch(handleError(res));
            });
          });
        }).catch(handleError(res));

      });
    })

  }

}

function respondWithResult(res, statusCode) {
  statusCode = statusCode || 200;
  return function(entity) {
    if (entity) {
      res.status(statusCode).json(entity);
    }
  };
}

function handleError(res, statusCode) {
  statusCode = statusCode || 500;
  return function(err) {
    res.status(statusCode).send(err);
  };
}

module.exports = new AdminPayController();
