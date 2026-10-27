const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');
const { sendNotification } = require('../../common/notificationService');

// Ensure unique index on customer mobile
let indexesCreated = false;
const ensureIndexes = async (dbobj) => {
  if (indexesCreated || !dbobj) return;
  try {
    await dbobj.collection('customer').createIndex({ mobile: 1 }, { unique: true });
    await dbobj.collection('customer_otps').createIndex({ mobile: 1 });
    indexesCreated = true;
  } catch (e) {
    indexesCreated = true;
  }
};

/* =========================================================
   MIDDLEWARE: Customer Token Verification (for protected endpoints)
   ========================================================= */
const verifyCustomerToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.replace(/^Bearer\s+/i, '');

    if (!token) {
      return res.status(401).json({
        status: "UA",
        message: "Authorization token is required",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || !decoded._id) {
      return res.status(401).json({
        status: "UA",
        message: "Invalid or expired token",
      });
    }

    const dbobj = res.locals.dbobj;
    const customer = await dbobj.collection('customer').findOne({
      _id: new ObjectId(decoded._id),
      is_active: { $ne: false }
    });

    if (!customer) {
      return res.status(401).json({
        status: "UA",
        message: "Customer account not found or deactivated",
      });
    }

    req.customer = customer;
    next();
  } catch (err) {
    console.error("Customer token auth error:", err);
    return res.status(401).json({
      status: "UA",
      message: "Authentication failed",
      error: err.message,
    });
  }
};

/* =========================================================
   1. SEND OTP
   POST /api/customer/send_otp
   Body: { mobile: "9876543210" }
   ========================================================= */
