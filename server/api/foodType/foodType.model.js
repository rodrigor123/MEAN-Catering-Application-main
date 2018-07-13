'use strict';

import mongoose from 'mongoose';

var FoodTypeSchema = new mongoose.Schema({
  name: String,
  info: String,
  approved: Boolean,
  custom: Boolean,
  user: String
});

export default mongoose.model('FoodType', FoodTypeSchema);
