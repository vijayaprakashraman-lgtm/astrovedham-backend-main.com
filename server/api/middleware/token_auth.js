const jwt = require('jsonwebtoken');
// const CONFIG = require('../../common/inc.config');
// const reward_class = require('../../classes/class.leaderboard_reward')
// var loggerobj = require('../../classes/class.logger');
// const reward_func = new reward_class();

module.exports = async (req, res, next) => {
    //console.log(req.url, req.headers['x-api-key'], req.headers['authorization']);
    // console.log(req.url, JSON.stringify(req.body));
    req.body = req.body || {};
    req.body.requrl = req.url;
    let dbobj = res.locals.dbobj;
    let redisobj = res.locals.redisobj;
    // let redisobjv1 = res.locals.redisobjv1;
    
    try {
        //Pre-Login endpoints which does not have Authorization token
        let X_API_KEY = req.headers['x-api-key'];
        let AUTHORIZATION = req.headers['authorization']?.replace("Bearer ", "");
        let only_x_api_key_endpoints = [
            'login',
            'google_login',
            'signup',
            'verify_email',
            'update_password',
            'get_products'
        ];

        let requested_url = req.url.replace('/', '');
        //console.log(only_x_api_key_endpoints.includes(requested_url), "requested url:::", requested_url);
        if (only_x_api_key_endpoints.includes(requested_url)) {
            console.log(req.body);
            /* CHECKING X-API-KEY WITH SERVER VALUE WHICH IS VALID OR NOT */
            (X_API_KEY == process.env.X_API_KEY)
                ? next()
                : res.status(401).json({ status: "UA", msg: "1Your account has been logged out." });
            return false;
        }
        else {

            if (AUTHORIZATION != "" && AUTHORIZATION != null && AUTHORIZATION != undefined) {

                /* POST LOGIN API's WHICH HAVE VALID AUTHORIZATION JWT TOKEN */
                let decode_token = jwt.verify(AUTHORIZATION, process.env.JWT_SECRET);
                 console.log(decode_token);
                if (decode_token) {
                    req.body.AVLemail = decode_token.email;
                    req.body.AVLemail = decode_token.email;
                    req.body.AVLid = decode_token.user_id;
                    req.body.AVLname = decode_token.name;
                    req.body.AVLtype = decode_token.type;
                    req.body.AVLOBJID = decode_token._id;
                    req.body.AVLType = decode_token.type;
                    console.log('Authenticated User:', decode_token);
                     next();
                }
                else {
                    res.status(401).json({ status: "UA", msg: "2Your account has been logged out." });
                    return false;
                }
            }
            else {
                res.status(401).json({ status: "UA", msg: "Unauthorized Access" });
                return false;
            }
        }

    } catch (err) {
        console.log(err);
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ status: "UA", msg: "Token expired" });
        }
        return res.status(401).json({ status: "UA", msg: "Your account has been logged out.",error: err });
    }
};
