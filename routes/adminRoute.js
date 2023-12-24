const express = require("express");
const router = express.Router({ body: true });

const adminController = require("../controllers/adminController");
const  upload =require("../middleware/multer")

const adminAuth=require("../middleware/adminAuth")


router.get("/login",adminAuth.notLogged,   adminController.loadLogin);

// router.post("/",adminController.verify)

router.post("/login", adminController.verifyLogin)


// router.use(adminAuth.isLogged)

router.get("/user", adminController.getUsers);

router.put("/users/:id/block",  adminController.blockUser);

router.get("/category", adminController.getCategory)


router.get("/category/addUser",adminController.getaddUser)

router.post("/category/addCategory",adminController.addCategory)

router.get("/category/editCategory/:id", adminController.editCategory)

router.post("/category/editCategory/:id",adminController.updateCategory)

router.put('/category/deleteCategory/:id', adminController.deleteCategory);


router.get("/product",adminController.getproduct)

router.get("/product/addproduct",adminController.getAddproduct)


router.post("/product/addproduct" ,upload.array('image', 2),adminController.addProduct)

router.get("/product/editProduct/:id",adminController.editProduct)

router.post("/product/editProduct/:id",upload.array('image', 2),adminController.updateproduct)

router.put("/product/deleteProduct/:id",adminController.deleteProduct)

router.get("/orderadmin",adminController.loadorder)

router.get("/editOrder/:id", adminController.loadEdit);

router.post("/editOrder/:id", adminController.updateStatus);

router.get("/coupon",adminController.loadCoupon)

router.post("/coupon",adminController.deleteCoupon)

router.get("/coupon/addcoupon",adminController.loadaddCoupon)

router.post("/coupon/addcoupon",adminController.addCoupon)

router.get("/coupon/editcoupon/:id",adminController.editCoupon)

router.post("/coupon/editcoupon/:id",adminController.updateCoupon)

router.get("/banner",adminController.loadbanner)

router.get("/addbanner",adminController.loadaddbanner)

router.post("/addbanner",upload.array('image', 1),adminController.addbanner)

router.get("/banner/editbanner/:id", upload.array('image', 1), adminController.loadEditbanner);

router.post("/banner/editbanner/:id", upload.array('image', 1), adminController.updateBanner);

router.get("/logout",adminController.adminLogout)

router.get("/return",adminController.loadreturn)

router.post("/return",adminController.returnOrder)

router.get("/editreturn/:id",adminController.loadeditReturn)

router.post("/editreturn/:id",adminController.editreturn)


router.post("/repay",adminController.rePayamount)

router.get("/admindashboard",adminController.loadAdmin)

router.post("/sale" ,adminController.salesReport)


router.get("/offer",adminController.offerManagment)

router.post("/offer",adminController.changePrice)

router.post("/offer/delete",adminController.deletesOffer)


router.get("/offer/addoffer",adminController.loadaddoffer)

router.post("/offer/addoffer",adminController.addofferManagment)

router.get("/offer/editoffer/:id",adminController.editOffer)

router.post("/offer/editoffer/:id",adminController.updateOffer)

router.get("/week",adminController.weekData)

router.get("/month",adminController.monthData)

router.get("/year",adminController.yearData)

router.get("/ordermonth",adminController.ordermonthData)

router.get("/orderyear",adminController.yearData)





module.exports = router;
