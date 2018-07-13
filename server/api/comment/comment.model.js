'use strict';

import mongoose from 'mongoose';

var CommentSchema = new mongoose.Schema({
  date: Date,
  text: String,
  userId: String,
  name: String,
  profileUrl: String,
  parentId: String,
  offerId: String,
  viewed: Boolean,
  target: String,
  children: Array
});

export default mongoose.model('Comment', CommentSchema);
