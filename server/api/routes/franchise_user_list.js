const express = require('express');
const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { status, search } = req.body;
    let query = { is_active: status };

    if (status === "") {
      delete query.is_active;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { mobile: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ];
    }
    
    const result = await res.locals.dbobj.collection('franchise_user')
      .find(query)
      .sort({ created_at: -1 })
      .toArray();

    res.status(200).json(result);
  } catch (err) {
    console.log("franchise_user_list", err);
    res.status(500).json({ message: "Server error" });
  }
});


module.exports = router;
