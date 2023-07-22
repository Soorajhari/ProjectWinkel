const User = require('../models/userSchema')


 const isLogged=async (req, res, next) => {
    
    if (req.session.user1) {
      const userId = req.session.user_id
      const user= await User.findById(userId)
      if (user.is_block) {
        req.session.user1 = null
        res.redirect('/login')
      } else {
        next()
      }
    } else {
      
      res.redirect('/login')
    }
  }


 const  notLoggd = (req, res, next) => {
    if (!req.session.user1) {
      next()
    } else {
      res.redirect('/home')
    }
  }


  module.exports={isLogged,notLoggd}