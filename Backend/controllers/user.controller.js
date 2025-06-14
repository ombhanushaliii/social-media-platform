const axios = require("axios");
const cloudinary = require("cloudinary").v2;

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

    // Clean the client secret - remove any padding or encoding issues
    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET.trim();
    console.log('Client secret length:', clientSecret.length);

    // Step 3: Exchange authorization code for access token
    const tokenParams = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      client_id: process.env.LINKEDIN_CLIENT_ID,
      client_secret: clientSecret, // Use cleaned secret
      redirect_uri: process.env.LINKEDIN_REDIRECT_URI
    });

    console.log('Token exchange parameters:', {
      grant_type: 'authorization_code',
      client_id: process.env.LINKEDIN_CLIENT_ID,
      redirect_uri: process.env.LINKEDIN_REDIRECT_URI,
      client_secret_length: clientSecret.length,
      code_length: code.length
    });

    const tokenResponse = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', 
      tokenParams.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        timeout: 15000
      }
    );

    console.log('LinkedIn token response received:', {
      status: tokenResponse.status,
      expires_in: tokenResponse.data.expires_in,
      scope: tokenResponse.data.scope
    });

    const { access_token, expires_in, refresh_token, scope } = tokenResponse.data;

    // Get user profile information
    console.log('Fetching user profile...');
    const profileResponse = await axios.get('https://api.linkedin.com/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Accept': 'application/json'
      },
      timeout: 15000
    });

    const userProfile = profileResponse.data;
    console.log('LinkedIn profile received:', {
      email: userProfile.email,
      name: userProfile.name,
      sub: userProfile.sub
    });

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

    // Create a session token
    const sessionToken = Buffer.from(JSON.stringify(userData)).toString('base64');

    // Redirect to frontend with user data
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const redirectUrl = `${frontendUrl}/auth/linkedin/callback?token=${sessionToken}&success=true`;
    
    console.log('Redirecting to frontend successfully');
    res.redirect(redirectUrl);

  } catch (error) {
    console.error('LinkedIn OAuth error details:', error.response?.data || error.message);
    
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    let errorMessage = 'Authentication failed';
    
    if (error.response?.data) {
      if (error.response.data.error === 'invalid_client') {
        errorMessage = 'Invalid LinkedIn client credentials. Check client ID and secret format.';
      } else if (error.response.data.error === 'invalid_grant') {
        errorMessage = 'Authorization code expired or invalid. Please try again.';
      } else {
        errorMessage = error.response.data.error_description || error.response.data.error || 'LinkedIn API error';
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