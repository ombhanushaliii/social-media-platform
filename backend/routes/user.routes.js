const express = require('express');
const { 
  signup, 
  login, 
  googleLogin,
  updateUsername,
  sendPasswordResetEmail, 
  sendSignInLinkToEmail, 
  verifyEmailLink,
  logout,
  post,
  linkedinPost,
  linkedinCallback,
  getConversations,
  sendMessage
} = require('../controllers/user.controller');
const { authenticateToken, requireInstagramAccess } = require('../middleware/auth.middleware');
const upload = require('../multer');
const router = express.Router();

// Authentication routes
router.post('/signup', signup);
router.post('/login', login);
router.post('/google-login', googleLogin);
router.post('/forgot-password', sendPasswordResetEmail);
router.post('/send-signin-link', sendSignInLinkToEmail);
router.post('/verify-email-link', verifyEmailLink);
router.post('/logout', logout);

// Social media posting routes
router.post('/post', authenticateToken, requireInstagramAccess, upload.single('image'), post); // Instagram - restricted
router.post('/linkedin/post', upload.single('image'), linkedinPost); // LinkedIn - available to all

// LinkedIn OAuth routes
router.get('/auth/linkedin/callback', linkedinCallback);

// Messaging routes
router.get('/messages/conversations', getConversations);
router.post('/messages/send', upload.single('attachment'), sendMessage);

// Protected routes
router.put('/update-username', authenticateToken, updateUsername);

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