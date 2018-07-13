'use strict';

import mongoose from 'mongoose';

var OfferSchema = new mongoose.Schema({
  pricePerPerson: Number,
  counter: Number,
  counterReason: String,
  contactInfo: String,
  offerDescription: String,
  includedInPrice: Array,
  eventId: String,
  catererId: String,
  catererName: String,
  date: Date,
  createDate: Date,
  dateAccepted: Date,
  dateConfirmed: Date,
  status: String,
  invoice: {
    _id:  mongoose.Schema.Types.ObjectId,
    pricePerPerson: Number,
    people: Number,
    service: Number,
    tax: Number,
    tip: Number,
    total: Number,
    stripeFee: {
      type: Number,
      default: 0
    },
    commission: {
      type: Number,
      default: 10
    },
    created_date : {
      type : Date,
      default: Date.now
    },
    refund: {
      type: Number,
      default: 0
    },
    adjustment: {
      client: {
        type: Number,
        default: 0
      },
      caterer: {
        type: Number,
        default: 0
      },
      chargeOff: {
        type: Number,
        default: 0
      }
    }
  },
  paymentId: String,
  paymentStatus: String
});

export default mongoose.model('Offer', OfferSchema);
