const admin = require("firebase-admin");
const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");
dotenv.config();

let serviceAccount = null;
const keyPath = path.join(__dirname, "../serviceAccountKey.json");

if (fs.existsSync(keyPath)) {
  try {
    serviceAccount = require(keyPath);
  } catch (e) {
    console.warn("Could not load serviceAccountKey.json");
  }
}

if (!serviceAccount && process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  } catch (e) {
    console.warn("Could not parse FIREBASE_SERVICE_ACCOUNT_KEY");
  }
}

if (serviceAccount) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
} else {
  admin.initializeApp();
}

module.exports = admin;
