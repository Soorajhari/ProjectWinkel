const Admin = require("../models/adminSchema");
const User = require("../models/userSchema");
const Category = require("../models/categorySchema");
const bcrypt = require("bcrypt");
const Product = require("../models/productSchema");
const Order = require("../models/order");
const Cart = require("../models/cartSchema");
const Coupon = require("../models/coupenSchema");
const Banner = require("../models/banner");
const Return = require("../models/returnSchema");
const Offer = require("../models/offerSchema");
const mongoose = require("mongoose");
const PDFDocument = require("pdfkit");
const ExcelJS = require("exceljs");
const fs = require("fs");
const sharp = require("sharp");
const path = require("path");

const loadLogin = (req, res) => {
  try {
    res.render("admin/login.ejs");
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server");
  }
};

const verifyLogin = async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  try {
    const adminData = await Admin.findOne({ email: email });
    if (!adminData) {
      return res.render("admin/login", {
        message: "Admin not found",
      });
    }

    const passwordMatch = await bcrypt.compare(password, adminData.password);
    if (!passwordMatch) {
      return res.render("admin/login", {
        message: "Invalid username or password",
      });
    }

    req.session.admin_id = adminData._id;
    req.session.email = adminData.email;
    req.session.admin1 = true;

    res.redirect("/admin/category");
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const getUsers = async (req, res) => {
  try {
    const USerData = await User.find();
    res.render("admin/users.ejs", { user: USerData });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("internal server error");
  }
};

const blockUser = async (req, res) => {
  const userId = req.params.id;
  console.log(req);

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    user.is_block = !user.is_block;
    await user.save();

    res.status(200).send("Successfully updated");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

const getCategory = async (req, res) => {
  try {
    const cataData = await Category.find({ deleted: false });
    res.render("admin/category.ejs", { category: cataData });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("internal server error");
  }
};

const getaddUser = (req, res) => {
  try {
    res.render("admin/AddCata.ejs");
  } catch (error) {
    console.log(error.message);
  }
};

const addCategory = async (req, res) => {
  try {
    const namenew = req.body.name;
    const newdisc = req.body.description;
    console.log(namenew);
    console.log(newdisc);

    const existingCategory = await Category.findOne({
      name: { $regex: new RegExp(`^${namenew}$`, "i") },
    });

    if (existingCategory) {
      res.render("admin/AddCata.ejs", {
        message: "Category already exists. Please use a unique name.",
      });
      return;
    }

    const newCategory = new Category({ name: namenew, description: newdisc });
    await newCategory.save();

    res.redirect("/admin/category");
  } catch (err) {
    console.error(err);
    res.render("admin/AddCata.ejs", {
      message: "An error occurred while adding the category.",
    });
  }
};

const editCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;
    console.log(categoryId);
    const category = await Category.findById(categoryId);
    // console.log(category)
    if (category) {
      res.render("admin/editCata.ejs", { category });
    } else {
      res.redirect("admin/category");
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
};
const updateCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;
    console.log(categoryId);
    const { name, description } = req.body;

    const update = await Category.findByIdAndUpdate(
      categoryId,
      {
        $set: { name, description },
      },
      { new: true }
    );

    res.redirect("/admin/category");
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
};

const deleteCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;
    console.log(categoryId);
    const softDelete = await Category.findByIdAndUpdate(categoryId, {
      $set: {
        deleted: true,
      },
    });

    if (!softDelete) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json("Coupon deleted successfully");
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const getproduct = async (req, res) => {
  try {
    const productData = await Product.find({ isdeleted: false }).populate(
      "categoryId"
    );

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 3;

    const skip = (page - 1) * limit;

    const totalProducts = productData.length;
    const totalPages = Math.ceil(totalProducts / limit);

    const paginatedProducts = productData.slice(skip, skip + limit);

    res.render("admin/productView.ejs", {
      product: paginatedProducts,
      totalPages: totalPages,
      currentPage: page,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal server error");
  }
};

const getAddproduct = async (req, res) => {
  try {
    const productData = await Category.find({ deleted: false });
    res.render("admin/addproduct.ejs", { product: productData });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("internal server error");
  }
};

const getEditproduct = async (req, res) => {
  try {
    const productData = await Category.find({ deleted: false });
    res.render("admin/editProduct.ejs", { product: productData });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("internal server error");
  }
};

const addProduct = async (req, res) => {
  try {
    const { name, description, price, categoryId, Color, Size, Stock } =
      req.body;
    const images = req.files;

    const stocknum = 0;
    const pricenum = 0;

    if (Stock < stocknum || price < pricenum) {
      throw new Error("Stock or price is below the minimum threshold.");
    }

    const imagePaths = [];

    for (const image of images) {
      const imagePath = image.path;
      const croppedImagePath = imagePath.replace(
        /(\.[\w\d_-]+)$/i,
        "-cropped$1"
      );

      await sharp(imagePath)
        .resize(400, 600) // Adjust the desired dimensions for the cropped image
        .toFile(croppedImagePath);

      imagePaths.push(croppedImagePath);
    }

    const newProduct = new Product({
      name,
      description,
      categoryId,
      price,
      Color,
      Size,
      Stock,
      image: imagePaths,
    });

    await newProduct.save();
    res.redirect("/admin/product");
  } catch (error) {
    console.log(error.message);
    res.redirect("/admin/product/addproduct");
  }
};

const editProduct = async (req, res) => {
  try {
    const productid = req.params.id;
    // console.log(productid);
    const productData = await Category.find({ deleted: false });
    const products = await Product.findById(productid);
    // console.log(products);
    if (products) {
      res.render("admin/editProduct.ejs", { products, product: productData });
    } else {
      res.redirect("admin/product");
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).send("internal server error");
  }
};
const updateproduct = async (req, res) => {
  try {
    const productid = req.params.id;
    const { name, description, price, categoryId, Color, Size, Stock } =
      req.body;

    const product = await Product.findById(productid);

    const existingImages = req.body.existingImages || [];
    const updatedImages = req.files ? req.files.map((file) => file.path) : [];

    const croppedImages = [];

    for (const image of updatedImages) {
      const imagePath = image;
      const croppedImagePath = imagePath.replace(
        /(\.[\w\d_-]+)$/i,
        "-cropped$1"
      );
      await sharp(imagePath).resize(400, 600).toFile(croppedImagePath);
      croppedImages.push(croppedImagePath);
    }

    const updatedImagePathList =
      updatedImages.length > 0 ? croppedImages : existingImages;

    const stocknum = 0;
    const pricenum = 0;

    if (Stock < stocknum || price < pricenum) {
      return res.json("Stock or price is below the minimum threshold.");
    }

    const update = await Product.findByIdAndUpdate(
      productid,
      {
        $set: {
          name,
          description,
          price,
          categoryId,
          Color,
          Size,
          Stock,
          image: updatedImagePathList,
        },
      },
      { new: true }
    );

    res.json("success");
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal server error");
  }
};

const deleteProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    // console.log(productId)
    const softDelete = await Product.findByIdAndUpdate(productId, {
      $set: {
        isdeleted: true,
      },
    });

    if (!softDelete) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json("Coupon deleted successfully");
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const adminLogout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.log(err);
      res.status(500).send("Error destroying session");
    } else {
      res.clearCookie("connect.sid");
      res.redirect("/admin/login");
    }
  });
};

