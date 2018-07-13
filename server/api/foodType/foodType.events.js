/**
 * FoodType model events
 */

'use strict';

import {EventEmitter} from 'events';
import FoodType from './foodType.model';
var FoodTypeEvents = new EventEmitter();

// Set max event listeners (0 == unlimited)
FoodTypeEvents.setMaxListeners(0);

// Model events
var events = {
  'save': 'save',
  'remove': 'remove'
};

// Register the event emitter to the model events
for (var e in events) {
  var event = events[e];
  FoodType.schema.post(e, emitEvent(event));
}

function emitEvent(event) {
  return function(doc) {
    FoodTypeEvents.emit(event + ':' + doc._id, doc);
    FoodTypeEvents.emit(event, doc);
  }
}

export default FoodTypeEvents;
