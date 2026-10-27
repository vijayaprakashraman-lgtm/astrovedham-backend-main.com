const express = require("express");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const dbobj = res.locals.dbobj;
    const fcmToken = String(req.body.fcmToken || "").trim();
    const email = String(req.body.AVLemail || "").trim().toLowerCase();
    const userType = String(req.body.AVLtype || "").trim().toLowerCase();

    if (!fcmToken) {
      return res.status(400).json({ message: "fcmToken is required" });
    }

    if (!email) {
      return res.status(400).json({ message: "Authenticated user email missing" });
    }

    const isFranchise = userType === "franchise";
    const collectionName = isFranchise ? "franchise_user" : "user_accounts";
    const timestampField = isFranchise ? "updated_at" : "mdy_on";

    const result = await dbobj.collection(collectionName).updateOne(
      { email },
      {
        $set: {
          fcm_token: fcmToken,
          [timestampField]: new Date(),
        },
      }
    );

    if (!result.matchedCount) {
      return res.status(404).json({
        message: `No user found in ${collectionName} for ${email}`,
      });
    }

    return res.status(200).json({
      message: "FCM token saved successfully",
      collection: collectionName,
    });
  } catch (error) {
    console.error("save_fcm_token error:", error);
    return res.status(500).json({ message: "Unable to save FCM token" });
  }
});

module.exports = router;
