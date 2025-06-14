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

    if (error) {
      console.error('LinkedIn OAuth error:', error, error_description);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const errorUrl = `${frontendUrl}/auth/linkedin/callback?error=${error}&message=${encodeURIComponent(error_description || 'LinkedIn authentication failed')}`;
      return res.redirect(errorUrl);
    }

    if (!code) {
      console.error('No authorization code received');
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
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

    // Step 3: Exchange authorization code for access token
    // Use credentials as-is, no trimming or encoding
    const requestBody = `grant_type=authorization_code&code=${code}&client_id=${clientId}&client_secret=${clientSecret}&redirect_uri=${redirectUri}`;

    console.log('Making token request to LinkedIn...');
    console.log('Request body format:', requestBody.replace(clientSecret, 'HIDDEN'));

    // Use URLSearchParams for proper encoding
    const data = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
    });

    console.log('Raw request body:', data.toString());

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

    // Redirect to frontend with user data
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const redirectUrl = `${frontendUrl}/dashboard?linkedin_token=${sessionToken}&linkedin_success=true`;
    
    console.log('Redirecting to frontend successfully');
    res.redirect(redirectUrl);

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

    if (!linkedinAccessToken) {
      return res.status(400).json({
        error: 'LinkedIn access token required',
        message: 'Please authenticate with LinkedIn first'
      });
    }

    let mediaAsset = null;

    // If there's an image, upload it to LinkedIn first
    if (req.file) {
      console.log('Uploading image to LinkedIn...');
      
      // Step 1: Register upload for LinkedIn
      const registerResponse = await axios.post('https://api.linkedin.com/v2/assets?action=registerUpload', {
        registerUploadRequest: {
          recipes: ["urn:li:digitalmediaRecipe:feedshare-image"],
          owner: `urn:li:person:${authorId}`,
          serviceRelationships: [{
            relationshipType: "OWNER",
            identifier: "urn:li:userGeneratedContent"
          }]
        }
      }, {
        headers: {
          'Authorization': `Bearer ${linkedinAccessToken}`,
          'Content-Type': 'application/json'
        }
      });

      const uploadUrl = registerResponse.data.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'].uploadUrl;
      const asset = registerResponse.data.value.asset;

      // Step 2: Upload the actual image
      await axios.put(uploadUrl, req.file.buffer, {
        headers: {
          'Content-Type': 'application/octet-stream',
          'Authorization': `Bearer ${linkedinAccessToken}`
        }
      });

      mediaAsset = asset;
      console.log('Image uploaded to LinkedIn successfully');
    }

    // Step 3: Create the LinkedIn post
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
      postData.specificContent["com.linkedin.ugc.ShareContent"].media = [{
        status: "READY",
        description: {
          text: "Image"
        },
        media: mediaAsset,
        title: {
          text: "Post Image"
        }
      }];
    }

    const linkedinResponse = await axios.post('https://api.linkedin.com/v2/ugcPosts', postData, {
      headers: {
        'Authorization': `Bearer ${linkedinAccessToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('LinkedIn post created successfully');

    res.json({
      success: true,
      linkedinPostId: linkedinResponse.data.id,
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

module.exports = { post, linkedinPost, linkedinCallback };