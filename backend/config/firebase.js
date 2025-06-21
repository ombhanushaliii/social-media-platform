const admin = require("firebase-admin");
const { getFirestore } = require("firebase-admin/firestore");
require('dotenv').config();

// Use environment variables or service account key
let credential;
let projectId;

if (process.env.FIREBASE_PRIVATE_KEY) {
  // Use environment variables (recommended for production)
  credential = admin.credential.cert({
    type: "service_account",
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL
  });
  projectId = process.env.FIREBASE_PROJECT_ID;
} else {
  // Use service account key file (for development)
  try {
    const serviceAccount = require("./serviceAccountKey.json");
    credential = admin.credential.cert(serviceAccount);
    projectId = serviceAccount.project_id; // Use the project_id from the service account key
  } catch (error) {
    console.error("Service account key not found. Please add serviceAccountKey.json or use environment variables.");
    process.exit(1);
  }
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: credential,
    projectId: projectId
  });
}

const db = getFirestore();

module.exports = { admin, db };