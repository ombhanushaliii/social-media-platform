const { admin, db } = require("../config/firebase");
const jwt = require("jsonwebtoken");

const COOKIE_NAME ="cookie" ||  process.env.COOKIE_NAME;
const JWT_SECRET ="jwt_secret" || process.env.JWT_SECRET;


const signup = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // basic validation
    if (!username?.trim() || !email?.trim() || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // password length check
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    // check if email already exists
    let existingUser;
    try {
      existingUser = await admin.auth().getUserByEmail(email);
    } catch (err) {
      // ignore if user not found
    }

    if (existingUser) {
      return res.status(400).json({ message: "Email already in use" });
    }

    // create user in firebase auth
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: username,
    });

    // save user in firestore
    await db.collection("users").doc(userRecord.uid).set({
      uid: userRecord.uid,
      email,
      username,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // generate jwt token
    const token = jwt.sign({ uid: userRecord.uid }, JWT_SECRET, { expiresIn: "7d" });

    // set cookie
    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      message: "Signup successful",
      user: { uid: userRecord.uid, email, username },
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

// const login = async (req, res) => {
//     try {

//     } catch (error) {
//         console.error("Error during login:", error);
//         res.status(500).json({ message: "Internal server error" });
//     }
// }
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // basic validation
    if (!email?.trim() || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // check user in firestore
    const userSnap = await db.collection("users")
      .where("email", "==", email)
      .limit(1)
      .get();

    if (userSnap.empty) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = userSnap.docs[0].data();

    // match password 
    if (user.password !== password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // generate jwt
    const token = jwt.sign({ uid: user.uid }, JWT_SECRET, { expiresIn: "7d" });

    // set cookie
    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      message: "Login successful",
      user: { uid: user.uid, email: user.email, username: user.username },
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Something went wrong", error: error.message });
  }
};

module.exports = {   
    signup,
    login
};