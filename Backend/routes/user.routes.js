const express = require('express');
const { post, linkedinCallback } = require('../controllers/user.controller');
const router = express.Router();
const upload = require('../multer');

// Existing routes
router.post('/post', upload.single('image'), post);

// LinkedIn OAuth routes
router.get('/auth/linkedin/callback', linkedinCallback);

module.exports = router;