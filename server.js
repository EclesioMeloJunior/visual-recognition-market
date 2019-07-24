const dotenv = require("dotenv");
const express = require("express");
const multer = require("multer");
const uploadController = require("./upload");
const bodyParser = require("body-parser");

dotenv.config();

const app = express();
const port = process.env.SERVER_PORT;

const storage = multer.diskStorage({
	limits: {
		fileSize: 4 * 1024 * 1024
	},
	destination: function(req, file, cb) {
		cb(null, "tmp/uploads/");
	},
	filename: function(req, file, cb) {
		cb(null, `${file.fieldname}-${Date.now()}.png`);
	}
});

const upload = multer({ storage });

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (req, res) => res.send("Hello World!"));

app.post(
	"/image/upload/label",
	upload.single("image"),
	uploadController.uploadAndLabeledImage
);

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
