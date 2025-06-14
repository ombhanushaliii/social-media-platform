const axios = require("axios");
const cloudinary = require("cloudinary").v2;

// LinkedIn OAuth callback handler
const linkedinCallback = async (req, res) => {
  try {
    const { code, state, error, error_description } = req.query;

    // Handle OAuth errors from LinkedIn
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

    console.log('LinkedIn callback received code:', code.substring(0, 20) + '...');
    console.log('State parameter:', state);

    // Step 3: Exchange authorization code for access token
    // Using application/x-www-form-urlencoded as specified in LinkedIn docs
    const tokenParams = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      client_id: process.env.LINKEDIN_CLIENT_ID,
      client_secret: process.env.LINKEDIN_CLIENT_SECRET,
      redirect_uri: process.env.LINKEDIN_REDIRECT_URI
    });

    console.log('Token request params:', {
      grant_type: 'authorization_code',
      client_id: process.env.LINKEDIN_CLIENT_ID,
      redirect_uri: process.env.LINKEDIN_REDIRECT_URI,
      code_length: code.length
    });

    const tokenResponse = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', 
      tokenParams.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      }
    );

    const { access_token, expires_in, refresh_token, scope } = tokenResponse.data;
    console.log('LinkedIn access token received, expires in:', expires_in);
    console.log('Granted scopes:', scope);

    // Get user profile information using the userinfo endpoint
    const profileResponse = await axios.get('https://api.linkedin.com/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Accept': 'application/json'
      },
      timeout: 10000
    });

    const userProfile = profileResponse.data;
    console.log('LinkedIn profile received for:', userProfile.email);

    // Create user data object
    const userData = {
      id: userProfile.sub,
      email: userProfile.email,
      name: userProfile.name,
      firstName: userProfile.given_name,
      lastName: userProfile.family_name,
      picture: userProfile.picture,
      linkedinId: userProfile.sub,
      provider: 'linkedin',
      loginTime: new Date().toISOString()
    };

    // Create a session token (excluding sensitive data)
    const sessionToken = Buffer.from(JSON.stringify(userData)).toString('base64');

    // Redirect to frontend with user data
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const redirectUrl = `${frontendUrl}/auth/linkedin/callback?token=${sessionToken}&success=true`;
    
    console.log('Redirecting to frontend successfully');
    res.redirect(redirectUrl);

  } catch (error) {
    console.error('LinkedIn OAuth error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers
      }
    });
    
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    let errorMessage = 'Authentication failed';
    
    if (error.response?.data) {
      // LinkedIn API error
      errorMessage = error.response.data.error_description || error.response.data.error || 'LinkedIn API error';
    } else if (error.message.includes('timeout')) {
      errorMessage = 'Request timeout - please try again';
    } else {
      errorMessage = error.message;
    }
    
    const errorUrl = `${frontendUrl}/auth/linkedin/callback?error=oauth_failed&message=${encodeURIComponent(errorMessage)}`;
    res.redirect(errorUrl);
  }
};

// Existing post function
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

module.exports = { post, linkedinCallback };