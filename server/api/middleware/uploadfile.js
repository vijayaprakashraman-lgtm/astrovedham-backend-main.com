const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/pdfs");
    },
    filename: (req, file, cb) => {
        const { orderId } = req.body; // 👈 coming from form-data
        const ext = path.extname(file.originalname); // .pdf
        const time = Date.now();

        cb(null, `${orderId}_${time}${ext}`);
    },
});

const uploadPdf = multer({
    storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === "application/pdf") {
            cb(null, true);
        } else {
            cb(new Error("Only PDF allowed"), false);
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
    },
});

module.exports = uploadPdf;
