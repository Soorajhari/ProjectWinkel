const multer = require("multer");
const path = require("path");




const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/productimages");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + file.originalname);
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|avif/;
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      return cb(new Error("Only JPEG, JPG, PNG, and WEBP files are allowed"));
    }
  },
});


// const cropImageMiddleware = (req, res, next) => {
//   if (req.file) {
//     const { path: imagePath } = req.file;
//     const croppedImagePath = imagePath.replace(/(\.[\w\d_-]+)$/i, "-cropped$1");
//     console.log(croppedImagePath);
//     sharp(imagePath)
//       .resize(100, 200) // Adjust the desired dimensions for the cropped image
//       .toFile(croppedImagePath, (error) => {
//         if (error) {
//           console.error("Error cropping image:", error);
//           return res.status(500).send("Internal Server Error");
//         }
//         req.file.path = croppedImagePath;
//         next();
//       });
//   } else {
//     next();
//   }
// };


module.exports =  upload 
