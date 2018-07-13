/**
 * Events model comments
 */

'use strict';

import {EventEmitter} from 'comments';
import Comment from './comment.model';
var CommentEvents = new EventEmitter();

// Set max event listeners (0 == unlimited)
CommentEvents.setMaxListeners(0);

// Model comments
var comments = {
  'save': 'save',
  'remove': 'remove'
};

// Register the event emitter to the model comments
for (var e in comments) {
  var event = comments[e];
  Comment.schema.post(e, emitEvent(event));
}

function emitEvent(event) {
  return function(doc) {
    CommentEvents.emit(event + ':' + doc._id, doc);
    CommentEvents.emit(event, doc);
  }
}

export default CommentEvents;
