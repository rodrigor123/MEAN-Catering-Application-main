/**
 * ServiceType model events
 */

'use strict';

import {EventEmitter} from 'events';
import ServiceType from './serviceType.model';
var ServiceTypeEvents = new EventEmitter();

// Set max event listeners (0 == unlimited)
ServiceTypeEvents.setMaxListeners(0);

// Model events
var events = {
  'save': 'save',
  'remove': 'remove'
};

// Register the event emitter to the model events
for (var e in events) {
  var event = events[e];
  ServiceType.schema.post(e, emitEvent(event));
}

function emitEvent(event) {
  return function(doc) {
    ServiceTypeEvents.emit(event + ':' + doc._id, doc);
    ServiceTypeEvents.emit(event, doc);
  }
}

export default ServiceTypeEvents;
