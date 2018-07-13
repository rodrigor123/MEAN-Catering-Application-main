'use strict';

import mongoose from 'mongoose';

var HistorySchema = new mongoose.Schema({
  userId: String,
  isLoggedIn: Boolean,
  lastLoginDate: Date
});

export default mongoose.model('History', HistorySchema);
