/**
 * Broadcast updates to client when the model changes
 */

'use strict';

import CommentComments from './comment.comments';

// Model comments to emit
var comments = ['save', 'remove'];

export function register(socket) {
  // Bind model comments to socket comments
  for (var i = 0, commentsLength = comments.length; i < commentsLength; i++) {
    var comment = comments[i];
    var listener = createListener('comments:' + comment, socket);

    CommentComments.on(comment, listener);
    socket.on('disconnect', removeListener(comment, listener));
  }
}


function createListener(comment, socket) {
  return function(doc) {
    socket.emit(comment, doc);
  };
}

function removeListener(comment, listener) {
  return function() {
    CommentComments.removeListener(comment, listener);
  };
}
