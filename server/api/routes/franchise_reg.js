const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const UTILS = require('../../utils/util.functions');

router.post('/', async (req, res) => {
  try {
     const { _id, name,mobile,altMobile,email,business_name,city ,office_address, is_active } = req.body;

    if (!name || !mobile || !business_name || !city || !office_address) {
      return res.status(400).json({
        message: "All required fields must be filled"
      });
    }

    if (!email) {
      return res.status(400).json({
        message: "Email is required"
      });
    }

    // Check for unique email
    if (_id) {
      const existingEmail = await res.locals.dbobj.collection('franchise_user').findOne({ 
        email: email.toLowerCase(),
        _id: { $ne: new ObjectId(_id) }
      });
      if (existingEmail) {
        return res.status(409).json({
          message: "Email already exists",
          field: "email"
        });
      }
    } else {
      const existingEmail = await res.locals.dbobj.collection('franchise_user').findOne({ email: email.toLowerCase() });
      if (existingEmail) {
        return res.status(409).json({
          message: "Email already exists",
          field: "email"
        });
      }
    }

    // Check for unique mobile
    if (_id) {
      const existingMobile = await res.locals.dbobj.collection('franchise_user').findOne({ 
        mobile: mobile,
        _id: { $ne: new ObjectId(_id) }
      });
      if (existingMobile) {
        return res.status(409).json({
          message: "Mobile number already exists",
          field: "mobile"
        });
      }
    } else {
      const existingMobile = await res.locals.dbobj.collection('franchise_user').findOne({ mobile: mobile });
      if (existingMobile) {
        return res.status(409).json({
          message: "Mobile number already exists",
          field: "mobile"
        });
      }
    }

    // Check for unique altMobile (only if provided)
    if (altMobile) {
      if (_id) {
        const existingAltMobile = await res.locals.dbobj.collection('franchise_user').findOne({ 
          altMobile: altMobile,
          _id: { $ne: new ObjectId(_id) }
        });
        if (existingAltMobile) {
          return res.status(409).json({
            message: "Alternate mobile number already exists",
            field: "altMobile"
          });
        }
      } else {
        const existingAltMobile = await res.locals.dbobj.collection('franchise_user').findOne({ altMobile: altMobile });
        if (existingAltMobile) {
          return res.status(409).json({
            message: "Alternate mobile number already exists",
            field: "altMobile"
          });
        }
      }
    }

    const query = {
      name,
      mobile,
      altMobile: altMobile || null,
      email: email.toLowerCase(),
      business_name,
      city,
      office_address,
      updated_at: new Date(),
    };

    let result;

    if (_id) {
      // UPDATE
      result = await res.locals.dbobj.collection('franchise_user').updateOne(
        { _id: new ObjectId(_id) },
        {
          $set: {
            ...query,
            is_active: is_active !== undefined ? is_active : true,
          },
          $push: {
            acc_his: 'Updated on ' + new Date().toISOString()
          }
        }
      );
      res.status(200).json({ message: "Franchise updated successfully", result });
    } else {
      // INSERT
      const newQuery = {
        ...query,
        created_at: new Date(),
        acc_his: ['Created on ' + new Date().toISOString()],
        is_active: is_active !== undefined ? is_active : true,
      };
      result = await res.locals.dbobj.collection('franchise_user').insertOne(newQuery);
      res.status(200).json({ message: "Franchise created successfully", result });
    }
  } catch (err) {
    console.log("franchise_reg_error", err);
    res.status(500).json({ message: "Server error" });
  }
});




module.exports = router;
