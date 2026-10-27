const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const UTILS = require('../../utils/util.functions');
const { sendNotification } = require("../../common/notificationService");


router.post('/', async (req, res) => {

  let dbobj = res.locals.dbobj;

  try {
    const {
      horoscope_type,
      name,
      fathername,
      mothername,
      mobile,
      is_whatsapp,
      emailid,
      gender,
      dob,
      tob,
      place,
      fdob,
      ftob,
      fplace,
      language,
      other_details,
      AVLname,
      AVLid,
      AVLtype,
      AVLOBJID,
      fname,
      cname
    } = req.body;

    // ✅ Validation
    const isMarriage = horoscope_type === "Marriage" || horoscope_type === "ProMarriage";

    if (!name || !mobile || !dob || !tob || !place) {
      return res.status(400).json({
        status: "E",
        message: "All required fields must be filled"
      });
    }

    if (isMarriage) {
      if (!fdob || !ftob || !fplace) {
        return res.status(400).json({
          status: "E",
          message: "Female birth details are required for Marriage Horoscope"
        });
      }
    } else {
      if (!gender) {
        return res.status(400).json({
          status: "E",
          message: "Gender is required"
        });
      }
    }

    const AVLnamelog =
      AVLtype === "franchise"
        ? `${AVLname}-Franchise`
        : `${AVLname}-Admin`;

    const insert_obj = {
      fnc_id: AVLOBJID ? new ObjectId(AVLOBJID) : null,
      horoscope_type,
      name,
      fathername: fathername || "",
      mothername: mothername || "",
      mobile,
      is_whatsapp: !!is_whatsapp,
      emailid: emailid || "",
      gender: gender || "M",
      dob: new Date(dob),
      tob,
      place,
      fdob: fdob ? new Date(fdob) : null,
      ftob: ftob || "",
      fplace: fplace || "",
      fname:fname || "",
      cname:cname || "",
      language,
      other_details: other_details || "",
      status: "Pending",
      fileurl: "",
      remarks: [
        `Order placed at ${new Date().toISOString()} by ${AVLnamelog}`
      ],
      created_at: new Date(),
      updated_at: new Date(),
      created_by: AVLnamelog,
      lastup_by: AVLnamelog
    };

    const result = await dbobj
      .collection('order_history')
      .insertOne(insert_obj);


    if (result.acknowledged) {
      // ✅ get tokens from DB
      const users = await dbobj
        .collection("user_accounts")
        .find({ is_active: true, fcm_token: { $exists: true, $ne: "" } })
        .toArray();

      const tokens = users.map(u => u.fcm_token);

      // ✅ send notification
      if (tokens.length > 0) {
        await sendNotification(
          tokens,
          "🔔 New Horoscope Order",
          `New ${horoscope_type} order from ${name}`,
          { orderId: result.insertedId.toString() }
        );
      }


      return res.json({
        status: "S",
        message: "Order placed successfully",
        order_id: result.insertedId
      });
    }

    return res.json({
      status: "E",
      message: "Failed to place order"
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json(UTILS.error());
  }
});

module.exports = router;
