const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true
  },
  discount: {
    type: Number,
    required: true,
    min: 0
  },
  minValue: {
    type: Number,
    required: true
  },
  validUntil: {
    type: Date,
    required: true
  },
  active: {
    type: Boolean,
    default: true
  },


  usedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
});


const Coupon = mongoose.model('coupon', couponSchema);

module.exports = Coupon;

