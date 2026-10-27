const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');

router.post('/', async (req, res) => {
  try {
    const {
      franchiseId,
      planName,
      amount,
      years,
      plan_start_date,
      plan_end_date,
      paymode,
      txnid
    } = req.body;

    if (!franchiseId || !planName || !amount || !years || !plan_start_date || !plan_end_date) {
      return res.status(400).json({
        message: "All required fields must be provided"
      });
    }

    // Check if franchise exists
    const franchise = await res.locals.dbobj.collection('franchise_user').findOne({
      _id: new ObjectId(franchiseId)
    });

    if (!franchise) {
      return res.status(404).json({
        message: "Franchise not found"
      });
    }

    // Create transaction history entry
    const txnEntry = {
      planName,
      amount,
      date: new Date().toISOString(),
      paymode: paymode || 'cash',
      txnid: txnid || `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    // Update franchise with plan details
    const updateResult = await res.locals.dbobj.collection('franchise_user').updateOne(
      { _id: new ObjectId(franchiseId) },
      {
        $set: {
          plan_start_date,
          plan_end_date,
          updated_at: new Date()
        },
        $push: {
          txn_history: txnEntry,
          acc_his: `Plan activated: ${planName} (${years} year${years > 1 ? 's' : ''}) on ${new Date().toISOString()}`
        }
      }
    );

    if (updateResult.modifiedCount === 0) {
      return res.status(500).json({
        message: "Failed to update franchise plan"
      });
    }

    res.status(200).json({
      message: "Plan activated successfully",
      plan: {
        planName,
        amount,
        years,
        plan_start_date,
        plan_end_date,
        txnEntry
      }
    });

  } catch (err) {
    console.log("franchise_plan_activation_error", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;