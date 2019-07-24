const fs = require("fs");
const path = require("path");
const createCsvWriter = require("csv-writer").createArrayCsvWriter;
const { Storage } = require("@google-cloud/storage");

const gcloudStorage = new Storage();

async function uploadAndLabeledImage(req, res) {
	const gcloudFileAddress = await writeAndUploadImage(req.file);
	await writeAndUploadCSVFile(gcloudFileAddress, req.body.labels);

	res.json({ message: "Upload with success" });

	async function uploadFileToGCloud(filePath) {
		const bucketName = process.env.BUCKET;

		return await gcloudStorage.bucket(bucketName).upload(filePath, {
			gzip: true,
			public: true,
			metadata: {
				cacheControl: "public, max-age=31536000"
			}
		});
	}

	async function writeAndUploadImage(file) {
		const filePath = path.join(file.destination, file.filename);
		const gcloudUploadResponse = await uploadFileToGCloud(filePath);

		fs.unlinkSync(filePath);

		const gcloudFileAddress = mountGClougAddress(gcloudUploadResponse[0]);
		return gcloudFileAddress;

		function mountGClougAddress(uploadResponse) {
			return `gs://${uploadResponse.metadata.bucket}/${
				uploadResponse.metadata.name
			}`;
		}
	}

	async function writeAndUploadCSVFile(gcloudFileAddress, labels) {
		const csvFilePath = "tmp/csv/ml_source.csv";
		const csvSource = process.env.ML_CSV_SOURCE;

		// const csvWriter = createCsvWriter({
		// 	path: csvFilePath
		// });

		const cvsLine = [gcloudFileAddress, ...labels.split(",")];

		// console.log(cvsLine);

		// await csvWriter.writeRecords(cvsLine);
		// await uploadFileToGCloud(csvFilePath);

		// fs.unlinkSync(csvFilePath);

		fs.stat(csvFilePath);
	}
}

module.exports = {
	uploadAndLabeledImage
};
