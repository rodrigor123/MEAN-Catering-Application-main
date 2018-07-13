'use strict';

var nodemailer = require('nodemailer');
var mg = require('nodemailer-mailgun-transport');
import _ from 'lodash';
import mongoose from 'mongoose';
import Event from '../event/event.model';
import Offer from '../offer/offer.model';
import Comment from '../comment/comment.model';
import User from '../user/user.model';
import config from '../../config/environment';
var Promise = require('bluebird');

var auth = {
  auth: {
    api_key: config.mailgun.api_key,
    domain: config.mailgun.domain
  }
}

var nodemailerMailgun = nodemailer.createTransport(mg(auth));

function getCommentOpponent(commentId, offerId, userId) {
  let result = {
    offer: {},
    event: {},
    author: {},
    user: {}
  }
  return Offer.findById(offerId).exec()
    .then((offer) => {
      result.offer = offer;
      return offer;
    })
    .then(() => {
      return User.findById(userId, '-salt -password -provider');
    })
    .then((author) => {
      result.author = author;
      return author;
    })
    .then(() => {
      return Event.findById(result.offer.eventId);
    })
    .then((event) => {
      result.event = event;
      if (userId == result.offer.catererId) {      //caterer wrote comment
        return User.findById(event.userId, '-salt -password -provider');
      } else {
        return User.findById(result.offer.catererId, '-salt -password -provider');
      }
    })
    .then((user) => {
      result.user = user;
      Comment.findById(commentId).exec().then((res) => {
        res.target = user._id;
        res.save();
      })
      return result;
    });
  }

function getEventMailList(event) {
  let query = {};

  if (event.sentTo.length) { //if Caterers were specified
    _.map(event.sentTo, (id) => {
      return new mongoose.Types.ObjectId(id);
    });
    query = { _id: {$in: event.sentTo }};
  } else if (event.confirmedBy) {
    query = { _id: event.confirmedBy }
  } else {
    if (event.foodTypes.length) { //if only ft were specified
      query = { foodTypes: {$in: event.foodTypes }};
    }
    if (event.serviceTypes.length) { //if only st were specified
      query = { serviceTypes: {$in: event.serviceTypes }};
    }
  }

  return User.find(query).exec()
    .then((users) => {

      let fltUsers = _.filter(users, (user) => {
        let count = 0;
        if (!user.veganOffers && event.vegetarianMeals) count++;
        if (user.minprice && +user.minprice < +event.pricePerPerson) count++;
        return count > 0;
      });

      fltUsers = _.filter(fltUsers, (user) => {
        return user.status !== 'deleted';
      })

      return _.map(fltUsers, (user) => {
          let emailOptions = {
            sendSummary: user.sendSummary,
            sendNotification: user.sendNotification,
            email: user.email
          }
          return emailOptions;
        });
    });
}

function getOfferMailList(offer) {
  return Event.findById(offer.eventId).exec()
   .then((event) => {
     return User.findById(event.userId).exec()
       .then((user) => {
          return user.email;
       });
   });
}

function getOfferOwnerMail(offer) {
  return User.findById(offer.catererId).exec()
    .then((user) => {
      return user.email;
    });
}

function getUsers() {
   return User.find({'role': 'caterer' }, { email: 1, role: 1, name: 1, companyName: 1, foodTypes: 1, serviceTypes: 1}).exec().then((users) => {
       return users;
     });
}

