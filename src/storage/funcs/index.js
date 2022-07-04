require('dotenv').config({ path: '../../.env' });
const moment = require('moment');
const axios = require('axios');

//Success
async function sendSuccessWebHook(req) {
	//Quick definitions
	let IP = req.headers['x-forwarded-for'] || req.socket.remoteAddress || null;
	IP = IP.split(',')[1];

	let encrypted = req.body.password != null && req.body.password !== '' ? 'Encrypted' : 'Direct';
	//An array of Discord Embeds.
	let embeds = [
		{
			title: 'File Uploaded Successfully',
			color: 5174599,
			fields: [
				{
					name: `${req.file.originalname.toString()}`,
					value: `**File Size›** \`${formatBytes(req.file.size)}\`\n**File Type›** \`${req.file.originalname.split('.')[1]}\`\n**File Encryption›** \`${encrypted}\`\n**Uploaded By›** ||${IP}||\n**File Link›** ||${req.headers.origin}/${req.file.filename}||`,
				},
			],
			footer: {
				text: `📅 ${moment(Date.now()).format('MMMM Do YYYY, h:mm:ss A')}`,
			},
		},
	];

	//Stringify the embeds using JSON.stringify()
	let data = JSON.stringify({ embeds });

	//Create a config object for axios, you can also use axios.post("url", data) instead
	var config = {
		method: 'POST',
		url: process.env.WEBHOOK, // https://discord.com/webhook/url/here
		headers: { 'Content-Type': 'application/json' },
		data: data,
	};

	//Send the request
	axios(config)
		.then((response) => {
			console.log('Webhook delivered successfully');
			return response;
		})
		.catch((error) => {
			console.log(error);
			return error;
		});
}

//Failed
async function sendFailedWebHook(req) {
	let IP = req.headers['x-forwarded-for'] || req.socket.remoteAddress || null;
	IP = IP.split(',')[1];
	let encrypted = req.body.password != null && req.body.password !== '' ? 'Encrypted' : 'Direct';
	//An array of Discord Embeds.
	let embeds = [
		{
			title: 'File Failed to Upload',
			color: 11875368,
			fields: [
				{
					name: `${req.file.originalname.toString()}`,
					value: `**File Size›** \`${formatBytes(req.file.size)}\`\n**File Type›** \`${req.file.originalname.split('.')[1]}\`\n**File Encryption›** \`${encrypted}\`\n**Uploaded By›** ||${IP}||\n**File Link›** ||${
						req.headers.origin
					}/${req.file.filename}||`,
				},
			],
			footer: {
				text: `📅 ${moment(Date.now()).format('MMMM Do YYYY, h:mm:ss A')}`,
			},
		},
	];

	//Stringify the embeds using JSON.stringify()
	let data = JSON.stringify({ embeds });

	//Create a config object for axios, you can also use axios.post("url", data) instead
	var config = {
		method: 'POST',
		url: process.env.WEBHOOK, // https://discord.com/webhook/url/here
		headers: { 'Content-Type': 'application/json' },
		data: data,
	};

	//Send the request
	axios(config)
		.then((response) => {
			console.log('Webhook delivered successfully');
			return response;
		})
		.catch((error) => {
			console.log(error);
			return error;
		});
}

function formatBytes(bytes, decimals = 2) {
	if (bytes === 0) return '0 Bytes';

	const k = 1024;
	const dm = decimals < 0 ? 0 : decimals;
	const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

module.exports = { sendSuccessWebHook, sendFailedWebHook };
