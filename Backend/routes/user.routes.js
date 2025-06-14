const express = require('express');
const { post, linkedinCallback } = require('../controllers/user.controller');
const router = express.Router();
const upload = require('../multer');

// Existing routes
router.post('/post', upload.single('image'), post);

// LinkedIn OAuth routes
router.get('/auth/linkedin/callback', linkedinCallback);

// Test route for LinkedIn configuration
router.get('/test/linkedin-config', (req, res) => {
  res.json({
    client_id: process.env.LINKEDIN_CLIENT_ID,
    client_secret: process.env.LINKEDIN_CLIENT_SECRET ? 'Present' : 'Missing',
    redirect_uri: process.env.LINKEDIN_REDIRECT_URI,
    frontend_url: process.env.FRONTEND_URL,
    environment: process.env.NODE_ENV
  });
});

module.exports = router;