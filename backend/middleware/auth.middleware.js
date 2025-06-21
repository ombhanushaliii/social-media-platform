const jwt = require("jsonwebtoken");
const { db } = require("../config/firebase");

const JWT_SECRET = process.env.JWT_SECRET || "jwt_secret";
const COOKIE_NAME = process.env.COOKIE_NAME || "authToken";

const authenticateToken = async (req, res, next) => {
  try {
    const token = req.cookies[COOKIE_NAME] || req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: "Access token required" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Get user data from Firestore
    const userDoc = await db.collection("users").doc(decoded.uid).get();

    if (!userDoc.exists) {
      return res.status(401).json({ message: "Invalid token" });
    }

    req.user = { uid: decoded.uid, role: decoded.role, ...userDoc.data() };
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(401).json({ message: "Invalid token" });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};

const requireInstagramAccess = (req, res, next) => {
  if (!req.user.instagramAccess) {
    return res.status(403).json({ message: "Instagram access not available for your account" });
  }
  next();
};

module.exports = { authenticateToken, requireAdmin, requireInstagramAccess };