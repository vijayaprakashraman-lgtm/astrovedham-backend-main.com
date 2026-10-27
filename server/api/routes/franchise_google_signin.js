const express = require('express');
const router = express.Router();
const admin = require("../../common/firebase");
const CONFIG = require("../../common/inc.config");
const UTILS = require('../../utils/util.functions');
// const { getEmailTemplate } = require("../../utils/util.email_templates");

/* MAIN SCRIPT STARTS */
router.post('/', async (req, res) => {
    const { idToken, referelId } = req.body;
    let token = '';
    const dbobj = res.locals.dbobj;
    try {
        // Verify Google ID token
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const { email, name, email_verified, picture } = decodedToken;
        // Find active franchise user
        const user = await dbobj
            .collection('franchise_user')
            .find({ email, is_active: true })
            .limit(1)
            .toArray();

        console.log(user);

        if (user[0].is_active === false) {
            return res.status(400).json({
                message: "Your account is not active. Please contact support."
            });
        }

        // ❗ No active user
        if (email_verified !== true) {
            return res.status(400).json({
                message: "Email not verified with Google. Please verify your email before signing in."
            });
        }
        if (user.length === 0) {
            return res.status(400).json({
                message: "Your account is not registered as an active franchise user. Please contact support."
            });
        }

        // Generate token
        user[0].type = 'franchise'; //franchise
        token = UTILS.generateToken(user[0]);

        // Update Google sign-in info
        await dbobj.collection('franchise_user').updateOne(
            { _id: user[0]._id },
            {
                $set: {
                    g_sign: decodedToken,
                    updated_at: new Date()
                }
            }
        );

        // ✅ Send response ONCE
        return res.status(200).json({
            token,
            name,
            picture,
            ctype: "frn9dad4d054c3c3379d9a0664ddd4bf44e",
            message: "Login successful"
        });

    } catch (err) {
        console.error("Google Sign-in Error:", err);
        return res.status(400).json(UTILS.error());
    }
});

module.exports = router;
/* MAIN SCRIPT ENDS */