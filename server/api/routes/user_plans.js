const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');

// Ensure only ONE plan per horoscope type in user_plans
let uniqueIndexInitialized = false;
const ensureSinglePlanPerType = async (dbobj) => {
  if (uniqueIndexInitialized || !dbobj) return;
  try {
    const all = await dbobj
      .collection('user_plans')
      .find()
      .sort({ updated_at: -1, created_at: -1 })
      .toArray();

    const seen = new Set();
    const toDelete = [];

    for (const p of all) {
      const key = String(p.plan_type || '').trim().toLowerCase();
      if (!key) continue;
      if (seen.has(key)) {
        toDelete.push(p._id);
      } else {
        seen.add(key);
      }
    }

    if (toDelete.length > 0) {
      await dbobj.collection('user_plans').deleteMany({
        _id: { $in: toDelete },
      });
      console.log(`Deduplicated ${toDelete.length} duplicate plans in user_plans`);
    }

    await dbobj.collection('user_plans').createIndex(
      { plan_type: 1 },
      { unique: true, collation: { locale: 'en', strength: 2 } }
    );
    uniqueIndexInitialized = true;
  } catch (err) {
    uniqueIndexInitialized = true;
  }
};

// POST /api/user_plans - Create a new user plan
router.post('/', async (req, res) => {
  try {
    const dbobj = res.locals.dbobj;
    await ensureSinglePlanPerType(dbobj);

    const {
      plan_type,
      plan_name,
      plan_details,
      count,
      total_amount,
      discount_percent,
      discount_amount,
      final_amount,
      AVLname,
      AVLid,
      AVLtype,
      AVLOBJID,
      AVLemail,
    } = req.body;

    // Only admin/owner can create plans
    if (AVLtype === 'franchise') {
      return res.status(403).json({
        status: "E",
        message: "Access denied. User plans can only be managed by admin.",
      });
    }

    // Validation
    if (!plan_type || !plan_type.trim()) {
      return res.status(400).json({
        status: "E",
        message: "Plan type is required",
      });
    }

    // Enforce SINGLE plan per horoscope type (More than one not allowed)
    const trimmedType = plan_type.trim();
    const existingPlan = await dbobj.collection('user_plans').findOne({
      plan_type: { $regex: new RegExp(`^${trimmedType}$`, 'i') },
      is_active: { $ne: false },
    });

    if (existingPlan) {
      return res.status(400).json({
        status: "E",
        message: `A plan already exists for "${trimmedType}". More than one plan is not allowed per Horoscope Type. Please edit the existing plan.`,
      });
    }

    if (!plan_name || !plan_name.trim()) {
      return res.status(400).json({
        status: "E",
        message: "Plan name is required",
      });
    }

    // Count is set to default 1
    const parsedCount = 1;

    const parsedTotal = parseFloat(total_amount);
    if (isNaN(parsedTotal) || parsedTotal < 0) {
      return res.status(400).json({
        status: "E",
        message: "Total amount must be a valid number",
      });
    }

    const parsedDiscountPercent = parseFloat(discount_percent || 0);
    const parsedDiscountAmount = parseFloat(discount_amount || 0);
    const parsedFinalAmount = parseFloat(
      final_amount !== undefined && final_amount !== null && !isNaN(parseFloat(final_amount))
        ? final_amount
        : Math.max(0, parsedTotal - parsedDiscountAmount)
    );

    const planDoc = {
      plan_type: plan_type.trim(),
      plan_name: plan_name.trim(),
      plan_details: (plan_details || "").trim(),
      count: parsedCount,
      total_amount: parsedTotal,
      discount_percent: parsedDiscountPercent,
      discount_amount: parsedDiscountAmount,
      final_amount: parsedFinalAmount,
      is_active: true,
      created_by: {
        id: AVLOBJID ? new ObjectId(AVLOBJID) : (AVLid || null),
        name: AVLname || "Admin",
        email: AVLemail || "",
        type: AVLtype || "admin",
      },
      created_at: new Date(),
      updated_at: new Date(),
    };

    const result = await res.locals.dbobj.collection('user_plans').insertOne(planDoc);

    return res.status(200).json({
      status: "S",
      message: "Plan created successfully",
      data: { _id: result.insertedId, ...planDoc },
    });
  } catch (err) {
    console.error("user_plans create error:", err);
    return res.status(500).json({
      status: "E",
      message: "Server error while saving user plan",
    });
  }
});