const loadorder = async (req, res) => {
  try {
    // const address = await Address.findById(addressId);
    // const cart = await Cart.findById(cartId);

    const orders = await Order.find();

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const skip = (page - 1) * limit;

    const totalProducts = orders.length;
    const totalPages = Math.ceil(totalProducts / limit);
    const paginatedorder = orders.slice(skip, skip + limit);
    res.render("admin/order.ejs", {
      orders: paginatedorder,
      totalPages: totalPages,
      currentPage: page,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const loadEdit = async (req, res) => {
  try {
    const orderid = req.params.id;

    const order = await Order.findById(orderid).populate("user");
    const shippingAddressId = order.shippingAddress;
    const shippingAddress = order.user.addresses.find(
      (address) => address._id.toString() === shippingAddressId.toString()
    );

    const price = await Cart.find();

    const orders = await Order.findById(orderid).populate("items.product");
    res.render("admin/editOrder.ejs", {
      order,
      price,
      shippingAddress,
      orders,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const updateStatus = async (req, res) => {
  try {
    const orderID = req.params.id;
    const status = req.body.status;

    const updatedOrder = await Order.findByIdAndUpdate(
      orderID,
      { $set: { status: status } },
      { new: true }
    );
    res.json(updatedOrder);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

const loadCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.find();
    res.render("admin/Acoupon.ejs", { coupon });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const loadaddCoupon = async (req, res) => {
  try {
    res.render("admin/AddCoupon.ejs");
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const addCoupon = async (req, res) => {
  try {
    const { code, discount, minValue, validUntil } = req.body;

    const stocknum = 0;
    const pricenum = 0;

    if (discount < stocknum || minValue < pricenum) {
      throw new Error("discount or minValue is below the minimum threshold.");
    }
    if (discount > minValue) {
      throw new Error("it not possible");
    }
    if (new Date(validUntil) < new Date()) {
    throw new Error ("Expiray date not beolow the currrent date");
    }
    const newCoupon = new Coupon({
      code,
      discount,
      minValue,
      validUntil,
    });
    await newCoupon.save();
    res.redirect("/admin/coupon");
  } catch (error) {
    console.log(error.message);
    res.render("admin/AddCoupon.ejs", {
      message: "discount or minValue is below the minimum threshold.",
    });
  }
};

const deleteCoupon = async (req, res) => {
  try {
    const couponId = req.body.id;
    console.log(couponId);

    const deletedCoupon = await Coupon.findByIdAndDelete(couponId);
    if (!deletedCoupon) {
      // Coupon not found
      return res.status(404).json({ error: "Coupon not found" });
    }

    res.status(200).json({
      message: "Coupon deleted successfully",
      deletedCouponId: couponId,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const editCoupon = async (req, res) => {
  try {
    const id = req.params.id;
    const coupon = await Coupon.findById(id);
    res.render("admin/editCoupon.ejs", { coupon });
    console.log(id);
  } catch (error) {
    console.log(error.message);
  }
};

const updateCoupon = async (req, res) => {
  try {
    const id = req.params.id;
    console.log(id);
    const { code, discount, validUntil, minValue } = req.body;
    console.log(code, discount, validUntil, minValue);
    const stocknum = 0;
    const pricenum = 0;

    if (discount < stocknum || minValue < pricenum) {
      return res.json("discount or minValue is below the minimum threshold.");
    }
    if (discount > minValue) {
      return res.json("it is not possible.");
    }
    if (new Date(validUntil) < new Date()) {
      return res.json("Expiray date not beolow the currrent date");
    }
    const coupon = await Coupon.findByIdAndUpdate(
      id,
      {
        $set: {
          code,
          discount,
          validUntil,
          minValue,
        },
      },
      { new: true }
    );

    return res.json("success");
  } catch (error) {
    console.log(error.message);
    return res.status(500).json("An error occurred.");
  }
};

const loadbanner = async (req, res) => {
  try {
    const banners = await Banner.find();

    for (const banner of banners) {
      const currentDate = new Date();
      const expiryAt = new Date(banner.ExpiryAt);

      if (currentDate > expiryAt) {
        banner.active = false;
      }
    }

    res.render("admin/baneer.ejs", { banners });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const loadaddbanner = async (req, res) => {
  try {
    // const banner = await Banner.find();
    res.render("admin/addBanner.ejs");
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const addbanner = async (req, res) => {
  try {
    const { title, description, text, button, ExpiryAt } = req.body;
    // console.log(title, description, text, button, ExpiryAt);
    const images = req.files;

    const imagePaths = [];

    for (const image of images) {
      const imagePath = image.path;
      console.log(imagePath);
      const croppedImagePath = imagePath.replace(
        /(\.[\w\d_-]+)$/i,
        "-cropped$1"
      );
      console.log(croppedImagePath);
      await sharp(imagePath).resize(500, 700).toFile(croppedImagePath);

      imagePaths.push(croppedImagePath);
    }
    // console.log(imagepath);
    if (new Date(ExpiryAt) < new Date()) {
      throw new Error("End date should be after the start date.");
    }
    const newbanner = new Banner({
      title,
      description,
      text,
      button,
      ExpiryAt,
      imagepath: imagePaths,
    });

    await newbanner.save();
    res.redirect("/admin/banner");
  } catch (error) {
    console.log(error.message);
    res.render("admin/addBanner.ejs", {
      message: "Expiray date not beolow the currrent date",
    });
  }
};

const loadEditbanner = async (req, res) => {
  try {
    const bannerid = req.params.id;
    console.log(bannerid);

    const banner = await Banner.findById(bannerid);
    // console.log(banner)
    res.render("admin/editBanner.ejs", { banner });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const updateBanner = async (req, res) => {
  try {
    const bannerid = req.params.id;
    console.log(bannerid);

    const { title, button, description, ExpiryAt, text } = req.body;

    const existingImages = req.body.existingImages || [];
    const updatedImages = req.files ? req.files.map((file) => file.path) : [];

    const croppedImages = [];

    for (const image of updatedImages) {
      const imagePath = image;
      console.log(imagePath);
      const croppedImagePath = imagePath.replace(
        /(\.[\w\d_-]+)$/i,
        "-cropped$1"
      );
      await sharp(imagePath).resize(500, 700).toFile(croppedImagePath);
      croppedImages.push(croppedImagePath);
    }

    const updatedImagePathList =
      updatedImages.length > 0 ? croppedImages : existingImages;

    if (new Date(ExpiryAt) < new Date()) {
      res.json("Expiray date not beolow the currrent date");
    } else {
      const banner = await Banner.findByIdAndUpdate(
        bannerid,
        {
          $set: {
            title,
            button,
            description,
            ExpiryAt,
            text,
            imagepath: updatedImagePathList,
          },
        },
        { new: true }
      );

      res.json("success");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const loadreturn = async (req, res) => {
  try {
    const returns = await Return.find();
    res.render("admin/return.ejs", { returns });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const returnOrder = async (req, res) => {
  try {
    const returnReason = req.body.returnReason;
    const resolutionType = req.body.resolutionType;
    const orderid = req.body.orderId;
    console.log(returnReason, resolutionType, orderid);

    const user = req.session.user_id;

    const newreturn = new Return({
      orderId: orderid,
      userId: user,
      returnReason: returnReason,
      resolutionType: resolutionType,
    });

    await newreturn.save();
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const loadeditReturn = async (req, res) => {
  try {
    const returnId = req.params.id;
    // console.log(returnId)

    const returns = await Return.findById(returnId);

    const orderid = returns.orderId;

    const order = await Order.findById(orderid).populate("user");

    const shippingAddressId = order.shippingAddress;
    const shippingAddress = order.user.addresses.find(
      (address) => address._id.toString() === shippingAddressId.toString()
    );

    const orders = await Order.findById(orderid).populate("items.product");

    res.render("admin/editReturn.ejs", {
      order,
      returns,
      shippingAddress,
      orders,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const editreturn = async (req, res) => {
  try {
    const ReturnID = req.params.id;
    // console.log(ReturnID);

    const returns = await Return.findById(ReturnID);
    const orderId = returns.orderId;
    // console.log(orderId);

    const status = req.body.status;
    // console.log(status);
    const value = returns.status;
    // console.log(typeof value)
    const updatedOrder = await Return.findByIdAndUpdate(
      ReturnID,
      {
        $set: { status: status },
      },
      { new: true }
    );

    if (value.trim() == "Approved") {
      const order = await Order.findByIdAndUpdate(
        orderId,
        { $set: { status: "returned" } },
        { new: true }
      );
    }

    const orders = await Order.findById(orderId);
    const orderItems = orders.items;
    for (const item of orderItems) {
      const product = await Product.findById(item.product);
      console.log(product);
      // product.Stock += item.quantity;
      const stockRemins = Number(product.Stock);
      product.Stock = stockRemins + item.quantity;
      await product.save();
    }

    res.json(updatedOrder);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

const rePayamount = async (req, res) => {
  try {
    const returnId = req.body.refundId;
    // console.log(returnId)
    const returns = await Return.findById(returnId);
    // console.log(returns)
    const orderId = returns.orderId;
    // console.log(orderId)
    const order = await Order.findById(orderId);
    // console.log(order)
    const userId = returns.userId;
    // console.log(userId)
    const userData = await User.findById(userId);
    // console.log(userData)

    const amount = order.totalPrice;
    console.log(amount);

    if (amount > 0) {
      userData.Wallet.push({ amount: amount });
    }
    await userData.save();

    order.totalPrice = 0;
    await order.save();

    console.log(returnId);
    res.status(200).json({ message: "Amount repaid successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

const offerManagment = async (req, res) => {
  try {
    const offers = await Offer.find();

    for (const offer of offers) {
      const currentDate = new Date();
      const expiryAt = new Date(offer.endDate);

      if (currentDate > expiryAt) {
        offer.isActive = false;
      }
    }

    res.render("admin/offer.ejs", { offers });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

const changePrice = async (req, res) => {
  try {
    const offerId = req.body.offerId;
    console.log(offerId);

    const offer = await Offer.findById(offerId).populate("categoryId");
    console.log(offer);

    const categoryId = offer.categoryId;
    console.log(categoryId);

    const products = await Product.find({ categoryId: categoryId });
    console.log(products);

    const errorProducts = [];

    for (const product of products) {
      const newPrice = Math.floor((product.price * offer.offerValue) / 100);
      console.log(newPrice);

      if (newPrice < 0) {
        errorProducts.push(product._id);
      } else {
        product.offerprice = newPrice;
        await product.save();
      }
      if (errorProducts.length > 0) {
        return res.status(400).json({
          message: "Offer price should be greater than zero.",
          errorProducts,
        });
      }
    }

    console.log("Offer prices updated successfully.");
    res.status(200).json({ message: "Offer prices updated successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

const loadaddoffer = async (req, res) => {
  try {
    const product = await Category.find({ deleted: false });
    res.render("admin/addOffer.ejs", { product });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};
const addofferManagment = async (req, res) => {
  try {
    const offerName = req.body.offerName;
    const offerValue = req.body.offerValue;
    const categoryId = req.body.categoryId;
    const startDate = req.body.startDate;
    const endDate = req.body.endDate;
    console.log(offerName, offerValue);

    const offer = new Offer({
      offerName: offerName,
      offerValue: offerValue,
      categoryId: categoryId,
      startDate: startDate,
      endDate: endDate,
    });

    if (new Date(startDate) > new Date(endDate)) {
      res.json("End date should be after the start date.");
    } else {
      await offer.save();
      res.json("sucess");
    }
    console.log("sucess");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

const editOffer = async (req, res) => {
  try {
    const offerId = req.params.id;
    // console.log(offerId);
    const product = await Category.find({ deleted: false });
    const offer = await Offer.findById(offerId);

    res.render("admin/editOffer.ejs", { offer, product });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const updateOffer = async (req, res) => {
  try {
    const offerId = req.params.id;
    console.log(offerId);
    const { offerName, offerValue, categoryId, startDate, endDate } = req.body;
    console.log(offerName, offerValue, categoryId, startDate, endDate);

    if (new Date(startDate) > new Date(endDate)) {
      res.json("End date should be after the start date.");
    } else {
      const updatedOffer = await Offer.findByIdAndUpdate(
        offerId,
        {
          $set: {
            offerName,
            offerValue,
            categoryId,
            startDate,
            endDate,
          },
        },
        { new: true }
      );

      res.json("success");
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const deletesOffer = async (req, res) => {
  try {
    const offerid = req.body.id;
    console.log(offerid);

    const offer = await Offer.findById(offerid).populate("categoryId");

    const categoryId = offer.categoryId;
    console.log(categoryId);

    const products = await Product.find({ categoryId: categoryId });
    console.log(products);

    const deletedCoupon = await Offer.findByIdAndDelete(offerid);

    if (!deletedCoupon) {
      return res.status(404).json({ error: "Coupon not found" });
    }

    for (let i = 0; i < products.length; i++) {
      products[i].offerprice = 0;
      await products[i].save();
    }
    res.status(200).json({
      message: "offer deleted successfully",
      deletedofferId: offerid,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const loadAdmin = async (req, res) => {
  try {
    const totalRevenue = await Order.aggregate([
      { $match: { status: "delivered" } },
      { $group: { _id: null, totalPrice: { $sum: "$totalPrice" } } },
      { $project: { _id: 0, totalPrice: 1 } },
    ]);
    const revenue = totalRevenue[0].totalPrice.toFixed(0);

    const count = await Order.countDocuments();

    const totalSales = await Order.countDocuments({ status: "delivered" });
    const usercount = await User.countDocuments();

    res.render("admin/adminDashboard.ejs", {
      revenue,
      count,
      usercount,
      totalSales,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const weekData = async (req, res) => {
  try {
    const currentDate = new Date();
    const startOfWeek = new Date(currentDate);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() - 6);

    const weeklyData = await Order.aggregate([
      {
        $match: {
          status: "delivered",
          createdAt: { $gte: endOfWeek, $lte: startOfWeek },
        },
      },
      {
        $group: {
          _id: { $dayOfWeek: "$createdAt" },
          totalSales: { $sum: "$totalPrice" },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    res.json(weeklyData);
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const monthData = async (req, res) => {
  try {
    const monthlyData = [];

    for (let month = 0; month < 12; month++) {
      const startOfMonth = new Date();
      startOfMonth.setFullYear(new Date().getFullYear(), month, 1);
      startOfMonth.setHours(0, 0, 0, 0);

      const endOfMonth = new Date(startOfMonth);
      endOfMonth.setMonth(endOfMonth.getMonth() + 1, 0);
      endOfMonth.setHours(23, 59, 59, 999);

      const result = await Order.aggregate([
        {
          $match: {
            status: "delivered",
            createdAt: { $gte: startOfMonth, $lte: endOfMonth },
          },
        },
        {
          $group: {
            _id: null,
            totalSales: { $sum: "$totalPrice" },
          },
        },
      ]);

      const totalSales = result.length > 0 ? result[0].totalSales : 0;
      monthlyData.push(totalSales);
    }

    res.json(monthlyData);
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const yearData = async (req, res) => {
  try {
    const startYear = 2018;
    const currentYear = new Date().getFullYear();
    const yearlyData = [];

    for (let year = startYear; year <= currentYear; year++) {
      const startOfYear = new Date(year, 0, 1);
      startOfYear.setHours(0, 0, 0, 0);

      const endOfYear = new Date(year, 11, 31);
      endOfYear.setHours(23, 59, 59, 999);

      const result = await Order.aggregate([
        {
          $match: {
            status: "delivered",
            createdAt: { $gte: startOfYear, $lte: endOfYear },
          },
        },
        {
          $group: {
            _id: null,
            totalSales: { $sum: "$totalPrice" },
          },
        },
      ]);

      const totalSales = result.length > 0 ? result[0].totalSales : 0;
      yearlyData.push(totalSales);
    }

    res.json(yearlyData);
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const ordermonthData = async (req, res) => {
  try {
    const monthlyorderData = [];

    for (let month = 0; month < 12; month++) {
      const startOfMonth = new Date();
      startOfMonth.setFullYear(new Date().getFullYear(), month, 1);
      startOfMonth.setHours(0, 0, 0, 0);

      const endOfMonth = new Date(startOfMonth);
      endOfMonth.setMonth(endOfMonth.getMonth() + 1, 0);
      endOfMonth.setHours(23, 59, 59, 999);

      const result = await Order.find({
        createdAt: { $gte: startOfMonth, $lte: endOfMonth },
      }).countDocuments();

      const monthlyOrders = {
        month: month + 1,
        totalOrders: result,
      };

      monthlyorderData.push(monthlyOrders);
    }

    res.json(monthlyorderData);
    console.log(monthlyorderData);
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const yearorderData = async (req, res) => {
  try {
    const startYear = 2018;
    const currentYear = new Date().getFullYear();
    const yearOrderData = [];

    for (let year = startYear; year <= currentYear; year++) {
      const orderCount = await Order.find({
        createdAt: {
          $gte: new Date(year, 0, 1),
          $lte: new Date(year, 11, 31, 23, 59, 59, 999),
        },
      }).countDocuments();

      yearOrderData.push({
        year: year,
        totalOrders: orderCount,
      });
    }

    res.json(yearOrderData);
    console.log(yearOrderData);
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};



const salesReport = async (req, res) => {
  try {
    const reportType = req.body.reportType;
    const fileFormat = req.body.fileFormat;

    console.log(reportType, fileFormat);

    const orders = await Order.find({ status: "delivered" }).populate(
      "items.product user"
    );

    if (fileFormat === "pdf") {
      const doc = new PDFDocument();

      const tableHeaderStyle = {
        fontSize: 14,
        bold: true,
      };

      const tableContentStyle = {
        fontSize: 10,
      };

      let yPos = 100;

      // Drawing the starting horizontal line
      doc.moveTo(50, yPos).lineTo(500, yPos).stroke();

      yPos += 5;

      doc.font("Helvetica-Bold").fontSize(12);
      doc.text("Order ID", 50, yPos, { continued: true });
      doc.text("Customer Name", 150, yPos);
      doc.text("Total Amount", 400, yPos);

      yPos += 20; // Increase the vertical position after the table headers

      doc.font("Helvetica").fontSize(10);
      orders.forEach((order) => {
        doc.text(order._id.toString(), 50, yPos, { continued: true });
        doc.text(order.user.name, 150, yPos);
        doc.text(order.totalPrice, 400, yPos);

        doc
          .moveTo(50, yPos + 15)
          .lineTo(500, yPos + 15)
          .stroke();
        yPos += 25;

        doc
          .moveTo(50, yPos - 50)
          .lineTo(50, yPos)
          .stroke();
        doc
          .moveTo(200, yPos - 50)
          .lineTo(200, yPos)
          .stroke();
        doc
          .moveTo(400, yPos - 50)
          .lineTo(400, yPos)
          .stroke();

        doc
          .moveTo(500, yPos - 50)
          .lineTo(500, yPos)
          .stroke();
      });

      doc.end();

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=sales_report.pdf"
      );

      doc.pipe(res);
    } else if (fileFormat === "excel") {
      // Generate Excel report
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Sales Report");

      // Set the column headers
      worksheet.columns = [
        { header: "Order ID", key: "_id", width: 30 },
        { header: "Customer Name", key: "user.name", width: 30 },
        { header: "Total Amount", key: "totalPrice", width: 15 },
        { header: "Payment Method", key: "paymentMethod", width: 15 },
      ];

      // Add data rows to the worksheet
      orders.forEach((order) => {
        worksheet.addRow({
          _id: order._id.toString(),
          "user.name": order.user.name,
          totalPrice: order.totalPrice.toString(),
          paymentMethod: order.paymentMethod.toString(),
        });
      });

      // Generate the Excel file buffer
      const excelBuffer = await workbook.xlsx.writeBuffer();

      // Set the appropriate headers for file download
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=sales_report.xlsx"
      );

      // Send the generated Excel file as the response
      res.send(excelBuffer);
    } else {
      throw new Error("Invalid file format");
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

module.exports = {
  loadLogin,
  verifyLogin,
  getUsers,
  blockUser,
  getCategory,
  getaddUser,
  addCategory,
  editCategory,
  updateCategory,
  deleteCategory,
  getproduct,
  getAddproduct,
  getEditproduct,
  addProduct,
  editProduct,
  updateproduct,
  deleteProduct,
  adminLogout,
  loadorder,
  loadEdit,
  updateStatus,
  loadaddCoupon,
  addCoupon,
  loadCoupon,
  deleteCoupon,
  loadaddbanner,
  addbanner,
  loadbanner,
  loadEditbanner,
  updateBanner,
  loadreturn,
  returnOrder,
  loadeditReturn,
  editreturn,
  editCoupon,
  updateCoupon,
  rePayamount,
  loadAdmin,
  weekData,
  monthData,
  yearData,
  offerManagment,
  addofferManagment,
  loadaddoffer,
  editOffer,
  updateOffer,
  changePrice,
  salesReport,
  deletesOffer,
  ordermonthData,
  yearorderData,
 
};
