'use strict';

import mongoose from 'mongoose';

var TemplateSchema = new mongoose.Schema({
  name: String,
  description: String,
  userId: String
});

export default mongoose.model('Template', TemplateSchema);
