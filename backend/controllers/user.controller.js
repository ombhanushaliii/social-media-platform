const { admin, db } = require("../config/firebase");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const cloudinary = require("cloudinary").v2;

const COOKIE_NAME = process.env.COOKIE_NAME || "authToken";
const JWT_SECRET = process.env.JWT_SECRET || "jwt_secret";
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || "user@whizmedia.com";

// Helper function to check if username exists
const checkUsernameExists = async (username) => {
  const snapshot = await db.collection("users")
    .where("username", "==", username.toLowerCase())
    .limit(1)
    .get();
  return !snapshot.empty;
};

// Helper function to generate unique username
const generateUniqueUsername = async (baseUsername) => {
  let username = baseUsername.toLowerCase().replace(/[^a-zA-Z0-9_]/g, '');
  let counter = 1;
  
  while (await checkUsernameExists(username)) {
    username = `${baseUsername.toLowerCase().replace(/[^a-zA-Z0-9_]/g, '')}${counter}`;
    counter++;
  }
  
  return username;
};

const signup = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Basic validation
    if (!username?.trim() || !email?.trim() || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Username validation
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(username)) {
      return res.status(400).json({ 
        message: "Username must be 3-20 characters long and contain only letters, numbers, and underscores" 
      });
    }

    // Password length check
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    // Check if username already exists
    if (await checkUsernameExists(username)) {
      return res.status(400).json({ message: "Username already taken" });
    }

    // Check if email already exists
    let existingUser;
    try {
      existingUser = await admin.auth().getUserByEmail(email);
    } catch (err) {
      // User doesn't exist, which is what we want
    }

    if (existingUser) {
      return res.status(400).json({ message: "Email already in use" });
    }

    // Create user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: username,
      emailVerified: false
    });

    // Determine user role and permissions - only test user gets Instagram access
    const role = email === TEST_USER_EMAIL ? 'admin' : 'user';
    const instagramAccess = email === TEST_USER_EMAIL;

    // Save user data in Firestore
    await db.collection("users").doc(userRecord.uid).set({
      uid: userRecord.uid,
      username: username.toLowerCase(),
      email,
      role,
      instagramAccess,
      instagramConnected: false,
      linkedinConnected: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Generate JWT token
    const token = jwt.sign({ uid: userRecord.uid, role }, JWT_SECRET, { expiresIn: "7d" });

    // Set cookie
    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      message: "Signup successful",
      user: { 
        uid: userRecord.uid, 
        username: username.toLowerCase(),
        email, 
        role,
        instagramAccess,
        token 
      },
    });

  } catch (error) {
    console.error("Signup error:", error);
    
    if (error.code && error.code.includes("auth")) {
      return res.status(400).json({ message: error.message });
    }

    res.status(500).json({
      message: "Something went wrong",
      error: error.message,
    });
  }
};

