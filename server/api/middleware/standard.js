const bodyParser = require('body-parser');
const cors = require('cors');
var fs = require('fs')
var morgan = require('morgan');
var path = require('path');
var rfs = require('rotating-file-stream');

class StandardMiddleware {

  attachTo(app) {
    var accessLogStream = rfs.createStream('access.log', {
      interval: '1d', // rotate daily
      path: path.join(__dirname, '../../log')
    });

    app.use(morgan('combined', { stream: accessLogStream }))
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json());

    app.use(bodyParser.urlencoded({ // Need to test
      parameterLimit: 5,
      limit: '1kb',
      extended: true
    }));
    const allowedOrigins = (process.env.CORS_ORIGINS ||
      "http://localhost:5000,http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,https://astrovedham.com,https://www.astrovedham.com,https://astrovedham.com:3000,https://www.astrovedham.com:3000")
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean);

    const corsOptions = {
      origin: (origin, callback) => {
        // Allow server-to-server or tools without Origin header
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error(`CORS blocked for origin: ${origin}`));
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "x-api-key"],
    };
    console.log('cors');
    app.use(cors(corsOptions));
    app.options('*', cors(corsOptions));
  }
}

module.exports = new StandardMiddleware();  
