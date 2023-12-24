const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true
    },
    price: {
      type: Number,
      required: true
    }
  }],
  subtotal: {
    type: Number,
    default: 0
  }
});

// Calculate and update the subtotal whenever the cart items or quantities change
cartSchema.pre('save', function(next) {
  const subtotal = this.items.reduce((total, item) => {
    const price = item.offerprice || item.price;
    return total + price;
  }, 0);
  this.subtotal = subtotal;
  next();
});

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;
