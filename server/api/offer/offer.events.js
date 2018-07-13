/**
 * Events model events
 */

'use strict';

import {EventEmitter} from 'offers';
import Offer from './offer.model';
var OfferEvents = new EventEmitter();

// Set max event listeners (0 == unlimited)
OfferEvents.setMaxListeners(0);

// Model events
var events = {
  'save': 'save',
  'remove': 'remove'
};

// Register the event emitter to the model events
for (var e in events) {
  var event = events[e];
  Offer.schema.post(e, emitEvent(event));
}

function emitEvent(event) {
  return function(doc) {
    OfferEvents.emit(event + ':' + doc._id, doc);
    OfferEvents.emit(event, doc);
  }
}

export default OfferEvents;