const login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier?.trim() || !password) {
      return res.status(400).json({ message: "Username/Email and password are required" });
    }

    let email = identifier;
    let userDoc = null;

    // Check if identifier is username or email
    if (!identifier.includes('@')) {
      // It's a username, find the email
      const snapshot = await db.collection("users")
        .where("username", "==", identifier.toLowerCase())
        .limit(1)
        .get();
      
      if (snapshot.empty) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      userDoc = snapshot.docs[0];
      email = userDoc.data().email;
    }

    // Firebase Auth REST API Login
    const response = await axios.post(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.FIREBASE_API_KEY}`,
      {
        email,
        password,
        returnSecureToken: true,
      }
    );

    const { idToken, localId } = response.data;

    // Fetch user data from Firestore if not already fetched
    if (!userDoc) {
      userDoc = await db.collection("users").doc(localId).get();
    }

    if (!userDoc.exists) {
      return res.status(404).json({ message: "User data not found" });
    }

    const user = userDoc.data();

    // Generate JWT token
    const token = jwt.sign({ uid: localId, role: user.role }, JWT_SECRET, { expiresIn: "7d" });

    // Set cookie
    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      message: "Login successful",
      user: { 
        uid: user.uid, 
        username: user.username,
        email: user.email, 
        role: user.role,
        instagramAccess: user.instagramAccess || false,
        token 
      },
    });

  } catch (error) {
    console.error("Login error:", error.response?.data || error.message);
    res.status(401).json({
      message: "Invalid credentials",
      error: error.response?.data?.error?.message || "Login failed",
    });
  }
};

const googleLogin = async (req, res) => {
  try {
    const { uid, email, name, photoURL } = req.body;

    // Check if user already exists in Firestore
    let userDoc = await db.collection("users").doc(uid).get();
    let user;

    if (!userDoc.exists) {
      // Create new user - only test email gets Instagram access
      const username = await generateUniqueUsername(email.split('@')[0]);
      const role = email === TEST_USER_EMAIL ? 'admin' : 'user';
      const instagramAccess = email === TEST_USER_EMAIL;

      user = {
        uid,
        username,
        email,
        role,
        instagramAccess,
        instagramConnected: false,
        linkedinConnected: false,
        photoURL: photoURL || null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      await db.collection("users").doc(uid).set(user);
    } else {
      user = userDoc.data();
      // Update last login
      await db.collection("users").doc(uid).update({
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    // Generate JWT token
    const token = jwt.sign({ uid, role: user.role }, JWT_SECRET, { expiresIn: "7d" });

    // Set cookie
    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      message: "Google login successful",
      user: { 
        uid: user.uid, 
        username: user.username,
        email: user.email, 
        role: user.role,
        instagramAccess: user.instagramAccess || false,
        token 
      },
    });

  } catch (error) {
    console.error("Google login error:", error);
    res.status(500).json({
      message: "Google login failed",
      error: error.message,
    });
  }
};

// LinkedIn OAuth callback handler
const linkedinCallback = async (req, res) => {
  try {
    const { code, state, error, error_description } = req.query;

    console.log('LinkedIn callback received:', {
      code: code ? code.substring(0, 10) + '...' : 'missing',
      state: state || 'missing',
      error: error || 'none',
      error_description: error_description || 'none'
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    if (error) {
      console.error('LinkedIn OAuth error:', error, error_description);
      const errorUrl = `${frontendUrl}/auth/linkedin/callback?error=${error}&message=${encodeURIComponent(error_description || 'LinkedIn authentication failed')}`;
      return res.redirect(errorUrl);
    }

    if (!code) {
      console.error('No authorization code received');
      const errorUrl = `${frontendUrl}/auth/linkedin/callback?error=no_code&message=${encodeURIComponent('Authorization code not provided')}`;
      return res.redirect(errorUrl);
    }

    // Get environment variables
    const clientId = process.env.LINKEDIN_CLIENT_ID;
    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
    const redirectUri = process.env.LINKEDIN_REDIRECT_URI;

    // Validate environment variables
    if (!clientId || !clientSecret || !redirectUri) {
      throw new Error('Missing LinkedIn environment variables');
    }

    // Use URLSearchParams for proper encoding
    const data = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
    });

    const tokenResponse = await axios.post(
      'https://www.linkedin.com/oauth/v2/accessToken',
      data,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        timeout: 30000
      }
    );

    const { access_token, expires_in, scope } = tokenResponse.data;

    // Get user profile information
    const profileResponse = await axios.get('https://api.linkedin.com/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Accept': 'application/json'
      },
      timeout: 30000
    });

    const userProfile = profileResponse.data;

    // Create user data object (including access token for LinkedIn posting)
    const userData = {
      id: userProfile.sub,
      email: userProfile.email,
      name: userProfile.name,
      firstName: userProfile.given_name,
      lastName: userProfile.family_name,
      picture: userProfile.picture,
      linkedinId: userProfile.sub,
      provider: 'linkedin',
      loginTime: new Date().toISOString(),
      linkedinAccessToken: access_token,
      tokenExpiresIn: expires_in,
      scope: scope
    };

    // Create a session token
    const sessionToken = Buffer.from(JSON.stringify(userData)).toString('base64');

    // Send HTML response with sessionStorage and redirect
    const htmlResponse = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>LinkedIn Connected</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          text-align: center; 
          padding: 50px; 
          background: #f5f5f5; 
          color: #333;
        }
        .success { color: #28a745; font-size: 18px; margin-bottom: 20px; }
        .loading { color: #007bff; }
      </style>
    </head>
    <body>
      <div class="success">✓ LinkedIn Connected Successfully!</div>
      <p class="loading">Connecting to your dashboard...</p>
      <script>
        try {
          if (window.opener) {
            window.opener.postMessage({
              type: 'LINKEDIN_SUCCESS',
              userData: ${JSON.stringify(userData)},
              token: '${sessionToken}'
            }, '${frontendUrl}');
            
            setTimeout(() => {
              window.close();
            }, 1000);
          } else {
            sessionStorage.setItem('linkedin_user_data', '${JSON.stringify(userData).replace(/'/g, "\\'")}');
            window.location.href = "${frontendUrl}/dashboard?linkedin_connected=true";
          }
        } catch (error) {
          console.error('Error sending LinkedIn data:', error);
          window.location.href = "${frontendUrl}/dashboard";
        }
      </script>
    </body>
    </html>`;

    res.send(htmlResponse);

  } catch (error) {
    console.error('LinkedIn OAuth error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    let errorMessage = 'Authentication failed';
    
    if (error.response?.data) {
      const errorData = error.response.data;
      
      if (errorData.error === 'invalid_client') {
        errorMessage = 'Invalid LinkedIn client credentials.';
      } else if (errorData.error === 'invalid_grant' || errorData.error === 'invalid_request') {
        errorMessage = 'Authorization code expired or parameters mismatch. Please try again.';
      } else if (errorData.error_description) {
        errorMessage = errorData.error_description;
      } else {
        errorMessage = `LinkedIn API error: ${errorData.error}`;
      }
    }
    
    const errorUrl = `${frontendUrl}/auth/linkedin/callback?error=oauth_failed&message=${encodeURIComponent(errorMessage)}`;
    res.redirect(errorUrl);
  }
};

