const mongoose = require('mongoose');

// Define the schema for guest user cart
const GuestUserCartSchema = new mongoose.Schema({
  cartId: {
    type: String,
    required: true,
    unique: true,
  },
  items: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
        default: 1,
      },
    },
  ],
});

// Create the GuestUserCart model
const GuestUserCart = mongoose.model('guestUserCart', GuestUserCartSchema);

module.exports = GuestUserCart;
