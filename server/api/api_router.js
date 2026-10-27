const express = require('express').Router;
const TOKEN_AUTH = require('./middleware/token_auth');
const uploadPdf = require("./middleware/uploadfile");




class api_router {
  create() {
    const route = express();

    // routes WITHOUT token
    const customerRoutes = require('./routes/customer.js');
    route.use('/customer', customerRoutes);
    route.use('/plan_types', (req, res, next) => {
      req.url = '/plan_types';
      customerRoutes(req, res, next);
    });
    route.use('/plans', (req, res, next) => {
      req.url = '/plans' + (req.url === '/' ? '' : req.url);
      customerRoutes(req, res, next);
    });
    route.use('/getplans', (req, res, next) => {
      req.url = '/getplans' + (req.url === '/' ? '' : req.url);
      customerRoutes(req, res, next);
    });
    route.use('/get_plans', (req, res, next) => {
      req.url = '/getplans' + (req.url === '/' ? '' : req.url);
      customerRoutes(req, res, next);
    });
    route.use('/franchise_reg', require('./routes/franchise_reg.js'));
    route.use('/google_login', require('./routes/google_signin.js'));
    route.use('/franchise_google_login', require('./routes/franchise_google_signin.js'));

    // routes WITH token
    route.use('/upload_horscope', uploadPdf.single("pdfFile"), TOKEN_AUTH, require('./routes/uploadHorscope.js'));
    route.use('/', TOKEN_AUTH);

    // other APIs

    route.use('/place_order', require('./routes/place_order.js'));
    route.use('/order_list', require('./routes/get_oders.js'));
    route.use('/franchise_user_list', require('./routes/franchise_user_list.js'));
    route.use('/customer_list', require('./routes/customer_list.js'));
    route.use('/franchise/activate-plan', require('./routes/franchise_plan_activation.js'));
    route.use('/user_plans', require('./routes/user_plans.js'));
    route.use('/save_fcm_token', require('./routes/save_fcm_token.js'));

    /* ================= TOGGLE STATUS API ================= */
    route.post('/franchise/toggle-status', async (req, res) => {
      try {
        const { id, status } = req.body;

        if (!id || typeof status !== "boolean") {
          return res.status(400).json({
            message: "Invalid parameters",
          });
        }

        const result = await res.locals.dbobj.collection('franchise_user').updateOne(
          { _id: id },
          { $set: { is_active: status } }
        )


        if (!result) {
          return res.status(404).json({
            message: "Franchise not found",
          });
        }

        return res.status(200).json({
          message: "Status updated successfully",
          data: result,
        });
      } catch (err) {
        console.error("Toggle status error:", err);
        return res.status(500).json({
          message: "Server error",
        });
      }
    });



    return route;
  }
}

module.exports = new api_router();