// LinkedIn post function
const linkedinPost = async (req, res) => {
  try {
    const { content, linkedinAccessToken, authorId } = req.body;

    if (!linkedinAccessToken) {
      return res.status(400).json({
        error: 'LinkedIn access token required',
        message: 'Please authenticate with LinkedIn first'
      });
    }

    if (!authorId) {
      return res.status(400).json({
        error: 'Missing authorId',
        message: 'LinkedIn user ID (authorId) is required'
      });
    }

    let mediaAsset = null;

    // If there's an image, upload it to LinkedIn first
    if (req.file) {
      const registerResponse = await axios.post(
        'https://api.linkedin.com/v2/assets?action=registerUpload',
        {
          registerUploadRequest: {
            recipes: ["urn:li:digitalmediaRecipe:feedshare-image"],
            owner: `urn:li:person:${authorId}`,
            serviceRelationships: [
              {
                relationshipType: "OWNER",
                identifier: "urn:li:userGeneratedContent"
              }
            ]
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${linkedinAccessToken}`,
            'Content-Type': 'application/json',
            'X-Restli-Protocol-Version': '2.0.0'
          }
        }
      );

      const uploadUrl = registerResponse.data.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'].uploadUrl;
      const asset = registerResponse.data.value.asset;

      await axios.post(
        uploadUrl,
        req.file.buffer,
        {
          headers: {
            'Authorization': `Bearer ${linkedinAccessToken}`,
            'Content-Type': 'application/octet-stream'
          }
        }
      );

      mediaAsset = asset;
    }

    // Create the LinkedIn post
    const postData = {
      author: `urn:li:person:${authorId}`,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: {
            text: content
          },
          shareMediaCategory: mediaAsset ? "IMAGE" : "NONE"
        }
      },
      visibility: {
        "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
      }
    };

    // Add media if present
    if (mediaAsset) {
      postData.specificContent["com.linkedin.ugc.ShareContent"].media = [
        {
          status: "READY",
          description: {
            text: "Image"
          },
          media: mediaAsset,
          title: {
            text: "Post Image"
          }
        }
      ];
    }

    const linkedinResponse = await axios.post(
      'https://api.linkedin.com/v2/ugcPosts',
      postData,
      {
        headers: {
          'Authorization': `Bearer ${linkedinAccessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0'
        }
      }
    );

    const postId = linkedinResponse.headers['x-restli-id'] || linkedinResponse.data.id;

    res.json({
      success: true,
      linkedinPostId: postId,
      message: 'Post published successfully to LinkedIn'
    });

  } catch (error) {
    console.error('LinkedIn posting error:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Failed to post to LinkedIn',
      details: error.response?.data || error.message
    });
  }
};

// Instagram post function - only for authorized users
const post = async (req, res) => {
  try {
    // Check if user has Instagram access
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'Please log in to post'
      });
    }

    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists || !userDoc.data().instagramAccess) {
      return res.status(403).json({ 
        error: 'Instagram access not available',
        message: 'Your account does not have Instagram posting permissions'
      });
    }

    if (!req.file) {
      return res.status(400).json({ 
        error: 'No image provided',
        message: 'Please upload an image file'
      });
    }

    // Upload to Cloudinary using buffer
    const cloudinaryResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          transformation: [
            { width: 1080, height: 1080, crop: 'fill' },
            { quality: 'auto:good' }
          ]
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(req.file.buffer);
    });

    // Post to Instagram
    const mediaResponse = await axios.post(
      `https://graph.facebook.com/v19.0/${process.env.INSTAGRAM_ACCOUNT_ID}/media`,
      {
        image_url: cloudinaryResult.secure_url,
        caption: req.body.caption || '',
        access_token: process.env.INSTAGRAM_ACCESS_TOKEN
      }
    );

    const publishResponse = await axios.post(
      `https://graph.facebook.com/v19.0/${process.env.INSTAGRAM_ACCOUNT_ID}/media_publish`,
      {
        creation_id: mediaResponse.data.id,
        access_token: process.env.INSTAGRAM_ACCESS_TOKEN
      }
    );

    res.json({ 
      success: true,
      instagramPostId: publishResponse.data.id,
      imageUrl: cloudinaryResult.secure_url,
      message: 'Post published successfully to Instagram'
    });

  } catch (err) {
    console.error('Posting error:', err.response?.data || err.message);
    res.status(500).json({ 
      error: 'Failed to post to Instagram',
      details: err.response?.data || err.message
    });
  }
};

