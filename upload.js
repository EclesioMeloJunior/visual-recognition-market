const fs = require("fs");
const path = require("path");
const { Storage } = require("@google-cloud/storage");
const createCsvWriter = require("csv-writer").createArrayCsvWriter;

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
		const csvFilePath = `tmp/csv/ml_source.csv`;
		await downloadCSVFromGCloud(csvFilePath);

		const csvlabels = labels
			.split(",")
			.map(label => label.trim())
			.join(",");

		const line = `\n${gcloudFileAddress},${csvlabels}`;

		fs.appendFileSync(csvFilePath, line);
		await uploadFileToGCloud(csvFilePath);

		fs.unlinkSync(csvFilePath);

		async function downloadCSVFromGCloud(destination) {
			const bucketName = process.env.BUCKET;

			await gcloudStorage
				.bucket(bucketName)
				.file("ml_source.csv")
				.download({
					destination
				});
		}
	}
}

module.exports = {
	uploadAndLabeledImage
};
