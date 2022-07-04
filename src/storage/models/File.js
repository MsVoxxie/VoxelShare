const mongoose = require('mongoose');

const File = new mongoose.Schema({
    url: String,
	path: {
		type: String,
		required: true,
	},
	originalName: {
		type: String,
		required: true,
	},
	size: {
		type: Number,
		required: true,
	},
	fileType: {
		type: String,
		required: true,
	},
	downloads: {
		type: Number,
		default: 0,
		required: true,
	},
	encryption: String,
});

module.exports = mongoose.model('File', File);
