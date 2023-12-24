const isLogged = (req, res, next) => {
    try{
  if (req.session.admin_id) {
    
  } else {
    res.redirect("/admin/login");
  }
  next()
}catch(error){
console.log(error.message)
}
}

const notLogged = (req, res, next) => {
  if (req.session.admin_id) {
  
    
 res.redirect("/admin/category");
  } else {
    next();
  }
};

module.exports = { isLogged, notLogged };