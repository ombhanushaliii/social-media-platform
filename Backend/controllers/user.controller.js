const { admin, db } = require("../config/firebase");
const jwt = require("jsonwebtoken");
const cloudinary = require("cloudinary").v2;

const axios = require("axios");

const COOKIE_NAME ="cookie" ||  process.env.COOKIE_NAME;
const JWT_SECRET ="jwt_secret" || process.env.JWT_SECRET;


// const signup = async (req, res) => {
//   try {
//     const { name, email, password } = req.body;

//     // basic validation
//     if (!name?.trim() || !email?.trim() || !password) {
//       return res.status(400).json({ message: "All fields are required" });
//     }

//     // email format check
//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     if (!emailRegex.test(email)) {
//       return res.status(400).json({ message: "Invalid email format" });
//     }

//     // password length check
//     if (password.length < 6) {
//       return res.status(400).json({ message: "Password must be at least 6 characters" });
//     }

//     // check if email already exists
//     let existingUser;
//     try {
//       existingUser = await admin.auth().getUserByEmail(email);
//     } catch (err) {
//       // ignore if user not found
//     }

//     if (existingUser) {
//       return res.status(400).json({ message: "Email already in use" });
//     }

//     // create user in firebase auth
//     const userRecord = await admin.auth().createUser({
//       email,
//       password,
//       displayName: name,
//     });

//     // save user in firestore
//     await db.collection("users").doc(userRecord.uid).set({
//       uid: userRecord.uid,
//       email,
//       name,
//       createdAt: admin.firestore.FieldValue.serverTimestamp(),
//     });

//     // generate jwt token
//     const token = jwt.sign({ uid: userRecord.uid }, JWT_SECRET, { expiresIn: "7d" });

//     // set cookie
//     res.cookie(COOKIE_NAME, token, {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === "production",
//       sameSite: "strict",
//       maxAge: 7 * 24 * 60 * 60 * 1000,
//     });

//     res.status(201).json({
//       message: "Signup successful",
//       user: { uid: userRecord.uid, email, name,token },
//     });

//   } catch (error) {
//     console.error("Signup error:", error);

//     if (error.code && error.code.includes("auth")) {
//       return res.status(400).json({ message: error.message });
//     }

//     res.status(500).json({
//       message: "Something went wrong",
//       error: error.message,
//     });
//   }
// };




// const login = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     if (!email?.trim() || !password) {
//       return res.status(400).json({ message: "Email and password are required" });
//     }

//     // Firebase Auth REST API Login
//     const response = await axios.post(
//       `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.FIREBASE_API_KEY}`,
//       {
//         email,
//         password,
//         returnSecureToken: true,
//       }
//     );

//     const { idToken, localId } = response.data;

//     // fetch user data from Firestore
//     const userDoc = await db.collection("users").doc(localId).get();

//     if (!userDoc.exists) {
//       return res.status(404).json({ message: "User data not found" });
//     }

//     const user = userDoc.data();

//     // generate jwt token for your own session (optional)
//     const token = jwt.sign({ uid: localId }, JWT_SECRET, { expiresIn: "7d" });

//     // set cookie
//     res.cookie(COOKIE_NAME, token, {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === "production",
//       sameSite: "strict",
//       maxAge: 7 * 24 * 60 * 60 * 1000,
//     });

//     res.status(200).json({
//       message: "Login successful",
//       user: { uid: user.uid, email: user.email, name: user.name,token },
//     });

//   } catch (error) {
//     console.error("Login error:", error.response?.data || error.message);
//     res.status(401).json({
//       message: "Login failed",
//       error: error.response?.data?.error?.message || error.message,
//     });
//   }
// };

const post=async(req,res)=>{
  try {
    if (!req.file) throw new Error('No image provided');

    // Upload to Cloudinary
    const cloudinaryResult = await cloudinary.uploader.upload(req.file.path, {
      transformation: [
        { width: 1080, height: 1080, crop: 'fill' },
        { quality: 'auto:good' }
      ]
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
      imageUrl: cloudinaryResult.secure_url
    });
  } catch (err) {
    console.error('Posting error:', err.response?.data || err.message);
    res.status(500).json({ 
      error: 'Failed to post to Instagram',
      details: err.response?.data || err.message
    });
};


}
module.exports = {   
   post
};