// Update username function
const updateUsername = async (req, res) => {
  try {
    const { newUsername } = req.body;
    const userId = req.user.uid;

    if (!newUsername?.trim()) {
      return res.status(400).json({ message: "Username is required" });
    }

    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(newUsername)) {
      return res.status(400).json({ 
        message: "Username must be 3-20 characters long and contain only letters, numbers, and underscores" 
      });
    }

    // Check if username already exists (excluding current user)
    const snapshot = await db.collection("users")
      .where("username", "==", newUsername.toLowerCase())
      .limit(1)
      .get();
    
    if (!snapshot.empty && snapshot.docs[0].id !== userId) {
      return res.status(400).json({ message: "Username already taken" });
    }

    await db.collection("users").doc(userId).update({
      username: newUsername.toLowerCase(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.status(200).json({
      message: "Username updated successfully",
      username: newUsername.toLowerCase()
    });

  } catch (error) {
    console.error("Update username error:", error);
    res.status(500).json({
      message: "Failed to update username",
      error: error.message,
    });
  }
};

const sendPasswordResetEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email?.trim()) {
      return res.status(400).json({ message: "Email is required" });
    }

    await axios.post(
      `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${process.env.FIREBASE_API_KEY}`,
      {
        requestType: "PASSWORD_RESET",
        email: email
      }
    );

    res.status(200).json({
      message: "Password reset email sent successfully",
    });

  } catch (error) {
    console.error("Password reset error:", error);
    res.status(400).json({
      message: "Failed to send password reset email",
      error: error.response?.data?.error?.message || error.message,
    });
  }
};

const sendSignInLinkToEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email?.trim()) {
      return res.status(400).json({ message: "Email is required" });
    }

    const response = await axios.post(
      `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${process.env.FIREBASE_API_KEY}`,
      {
        requestType: "EMAIL_SIGNIN",
        email: email,
        continueUrl: `${process.env.FRONTEND_URL}/email-signin?email=${encodeURIComponent(email)}`
      }
    );

    res.status(200).json({
      message: "Sign-in link sent to your email",
    });

  } catch (error) {
    console.error("Email link error:", error);
    res.status(400).json({
      message: "Failed to send sign-in link",
      error: error.response?.data?.error?.message || error.message,
    });
  }
};

