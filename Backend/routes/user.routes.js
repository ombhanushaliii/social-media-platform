const express=  require('express');
const { post } = require('../controllers/user.controller');
const router=express.Router();
const upload=require('../multer')

// router.post('/signup', signup);
// router.post('/login', login);
router.post('/post',upload.single('image'), post);

module.exports=router;