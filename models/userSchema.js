const mongoose = require("mongoose");
const { UserBindingContextImpl } = require("twilio/lib/rest/ipMessaging/v2/service/user/userBinding");
const { boolean } = require("webidl-conversions");


const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  mobile: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
  },
  is_block: {
    type: Boolean,
    default: false,
  },
  token: {
    type: String,
    default: "",
  },
  addresses: [{
      
        firstname: {
          type: String,
          required: true,
        },
        lastname: {
          type: String,
          required: true,
        },
        country: {
          type: String,
          required: true,
        },
        address: {
          type: String,
          required: true,
        },
        city: {
          type: String,
          required: true,
        },
        state: {
          type: String,
          required: true,
        },
        post: {
          type: String,
          required: true,
        },
        mobile: {
          type: String,
          required: true,
        },
  
  }],
  coupon: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coupon'
  }],
  Wallet: [{
    _id: false,
    amount:{
      type:   Number,
      
    } 
  }]

});

const User = mongoose.model("User", userSchema);
module.exports = User;