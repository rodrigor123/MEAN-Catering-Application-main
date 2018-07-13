'use strict';

import mongoose from 'mongoose';

var EventSchema = new mongoose.Schema({
  name: String,
  description: String,
  createDate: Date,
  status: String,
  pricePerPerson: Number,
  people: Number,
  tip: Number,
  tipType: String,
  vegetarianMeals: Number,
  specialRequest: String,
  includedInPrice: Object,
  deliveryInstructions: String,
  location: String,
  userId: String,
  showToCaterers: Boolean,
  foodTypes: Object,
  serviceTypes: Object,
  date: Date,
  time: String,
  acceptedDate: Date,
  confirmedDate: Date,
  paymentPaidDate: Date,
  paymentHoldDate: Date,
  selectedCaterers: Object,
  sentTo: Array,
  rejectedBy: Array,
  confirmedBy: String,
  isUpdated: Boolean,
  address: Object,
  paymentStatus: String,
  offerId: String,
  blocked: Boolean,
  dateAccepted: Date,
  dateConfirmed: Date,
  datePaid: Date
});

export default mongoose.model('Event', EventSchema);
