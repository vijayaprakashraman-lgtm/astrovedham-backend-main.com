const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const UTILS = require('../../utils/util.functions');

router.post('/', async (req, res) => {
  try {
    const { status, horoscope_type, search, AVLType, AVLOBJID, source } = req.body;

    let query = {};

    // Filter by status if provided and not "All"
    if (status && status !== "All") {
      query.status = status;
    }

    if (horoscope_type) {
      query.horoscope_type = horoscope_type;
    }

    // Franchise users are restricted to their own franchise orders
    if (AVLType === "franchise") {
      query.fnc_id = new ObjectId(AVLOBJID);
    } else {
      // Admin / Owner: Can filter by source (all, customer, franchise)
      if (source === "customer") {
        query.$or = [
          { cus_id: { $exists: true, $ne: null } },
          { fnc_id: null },
          { created_by: { $regex: "customer", $options: "i" } },
        ];
      } else if (source === "franchise") {
        query.fnc_id = { $exists: true, $ne: null };
      }
    }

    if (search && String(search).trim() !== "") {
      const s = String(search).trim();
      const searchConditions = [
        { name: { $regex: s, $options: "i" } },
        { cname: { $regex: s, $options: "i" } },
        { fathername: { $regex: s, $options: "i" } },
        { mothername: { $regex: s, $options: "i" } },
        { mobile: { $regex: s, $options: "i" } },
        { emailid: { $regex: s, $options: "i" } },
        { created_by: { $regex: s, $options: "i" } },
      ];

      // If query already has $or (e.g. from source === 'customer'), wrap in $and
      if (query.$or) {
        query.$and = [
          { $or: query.$or },
          { $or: searchConditions },
        ];
        delete query.$or;
      } else {
        query.$or = searchConditions;
      }
    }

    const result = await res.locals.dbobj.collection('order_history')
      .find(query)
      .sort({ created_at: -1 })
      .toArray();

    // Enrich customer details for customer-generated orders
    const customerIds = result
      .map(item => item.cus_id)
      .filter(id => id && ObjectId.isValid(id))
      .map(id => new ObjectId(id));

    let customerMap = {};
    if (customerIds.length > 0) {
      try {
        const customers = await res.locals.dbobj.collection('customer')
          .find({ _id: { $in: customerIds } })
          .project({ name: 1, mobile: 1, email: 1 })
          .toArray();
        customers.forEach(c => {
          customerMap[c._id.toString()] = c;
        });
      } catch (e) {
        console.error("Error looking up customers for order history:", e);
      }
    }

    result.forEach(item => {
      // Format file url
      if (item.fileurl && !String(item.fileurl).startsWith("http")) {
        item.fileurl = process.env.PDF_BASE_URL + "/viewhoroscope/" + item.fileurl;
      }

      // Determine order source
      const isCustomer = Boolean(
        item.cus_id ||
        !item.fnc_id ||
        (item.created_by && String(item.created_by).toLowerCase().includes("customer"))
      );

      item.order_source = isCustomer ? "customer" : "franchise";

      // Attach customer info if available
      if (item.cus_id && customerMap[item.cus_id.toString()]) {
        const c = customerMap[item.cus_id.toString()];
        item.customer_info = c;
        if (!item.cname) {
          item.cname = c.name;
        }
      }
    });

    res.status(200).json(result);
  } catch (err) {
    console.log("order_list error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;