function createSummary(user) {    //user is caterer
  let eventsQuery = { foodTypes: { $in: user.foodTypes}, serviceTypes: { $in: user.serviceTypes}},
      eventsTomorrowQuery = { status: 'confirmed', confirmedBy: user._id },
      offersSentQuery = { catererId: user._id },
      offersAcceptedQuery = { catererId: user._id },
      today = new Date().toISOString(),
      end = new Date(),
      start = new Date(),
      summary = {};

  end = Date.parse(end) + (24 * 60 * 60 * 1000);
  end = new Date(end).toISOString();
  start = Date.parse(start) - (24 * 60 * 60 * 1000);
  start = new Date(start).toISOString();

  eventsQuery.date = { $lte: today, $gte: start };
  eventsTomorrowQuery.date = { $lte: end, $gte: today };
  offersSentQuery.date = { $lte: today, $gte: start };
  offersAcceptedQuery.dateAccepted = { $lte: today, $gte: start };

  return Event.find(eventsQuery).exec()
    .then((events) => {
       summary.eventsNumber = events.length;
       summary.eventsNumberHtml = '<p>Total number of events recieved: <strong> ' + events.length + ' </strong></p>';
    })
    .then(() => {
      return Event.find(eventsTomorrowQuery).exec();
    })
    .then((eventsTomorrow) => {
      summary.eventsTomorrow = eventsTomorrow;
      let html = '<h2>Events scheduled for tomorrow</h2>';
      _.each(summary.eventsTomorrow, (event) => {
        let date = new Date(event.date),
            time = new Date(event.time);
        html += '<p><strong>' + event.name + '</strong></p>';
        html += '<p>Date:<strong>' + date.toDateString() + '</strong></p>';
        html += '<p>Time:<strong>' + time.toTimeString() + '</strong></p>';
        html += '<p>Location: <strong>' + event.location + '</strong></p>';
        html += '<p>People: <strong>' + event.people + '</strong></p>';
        html += '<p>Price per person: <strong>' + event.pricePerPerson + '</strong></p>';
        html += '<p>To change or stop email notifications, log into your account using this email address and click Profile and Email Options.</p>';
        html += '<p>If you have not registered or do not know your password, just click forgot my password at login, or the link below, and use this email.</p>';
        html += '<p><a href="https://app.cateringninja.com/reset">Forgot My Password</a></p>';
        html += '<p><a href="https://app.cateringninja.com/login">Login</a></p>';
        html += '<hr />';
      });
      summary.eventsTomorrowHtml = html;
    })
    .then(()=> {
      return Offer.find(offersSentQuery).exec();
    })
    .then((offersSent) => {
      summary.offersSent = offersSent.length;
      summary.offersSentHtml = '<p>Total number of offers sent: <strong> ' + offersSent.length + ' </strong></p>';
    })
    .then(()=> {
      return Offer.find(offersAcceptedQuery).exec();
    })
    .then((offersAccepted) => {
      summary.offersAccepted = offersAccepted.length;
      summary.offersAcceptedHtml = '<p>Total number of offers accepted: <strong> ' + offersAccepted.length + ' </strong></p>';
    })
    .then(() => {
      return summary;
    })
}