const verifyEmailLink = async (req, res) => {
  try {
    const { email, oobCode } = req.body;

    if (!email || !oobCode) {
      return res.status(400).json({ message: "Email and code are required" });
    }

    const verifyResponse = await axios.post(
      `https://identitytoolkit.googleapis.com/v1/accounts:resetPassword?key=${process.env.FIREBASE_API_KEY}`,
      {
        oobCode: oobCode
      }
    );

    const signInResponse = await axios.post(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithEmailLink?key=${process.env.FIREBASE_API_KEY}`,
      {
        email: email,
        oobCode: oobCode
      }
    );

    const { localId } = signInResponse.data;

    let userDoc = await db.collection("users").doc(localId).get();
    let user;

    if (!userDoc.exists) {
      const username = await generateUniqueUsername(email.split('@')[0]);
      const role = email === TEST_USER_EMAIL ? 'admin' : 'user';
      const instagramAccess = email === TEST_USER_EMAIL;

      user = {
        uid: localId,
        username,
        email,
        role,
        instagramAccess,
        instagramConnected: false,
        linkedinConnected: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      await db.collection("users").doc(localId).set(user);
    } else {
      user = userDoc.data();
    }

    const token = jwt.sign({ uid: localId, role: user.role }, JWT_SECRET, { expiresIn: "7d" });

    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      message: "Email verification successful",
      user: { 
        uid: user.uid, 
        username: user.username,
        email: user.email, 
        role: user.role,
        instagramAccess: user.instagramAccess || false,
        token 
      },
    });

  } catch (error) {
    console.error("Email verification error:", error);
    res.status(400).json({
      message: "Email verification failed",
      error: error.response?.data?.error?.message || error.message,
    });
  }
};

const logout = async (req, res) => {
  try {
    res.clearCookie(COOKIE_NAME);
    res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ message: "Logout failed" });
  }
};

// Get conversations and send message functions remain the same...
const getConversations = async (req, res) => {
  try {
    const { linkedinAccessToken } = req.query;

    if (!linkedinAccessToken) {
      return res.status(400).json({
        error: 'LinkedIn access token required',
        message: 'Please authenticate with LinkedIn first'
      });
    }

    res.json({
      success: true,
      conversations: []
    });

  } catch (error) {
    console.error('Error fetching conversations:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Failed to fetch conversations',
      details: error.response?.data || error.message
    });
  }
};

const sendMessage = async (req, res) => {
  try {
    const { recipients, subject, body, linkedinAccessToken, authorId, thread } = req.body;

    if (!linkedinAccessToken) {
      return res.status(400).json({
        error: 'LinkedIn access token required',
        message: 'Please authenticate with LinkedIn first'
      });
    }

    if (!body || body.trim() === '') {
      return res.status(400).json({
        error: 'Message body required',
        message: 'Please enter a message'
      });
    }

    let attachments = [];

    if (req.file) {
      const registerResponse = await axios.post(
        'https://api.linkedin.com/v2/assets?action=registerUpload',
        {
          registerUploadRequest: {
            owner: `urn:li:person:${authorId}`,
            recipes: ["urn:li:digitalmediaRecipe:messaging-attachment"],
            serviceRelationships: [
              {
                identifier: "urn:li:userGeneratedContent",
                relationshipType: "OWNER"
              }
            ]
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${linkedinAccessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const uploadUrl = registerResponse.data.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'].uploadUrl;
      const asset = registerResponse.data.value.asset;

      await axios.post(
        uploadUrl,
        req.file.buffer,
        {
          headers: {
            'Authorization': `Bearer ${linkedinAccessToken}`,
            'Content-Type': 'application/octet-stream'
          }
        }
      );

      attachments.push(asset);
    }

    const messageData = {
      body: body,
      messageType: "MEMBER_TO_MEMBER"
    };

    if (thread) {
      messageData.thread = thread;
    } else if (recipients && recipients.length > 0) {
      messageData.recipients = recipients.map(id => `urn:li:person:${id}`);
      if (subject) {
        messageData.subject = subject;
      }
    } else {
      return res.status(400).json({
        error: 'Recipients or thread required',
        message: 'Please specify recipients for new message or thread for reply'
      });
    }

    if (attachments.length > 0) {
      messageData.attachments = attachments;
    }

    const response = await axios.post(
      'https://api.linkedin.com/v2/messages',
      messageData,
      {
        headers: {
          'Authorization': `Bearer ${linkedinAccessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const locationHeader = response.headers['x-linkedin-id'];
    let threadId = null;
    let messageId = null;

    if (locationHeader) {
      const matches = locationHeader.match(/thread=([^,]+).*id=([^}]+)/);
      if (matches) {
        threadId = matches[1];
        messageId = matches[2];
      }
    }

    res.json({
      success: true,
      messageId: messageId,
      threadId: threadId,
      message: 'Message sent successfully'
    });

  } catch (error) {
    console.error('Error sending message:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Failed to send message',
      details: error.response?.data || error.message
    });
  }
};

module.exports = {
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
};