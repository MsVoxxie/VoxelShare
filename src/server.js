const { sendSuccessWebHook, sendFailedWebHook } = require('./storage/funcs/index.js');
const File = require('./storage/models/File');
const mongoose = require('mongoose');
const express = require('express');
const bcrypt = require('bcrypt');
const multer = require('multer');
const https = require('https');
const path = require('path');
require('dotenv').config();
const fs = require('fs');
const app = express();

//Setup MongoDB
mongoose.connect(process.env.DATABASE_URL);

//Setup Statics
const cssDirectoryPath = path.join(__dirname, '../src/css');
const fileStoragePath = path.join(__dirname, '../src/fileStorage');
const cssDirectory = express.static(cssDirectoryPath);
const fileStorageDirectory = express.static(fileStoragePath);

console.log(fileStoragePath);

//Set View Engine and allow forms
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

//Use Statics
app.use('/css/', cssDirectory);
app.use('/', fileStorageDirectory);
// app.use('/', express.static(`${__dirname}/fileStorage`));

//View Paths
const viewPaths = {
	index: path.join(`${__dirname}/storage/views/index.ejs`),
	encryption: path.join(`${__dirname}/storage/views/encryption.ejs`),
};

//Landing Page
app.get('/', (req, res) => {
	res.render(viewPaths.index);
});

//Handle Uploads
app.post('/upload', async (req, res) => {
	//Setup Multer
	let storage = multer.diskStorage({
		destination: function (req, file, cb) {
			cb(null, `${__dirname}/fileStorage/`);
		},
		filename: function (req, file, cb) {
			let extArray = file.originalname.split('.');
			let extension = extArray[extArray.length - 1];
			cb(null, `${Date.now()}.${extension}`);
		},
		fieldSize: 500 * 1024 * 1024,
	});

	//Define Upload
	const upload = multer({ storage });

	//Upload File
	upload.single('file')(req, res, async (err) => {
		if (err) {
			sendFailedWebHook(req);
			return res.send('Error uploading file.');
		}

		console.log(req.file, req.body.encryption);

		const fileData = {
			url: `${req.headers.origin}/${req.file.filename}`,
			path: req.file.path,
			originalName: req.file.originalname,
			fileType: `.${req.file.mimetype.split('/')[1]}`,
			size: req.file.size,
		};

		if (req.body.encryption != null && req.body.encryption !== '') {
			fileData.encryption = await bcrypt.hash(req.body.encryption, 10);
		}

		const file = await File.create(fileData);
		await sendSuccessWebHook(req);

		res.render(viewPaths.index, { fileLink: file.id, fileUrl: file.url, secure: file.encryption ? true : false });
	});
});

//Serve Files
app.route('/:id').get(handleDownload).post(handleDownload);

// Function for downloading files
async function handleDownload(req, res) {
	//Get file from DB
	if (!mongoose.Types.ObjectId.isValid(req.params.id)) return false;
	const file = await File.findById(req.params.id);

	//Check for encryption
	if (file.encryption != null) {
		if (req.body.encryption == null) {
			res.render(viewPaths.encryption);
			return;
		}

		if (!(await bcrypt.compare(req.body.encryption, file.encryption))) {
			res.render(viewPaths.encryption, { error: true });
			return;
		}
	}

	//Increment download count
	file.downloads++;
	await file.save();

	//Download file
	res.download(file.path, file.originalName);
}

const AUTH = {
	privateKey: fs.readFileSync('/etc/letsencrypt/live/file.voxxie.me/privkey.pem', 'utf8'),
	certificate: fs.readFileSync('/etc/letsencrypt/live/file.voxxie.me/fullchain.pem', 'utf8'),
	ca: fs.readFileSync('/etc/letsencrypt/live/file.voxxie.me/chain.pem', 'utf8'),
};

https.createServer({ key: AUTH.privateKey, cert: AUTH.certificate, ca: AUTH.ca }, app).listen(process.env.PORT, '0.0.0.0', () => console.log(`Server Started on port:  ${process.env.PORT}`));