// POST /api/user_plans/list - Get all user plans (with optional filter by plan_type)
router.post('/list', async (req, res) => {
  try {
    const dbobj = res.locals.dbobj;
    await ensureSinglePlanPerType(dbobj);

    const { plan_type, search } = req.body || {};
    let query = { is_active: { $ne: false } };

    if (plan_type && plan_type.trim() !== "") {
      query.plan_type = plan_type.trim();
    }

    if (search && search.trim() !== "") {
      query.$or = [
        { plan_name: { $regex: search.trim(), $options: "i" } },
        { plan_details: { $regex: search.trim(), $options: "i" } },
        { plan_type: { $regex: search.trim(), $options: "i" } },
      ];
    }

    const plans = await res.locals.dbobj
      .collection('user_plans')
      .find(query)
      .sort({ created_at: -1 })
      .toArray();

    return res.status(200).json({
      status: "S",
      data: plans,
    });
  } catch (err) {
    console.error("user_plans list error:", err);
    return res.status(500).json({
      status: "E",
      message: "Server error fetching user plans",
    });
  }
});

// POST /api/user_plans/update - Update an existing user plan
router.post('/update', async (req, res) => {
  try {
    const {
      id,
      _id,
      plan_name,
      plan_details,
      total_amount,
      discount_percent,
      discount_amount,
      final_amount,
      AVLtype,
    } = req.body;

    if (AVLtype === 'franchise') {
      return res.status(403).json({
        status: "E",
        message: "Access denied. User plans can only be managed by admin.",
      });
    }

    const planId = id || _id;
    if (!planId) {
      return res.status(400).json({
        status: "E",
        message: "Plan ID is required for update",
      });
    }

    if (!plan_name || !plan_name.trim()) {
      return res.status(400).json({
        status: "E",
        message: "Plan name is required",
      });
    }

    const parsedTotal = parseFloat(total_amount);
    if (isNaN(parsedTotal) || parsedTotal < 0) {
      return res.status(400).json({
        status: "E",
        message: "Total amount must be a valid number",
      });
    }

    const parsedDiscountPercent = parseFloat(discount_percent || 0);
    const parsedDiscountAmount = parseFloat(discount_amount || 0);
    const parsedFinalAmount = parseFloat(
      final_amount !== undefined && final_amount !== null && !isNaN(parseFloat(final_amount))
        ? final_amount
        : Math.max(0, parsedTotal - parsedDiscountAmount)
    );

    const updateFields = {
      plan_name: plan_name.trim(),
      plan_details: (plan_details || "").trim(),
      count: 1, // count is fixed to 1
      total_amount: parsedTotal,
      discount_percent: parsedDiscountPercent,
      discount_amount: parsedDiscountAmount,
      final_amount: parsedFinalAmount,
      updated_at: new Date(),
    };

    const result = await res.locals.dbobj.collection('user_plans').updateOne(
      { _id: new ObjectId(planId) },
      { $set: updateFields }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        status: "E",
        message: "Plan not found",
      });
    }

    const updatedDoc = await res.locals.dbobj.collection('user_plans').findOne({
      _id: new ObjectId(planId),
    });

    return res.status(200).json({
      status: "S",
      message: "Plan updated successfully",
      data: updatedDoc,
    });
  } catch (err) {
    console.error("user_plans update error:", err);
    return res.status(500).json({
      status: "E",
      message: "Server error while updating user plan",
    });
  }
});

// POST /api/user_plans/delete - Delete a plan
router.post('/delete', async (req, res) => {
  try {
    const { id, AVLtype } = req.body || {};
    if (AVLtype === 'franchise') {
      return res.status(403).json({
        status: "E",
        message: "Access denied. User plans can only be managed by admin.",
      });
    }

    if (!id) {
      return res.status(400).json({
        status: "E",
        message: "Plan ID is required",
      });
    }

    const result = await res.locals.dbobj.collection('user_plans').deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        status: "E",
        message: "Plan not found",
      });
    }

    return res.status(200).json({
      status: "S",
      message: "Plan deleted successfully",
    });
  } catch (err) {
    console.error("user_plans delete error:", err);
    return res.status(500).json({
      status: "E",
      message: "Server error deleting plan",
    });
  }
});

module.exports = router;

