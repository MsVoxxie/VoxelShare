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

//Set View Engine and allow forms
app.use('/', express.static(`${__dirname}/fileStorage`));
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

//View Paths
const viewPaths = {
	index: path.join(`${__dirname}/storage/views/index.ejs`),
	password: path.join(`${__dirname}/storage/views/password.ejs`),
};

app.get('/', (req, res) => {
	res.render(viewPaths.index);
});

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
			return res.send('Error uploading file.');
		}

		const fileData = {
			url: `${req.headers.origin}/${req.file.filename}`,
			path: req.file.path,
			originalName: req.file.originalname,
			fileType: `.${req.file.mimetype.split('/')[1]}`,
			size: req.file.size,
		};

		if (req.body.password != null && req.body.password !== '') {
			fileData.password = await bcrypt.hash(req.body.password, 10);
		}

		const file = await File.create(fileData);
		res.render(viewPaths.index, { fileLink: file.id, fileUrl: file.url, secure: file.password ? true : false });
	});
});

app.route('/:id').get(handleDownload).post(handleDownload);

// Function for downloading files
async function handleDownload(req, res) {
	//Get file from DB
	if (!mongoose.Types.ObjectId.isValid(req.params.id)) return false;
	const file = await File.findById(req.params.id);

	//Check for password
	if (file.password != null) {
		if (req.body.password == null) {
			res.render(viewPaths.password);
			return;
		}

		if (!(await bcrypt.compare(req.body.password, file.password))) {
			res.render(viewPaths.password, { error: true });
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
