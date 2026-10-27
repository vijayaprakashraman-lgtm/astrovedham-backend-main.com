const express = require("express");
const router = express.Router();
const { ObjectId } = require("bson");   // ✅ FIX

router.post("/", async (req, res) => {
  try {



    const { orderId, AVLname,
      AVLid,
      AVLtype,
      AVLOBJID } = req.body;
    console.log("Received orderId:", req.body);
    const AVLnamelog =
      AVLtype === "franchise"
        ? `${AVLname}-Franchise`
        : `${AVLname}-Admin`;
    if (!orderId || !req.file) {
      return res.status(400).json({
        status: false,
        message: "Order ID and PDF required",
      });
    }

    const fileName = req.file.filename; // 👈 NEW renamed file

    const result = await res.locals.dbobj
      .collection("order_history")
      .updateOne(
        { _id: new ObjectId(orderId) },
        {
          $set: {
            fileurl: fileName,
            status: "Completed",
            updated_at: new Date(),
            lastup_by: AVLname + "_" + AVLtype,
          },
          $push: {
            remarks: `Order Move to Completed at ${new Date().toISOString()} by ${AVLnamelog}`
          }
        }
      );

    console.log("updateResult", result);

    res.json({ status: true, fileurl: fileName });
  } catch (err) {
    console.log("upload_pdf", err);
    res.status(500).json({ status: false, message: "Server error" });
  }
});

module.exports = router;
