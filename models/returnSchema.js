const mongoose = require('mongoose');

const returnSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  returnReason: {
    type: String,
    required: true,
  },
  resolutionType: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["pending","Approved", "Rejected", ],
    default: "pending",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Return = mongoose.model('return', returnSchema);

module.exports = Return;
