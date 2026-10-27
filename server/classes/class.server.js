const express = require('express');
const cluster = require('cluster');
const standardmiddleware = require('../api/middleware/standard');
const api_router = require('../api/api_router');
const cookieParser = require("cookie-parser");
const path = require('path'); // ✅ Only declared once at top
const fs = require('fs');     // ✅ For checking if dist exists
const cpu_count = require('os').cpus().length;
const { MongoClient } = require('mongodb');
const dotenv = require("dotenv");
const last_deploy = new Date();
dotenv.config();

class Server {
    constructor() {
        this.epress_apps = [];
        this.workers = [];
        this.mongoClient = null;
        this.dbobj = null;
    }

    async start(clustermode) {
        await this.initMongoDB();
        if (clustermode) {
            this.start_cluster_mode();
        } else {
            this.start_normal_mode();
        }
    }

    start_cluster_mode() {
        if (cluster.isMaster) {
            this.start_master();
        } else {
            this.start_worker();
        }
    }

    start_normal_mode() {
        this.start_worker();
    }

    start_master() {
        console.log(`Master started in process id [${process.pid}]`);
        for (let i = 0; i < cpu_count; i++) {
            let worker = cluster.fork();
            console.log(`Worker ${worker.id} started from process id [${process.pid}]`);
            worker.on('disconnect', () => {
                console.log(`Worker ${worker.id} died`);
            });
            this.workers.push(worker);
        }
    }

    async start_worker() {
        let app = express();

        /* Middleware */
        app.use(cookieParser());
        standardmiddleware.attachTo(app);

        app.use((req, res, next) => {
            res.locals.dbobj = this.dbobj;
            next();
        });

        // /* Serve React frontend (built with Vite) */
        // const reactBuildPath = path.join(__dirname, '../../clientv1/dist');
        // // const reactBuildPath = path.join(__dirname, '../clientv1/dist');

        // // Optional: Check if React build exists
        // if (!fs.existsSync(reactBuildPath)) {
        //     console.error(`❌ React build not found at: ${reactBuildPath}`);
        //     console.error('👉 Run "npm run build" in the clientv1 directory first!');
        //     process.exit(1);
        // }

        // app.use(express.static(reactBuildPath));

        /* Serve uploaded PDFs */
        app.use("/viewhoroscope", express.static("uploads/pdfs"));

        /* API routes — MUST come BEFORE catch-all */
        app.use('/api', api_router.create());

        // /* SPA fallback: serve index.html for all non-API routes */
        // app.get('*', (req, res) => {
        //     res.sendFile(path.join(reactBuildPath, 'index.html'));
        // });

        await this.start_listening(app);
        this.epress_apps.push(app);
    }

    start_listening(app) {
        return new Promise((resolve, reject) => {
            if (process.env.PORT) {
                let server = app.listen(process.env.PORT, '0.0.0.0'); // Listen on all interfaces
                server.on('error', (err) => {
                    console.log(`Could not start server: ${err}`);
                    reject(err);
                });
                server.on('listening', () => {
                    console.log(`[${process.pid}] Server started on http://0.0.0.0:${process.env.PORT}`);
                    resolve();
                });
            } else {
                reject(new Error(`PORT not defined in environment`));
            }
        });
    }

    async initMongoDB() {
        try {
            this.mongoClient = new MongoClient(process.env.MONGODB_URI, { maxPoolSize: 10 });
            await this.mongoClient.connect();
            this.dbobj = this.mongoClient.db(process.env.DB_NAME);
            console.log(`✅ Connected to MongoDB`);
        } catch (error) {
            console.error(`❌ Failed to connect to MongoDB: ${error}`);
            throw error;
        }
    }
}

module.exports = Server;
