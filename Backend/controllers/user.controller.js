const axios = require("axios");
const cloudinary = require("cloudinary").v2;

// LinkedIn OAuth callback handler
const linkedinCallback = async (req, res) => {
  try {
    const { code, state, error, error_description } = req.query;

    console.log('---------------------------------------');
    console.log('🔑 Authorization Code:', `"${code}"`);
    console.log('🧾 Length:', code?.length);
    console.log('🧼 Trimmed:', `"${code?.trim()}"`, 'Length:', code?.trim().length);
    console.log('---------------------------------------');

    console.log('LinkedIn callback received:', {
      code: code ? code.substring(0, 10) + '...' : 'missing',
      state: state || 'missing',
      error: error || 'none',
      error_description: error_description || 'none'
    });

    // Define frontendUrl at the beginning of the function
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

    console.log('Attempting to exchange code for token...');

    // Get environment variables
    const clientId = process.env.LINKEDIN_CLIENT_ID;
    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
    const redirectUri = process.env.LINKEDIN_REDIRECT_URI;

    console.log('Token exchange parameters:', {
      grant_type: 'authorization_code',
      client_id: clientId,
      redirect_uri: redirectUri,
      client_secret_present: !!clientSecret,
      code_length: code.length
    });

    // Validate environment variables
    if (!clientId || !clientSecret || !redirectUri) {
      throw new Error('Missing LinkedIn environment variables');
    }

    console.log("Client ID:", process.env.LINKEDIN_CLIENT_ID);
    console.log("Client Secret:", process.env.LINKEDIN_CLIENT_SECRET);
    console.log("Redirect URI:", process.env.LINKEDIN_REDIRECT_URI);

    // Use URLSearchParams for proper encoding
    const data = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
    });

    console.log('Making token request to LinkedIn...');
    console.log('Raw request body:', data.toString().replace(clientSecret, 'HIDDEN'));

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

    console.log('LinkedIn token response received:', {
      status: tokenResponse.status,
      expires_in: tokenResponse.data.expires_in,
      scope: tokenResponse.data.scope
    });

    const { access_token, expires_in, refresh_token, scope } = tokenResponse.data;

    // Get user profile information using OpenID Connect endpoint
    console.log('Fetching user profile...');
    const profileResponse = await axios.get('https://api.linkedin.com/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Accept': 'application/json'
      },
      timeout: 30000
    });

    const userProfile = profileResponse.data;
    console.log('LinkedIn profile received:', {
      email: userProfile.email,
      name: userProfile.name,
      sub: userProfile.sub
    });

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
      // Store LinkedIn access token securely
      linkedinAccessToken: access_token,
      tokenExpiresIn: expires_in,
      scope: scope
    };

    // Create a session token
    const sessionToken = Buffer.from(JSON.stringify(userData)).toString('base64');
    console.log("hello, scope here: ", userData.scope);

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
          // Send data to parent window (main dashboard)
          if (window.opener) {
            window.opener.postMessage({
              type: 'LINKEDIN_SUCCESS',
              userData: ${JSON.stringify(userData)},
              token: '${sessionToken}'
            }, 'https://whizmedia-frontend.vercel.app');
            
            // Wait a moment then close popup
            setTimeout(() => {
              window.close();
            }, 1000);
          } else {
            // Fallback: redirect to dashboard with sessionStorage
            sessionStorage.setItem('linkedin_user_data', '${JSON.stringify(userData).replace(/'/g, "\\'")}');
            window.location.href = "${frontendUrl}/dashboard?linkedin_connected=true";
          }
        } catch (error) {
          console.error('Error sending LinkedIn data:', error);
          // Final fallback: redirect to dashboard
          window.location.href = "${frontendUrl}/dashboard";
        }
      </script>
    </body>
    </html>`;

    res.send(htmlResponse);
    console.log('Redirecting to frontend successfully');

  } catch (error) {
    console.error('LinkedIn OAuth error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      url: error.config?.url
    });
    
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    let errorMessage = 'Authentication failed';
    
    if (error.response?.data) {
      const errorData = error.response.data;
      console.log('LinkedIn API Error:', errorData);
      
      if (errorData.error === 'invalid_client') {
        errorMessage = 'Invalid LinkedIn client credentials.';
      } else if (errorData.error === 'invalid_grant' || errorData.error === 'invalid_request') {
        errorMessage = 'Authorization code expired or parameters mismatch. Please try again.';
      } else if (errorData.error_description) {
        errorMessage = errorData.error_description;
      } else {
        errorMessage = `LinkedIn API error: ${errorData.error}`;
      }
    } else if (error.message.includes('timeout')) {
      errorMessage = 'Request timeout - please try again';
    } else {
      errorMessage = error.message;
    }
    
    const errorUrl = `${frontendUrl}/auth/linkedin/callback?error=oauth_failed&message=${encodeURIComponent(errorMessage)}`;
    res.redirect(errorUrl);
  }
};

// LinkedIn post function
const linkedinPost = async (req, res) => {
  try {
    const { content, linkedinAccessToken, authorId } = req.body;

    console.log('Received LinkedIn post request:', { content, authorId, hasToken: !!linkedinAccessToken });

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
      // 1. Register upload
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

      // 2. Upload the actual image
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

      mediaAsset = asset; // e.g. "urn:li:digitalmediaAsset:xxxx"
    }

    // 3. Create the LinkedIn post
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

    console.log('Posting to LinkedIn UGC API:', JSON.stringify(postData, null, 2));

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

    console.log('LinkedIn API response:', linkedinResponse.status, linkedinResponse.data, linkedinResponse.headers);

    // LinkedIn returns 201 Created and X-RestLi-Id header with post id
    const postId = linkedinResponse.headers['x-restli-id'] || linkedinResponse.data.id;

    res.json({
      success: true,
      linkedinPostId: postId,
      message: 'Post published successfully to LinkedIn'
    });

  } catch (error) {
    console.error('LinkedIn posting error:', error.response?.data || error.message, error.response?.status);
    res.status(500).json({
      error: 'Failed to post to LinkedIn',
      details: error.response?.data || error.message
    });
  }
};

// Instagram post function (existing)
const post = async (req, res) => {
  try {
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

// Get conversations for a user
const getConversations = async (req, res) => {
  try {
    const { linkedinAccessToken, authorId } = req.query;

    if (!linkedinAccessToken) {
      return res.status(400).json({
        error: 'LinkedIn access token required',
        message: 'Please authenticate with LinkedIn first'
      });
    }

    // Note: LinkedIn doesn't provide a direct API to get conversations
    // This would typically require storing conversation data locally
    // For now, return empty array as placeholder
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

// Send a new message
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

    // Handle file attachment if present
    if (req.file) {
      // Register upload for attachment
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

      // Upload the file
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

    // Prepare message data
    const messageData = {
      body: body,
      messageType: "MEMBER_TO_MEMBER"
    };

    // Add recipients for new conversation or thread for reply
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

    // Add attachments if any
    if (attachments.length > 0) {
      messageData.attachments = attachments;
    }

    console.log('Sending message to LinkedIn:', JSON.stringify(messageData, null, 2));

    // Send message via LinkedIn API
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

    // Extract thread and message ID from response headers
    const locationHeader = response.headers['x-linkedin-id'];
    let threadId = null;
    let messageId = null;

    if (locationHeader) {
      // Parse the location header to extract IDs
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

// Handle Lookup API - Find LinkedIn users by email
const lookupLinkedInUserByEmail = async (req, res) => {
  try {
    const { email, linkedinAccessToken } = req.query;

    if (!linkedinAccessToken) {
      return res.status(400).json({
        error: 'LinkedIn access token required',
        message: 'Please authenticate with LinkedIn first'
      });
    }

    if (!email || !email.includes('@')) {
      return res.status(400).json({
        error: 'Valid email address required',
        message: 'Please provide a valid email address'
      });
    }

    // Required headers for Handle Lookup API
    const headers = {
      'Authorization': `Bearer ${linkedinAccessToken}`,
      'Content-Type': 'application/json',
      'X-Forwarded-For': req.ip || '127.0.0.1', // Client IP
      'Caller-Account-Age': '3', // Account age bucket (assuming 6+ months old account)
      'Caller-Device-UUID': 'placeholder-uuid-not-collected' // Placeholder as per LinkedIn docs
    };

    console.log('Looking up LinkedIn user by email:', email);

    // Call LinkedIn Handle Lookup API with profile projection
    const response = await axios.get(
      `https://api.linkedin.com/v2/clientAwareMemberHandles?q=handleString&handleString=${encodeURIComponent(email)}&projection=(elements*(member~))`,
      { headers }
    );

    if (response.data.elements && response.data.elements.length > 0) {
      const userData = response.data.elements[0];
      const member = userData.member;
      const profile = userData['member~'];

      // Extract Person ID from URN (urn:li:person:ID)
      const personId = member.replace('urn:li:person:', '')

      // Format the response
      const formattedUser = {
        id: personId,
        urn: member,
        name: profile.localizedFirstName || 'LinkedIn User',
        firstName: profile.localizedFirstName,
        headline: profile.headline?.localized?.en_US || '',
        email: email
      };

      res.json({
        success: true,
        user: formattedUser
      });
    } else {
      res.json({
        success: false,
        message: 'No LinkedIn profile found for this email address'
      });
    }

  } catch (error) {
    console.error('LinkedIn user lookup error:', error.response?.data || error.message);
    
    // Handle specific LinkedIn API errors
    if (error.response?.status === 404) {
      return res.json({
        success: false,
        message: 'No LinkedIn profile found for this email address'
      });
    }
    
    if (error.response?.status === 403) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Your application does not have permission to use the Handle Lookup API'
      });
    }

    res.status(500).json({
      error: 'Failed to lookup LinkedIn user',
      details: error.response?.data || error.message
    });
  }
};