router.post('/send_otp', async (req, res) => {
  try {
    const { mobile } = req.body || {};

    if (!mobile) {
      return res.status(400).json({
        status: "E",
        message: "Mobile number is required",
      });
    }

    const cleanedMobile = String(mobile).replace(/\D/g, "");
    if (cleanedMobile.length !== 10) {
      return res.status(400).json({
        status: "E",
        message: "Please enter a valid 10-digit mobile number",
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    // Expiry: 5 minutes from now
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    const dbobj = res.locals.dbobj;
    await ensureIndexes(dbobj);

    // Save or update OTP in customer_otps collection
    await dbobj.collection('customer_otps').updateOne(
      { mobile: cleanedMobile },
      {
        $set: {
          otp,
          expires_at: expiresAt,
          is_used: false,
          updated_at: new Date(),
        },
        $setOnInsert: {
          created_at: new Date(),
        },
      },
      { upsert: true }
    );

    console.log(`\n========================================`);
    console.log(`📱 [CUSTOMER OTP] Mobile: ${cleanedMobile} | OTP: ${otp}`);
    console.log(`========================================\n`);

    // In response, return otp for testing / app development
    return res.status(200).json({
      status: "S",
      message: "OTP sent successfully",
      data: {
        mobile: cleanedMobile,
        otp, // Included for app testing / dev integration
        expires_in_seconds: 300,
      },
    });
  } catch (err) {
    console.error("send_otp error:", err);
    return res.status(500).json({
      status: "E",
      message: "Internal server error while sending OTP",
    });
  }
});

/* =========================================================
   2. VERIFY OTP & LOGIN / REGISTER
   POST /api/customer/verify_otp
   Body: { mobile: "9876543210", otp: "123456" }
   ========================================================= */
router.post('/verify_otp', async (req, res) => {
  try {
    const { mobile, otp } = req.body || {};

    if (!mobile || !otp) {
      return res.status(400).json({
        status: "E",
        message: "Mobile number and OTP are required",
      });
    }

    const cleanedMobile = String(mobile).replace(/\D/g, "");
    const cleanedOtp = String(otp).trim();

    if (cleanedMobile.length !== 10) {
      return res.status(400).json({
        status: "E",
        message: "Please enter a valid 10-digit mobile number",
      });
    }

    const dbobj = res.locals.dbobj;
    await ensureIndexes(dbobj);

    // Check OTP in customer_otps
    const otpRecord = await dbobj.collection('customer_otps').findOne({
      mobile: cleanedMobile,
    });

    // Check if OTP matches and is not expired (also allow master test OTP 123456)
    const isMasterOtp = cleanedOtp === "123456";
    const isValidOtp =
      otpRecord &&
      otpRecord.otp === cleanedOtp &&
      !otpRecord.is_used &&
      new Date() <= new Date(otpRecord.expires_at);

    if (!isValidOtp && !isMasterOtp) {
      return res.status(400).json({
        status: "E",
        message: "Invalid or expired OTP. Please try again.",
      });
    }

    // Mark OTP as used
    if (otpRecord) {
      await dbobj.collection('customer_otps').updateOne(
        { mobile: cleanedMobile },
        { $set: { is_used: true, verified_at: new Date() } }
      );
    }

    // Find or create customer in `customer` collection
    let customer = await dbobj.collection('customer').findOne({
      mobile: cleanedMobile,
    });

    if (!customer) {
      const newCustomer = {
        mobile: cleanedMobile,
        name: "",
        email: "",
        role: "customer",
        type: "customer",
        is_active: true,
        purchased_plans: [],
        transactions: [],
        created_at: new Date(),
        updated_at: new Date(),
        last_login: new Date(),
      };

      const result = await dbobj.collection('customer').insertOne(newCustomer);
      customer = { _id: result.insertedId, ...newCustomer };
    } else {
      await dbobj.collection('customer').updateOne(
        { _id: customer._id },
        {
          $set: {
            last_login: new Date(),
            updated_at: new Date(),
          },
        }
      );
    }

    // Generate JWT token for customer
    const token = jwt.sign(
      {
        _id: customer._id.toString(),
        user_id: customer.mobile,
        mobile: customer.mobile,
        name: customer.name || "Customer",
        type: "customer",
        role: "customer",
      },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    return res.status(200).json({
      status: "S",
      message: "Login successful",
      data: {
        token,
        customer: {
          _id: customer._id,
          mobile: customer.mobile,
          name: customer.name || "",
          email: customer.email || "",
          role: customer.role || "customer",
          is_active: customer.is_active,
          purchased_plans: customer.purchased_plans || [],
          transactions: customer.transactions || [],
        },
      },
    });
  } catch (err) {
    console.error("verify_otp error:", err);
    return res.status(500).json({
      status: "E",
      message: "Internal server error while verifying OTP",
    });
  }
});

/* =========================================================
   3. GET CUSTOMER PROFILE (Protected)
   GET /api/customer/profile
   Headers: { Authorization: "Bearer <token>" }
   ========================================================= */
router.get('/profile', verifyCustomerToken, async (req, res) => {
  try {
    const customer = req.customer;
    return res.status(200).json({
      status: "S",
      data: {
        _id: customer._id,
        mobile: customer.mobile,
        name: customer.name || "",
        email: customer.email || "",
        role: customer.role || "customer",
        purchased_plans: customer.purchased_plans || [],
        transactions: customer.transactions || [],
        created_at: customer.created_at,
        last_login: customer.last_login,
      },
    });
  } catch (err) {
    console.error("get profile error:", err);
    return res.status(500).json({
      status: "E",
      message: "Error fetching customer profile",
    });
  }
});

/* =========================================================
   4. UPDATE CUSTOMER PROFILE (Protected)
   POST /api/customer/update_profile
   Headers: { Authorization: "Bearer <token>" }
   Body: { name: "...", email: "..." }
   ========================================================= */
router.post('/update_profile', verifyCustomerToken, async (req, res) => {
  try {
    const { name, email } = req.body || {};
    const dbobj = res.locals.dbobj;

    const updateFields = {
      updated_at: new Date(),
    };

    if (typeof name === "string") updateFields.name = name.trim();
    if (typeof email === "string") updateFields.email = email.trim();

    await dbobj.collection('customer').updateOne(
      { _id: new ObjectId(req.customer._id) },
      { $set: updateFields }
    );

    const updated = await dbobj.collection('customer').findOne({
      _id: new ObjectId(req.customer._id),
    });

    return res.status(200).json({
      status: "S",
      message: "Profile updated successfully",
      data: {
        _id: updated._id,
        mobile: updated.mobile,
        name: updated.name || "",
        email: updated.email || "",
        purchased_plans: updated.purchased_plans || [],
        transactions: updated.transactions || [],
      },
    });
  } catch (err) {
    console.error("update profile error:", err);
    return res.status(500).json({
      status: "E",
      message: "Error updating customer profile",
    });
  }
});

/* =========================================================
   5. GET ALL PLAN TYPES (Public)
   GET  /api/customer/plan_types
   POST /api/customer/plan_types
   ========================================================= */
const DEFAULT_PLAN_TYPES = [
  {
    plan_type: "Single",
    name: "Single Horoscope",
    description: "Quick astrological overview, rasi, nakshatra, and key planetary charts.",
    icon: "star",
    badge: "Popular",
    sort_order: 1,
  },
  {
    plan_type: "Life",
    name: "Life Horoscope",
    description: "Comprehensive lifelong astrological predictions, mahadasha, and bhukti analysis.",
    icon: "book",
    badge: "Recommended",
    sort_order: 2,
  },
  {
    plan_type: "Yearly",
    name: "Yearly Horoscope",
    description: "Annual planetary transits, monthly forecasts, and favorable periods.",
    icon: "calendar",
    badge: "Trending",
    sort_order: 3,
  },
  {
    plan_type: "Super",
    name: "Super Horoscope",
    description: "Premium deep-dive horoscope analysis with extensive dosha and remedial guidance.",
    icon: "crown",
    badge: "Premium",
    sort_order: 4,
  },
  {
    plan_type: "Numerology",
    name: "Numerology Horoscope",
    description: "Name numerology, destiny numbers, psychic numbers, and auspicious timing.",
    icon: "calculator",
    badge: "",
    sort_order: 5,
  },
  {
    plan_type: "Gemstone",
    name: "Gemstone Horoscope",
    description: "Personalized birth chart gemstone recommendations for health, wealth, and success.",
    icon: "gem",
    badge: "",
    sort_order: 6,
  },
  {
    plan_type: "Wealth",
    name: "Wealth Horoscope",
    description: "Detailed financial forecast, career growth, business prospects, and wealth remedies.",
    icon: "rupee",
    badge: "",
    sort_order: 7,
  },
  {
    plan_type: "MarriageH",
    name: "Marriage Horoscope",
    description: "Marriage timing, spouse characteristics, married life forecast, and remedies.",
    icon: "heart",
    badge: "",
    sort_order: 8,
  },
  {
    plan_type: "Marriage",
    name: "Simple Marriage Matching",
    description: "Traditional 10-porutham gun milan compatibility report for prospective bride and groom.",
    icon: "users",
    badge: "",
    sort_order: 9,
  },
  {
    plan_type: "ProMarriage",
    name: "Pro Marriage Matching",
    description: "Advanced marriage compatibility analysis with Sevvai (Manglik), Rahu-Ketu, and Dasa sandhi.",
    icon: "shield-check",
    badge: "Pro",
    sort_order: 10,
  },
];

const getPlanTypesHandler = async (req, res) => {
  try {
    const dbobj = res.locals.dbobj;

    // Check if custom plan_types collection exists and has items
    let types = [];
    if (dbobj) {
      try {
        types = await dbobj
          .collection('plan_types')
          .find({ is_active: { $ne: false } })
          .sort({ sort_order: 1 })
          .toArray();
      } catch (e) {
        types = [];
      }
    }

    if (!types || types.length === 0) {
      types = DEFAULT_PLAN_TYPES;
    }

    // Attach active plans count and starting price from user_plans
    if (dbobj) {
      try {
        const userPlans = await dbobj
          .collection('user_plans')
          .find({ is_active: { $ne: false } })
          .toArray();

        types = types.map((pt) => {
          const matchingPlans = userPlans.filter(
            (up) => String(up.plan_type).toLowerCase() === String(pt.plan_type).toLowerCase()
          );

          let startingPrice = null;
          if (matchingPlans.length > 0) {
            startingPrice = Math.min(
              ...matchingPlans.map((p) => (p.final_amount !== undefined ? p.final_amount : p.total_amount || 0))
            );
          }

          return {
            ...pt,
            available_plans_count: matchingPlans.length,
            starting_price: startingPrice !== null ? startingPrice : 0,
          };
        });
      } catch (err) {
        console.warn("Could not enrich plan types with user_plans stats:", err);
      }
    }

    return res.status(200).json({
      status: "S",
      message: "Plan types fetched successfully",
      data: types,
    });
  } catch (err) {
    console.error("plan_types error:", err);
    return res.status(500).json({
      status: "E",
      message: "Failed to fetch plan types",
    });
  }
};

router.get('/plan_types', getPlanTypesHandler);
router.post('/plan_types', getPlanTypesHandler);

/* =========================================================
   6. GET PLANS BY PLAN TYPE (From user_plans collection)
   GET  /api/customer/plans?plan_type=Single
   GET  /api/customer/plans/:plan_type
   POST /api/customer/plans
   Body: { plan_type: "Single" }
   ========================================================= */
const getPlansByTypeHandler = async (req, res) => {
  try {
    const dbobj = res.locals.dbobj;
    const planTypeInput = (
      req.params.plan_type ||
      req.query.plan_type ||
      req.query.type ||
      (req.body && req.body.plan_type) ||
      ""
    ).trim();

    let query = { is_active: { $ne: false } };
    if (planTypeInput && planTypeInput.toLowerCase() !== "all") {
      query.plan_type = { $regex: new RegExp(`^${planTypeInput}$`, 'i') };
    }

    const plans = await dbobj
      .collection('user_plans')
      .find(query)
      .sort({ final_amount: 1, created_at: -1 })
      .toArray();

    const formattedPlans = plans.map((p) => {
      const finalAmt =
        p.final_amount !== undefined
          ? p.final_amount
          : Math.max(0, (p.total_amount || 0) - (p.discount_amount || 0));

      const savings = Math.max(0, (p.total_amount || 0) - finalAmt);

      const itemTypeMeta =
        DEFAULT_PLAN_TYPES.find(
          (t) => t.plan_type.toLowerCase() === (p.plan_type || "").toLowerCase()
        ) || null;

      return {
        _id: p._id,
        plan_type: p.plan_type,
        plan_type_name: itemTypeMeta ? itemTypeMeta.name : p.plan_type,
        plan_name: p.plan_name,
        plan_details: p.plan_details || "",
        count: p.count || 1,
        total_amount: p.total_amount,
        discount_percent: p.discount_percent || 0,
        discount_amount: p.discount_amount || 0,
        final_amount: finalAmt,
        savings,
        currency: "INR",
        currency_symbol: "₹",
        type_icon: itemTypeMeta ? itemTypeMeta.icon : "star",
        type_badge: itemTypeMeta ? itemTypeMeta.badge : "",
        created_at: p.created_at,
      };
    });

    const typeMeta =
      DEFAULT_PLAN_TYPES.find(
        (t) => t.plan_type.toLowerCase() === planTypeInput.toLowerCase()
      ) || null;

    return res.status(200).json({
      status: "S",
      message: "Plans fetched successfully",
      plan_type: planTypeInput || "All",
      plan_type_details: typeMeta,
      total_plans: formattedPlans.length,
      data: formattedPlans,
    });
  } catch (err) {
    console.error("get plans by type error:", err);
    return res.status(500).json({
      status: "E",
      message: "Failed to fetch plans",
    });
  }
};

router.get('/plans', getPlansByTypeHandler);
router.get('/plans/:plan_type', getPlansByTypeHandler);
router.post('/plans', getPlansByTypeHandler);

// GET /api/customer/getplans & POST /api/customer/getplans (Send all user_plans)
router.get('/getplans', getPlansByTypeHandler);
router.post('/getplans', getPlansByTypeHandler);
router.get('/get_plans', getPlansByTypeHandler);
router.post('/get_plans', getPlansByTypeHandler);

/* =========================================================
   ORDER FULFILLMENT HELPERS (plan_pursch & transactions)
   ========================================================= */
const cashfree = require('../../utils/cashfree');

const fulfillCustomerOrder = async (dbobj, order, cfDetails = {}) => {
  if (order.status === 'SUCCESS') {
    return { already_fulfilled: true };
  }

  const customerId = new ObjectId(order.customer_id);

  // 1. Plan Purchase Record for `plan_pursch`
  const planPurchaseDoc = {
    order_id: order.order_id,
    plan_id: order.plan_id ? new ObjectId(order.plan_id) : null,
    plan_name: order.plan_name,
    plan_type: order.plan_type,
    count: parseInt(order.count, 10) || 1,
    remaining_count: parseInt(order.count, 10) || 1,
    amount_paid: parseFloat(order.amount),
    purchased_at: new Date(),
    status: "ACTIVE",
  };

  // 2. Transaction Record for `transactions`
  const transactionDoc = {
    order_id: order.order_id,
    plan_id: order.plan_id ? new ObjectId(order.plan_id) : null,
    plan_name: order.plan_name,
    plan_type: order.plan_type,
    amount: parseFloat(order.amount),
    count: parseInt(order.count, 10) || 1,
    status: "SUCCESS",
    paid_at: new Date(),
    gateway: "CASHFREE",
    gateway_details: cfDetails,
  };

  // 3. Update customer_orders tracking
  await dbobj.collection('customer_orders').updateOne(
    { order_id: order.order_id },
    {
      $set: {
        status: "SUCCESS",
        updated_at: new Date(),
        paid_at: new Date(),
        gateway_details: cfDetails,
      },
    }
  );

  // 4. Update customer document: update transactions.$ and push into plan_pursch
  const updateMatched = await dbobj.collection('customer').updateOne(
    {
      _id: customerId,
      "transactions.order_id": order.order_id,
    },
    {
      $set: {
        "transactions.$.status": "SUCCESS",
        "transactions.$.paid_at": new Date(),
        "transactions.$.gateway_details": cfDetails,
        updated_at: new Date(),
      },
      $push: {
        plan_pursch: planPurchaseDoc,
        purchased_plans: planPurchaseDoc,
      },
    }
  );

  // Fallback: If transaction was not in array yet
  if (updateMatched.matchedCount === 0) {
    await dbobj.collection('customer').updateOne(
      { _id: customerId },
      {
        $push: {
          plan_pursch: planPurchaseDoc,
          purchased_plans: planPurchaseDoc,
          transactions: transactionDoc,
        },
        $set: { updated_at: new Date() },
      }
    );
  }

  return { success: true };
};

const markCustomerOrderFailed = async (dbobj, order, cfDetails = {}) => {
  const customerId = new ObjectId(order.customer_id);

  await dbobj.collection('customer_orders').updateOne(
    { order_id: order.order_id },
    {
      $set: {
        status: "FAILED",
        updated_at: new Date(),
        gateway_details: cfDetails,
      },
    }
  );

  await dbobj.collection('customer').updateOne(
    {
      _id: customerId,
      "transactions.order_id": order.order_id,
    },
    {
      $set: {
        "transactions.$.status": "FAILED",
        "transactions.$.failed_at": new Date(),
        "transactions.$.gateway_details": cfDetails,
        updated_at: new Date(),
      },
    }
  );
};

/* =========================================================
   7. BUY NOW - INITIATE CASHFREE PAYMENT
   POST /api/customer/buy_now
   POST /api/customer/buy_plan
   Headers: { Authorization: "Bearer <token>" } (or body: { mobile: "..." })
   Body: { plan_id: "673cf981...", return_url: "..." }
   ========================================================= */
const buyNowHandler = async (req, res) => {
  try {
    const { plan_id, return_url, mobile } = req.body || {};
    const dbobj = res.locals.dbobj;

    if (!plan_id) {
      return res.status(400).json({
        status: "E",
        message: "plan_id is required",
      });
    }

    // Determine customer from token or mobile
    let customer = null;
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.replace(/^Bearer\s+/i, '');

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded && decoded._id) {
          customer = await dbobj.collection('customer').findOne({
            _id: new ObjectId(decoded._id),
          });
        }
      } catch (err) {
        // Fall back to body mobile if token error
      }
    }

    if (!customer && mobile) {
      const cleanedMobile = String(mobile).replace(/\D/g, '');
      customer = await dbobj.collection('customer').findOne({
        mobile: cleanedMobile,
      });
    }

    if (!customer) {
      return res.status(401).json({
        status: "UA",
        message: "Customer authentication required to purchase a plan. Please login first.",
      });
    }

    // Fetch plan details from user_plans
    let plan = null;
    try {
      plan = await dbobj.collection('user_plans').findOne({
        _id: new ObjectId(plan_id),
        is_active: { $ne: false },
      });
    } catch (e) {
      return res.status(400).json({
        status: "E",
        message: "Invalid plan_id format",
      });
    }

    if (!plan) {
      return res.status(404).json({
        status: "E",
        message: "Selected plan not found or no longer active",
      });
    }

    const payableAmount =
      plan.final_amount !== undefined
        ? parseFloat(plan.final_amount)
        : Math.max(0, parseFloat(plan.total_amount || 0) - parseFloat(plan.discount_amount || 0));

    if (isNaN(payableAmount) || payableAmount < 0) {
      return res.status(400).json({
        status: "E",
        message: "Invalid plan price",
      });
    }

    // Unique Order ID
    const orderId = `CF_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    // Call Cashfree API
    const cfOrder = await cashfree.createOrder({
      orderId,
      orderAmount: payableAmount,
      customer,
      planName: `${plan.plan_name} (${plan.plan_type})`,
      returnUrl: return_url,
    });

    // Initial Pending Transaction Doc
    const pendingTxn = {
      order_id: orderId,
      plan_id: plan._id,
      plan_name: plan.plan_name,
      plan_type: plan.plan_type,
      count: plan.count,
      amount: payableAmount,
      status: "PENDING",
      payment_link: cfOrder.payment_link,
      payment_session_id: cfOrder.payment_session_id,
      created_at: new Date(),
    };

    // Store in customer_orders collection
    await dbobj.collection('customer_orders').insertOne({
      order_id: orderId,
      customer_id: customer._id,
      customer_mobile: customer.mobile,
      plan_id: plan._id,
      plan_name: plan.plan_name,
      plan_type: plan.plan_type,
      count: plan.count,
      amount: payableAmount,
      status: "PENDING",
      payment_link: cfOrder.payment_link,
      payment_session_id: cfOrder.payment_session_id,
      created_at: new Date(),
    });

    // Record pending transaction in customer document
    await dbobj.collection('customer').updateOne(
      { _id: customer._id },
      {
        $push: { transactions: pendingTxn },
        $set: { updated_at: new Date() },
      }
    );

    return res.status(200).json({
      status: "S",
      message: "Cashfree payment link generated successfully",
      data: {
        order_id: orderId,
        payment_link: cfOrder.payment_link,
        payment_session_id: cfOrder.payment_session_id,
        order_amount: payableAmount,
        currency: "INR",
        plan: {
          _id: plan._id,
          plan_name: plan.plan_name,
          plan_type: plan.plan_type,
          count: plan.count,
          total_amount: plan.total_amount,
          final_amount: payableAmount,
        },
        customer: {
          _id: customer._id,
          mobile: customer.mobile,
          name: customer.name || "",
          email: customer.email || "",
        },
      },
    });
  } catch (err) {
    console.error("buy_now error:", err);
    return res.status(500).json({
      status: "E",
      message: err.message || "Failed to initiate payment",
    });
  }
};

router.post('/buy_now', buyNowHandler);
router.post('/buy_plan', buyNowHandler);

/* =========================================================
   8. VERIFY PAYMENT STATUS (Client Check)
   POST /api/customer/verify_payment
   Body: { order_id: "CF_..." }
   ========================================================= */
router.post('/verify_payment', async (req, res) => {
  try {
    const { order_id } = req.body || {};
    const dbobj = res.locals.dbobj;

    if (!order_id) {
      return res.status(400).json({
        status: "E",
        message: "order_id is required",
      });
    }

    const order = await dbobj.collection('customer_orders').findOne({ order_id });
    if (!order) {
      return res.status(404).json({
        status: "E",
        message: "Order not found",
      });
    }

    // Query Cashfree for actual payment status
    const cfDetails = await cashfree.getOrderDetails(order_id);
    const orderStatus = (cfDetails.order_status || '').toUpperCase();

    if (orderStatus === 'PAID') {
      await fulfillCustomerOrder(dbobj, order, cfDetails);

      return res.status(200).json({
        status: "S",
        message: "Payment successful! Plan activated.",
        data: {
          order_id,
          status: "SUCCESS",
          order_status: "PAID",
          plan_name: order.plan_name,
          plan_type: order.plan_type,
          count: order.count,
          amount: order.amount,
        },
      });
    } else if (orderStatus === 'FAILED' || orderStatus === 'CANCELLED' || orderStatus === 'EXPIRED') {
      await markCustomerOrderFailed(dbobj, order, cfDetails);

      return res.status(200).json({
        status: "E",
        message: `Payment ${orderStatus.toLowerCase()}`,
        data: {
          order_id,
          status: "FAILED",
          order_status: orderStatus,
        },
      });
    } else {
      // Pending / Active
      return res.status(200).json({
        status: "PENDING",
        message: "Payment is still pending",
        data: {
          order_id,
          status: "PENDING",
          order_status: orderStatus || "ACTIVE",
        },
      });
    }
  } catch (err) {
    console.error("verify_payment error:", err);
    return res.status(500).json({
      status: "E",
      message: err.message || "Failed to verify payment",
    });
  }
});

/* =========================================================
   9. CASHFREE WEBHOOK NOTIFICATION
   POST /api/customer/cashfree_webhook
   ========================================================= */
router.post('/cashfree_webhook', async (req, res) => {
  try {
    const payload = req.body || {};
    const dbobj = res.locals.dbobj;

    console.log("🔔 [CASHFREE WEBHOOK RECEIVED]:", JSON.stringify(payload));

    const orderData =
      (payload.data && payload.data.order) ||
      (payload.order) ||
      payload;

    const orderId = orderData.order_id || payload.orderId;
    const paymentStatus = (
      (payload.data && payload.data.payment && payload.data.payment.payment_status) ||
      orderData.order_status ||
      payload.txStatus ||
      ''
    ).toUpperCase();

    if (!orderId) {
      return res.status(400).json({ message: "Missing order_id in webhook" });
    }

    const order = await dbobj.collection('customer_orders').findOne({ order_id: orderId });
    if (!order) {
      console.warn(`Webhook order not found: ${orderId}`);
      return res.status(200).json({ message: "Order not found but acknowledged" });
    }

    if (paymentStatus === 'SUCCESS' || paymentStatus === 'PAID') {
      await fulfillCustomerOrder(dbobj, order, payload);
      console.log(`✅ [WEBHOOK] Order ${orderId} marked SUCCESS and customer plan activated.`);
    } else if (paymentStatus === 'FAILED' || paymentStatus === 'CANCELLED') {
      await markCustomerOrderFailed(dbobj, order, payload);
      console.log(`❌ [WEBHOOK] Order ${orderId} marked FAILED.`);
    }

    return res.status(200).json({ status: "OK", message: "Webhook processed" });
  } catch (err) {
    console.error("cashfree_webhook error:", err);
    return res.status(500).json({ message: "Webhook processing error" });
  }
});

/* =========================================================
   10. GET CUSTOMER TRANSACTIONS & PURCHASED PLANS (Protected)
   GET /api/customer/my_plans
   ========================================================= */
router.get('/my_plans', verifyCustomerToken, async (req, res) => {
  try {
    const customer = req.customer;
    return res.status(200).json({
      status: "S",
      data: {
        customer_id: customer._id,
        mobile: customer.mobile,
        plan_pursch: customer.plan_pursch || customer.purchased_plans || [],
        transactions: customer.transactions || [],
      },
    });
  } catch (err) {
    console.error("my_plans error:", err);
    return res.status(500).json({
      status: "E",
      message: "Failed to fetch customer plans and transactions",
    });
  }
});

/* =========================================================
   11. CUSTOMER PLACE HOROSCOPE ORDER (GENERATE HOROSCOPE)
   POST /api/customer/generate_horoscope
   POST /api/customer/place_order
   Headers: { Authorization: "Bearer <token>" }
   Body: Raw JSON with plan type and required fields
   ========================================================= */
const generateHoroscopeHandler = async (req, res) => {
  try {
    const dbobj = res.locals.dbobj;
    const customer = req.customer;

    const {
      horoscope_type,
      plan_type,
      name,
      mobile,
      emailid,
      is_whatsapp,
      gender,
      dob,
      tob,
      place,
      fdob,
      ftob,
      fplace,
      fname,
      cname,
    } = req.body || {};

    let rawType = (
      req.params.horoscope_type ||
      req.params.plan_type ||
      horoscope_type ||
      plan_type ||
      ""
    ).trim();

    // Map common aliases / normalize casing
    const typeMapping = {
      single: "Single",
      life: "Life",
      yearly: "Yearly",
      super: "Super",
      numerology: "Numerology",
      gemstone: "Gemstone",
      wealth: "Wealth",
      marriageh: "MarriageH",
      marriage_horoscope: "MarriageH",
      "marriage-horoscope": "MarriageH",
      marriage: "Marriage",
      marriage_matching: "Marriage",
      "marriage-matching": "Marriage",
      promarriage: "ProMarriage",
      pro_marriage: "ProMarriage",
      "pro-marriage": "ProMarriage",
    };

    const type = typeMapping[rawType.toLowerCase()] || rawType;

    if (!type) {
      return res.status(400).json({
        status: "E",
        message:
          "Horoscope / plan type is required (e.g. Single, Life, Yearly, Super, Numerology, Gemstone, Wealth, MarriageH, Marriage, ProMarriage)",
      });
    }

    const isMarriage = type === "Marriage" || type === "ProMarriage";

    // 1. Validate Main Person details
    if (!name || !name.trim()) {
      return res.status(400).json({
        status: "E",
        message: isMarriage ? "Male Name (name) is required" : "Name is required",
      });
    }

    const orderMobile = String(mobile || customer.mobile || "").replace(/\D/g, "");
    if (!orderMobile || orderMobile.length !== 10) {
      return res.status(400).json({
        status: "E",
        message: "A valid 10-digit mobile number is required",
      });
    }

    if (!dob) {
      return res.status(400).json({
        status: "E",
        message: isMarriage
          ? "Male Date of Birth (dob) is required (YYYY-MM-DD)"
          : "Date of Birth (dob) is required (YYYY-MM-DD)",
      });
    }

    if (!tob || !String(tob).trim()) {
      return res.status(400).json({
        status: "E",
        message: isMarriage
          ? "Male Time of Birth (tob) is required (HH:mm)"
          : "Time of Birth (tob) is required (HH:mm)",
      });
    }

    if (!place || !String(place).trim()) {
      return res.status(400).json({
        status: "E",
        message: isMarriage
          ? "Male Place of Birth (place) is required"
          : "Place of Birth (place) is required",
      });
    }

    // 2. Validate Marriage Matching (Female Details)
    if (isMarriage) {
      if (!fname || !fname.trim()) {
        return res.status(400).json({
          status: "E",
          message: "Female Name (fname) is required for Marriage Matching",
        });
      }
      if (!fdob) {
        return res.status(400).json({
          status: "E",
          message: "Female Date of Birth (fdob) is required for Marriage Matching",
        });
      }
      if (!ftob || !String(ftob).trim()) {
        return res.status(400).json({
          status: "E",
          message: "Female Time of Birth (ftob) is required for Marriage Matching",
        });
      }
      if (!fplace || !String(fplace).trim()) {
        return res.status(400).json({
          status: "E",
          message: "Female Place of Birth (fplace) is required for Marriage Matching",
        });
      }
    } else {
      if (!gender) {
        return res.status(400).json({
          status: "E",
          message: "Gender is required (M/F)",
        });
      }
    }

    // 3. Deduct credit from customer's purchased plans (plan_pursch) if available
    let appliedPlanId = null;
    if (Array.isArray(customer.plan_pursch) && customer.plan_pursch.length > 0) {
      const planIdx = customer.plan_pursch.findIndex(
        (p) =>
          p.status === "ACTIVE" &&
          (p.remaining_count === undefined || p.remaining_count > 0) &&
          String(p.plan_type).toLowerCase() === type.toLowerCase()
      );

      if (planIdx !== -1) {
        appliedPlanId = customer.plan_pursch[planIdx].plan_id;
        const currentRemaining = customer.plan_pursch[planIdx].remaining_count ?? 1;
        const newRemaining = Math.max(0, currentRemaining - 1);
        const newStatus = newRemaining === 0 ? "EXHAUSTED" : "ACTIVE";

        const updateResult = await dbobj.collection('customer').updateOne(
          {
            _id: customer._id,
            [`plan_pursch.${planIdx}.status`]: "ACTIVE",
            [`plan_pursch.${planIdx}.remaining_count`]: currentRemaining,
          },
          {
            $set: {
              [`plan_pursch.${planIdx}.remaining_count`]: newRemaining,
              [`plan_pursch.${planIdx}.status`]: newStatus,
              updated_at: new Date(),
            },
          }
        );
        if (updateResult.modifiedCount === 0) {
          console.warn("Concurrent plan credit deduction detected or plan already updated.");
        }
      }
    }

    // 4. Build document according to user specifications for order_history
    const customerDisplayName =
      (customer.name && customer.name.trim()) || name.trim() || "Customer";
    const customerLabel = `${customerDisplayName}-Customer`;

    const insert_obj = {
      cus_id: new ObjectId(customer._id), // Store logged-in customer ID
      fnc_id: null, // fnc_id set empty for customer generated orders
      plan_id: appliedPlanId ? new ObjectId(appliedPlanId) : null,
      horoscope_type: type,
      name: name.trim(),
      fathername: "", // Father Name no need
      mothername: "", // Mother Name no need
      mobile: orderMobile,
      is_whatsapp: is_whatsapp !== undefined ? Boolean(is_whatsapp) : true,
      emailid: (emailid || customer.email || "").trim(),
      gender: isMarriage ? "M" : (gender || "M"),
      dob: new Date(dob),
      tob: String(tob).trim(),
      place: String(place).trim(),
      fdob: fdob ? new Date(fdob) : null,
      ftob: ftob ? String(ftob).trim() : "",
      fplace: fplace ? String(fplace).trim() : "",
      fname: fname ? String(fname).trim() : "",
      cname: cname ? String(cname).trim() : customerDisplayName,
      language: "ta", // Lang default set to tamil
      other_details: "", // Remarks/other details no need
      status: "Pending",
      fileurl: "",
      remarks: [
        `Order placed at ${new Date().toISOString()} by ${customerLabel}`,
      ],
      created_at: new Date(),
      updated_at: new Date(),
      created_by: customerLabel,
      lastup_by: customerLabel,
    };

    const result = await dbobj.collection('order_history').insertOne(insert_obj);

    if (result.acknowledged) {
      // Send push notification to active admin users
      try {
        const users = await dbobj
          .collection("user_accounts")
          .find({ is_active: true, fcm_token: { $exists: true, $ne: "" } })
          .toArray();

        const tokens = users.map((u) => u.fcm_token).filter(Boolean);
        if (tokens.length > 0) {
          await sendNotification(
            tokens,
            "🔔 New Customer Horoscope Order",
            `New ${type} horoscope order placed by ${customerDisplayName} (${orderMobile})`,
            { orderId: result.insertedId.toString() }
          );
        }
      } catch (notifyErr) {
        console.warn("FCM push notification error:", notifyErr);
      }

      return res.status(200).json({
        status: "S",
        message: "Horoscope order placed successfully",
        order_id: result.insertedId,
        data: {
          order_id: result.insertedId,
          cus_id: customer._id,
          fnc_id: null,
          horoscope_type: type,
          name: insert_obj.name,
          mobile: insert_obj.mobile,
          emailid: insert_obj.emailid,
          language: "ta",
          status: "Pending",
          created_at: insert_obj.created_at,
        },
      });
    }

    return res.status(500).json({
      status: "E",
      message: "Failed to place horoscope order",
    });
  } catch (err) {
    console.error("customer generate_horoscope error:", err);
    return res.status(500).json({
      status: "E",
      message: "Server error while placing horoscope order",
      error: err.message,
    });
  }
};

router.post('/generate_horoscope', verifyCustomerToken, generateHoroscopeHandler);
router.post('/generate_horoscope/:horoscope_type', verifyCustomerToken, generateHoroscopeHandler);
router.post('/place_order', verifyCustomerToken, generateHoroscopeHandler);
router.post('/place_order/:horoscope_type', verifyCustomerToken, generateHoroscopeHandler);

/* =========================================================
   12. CUSTOMER ORDERS HISTORY (Protected)
   GET /api/customer/orders
   GET /api/customer/order_history
   Headers: { Authorization: "Bearer <token>" }
   ========================================================= */
const getCustomerOrdersHandler = async (req, res) => {
  try {
    const dbobj = res.locals.dbobj;
    const customer = req.customer;

    const orders = await dbobj
      .collection('order_history')
      .find({
        $or: [
          { cus_id: new ObjectId(customer._id) },
          { mobile: customer.mobile },
        ],
      })
      .sort({ created_at: -1 })
      .toArray();

    return res.status(200).json({
      status: "S",
      total: orders.length,
      data: orders,
    });
  } catch (err) {
    console.error("getCustomerOrders error:", err);
    return res.status(500).json({
      status: "E",
      message: "Failed to fetch order history",
    });
  }
};

router.get('/orders', verifyCustomerToken, getCustomerOrdersHandler);
router.get('/order_history', verifyCustomerToken, getCustomerOrdersHandler);

module.exports = router;
