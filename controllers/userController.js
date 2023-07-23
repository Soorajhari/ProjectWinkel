const User = require("../models/userSchema");
const OTP = require("../models/otp");
const bcrypt = require("bcrypt");
const Product = require("../models/productSchema");
const mongoose = require("mongoose");
const Cart = require("../models/cartSchema");
// const Address = require("../models/addressSchema");
const randomstring = require("randomstring");
const Order = require("../models/order");
const { v4: uuidv4 } = require("uuid");
const nodemailer = require("nodemailer");
const Razorpay = require("razorpay");
const Coupon = require("../models/coupenSchema");
const { UserInstance } = require("twilio/lib/rest/chat/v1/service/user");
const Banner = require("../models/banner");
const Category = require("../models/categorySchema");
const Offer = require("../models/offerSchema");
const easyinvoice = require("easyinvoice");
const fs = require("fs");
const dotenv = require("dotenv").config();

const crypto = require("crypto");
const { rawListeners } = require("process");
const { offerManagment } = require("./adminController");
const Return = require("../models/returnSchema");

var instance = new Razorpay({
  key_id: "rzp_test_wuu2yhm284NSc9",
  key_secret: "0d9i71utS7Fzzf7J59eMcDBj",
});

const loadhome = async (req, res) => {
  try {
    res.render("users/index.ejs");
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const loadhomes = async (req, res) => {
  try {
    const products = await Product.find({ isdeleted: false });
    const isLoggedIn = req.session.user_id ? true : false;
    const user = await User.find({ is_block: false });
    const banner = await Banner.find();
    const username = req.session.user_id;
    const userData =await User.findById(username)
    res.render("users/home.ejs", { products, user, banner,isLoggedIn,userData });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const loginpage = async (req, res) => {
  try {
    res.render("users/login.ejs");
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const verifylogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const userData = await User.findOne({ email: email });
    // console.log(userData);

    if (!userData) {
      return res.render("users/login.ejs", {
        message: "User not found",
      });
    }

    const passwordMatch = await bcrypt.compare(password, userData.password);
    // console.log(passwordMatch);
    if (!passwordMatch) {
      return res.render("users/login.ejs", {
        message: "Invalid username or password",
      });
    }

    if (userData.is_block) {
      return res.render("users/login.ejs", {
        message:
          "Your account is blocked. Please contact the administrator for assistance.",
      });
    }

    if (passwordMatch) {
      req.session.user_id = userData._id;
      req.session.email = userData.email;
      req.session.user1 = true;

      res.redirect("/home");
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require("twilio")(accountSid, authToken);

function generateOTP() {
  const otpe = Math.floor(100000 + Math.random() * 900000);
  return otpe.toString();
}

const sendOTP = async (req, res) => {
  try {
    // const { mobile } = req.body;
    const otp = generateOTP();

    client.messages
      .create({
        body: otp,
        from: "+13159080660",
        to: req.body.otp,
      })
      .then((message) => console.log(message.sid));

    // console.log(otp);
  } catch (error) {
    console.log(error);
  }
};

const loadsignUp = async (req, res) => {
  try {
    const message = req.query.message;
    res.render("users/signUp.ejs", { message });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const insertUser = async (req, res) => {
  // console.log("before" + req.body.password);
  const salt = bcrypt.genSaltSync(10);
  const password = bcrypt.hashSync(req.body.password, salt);

  try {
    const user = new User({
      name: req.body.name,
      email: req.body.email,
      mobile: req.body.mobile,
      password,
    });

    const userData = await user.save();
    

    if (userData) {
      const otp = generateOTP();
      client.messages
        .create({
          body: otp,
          from: "+13159080660",
          to: `+91${req.body.mobile}`,
        })
        .then((message) => console.log(message.sid));

      const newOtp = new OTP({
        mobile: req.body.mobile,
        otp,
      });
      await newOtp.save();

      res.render("users/otp.ejs", { mobile: req.body.mobile });
    } else {
      res.redirect("/signUp?message=registration-failed");
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const resendOtp = async (req, res) => {
  try {
    const mobile = req.body.mobile;
    console.log(mobile);
    const otp = generateOTP();
    client.messages
      .create({
        body: otp,
        from: "+13159080660",
        to: `+91${mobile}`,
      })
      .then((message) => console.log(message.sid));

    const newOtp = new OTP({
      mobile: req.body.mobile,
      otp,
    });
    await newOtp.save();
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const verifyOtp = async (req, res) => {
  const enteredOtp = req.body.otp; // OTP entered by the user
  const newOtp = enteredOtp.join("");

  try {
    const otpData = await OTP.findOne({ otp: newOtp });
    // console.log(otpData);

    if (!otpData) {
      // OTP data not found in the database
      console.log("OTP data not found");
      
      return;
    }

    const storedOtp = otpData.otp;

    if (newOtp === storedOtp) {
      console.log("OTP verified successfully");
      res.render("users/login.ejs");
    } else {
      // Incorrect OTP
      console.log("Invalid OTP");
      res.render("users/otp.ejs", { message: "Invalid OTP" });
    }
  } catch (error) {
    console.log("Error verifying OTP:", error.message);
    res.status(500).send("Internal Server Error");
  }
};

const userLogout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.log(err);
      res.status(500).send("Error destroying session");
    } else {
      res.clearCookie("connect.sid");
      res.redirect("/login");
    }
  });
};

const getPricefilter = async (req, res) => {
  try {
    const filterOptions = {};
    const price = req.query.filterPriceRange;
    console.log(price);

    if (req.query.filterPriceRange) {
      const [minPrice, maxPrice] = req.query.filterPriceRange.split("-");
      filterOptions.offerprice = { $gte: minPrice, $lte: maxPrice };
    }

    // Add stock filter
    filterOptions.Stock = { $gt: 0 };

    let productsQuery;

    if (Object.keys(filterOptions).length > 0) {
      productsQuery = Product.find({ isdeleted: false, ...filterOptions });
    } else {
      productsQuery = Product.find({ isdeleted: false });
    }
    const products = await productsQuery; // Execute the query
    
    res.json(products);
    console.log(productsQuery);
  } catch (error) {
    console.log("Error verifying OTP:", error.message);
    res.status(500).send("Internal Server Error");
  }
};

const getShop = async (req, res) => {
  try {
    let productsQuery;

    productsQuery = Product.find({ isdeleted: false });

    const sortType = req.query.sort || "asc";
    if (sortType === "asc") {
      productsQuery = productsQuery.sort({ price: 1 });
    } else if (sortType === "desc") {
      productsQuery = productsQuery.sort({ price: -1 });
    }

    const products = await productsQuery.exec();
    const user = await User.find({ is_block: false });
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;

    const skip = (page - 1) * limit;

    const filteredProducts = products.filter((product) => product.Stock > 0); // Apply stock filter for pagination

    const paginatedProducts = filteredProducts.slice(skip, skip + limit);

    const totalPages = Math.ceil(filteredProducts.length / limit);
    console.log(totalPages);
    res.render("users/shop.ejs", {
      products: paginatedProducts,
      totalPages: totalPages,
      currentPage: page,
      user: user,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const shopFilter = async (req, res) => {
  try {
    const price = req.query.filterPriceRange;
    console.log(price);
    const selectedCategory = req.body.category;
    console.log(selectedCategory);
    const newcata = await Category.findOne({ name: selectedCategory });
    // console.log(newcata)
    const id = newcata._id;
    console.log(id);
    const product = await Product.find({ categoryId: id, isdeleted: false });
    console.log(product);
    res.json(product);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const getSingle = async (req, res) => {
  try {
    const productid = req.params.id;
    // console.log(productid);
    const products = await Product.findById(productid);

    const user = await User.find({ is_block: false });
    // console.log(user);
    // res.render("users/single.ejs", { products });
    res.render("users/single.ejs", { products });
  } catch (error) {
    console.log(error.message);
  }
};

const loadCart = async (req, res) => {
  try {
    const userData = req.session.user_id;

    if (userData) {
      const cart = await Cart.findOne({ user: userData }).populate(
        "items.product"
      );

      const coupon = await Coupon.find();

      res.render("users/cart.ejs", { cart, coupon });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const couponManagment = async (req, res) => {
  try {
    const couponcode = req.body.name;
    console.log(couponcode);
    const coupon = await Coupon.findOne({ code: couponcode });
    const users = req.session.user_id;
    const carts = await Cart.findOne({ user: users });
    const userdata = await User.findOne({ _id: users });

    const userUsedCoupon = coupon.usedBy.includes(users);
    if (userUsedCoupon) {
      return res.json({ message: "You have already used a coupon." });
    }

    if (userdata.coupon.length != 0) {
      return res.json({ message: "one coupon at a time" });
    }

    if (carts.subtotal + carts.subtotal * 0.1 < coupon.minValue) {
      return res.json({
        message:
          "Coupon can only be applied on orders with a minimum price of " +
          coupon.minValue +
          ".",
      });
    }

    const dis = coupon.discount;
    const newPrice = carts.subtotal - dis;

    await Cart.findOneAndUpdate({ user: users }, { subtotal: newPrice });

    coupon.usedBy.push(users);
    await coupon.save();

    if (!userdata.coupon) {
      userdata.coupon = [];
    }

    userdata.coupon.push(coupon._id);
    await userdata.save();

    res.json({ message: "Coupon applied successfully.", newPrice });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const removeCoupon = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const removeid = await User.findOne({ _id: userId });
    // console.log(removeid)
    const carts = await Cart.findOne({ user: userId });

    if (removeid.coupon.length === 0) {
      // Coupon array is empty, no need to remove anything
      res.redirect("/cart");
      return;
    }

    const couponId = removeid.coupon[0];
    console.log(couponId);
    const coupon = await Coupon.findById(couponId);

    const oldprice = carts.subtotal + coupon.discount;
    await Cart.findOneAndUpdate({ user: userId }, { subtotal: oldprice });

    res.redirect("/cart");

    coupon.usedBy = [];
    await coupon.save();

    removeid.coupon = [];
    await removeid.save();
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};
const addtoCart = async (req, res) => {
  try {
    const productId = req.params.id;
    const user = req.session.user_id;

    let qty = 1;

    const product = await Product.findById(productId);

    const cart = await Cart.findOne({ user: user });

    if (cart) {
      const existingItem = cart.items.find(
        (item) => item.product.toString() === productId
      );

      if (existingItem) {
        // Item already exists in the cart
        // Update the quantity and price
        
        existingItem.price = product.offerprice || product.price;
      } else {
        // Add a new item to the cart
        const newItem = {
          product: productId,
          quantity: qty,
          price: product.offerprice || product.price,
        };

        cart.items.push(newItem);
      }

      await cart.save();
    } 
    // else if(!req.session.user_id){
    //   const generateId = Math.floor(100000 + Math.random() * 900000);
    //   req.session.user_id = generateId

    //   if(req.session.user_id){
        
    //   }
    // }
    
    else {
      // Create a new cart
      const newCart = new Cart({
        user: user,
        items: [
          {
            product: productId,
            quantity: qty,
            price: product.offerprice || product.price,
          },
        ],
      });

      await newCart.save();
    }

    res.redirect("/cart");
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Error storing data in cart");
  }
};
const updateCart = async (req, res) => {
  try {
    const { itemId, quantity } = req.body;

    const cart = await Cart.findOne({ user: req.session.user_id });
    const existingItem = cart.items.find(
      (item) => item.product.toString() === itemId
    );
    const product = await Product.findOne({ _id: itemId });

    const initialQuantity = existingItem.quantity;
    const quantityDiff = quantity - initialQuantity;

    // Check if requested quantity exceeds available stock
    if (quantity > product.Stock) {
      // Set quantity to available stock quantity
      existingItem.quantity = product.Stock;
    } else {
      existingItem.quantity = quantity;
    }

    // Calculate item price based on offer price or regular price
    const itemPrice = product.offerprice || product.price;
    existingItem.price = existingItem.quantity * itemPrice;

    // Update cart price based on the updated item prices
    const total = cart.items.reduce((acc, item) => acc + item.price, 0);
    cart.price = total;

    await cart.save();
    await product.save();

    res.status(200).json({
      success: true,
      message: "Cart updated successfully",
      cart,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal server error");
  }
};


const deleteCart = async (req, res) => {
  try {
    const productId = req.params.id;
    const userId = req.session.user_id;

    const cart = await Cart.findOne({ user: userId });

    const existingItem = cart.items.find((item) =>
      item.product.equals(productId)
    );

    if (!existingItem) {
      return res.status(404).json({ error: "Product not found in cart" });
    }

    const product = await Product.findById(productId);
    const priceToRemove = product.offerprice || product.price;

    cart.items = cart.items.filter((item) => !item.product.equals(productId));

    const total = cart.items.reduce((acc, item) => acc + item.price, 0);
    cart.price = total;

    await cart.save();

    res.json({
      message: "Product removed from cart",
      priceToRemove: priceToRemove,
      cart: cart,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
};


const loadcheckout = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const user = await User.findById(userId);
    const address = user.addresses;
    const productId = await Cart.findOne().populate("items.product");
    const price = await Cart.findOne({ user: userId });
    // console.log(user);
    // console.log(productId);
    if (user && productId.items.length >= 0) {
      res.render("users/checkout.ejs", { user, price, productId, address });
    } else {
      res.redirect("/cart");
    }
    // console.log(address);
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const loadaddress = async (req, res) => {
  try {
    res.render("users/address.ejs");
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const addAddress = async (req, res) => {
  try {
    const { firstname, lastname, country, address, city, state, post, mobile } =
      req.body;

    const userId = req.session.user_id;

    // Find the user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.redirect("/address");
    }

    // Add the new address to the user's addresses array
    user.addresses.push({
      firstname,
      lastname,
      country,
      address,
      city,
      state,
      post,
      mobile,
    });

    // Save the updated user object
    await user.save();

    // Redirect or send a response
    res.redirect("/checkout");
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const getEditaddress = async (req, res) => {
  try {
    const addId = req.params.id;
    // console.log(addId);
    const user = await User.findById(req.session.user_id);
    const address = user.addresses.find(
      (addr) => addr._id.toString() === addId
    );
    // console.log(address);
    res.render("users/editAddress.ejs", { address });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("internal server error");
  }
};

const UpdateAddress = async (req, res) => {
  try {
    const addId = req.params.id;
    console.log(addId);
    const { firstname, lastname, country, address, city, state, post, mobile } =
      req.body;
    console.log(req.body);

    const user = await User.findById(req.session.user_id);

    const addressIndex = user.addresses.findIndex(
      (addr) => addr._id.toString() === addId
    );

    if (addressIndex !== -1) {
      // Update the specific address within the addresses array
      user.addresses[addressIndex] = {
        _id: addId,
        firstname,
        lastname,
        country,
        address,
        city,
        state,
        post,
        mobile,
      };

      await user.save();

      res.redirect("/checkout");
    } else {
      res.status(404).send("Address not found");
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal server error");
  }
};

const forgetPassword = (req, res) => {
  try {
    res.render("users/forget.ejs");
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const forgetVerify = async (req, res) => {
  try {
    const email = req.body.email;
    // console.log(email);
    const userData = await User.findOne({ email: email });
    // console.log(userData);

    if (userData) {
      if (userData.is_block) {
        res.render("users/forget.ejs", { message: "please verify your email" });
      } else {
        const randomString = randomstring.generate();
        const updatedata = await User.updateOne(
          { email: email },
          { $set: { token: randomString } }
        );
        sendVerifyemail(userData.name, userData.email, randomString);
        res.render("users/forget.ejs", {
          message: "please check your email to reset your password",
        });
      }
    } else {
      res.render("users/forget.ejs", { message: "your email is incorrect" });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const sendVerifyemail = (name, email, token) => {
  // create reusable transporter object using SMTP transport
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: "hanginghammer21@gmail.com",
      pass: "dmuqptimnxuyyacx",
    },
  });
  const mailOptions = {
    from: "hanginghammer21@gmail.com",
    to: email,
    subject: "Hello",
    text: "For Reset Password",
    html:
      "<p>Hii " +
      name +
      ', please click here to <a href="http://127.0.0.1:3000/forgetVerify?token=' +
      token +
      '">reset</a> your password </p>',
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
    } else {
      console.log("Message sent: %s", info.messageId);
    }
  });
};

const loadreset = async (req, res) => {
  try {
    const token = req.query.token;
    const tokendata = await User.findOne({ token: token });
    if (tokendata) {
      res.render("users/reset.ejs", { user_id: tokendata._id });
    } else {
      res.redirect("/forget");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const restpass = async (req, res) => {
  try {
    const password = req.body.password;
    const user_id = req.body.user_id;
    const secure = await securepassword(password);

    const Userdata = await User.findByIdAndUpdate(
      { _id: user_id },
      { $set: { password: secure, token: "" } }
    );

    res.redirect("/login");
  } catch (error) {
    console.log(error.message);
  }
};

const securepassword = async (password) => {
  try {
    const passHash = await bcrypt.hash(password, 10);
    return passHash;
  } catch (error) {
    console.log(error.message);
  }
};

const loadorder = async (req, res) => {
  try {
    const userId = req.session.user_id;
    // console.log(userId);
    const order = await Order.find({ user: userId })
      .populate("items.product")
      .sort({ _id: -1 });
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;

    const skip = (page - 1) * limit;

    const paginatedOrder = order.slice(skip, skip + limit);

    const totalPages = Math.ceil(order.length / limit);

    res.render("users/orders.ejs", {
      order: paginatedOrder,
      totalPages: totalPages,
      currentPage: page,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const searchProduct = async (req, res) => {
  try {
    const user = req.session._id;
    const search = req.body.search;
    console.log(search);
    const searchPattern = new RegExp(search, "i");
    const searchedProducts = await Product.find({ name: searchPattern }).exec();
    const searchedProductIds = searchedProducts.map((product) => product._id);

    const otherProducts = await Product.find({
      _id: { $nin: searchedProductIds },
    }).exec();

    const products = searchedProducts;
    res.json(products);
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const editOrder = async (req, res) => {
  try {
    const orderid = req.query.orderid;
    // console.log(orderid);
    const oneorder = await Order.findById(orderid).populate("user");
    const shippingAddressId = oneorder.shippingAddress;
    const shippingAddress = oneorder.user.addresses.find(
      (address) => address._id.toString() === shippingAddressId.toString()
    );
    console.log(shippingAddress);
    const orders = await Order.findById(orderid).populate("items.product");
    // console.log(orders);

    // console.log(oneorder)
    res.render("users/editOrder.ejs", { oneorder, shippingAddress, orders });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

const invoice = async (req, res) => {
  try {
    const orderId = req.body.orderId;
    const order = await Order.findById(orderId)
      .populate({
        path: "items.product",
        model: "Product",
      })
      .populate("user"); // Populate the "user" field

    console.log("Order:", order);

    if (!order) {
      throw new Error("Order not found");
    }

    const user = order.user;
    console.log("User:", user);

    if (!user) {
      throw new Error("User not found");
    }

    const shippingAddressId = order.shippingAddress;
    const shippingAddress = user.addresses.find(
      (address) =>
        address._id && address._id.toString() === shippingAddressId.toString()
    );
    console.log("Shipping Address:", shippingAddress);

    if (!shippingAddress) {
      throw new Error("Shipping address not found");
    }

    const invoiceData = await generateInvoice(order, shippingAddress);

    // Set the appropriate headers for file download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=invoice.pdf`);

    // Send the invoice data as the response
    res.send(invoiceData);
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal server error");
  }
};

async function generateInvoice(order, shippingAddress) {
  const invoiceData = {
    currency: "USD",
    taxNotation: null, // or gst
    marginTop: 25,
    marginRight: 25,
    marginLeft: 25,
    marginBottom: 25,
    images: {
      logo: "https://drive.google.com/uc?export=download&id=1dMlX3qopqC_ONzgfxcjG2rxG4Ur-URcY",
      background: "",
    },
    sender: {
      company: "WINKEL Ecommerce",
      address: "padanilam Town,Nooranad ,Alappuzha,690529",
      email: "hanginghammer21@gmail.com",
      phone: "7025927638",
    },
    client: {
      company: shippingAddress.firstname,
      address: shippingAddress.address,
      city: shippingAddress.state,
      zip: shippingAddress.mobile,
    },
    information: {
      number: "INV" + Math.random().toString(36).substring(2),
      date: new Date().toLocaleDateString(),
    },
    products: order.items.map((item) => ({
      quantity: item.quantity,
      description: item.product.name,
      "tax-rate": 0,
      price: order.totalPrice,
    })),
    bottomNotice: "Thank you for your business!",
  };

  const result = await easyinvoice.createInvoice(invoiceData);
  const pdfBuffer = Buffer.from(result.pdf, "base64");

  return pdfBuffer;
}

const CreateOrder = async (req, res) => {
  try {
    const addressId = req.body.selectedItemId;
    const userData = req.session.user_id;

    const coupons = await Coupon.find();
    const user = await User.findById(userData);
    const cart = await Cart.find({ user: userData });

    const selectedAddress = user.addresses.find(
      (address) => address._id.toString() === addressId
    );
    const selectaddress = selectedAddress._id;

    const orderID = uuidv4();

    const orderItems = cart[0].items.map((item) => {
      return {
        product: item.product,
        quantity: item.quantity,
      };
    });


    let  subtotal = cart[0].items.reduce((total, item) => total + item.price, 0);
    // const userAppliedCouponId = user.coupon[0].toString();

    if (user.coupon.length > 0) {
      const appliedCoupon = coupons.find(
        (coupon) => coupon._id.toString() == user.coupon[0]
      );

      if (appliedCoupon) {
        subtotal -= appliedCoupon.discount;
      }
    }
    
    const discount = subtotal * 0.1;
    // const shipping = 5;
    const totalPrice = (subtotal + discount).toFixed();

    const paymentMethod = req.body.selectedMethod;

    if (paymentMethod == "cash_on_delivery") {
      // console.log("i aM Sved");
      const order = new Order({
        orderID,
        user: user,
        items: orderItems,
        shippingAddress: selectaddress,
        totalPrice: totalPrice,
        paymentMethod: paymentMethod,
      });
      await order.save();
      res.json("Sucess");
      for (const item of orderItems) {
        const product = await Product.findById(item.product);
        product.Stock -= item.quantity;
        await product.save();
      }

      const carts = await Cart.findOne({ user: userData });

      carts.items = [];

      await carts.save();

      for (const coupon of coupons) {
        coupon.usedBy = [];
        await coupon.save();
      }

      user.coupon = [];
      await user.save();
    } else {
      const generateRazorpay = (orderId) => {
        return new Promise((resolve, reject) => {
          const orderOptions = {
            amount: (totalPrice * 100).toFixed(),
            currency: "INR",
            receipt: orderId,
            payment_capture: 1,
          };
          instance.orders.create(orderOptions, function (err, order) {
            if (err) {
              reject(err);
            } else {
              resolve(order);
            }
          });
        });
      };

      const generatedOrder = await generateRazorpay(orderID);
      // console.log(generatedOrder);

      // return res.json("successfull");
      res.json({ generatedOrder: generatedOrder });

      // const payment = req.body.response;
      // const ordrid = req.body.order;
      // console.log(payment, ordrid);

      console.log(req.body);
      // await order.save();
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const loadSuccess = async (req, res) => {
  try {
    res.render("users/sucess.ejs");
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const verifyPayment = async (req, res) => {
  try {
    const payment = req.body.response;
    const ordrid = req.body.order;

    const addressId = req.body.selectedAddress;
    const paymentMethod = req.body.selectedMethod;

    console.log(payment, ordrid, addressId, paymentMethod);

    const userData = req.session.user_id;

    const coupons = await Coupon.find();
    const user = await User.findById(userData);
    const cart = await Cart.find({ user: userData });
    console.log(cart);

    const selectedAddress = user.addresses.find(
      (address) => address._id.toString() === addressId
    );
    const selectaddress = selectedAddress._id;

    const orderID = uuidv4();

    const orderItems = cart[0].items.map((item) => {
      return {
        product: item.product,
        quantity: item.quantity,
      };
    });

    let  subtotal = cart[0].items.reduce((total, item) => total + item.price, 0);
 

    if (user.coupon.length > 0) {
      const appliedCoupon = coupons.find(
        (coupon) => coupon._id ==user.coupon[0]
      );

      if (appliedCoupon) {
        subtotal -= appliedCoupon.discount;
      }
    }

    const discount = subtotal * 0.1;

    const totalPrice = subtotal + discount;

    const order = new Order({
      orderID,
      user: user,
      items: orderItems,
      shippingAddress: selectaddress,
      totalPrice: totalPrice,
      paymentMethod: paymentMethod,
      razorpayOrderId: payment.razorpay_payment_id,
    });
    await order.save();
    res.json({ status: true, message: "Payment verification successful" });
    for (const item of orderItems) {
      const product = await Product.findById(item.product);
      product.Stock -= item.quantity;
      await product.save();
    }

    const carts = await Cart.findOne({ user: userData });

    carts.items = [];

    await carts.save();

    for (const coupon of coupons) {
      coupon.usedBy = [];
      await coupon.save();
    }

    user.coupon = [];
    await user.save();
  } catch (error) {
    console.error("Error verifying payment:", error);
    throw new Error("Payment verification failed");
  }
};

const loadProfile = async (req, res) => {
  try {
    const user = req.session.user_id;
    const users = await User.findById({ _id: user });

    res.render("users/profile.ejs", { users });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const loadmanage = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const user = await User.findById(userId);
    const address = user.addresses;
    res.render("users/manageaddress.ejs", { address });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const editProfiladdress = async (req, res) => {
  try {
    const editId = req.params.id;
    // console.log(addId);
    const user = await User.findById(req.session.user_id);
    const address = user.addresses.find(
      (addr) => addr._id.toString() === editId
    );
    // console.log(address);
    res.render("users/editProfileadd.ejs", { address });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const UpdateprofileAddress = async (req, res) => {
  try {
    const addId = req.params.id;
    // console.log(addId);
    const { firstname, lastname, country, address, city, state, post, mobile } =
      req.body;
    // console.log(req.body);

    const user = await User.findById(req.session.user_id);

    const addressIndex = user.addresses.findIndex(
      (addr) => addr._id.toString() === addId
    );

    if (addressIndex !== -1) {
      user.addresses[addressIndex] = {
        _id: addId,
        firstname,
        lastname,
        country,
        address,
        city,
        state,
        post,
        mobile,
      };

      await user.save();

      res.redirect("/manageaddress");
    } else {
      res.status(404).send("Address not found");
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal server error");
  }
};

const deleteAddress = async (req, res) => {
  try {
    const deleId = req.params.id;
    console.log(deleId);
    const user = await User.findById(req.session.user_id);
    const addressIndex = user.addresses.findIndex(
      (addr) => addr._id.toString() === deleId
    );

    if (addressIndex !== -1) {
      user.addresses.splice(addressIndex, 1);
      await user.save();
    }

    res.redirect("/manageaddress");
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const editProfile = async (req, res) => {
  try {
    const user = req.session.user_id;
    //  console.log(user)
    const Userdata = await User.findById(user);
    //  console.log(Userdata)
    res.render("users/editprofile.ejs", { Userdata });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const Updateprofile = async (req, res) => {
  try {
    const user = req.session.user_id;
    console.log(user);
    //  const Userdata=await User.findById(user)
    //  console.log(Userdata)
    const { name, email, mobile } = req.body;
    console.log(req.body);

    const update = await User.findByIdAndUpdate(
      user,
      {
        $set: {
          name,
          email,
          mobile,
        },
      },
      { new: true }
    );
    // console.log(update)
    update.save();
    console.log(update);
    res.redirect("/profile");
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal server error");
  }
};
const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.body;

    const order = await Order.findOne({ _id: orderId });
    let value = order.status;
    // if (!value.trim() == "returned") {
    var cOrder = await Order.findByIdAndUpdate(
      orderId,
      { $set: { status: "cancelled" } },
      { new: true }
    );
    // }
    res.json(cOrder);
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal server error");
  }
};

const wallet = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const user = await User.findById(userId);

    const totalAmount = user.Wallet.reduce((total, item) => total + item.amount, 0);

    res.render("users/wallet.ejs",{totalAmount})

    
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal server error");
  }
};


module.exports = {
  loadhome,
  loadhomes,
  loginpage,
  loadsignUp,
  insertUser,
  sendOTP,
  verifyOtp,
  verifylogin,
  userLogout,
  getShop,
  getSingle,
  loadCart,
  addtoCart,
  updateCart,
  loadcheckout,
  loadaddress,
  addAddress,
  forgetPassword,
  forgetVerify,
  loadorder,
  loadreset,
  deleteCart,
  CreateOrder,
  loadSuccess,
  loadProfile,
  loadmanage,
  getEditaddress,
  UpdateAddress,
  editProfiladdress,
  UpdateprofileAddress,
  deleteAddress,
  restpass,
  editOrder,
  editProfile,
  Updateprofile,
  cancelOrder,
  couponManagment,
  removeCoupon,
  searchProduct,
  shopFilter,
  verifyPayment,
  invoice,
  resendOtp,
  getPricefilter,
  wallet
};