// Batch lookup for multiple emails
const lookupLinkedInUsersByEmails = async (req, res) => {
  try {
    const { emails, linkedinAccessToken } = req.body;

    if (!linkedinAccessToken) {
      return res.status(400).json({
        error: 'LinkedIn access token required',
        message: 'Please authenticate with LinkedIn first'
      });
    }

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({
        error: 'Email addresses required',
        message: 'Please provide an array of email addresses'
      });
    }

    // Validate emails
    const validEmails = emails.filter(email => email && email.includes('@'));
    if (validEmails.length === 0) {
      return res.status(400).json({
        error: 'Valid email addresses required',
        message: 'Please provide valid email addresses'
      });
    }

    const headers = {
      'Authorization': `Bearer ${linkedinAccessToken}`,
      'Content-Type': 'application/json',
      'X-Forwarded-For': req.ip || '127.0.0.1',
      'Caller-Account-Age': '3',
      'Caller-Device-UUID': 'placeholder-uuid-not-collected'
    };

    // Build query string for multiple emails
    const emailParams = validEmails.map(email => `handleStrings=${encodeURIComponent(email)}`).join('&');
    const url = `https://api.linkedin.com/v2/clientAwareMemberHandles?q=handleStrings&${emailParams}&projection=(elements*(member~))`;

    console.log('Looking up multiple LinkedIn users by emails:', validEmails);

    const response = await axios.get(url, { headers });

    const users = [];
    if (response.data.elements && response.data.elements.length > 0) {
      response.data.elements.forEach((userData, index) => {
        const member = userData.member;
        const profile = userData['member~'];
        const personId = member.replace('urn:li:person:', '');

        users.push({
          id: personId,
          urn: member,
          name: profile.localizedFirstName || 'LinkedIn User',
          firstName: profile.localizedFirstName,
          headline: profile.headline?.localized?.en_US || '',
          email: validEmails[index]
        });
      });
    }

    res.json({
      success: true,
      users: users,
      totalFound: users.length,
      totalSearched: validEmails.length
    });

  } catch (error) {
    console.error('LinkedIn users lookup error:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Failed to lookup LinkedIn users',
      details: error.response?.data || error.message
    });
  }
};

// Update exports to include new functions
module.exports = { 
  post, 
  linkedinPost, 
  linkedinCallback, 
  getConversations, 
  sendMessage, 
  lookupLinkedInUserByEmail, 
  lookupLinkedInUsersByEmails 
};