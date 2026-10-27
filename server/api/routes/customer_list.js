const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');

/**
 * POST /api/customer_list
 * Fetch all customers for admin portal with summary stats, transactions, and purchased plans.
 */
router.post('/', async (req, res) => {
  try {
    const dbobj = res.locals.dbobj;
    const { status, search } = req.body || {};

    let query = {};

    if (status === "active") {
      query.is_active = { $ne: false };
    } else if (status === "inactive") {
      query.is_active = false;
    }

    if (search && String(search).trim() !== "") {
      const s = String(search).trim();
      query.$or = [
        { name: { $regex: s, $options: "i" } },
        { mobile: { $regex: s, $options: "i" } },
        { email: { $regex: s, $options: "i" } },
      ];
    }

    const customers = await dbobj
      .collection('customer')
      .find(query)
      .sort({ created_at: -1 })
      .toArray();

    // Fetch order counts for each customer from order_history
    const customerIds = customers.map(c => c._id);
    const customerMobiles = customers.map(c => c.mobile).filter(Boolean);

    // Aggregate orders count per customer
    const orderCounts = await dbobj
      .collection('order_history')
      .aggregate([
        {
          $match: {
            $or: [
              { cus_id: { $in: customerIds } },
              { mobile: { $in: customerMobiles } },
            ],
          },
        },
        {
          $group: {
            _id: { $ifNull: ["$cus_id", "$mobile"] },
            total_orders: { $sum: 1 },
            completed_orders: {
              $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] },
            },
            pending_orders: {
              $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] },
            },
          },
        },
      ])
      .toArray();

    const orderMap = {};
    orderCounts.forEach(o => {
      if (o._id) {
        orderMap[o._id.toString()] = o;
      }
    });

    let totalRevenue = 0;
    let totalTransactionsCount = 0;
    let totalPlansPurchasedCount = 0;

    const enrichedCustomers = customers.map(c => {
      const cIdStr = c._id.toString();
      const cMobile = c.mobile;
      const orderStat = orderMap[cIdStr] || orderMap[cMobile] || { total_orders: 0, completed_orders: 0, pending_orders: 0 };

      // Normalize plans: check plan_pursch and purchased_plans
      const purchasedPlans = Array.isArray(c.plan_pursch) && c.plan_pursch.length > 0
        ? c.plan_pursch
        : (Array.isArray(c.purchased_plans) ? c.purchased_plans : []);

      // Normalize transactions
      const transactions = Array.isArray(c.transactions) ? c.transactions : [];

      // Calculate totals
      let custSpent = 0;
      let custRemainingCredits = 0;

      transactions.forEach(t => {
        totalTransactionsCount += 1;
        if (t.status === "SUCCESS" || t.payment_status === "SUCCESS") {
          const amt = Number(t.amount) || 0;
          custSpent += amt;
          totalRevenue += amt;
        }
      });

      purchasedPlans.forEach(p => {
        totalPlansPurchasedCount += 1;
        const remaining = p.remaining_count !== undefined ? Number(p.remaining_count) : Number(p.count || 1);
        if (p.status !== "EXHAUSTED" && remaining > 0) {
          custRemainingCredits += remaining;
        }
      });

      return {
        _id: c._id,
        name: c.name || "Customer",
        mobile: c.mobile || "-",
        email: c.email || "-",
        role: c.role || "customer",
        is_active: c.is_active !== false,
        created_at: c.created_at || new Date(),
        updated_at: c.updated_at || new Date(),
        last_login: c.last_login || null,
        purchased_plans: purchasedPlans,
        transactions: transactions,
        stats: {
          total_plans: purchasedPlans.length,
          active_credits: custRemainingCredits,
          total_txns: transactions.length,
          total_spent: custSpent,
          total_orders: orderStat.total_orders,
          completed_orders: orderStat.completed_orders,
          pending_orders: orderStat.pending_orders,
        },
      };
    });

    // Summary stats for top counters
    const stats = {
      total_customers: customers.length,
      active_customers: customers.filter(c => c.is_active !== false).length,
      total_revenue: totalRevenue,
      total_transactions: totalTransactionsCount,
      total_plans_purchased: totalPlansPurchasedCount,
    };

    return res.status(200).json({
      status: "S",
      stats,
      data: enrichedCustomers,
    });
  } catch (err) {
    console.error("customer_list error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});

/**
 * POST /api/customer_list/toggle-status
 * Toggle customer active/inactive status
 */
router.post('/toggle-status', async (req, res) => {
  try {
    const dbobj = res.locals.dbobj;
    const { id, status } = req.body;

    if (!id || typeof status !== "boolean") {
      return res.status(400).json({ message: "Invalid parameters" });
    }

    const result = await dbobj.collection('customer').updateOne(
      { _id: new ObjectId(id) },
      { $set: { is_active: status, updated_at: new Date() } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "Customer not found" });
    }

    return res.status(200).json({
      status: "S",
      message: `Customer ${status ? "activated" : "deactivated"} successfully`,
    });
  } catch (err) {
    console.error("toggle customer status error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

/**
 * POST /api/customer_list/orders
 * Fetch specific customer's order history
 */
router.post('/orders', async (req, res) => {
  try {
    const dbobj = res.locals.dbobj;
    const { customer_id, mobile } = req.body;

    if (!customer_id && !mobile) {
      return res.status(400).json({ message: "customer_id or mobile required" });
    }

    const query = {
      $or: [],
    };
    if (customer_id) {
      query.$or.push({ cus_id: new ObjectId(customer_id) });
    }
    if (mobile) {
      query.$or.push({ mobile: String(mobile).trim() });
    }

    const orders = await dbobj
      .collection('order_history')
      .find(query)
      .sort({ created_at: -1 })
      .toArray();

    orders.forEach(item => {
      if (item.fileurl) {
        item.fileurl = process.env.PDF_BASE_URL + "/viewhoroscope/" + item.fileurl;
      }
    });

    return res.status(200).json({
      status: "S",
      data: orders,
    });
  } catch (err) {
    console.error("customer orders error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;

