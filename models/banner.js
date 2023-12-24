const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  button: {
    type: String,
    required: true,
  },

  imagepath: {
    type: Array,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  ExpiryAt: {
    type: Date,
    required:true,
  },
  active: {
    type: Boolean,
    default: true,
  }
});

const Banner = mongoose.model('banner', bannerSchema);

module.exports = Banner;
