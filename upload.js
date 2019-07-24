const fs = require("fs");
const path = require("path");
const fastcsv = require("fast-csv");
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
		const csvFilePath = `tmp/csv/ml_source-${Date.now()}.csv`;
		const cvsLine = [gcloudFileAddress, ...labels.split(",")];
		const write = fs.createWriteStream(csvFilePath);

		await fastcsv.write(cvsLine, { headers: false }).pipe(write);
	}
}

module.exports = {
	uploadAndLabeledImage
};