var mailer = {
  notifyComment: function(comment) {
    getCommentOpponent(comment._id, comment.offerId, comment.userId).then((data) => {
      let date = new Date(comment.date),
      message = '<h3>Hello,</h3><p>You\'ve got new comment</p>';
      message += '<p>Event: ' + data.event.name + '</p>';
      message += '<p>From: ' + comment.name + '</p>';
      message += '<p>Date: ' + date.toDateString() + '</p>';
      message += '<p>Comment: ' + comment.text + '</p>';
      message += '<p></p>';
      message += '<p>Do Not Reply to This Email. You have to log into Catering Ninja to respond to comments.</p>';

      nodemailerMailgun.sendMail({
        from: config.mailgun.from,
        to: data.user.email,
        subject: 'New comment - Do Not Reply to This Email',
        html: message,
      }, function (err, info) {
        if (err) {
          console.log('Error: ' + err);
        }
        else {
          console.log('Response: ' + info);
        }
      });

    });
  },
  verifyUser: function(user) {
    let message = '<h3>Hello,</h3><p>Please follow the link below to verify your email. If you did not sign up to Catering Ninja, just ignore this message.</p><p><a href="' + config.domain + 'verify/' + user._id + '">Please verify email address</a></p>';
    nodemailerMailgun.sendMail({
      from: config.mailgun.from,
      to: user.email,
      subject: 'Catering-ninja: verify your email',
      html: message,
    }, function (err, info) {
      if (err) {
        console.log('Error: ' + err);
      }
      else {
        console.log('Response: ' + info);
      }
    });
  },
  reset: function(user) {
    let message = '<h3>Hello,</h3><p>Here is your new password. Please change it as soon as you log in</p><h3>' + user.password + '</h3>';
    nodemailerMailgun.sendMail({
      from: config.mailgun.from,
      to: user.email,
      subject: 'Catering-ninja: reset your password',
      html: message,
    }, function (err, info) {
      if (err) {
        console.log('Error: ' + err);
      }
      else {
        console.log('Response: ' + info);
      }
    });
  },
  breakAuth: (user, caterer) => {
    let promises = [];
    promises.push(nodemailerMailgun.sendMail({
      from: config.mailgun.from,
      to: user.email,
      subject: 'Catering-ninja: your credit card was not authorized',
      html: 'Simple message',
    }, function (err, info) {
      if (err) {
        console.log('Error: ' + err);
      }
      else {
        console.log('Response: ' + info);
      }
    }));
    promises.push(nodemailerMailgun.sendMail({
      from: config.mailgun.from,
      to: caterer.email,
      subject: 'Catering-ninja: offer has been canceled',
      html: 'Simple message',
    }, function (err, info) {
      if (err) {
        console.log('Error: ' + err);
      }
      else {
        console.log('Response: ' + info);
      }
    }));
    return Promise.all(promises);
  },
  breakCapture: (user, caterer) => {
    let promises = [];
    promises.push(nodemailerMailgun.sendMail({
      from: config.mailgun.from,
      to: user.email,
      subject: 'Catering-ninja: money cannot be captured',
      html: 'Simple message',
    }, function (err, info) {
      if (err) {
        console.log('Error: ' + err);
      }
      else {
        console.log('Response: ' + info);
      }
    }));
    promises.push(nodemailerMailgun.sendMail({
      from: config.mailgun.from,
      to: caterer.email,
      subject: 'Catering-ninja: offer has been canceled',
      html: 'Simple message',
    }, function (err, info) {
      if (err) {
        console.log('Error: ' + err);
      }
      else {
        console.log('Response: ' + info);
      }
    }));
    return Promise.all(promises);
  },
  report: function() {
    getUsers().then((users) => {
      _.each(users, (user) =>{
        if (user.sendSummary) {
          createSummary(user).then((summary)=> {
            let message = summary.eventsNumberHtml + summary.offersSentHtml + summary.offersAcceptedHtml + summary.eventsTomorrowHtml;
            nodemailerMailgun.sendMail({
                from: config.mailgun.from,
                to: user.email,
                subject: 'Catering-ninja: daily report',
                html: message,
              }, function (err, info) {
                if (err) {
                  console.log('Error: ' + err);
                }
                else {
                  console.log('Response: ' + info);
                }
              });
          });
        }
      });
    });
  },
  notifyEvent: function(event, fact) {

    let date = new Date(event.date),
      time = new Date(event.time),
      message = '<h1>Event ' + event.name + ' was ' + fact + '!</h1>';
      message += '<p>Date:<strong>' + date.toDateString() + '</strong></p>';
      message += '<p>Time:<strong>' + time.toTimeString() + '</strong></p>';
      message += '<p>People: <strong>' + event.people + '</strong></p>';
      message += '<p>Price per person: <strong>' + event.pricePerPerson + '</strong></p>';
      message += '<p></p>';
      message += '<p>If you would like to create and offer to respond to this event, please log in using the link below.</p>';
      message += '<p></p>';
      message += '<p>To change or stop email notifications, log into your account using this email address and click Profile and Email Options.</p>';
      message += '<p>If you have not registered or do not know your password, just click forgot my password at login and use this email.</p>';
      message += '<p><a href="https://app.cateringninja.com/reset">Forgot My Password</a></p>';
      message += '<p><a href="https://app.cateringninja.com/login">Login</a></p>';

    getEventMailList(event).then((users) => {
      _.each(users, (user) => {
        if (user.sendNotification) {
          nodemailerMailgun.sendMail({
            from: config.mailgun.from,
            to: user.email,
            subject: 'Catering-ninja: event has been ' + fact,
            html: message,
          }, function (err, info) {
            if (err) {
              console.log('Error: ' + err);
            }
            else {
              console.log('Response: ' + info);
            }
          });
        }
      });
    });
  },

  notifyOffer: function(offer, fact) {
    getOfferMailList(offer).then((sendTo) => {
      let message = '<h1>Offer from ' + offer.catererName + ' was ' + fact + '!</h1><p>Description: ' + offer.offerDescription + '</p><p>Status: ' + offer.status + '</p>';

      nodemailerMailgun.sendMail({
        from: config.mailgun.from,
        to: sendTo, // An array if you have multiple recipients.
        subject: 'Catering-ninja: offer has been ' + fact,
        html: message,
        }, function (err, info) {
        if (err) {
          console.log('Error: ' + err);
        }
        else {
          console.log('Response: ' + info);
        }
       });
    });
  },

  notifyOfferAccepted: function(offer, fact) {
    getOfferOwnerMail(offer).then((sendTo) => {
      let message = '<h1>Your offer was ' + fact + '!</h1><p>Description: ' + offer.offerDescription + '</p><p>Status: ' + offer.status + '</p>';

      Event.findById(offer.eventId).exec()
        .then((event) => {

          User.findById(event.userId).exec()
            .then((user) => {
                let date = new Date(event.date),
                    time = new Date(event.time);
                message += '<hr />';
                message += '<p><b>Congratulations, your offer was accepted!! Now you need to confirm your offer to have a binding contract. If this is the first offer you have confirmed, you will be asked to set up a Dwolla account for payment. Since we do the invoicing and take payment, we need a way to pay you. We looked at all of the payment options, like PayPal etc, and Dwolla is the best solution we found for FREE direct ACH payments. If you have any questions please call us or send an email to support@cateringninja.com.</b></p>';
                message += '<p>Event details:</p>';
                message += '<p>Contact Name:<strong>' + user.firstname + ' ' + user.lastname + '</strong></p>';
                message += '<p>Contact Phone:<strong>' + user.userphone + '</strong></p>';
                message += '<p>Contact Email:<strong>' + user.email + '</strong></p>';
                message += '<p>Name:<strong>' + event.name + '</strong></p>';
                message += '<p>Date:<strong>' + date.toDateString() + '</strong></p>';
                message += '<p>Time:<strong>' + time.toTimeString() + '</strong></p>';
                message += '<p>Location: <strong>' + event.location + '</strong></p>';
                message += '<p>People: <strong>' + event.people + '</strong></p>';
                message += '<p>Price per person: <strong>' + event.pricePerPerson + '</strong></p>';
                // message += '<p>To change or stop email notifications, log into your account using this email address and click Profile and Email Options.</p>';
                // message += '<p>If you have not registered or do not know your password, just click forgot my password at login and use this email.</p>';
                // message += '<p><a href="https://app.cateringninja.com/reset">Forgot My Password</a></p>';
                // message += '<p><a href="https://app.cateringninja.com/login">Login</a></p>';
                message += '<hr />';

                nodemailerMailgun.sendMail({
                  from: config.mailgun.from,
                  to: sendTo, // An array if you have multiple recipients.
                  subject: 'Catering-ninja: offer has been ' + fact,
                  html: message,
                }, function (err, info) {
                  if (err) {
                    console.log('Error: ' + err);
                  }
                  else {
                    console.log('Response: ' + info);
                  }
                });
            });
        });
      });
  }
}

module.exports = mailer;
