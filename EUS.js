const fs = require("fs"), config = require("../config/config.json"), emoji = require("../misc/emoji_list.json");

// Defines the function of this module
const MODULE_FUNCTION = "handle_requests",

	  // Base path for module folder creation and navigation
	  BASE_PATH = "/EUS";

let node_modules = {};

let eusConfig = {},
	useUploadKey = true,
	cacheJSON = "",
	startupFinished = false,
	diskRunningOnSize = 0;

class Database {
	constructor(databaseAddress, databasePort = 3306, databaseUsername, databasePassword, databaseName, connectedCallback) {
		this.connectionPool = node_modules.mysql.createPool({
			connectionLimit: 128,
			host: databaseAddress,
			port: databasePort,
			user: databaseUsername,
			password: databasePassword,
			database: databaseName
		});

		this.dbActive = false;
		if (connectedCallback == null) {
			this.dbActive = true;
		} else {
			const connectionCheckInterval = setInterval(() => {
				this.query("SELECT id FROM images LIMIT 1")
					.then(data => {
						if (startupFinished) global.modules.consoleHelper.printInfo(emoji.globe_europe, `Connected to database`);
						else console.log("[EUS] Connected to database");
						this.dbActive = true;
						clearInterval(connectionCheckInterval);

						connectedCallback();
					})
					.catch(err => {});
			}, 167); // Roughly 6 times per sec
		}
	}

	async query(sqlQuery) {
		return new Promise((resolve, reject) => {
			this.connectionPool.getConnection((err, connection) => {
				if (err) {
					reject(err);
					try {
						connection.release();
					} catch (e) {}
				} else {
					connection.query(sqlQuery, (err, data) => {
						if (err) {
							reject(err);
							connection.release();
						} else {
							if (sqlQuery.includes("LIMIT 1")) resolve(data[0]);
							else resolve(data);
							connection.release();
						}
					});
				}
			});
		});
	}
}

let dbConnection;
function init() {
	// Require node modules
	node_modules["chalk"] = require("chalk");
	node_modules["busboy"] = require("connect-busboy");
	node_modules["randomstring"] = require("randomstring");
	node_modules["diskUsage"] = require("diskusage");
	node_modules["streamMeter"] = require("stream-meter");
	node_modules["mysql"] = require("mysql");

	// Only ran on startup so using sync functions is fine

	// Fetch total size of disk on startup, this will never change during runtime
	// if it does something seriously wrong has happened.
	diskRunningOnSize = node_modules.diskUsage.checkSync(__dirname).total;

	// Makes the folder for files of the module
	if (!fs.existsSync(__dirname + BASE_PATH)) {
		fs.mkdirSync(__dirname + BASE_PATH);
		console.log(`[EUS] Made EUS module folder`);
	}
	// Makes the folder for frontend files
	if (!fs.existsSync(__dirname + BASE_PATH + "/files")) {
		fs.mkdirSync(__dirname + BASE_PATH + "/files");
		console.log(`[EUS] Made EUS web files folder`);
	}
	// Makes the folder for images
	if (!fs.existsSync(__dirname + BASE_PATH + "/i")) {
		fs.mkdirSync(__dirname + BASE_PATH + "/i");
		console.log(`[EUS] Made EUS images folder`);
	}

	// Makes the config file
	if (!fs.existsSync(__dirname + BASE_PATH + "/config.json")) {
		// Config doesn't exist, make it.
		fs.writeFileSync(`${__dirname}${BASE_PATH}/config.json`, '{\n\t"baseURL":"http://example.com/",\n\t"acceptedTypes": [\n\t\t".png",\n\t\t".jpg",\n\t\t".jpeg",\n\t\t".gif"\n\t],\n\t"uploadKey": "",\n\t"database": {\n\t\t"databaseAddress": "127.0.0.1",\n\t\t"databasePort": 3306,\n\t\t"databaseUsername": "root",\n\t\t"databasePassword": "password",\n\t\t"databaseName": "EUS"\n\t}\n}');
		console.log("[EUS] Made EUS config File!");
		console.log("[EUS] Please edit the EUS Config file before restarting.");
		// Config has been made, close framework.
		process.exit(0);
	} else {
		eusConfig = require(`${__dirname}${BASE_PATH}/config.json`);
		if (validateConfig(eusConfig)) console.log("[EUS] EUS config passed all checks");
	}

	// This is using a callback but that's fine, the server will just react properly to the db not being ready yet.
	dbConnection = new Database(eusConfig["database"]["databaseAddress"], eusConfig["database"]["databasePort"], eusConfig["database"]["databaseUsername"], eusConfig["database"]["databasePassword"], eusConfig["database"]["databaseName"], async () => {
		cacheJSON = JSON.stringify(await cacheFilesAndSpace());
		cacheIsReady = true;
	});

	console.log("[EUS] Finished loading.");
}

// Cache for the file count and space usage, this takes a while to do so it's best to cache the result
let cacheIsReady = false;
function cacheFilesAndSpace() {
	return new Promise(async (resolve, reject) => {
		const startCacheTime = Date.now();
		cacheIsReady = false;
		let cachedFilesAndSpace = {
			fileCounts: {},
		};

		const dbData = await dbConnection.query(`SELECT imageType, COUNT(imageType) AS "count" FROM images GROUP BY imageType`);
		let totalFiles = 0;
		dbData.forEach(fileType => {
			cachedFilesAndSpace["fileCounts"][fileType.imageType] = fileType.count;
			totalFiles += fileType.count;
		});
		cachedFilesAndSpace["filesTotal"] = totalFiles;

		cachedFilesAndSpace["space"] = {usage: {}, total:{}};

		const dbSize = (await dbConnection.query(`SELECT SUM(imageSize) FROM images LIMIT 1`))["SUM(imageSize)"];
		const totalSizeBytes = dbSize == null ? 0 : dbSize;
		const mbSize = totalSizeBytes / 1024 / 1024;
		cachedFilesAndSpace["space"]["usage"]["mb"] = parseFloat(mbSize.toFixed(4));
		cachedFilesAndSpace["space"]["usage"]["gb"] = parseFloat((mbSize / 1024).toFixed(4));
		cachedFilesAndSpace["space"]["usage"]["string"] = await spaceToLowest(totalSizeBytes, true);

		//totalDiskSize
		const totalMBSize = diskRunningOnSize / 1024 / 1024;
		cachedFilesAndSpace["space"]["total"]["mb"] = parseFloat(totalMBSize.toFixed(4));
		cachedFilesAndSpace["space"]["total"]["gb"] = parseFloat((totalMBSize / 1024).toFixed(4));
		cachedFilesAndSpace["space"]["total"]["string"] = await spaceToLowest(diskRunningOnSize, true);

		resolve(cachedFilesAndSpace);
		global.modules.consoleHelper.printInfo(emoji.folder, `Stats api cache took ${Date.now() - startCacheTime}ms`);
	});
}

function validateConfig(json) {
	let performShutdownAfterValidation = false;
	// URL Tests
	if (json["baseURL"] == null) {
		console.error("EUS baseURL property does not exist!");
		performShutdownAfterValidation = true;
	} else {
		if (json["baseURL"] == "") console.warn("EUS baseURL property is blank");
		const bURL = `${json["baseURL"]}`.split("");
		if (bURL.length > 1) { 
			if (bURL[bURL.length-1] != "/") console.warn("EUS baseURL property doesn't have a / at the end, this can lead to unpredictable results!");
		}
		else {
			if (json["baseURL"] != "http://" || json["baseURL"] != "https://") console.warn("EUS baseURL property is possibly invalid!");
		}
	}
	// acceptedTypes checks
	if (json["acceptedTypes"] == null) {
		console.error("EUS acceptedTypes list does not exist!");
		performShutdownAfterValidation = true;
	} else {
		if (json["acceptedTypes"].length < 1) console.warn("EUS acceptedTypes array has no extentions in it, users will not be able to upload images!");
	}
	// uploadKey checks
	if (json["uploadKey"] == null) {
		console.error("EUS uploadKey property does not exist!");
		performShutdownAfterValidation = true;
	} else {
		if (json["uploadKey"] == "") useUploadKey = false;
	}
	// database checks
	if (json["database"] == null) {
		console.error("EUS database properties do not exist!");
		performShutdownAfterValidation = true;
	} else {
		// databaseAddress
		if (json["database"]["databaseAddress"] == null) {
			console.error("EUS database.databaseAddress property does not exist!");
			performShutdownAfterValidation = true;
		}
		// databasePort
		if (json["database"]["databasePort"] == null) {
			console.error("EUS database.databasePort property does not exist!");
			performShutdownAfterValidation = true;
		}
		// databaseUsername
		if (json["database"]["databaseUsername"] == null) {
			console.error("EUS database.databaseUsername property does not exist!");
			performShutdownAfterValidation = true;
		}
		// databasePassword
		if (json["database"]["databasePassword"] == null) {
			console.error("EUS database.databasePassword property does not exist!");
			performShutdownAfterValidation = true;
		}
		// databaseName
		if (json["database"]["databaseName"] == null) {
			console.error("EUS database.databaseName property does not exist!");
			performShutdownAfterValidation = true;
		}
	}

	// Check if server needs to be shutdown
	if (performShutdownAfterValidation) {
		console.error("EUS config properties are missing, refer to docs for more details (https://wiki.eusv.ml)");
		process.exit(1);
	}
	else return true;
}

function cleanURL(url = "") {
	return url.split("%20").join(" ").split("%22").join("\"").split("%23").join("#").split("%24").join("$").split("%25").join("%").split("%26").join("&").split("%27").join("'").split("%2B").join("+").split("%2C").join(",").split("%2F").join("/")
			  .split("%3A").join(":").split("%3B").join(";").split("%3C").join("<").split("%3D").join("=").split("%3E").join(">").split("%3F").join("?")
			  .split("%40").join("@")
			  .split("%5B").join("[").split("%5C").join("\\").split("%5D").join("]").split("%5E").join("^")
	   		  .split("%60").join("`")
	   		  .split("%7B").join("{").split("%7C").join("|").split("%7D").join("}").split("%7E").join("~");
}

function regularFile(req, res, urs = "", startTime = 0) {
	if (req.url === "/") { urs = "/index.html" } else { urs = req.url }
	fs.access(`${__dirname}${BASE_PATH}/files${urs}`, (error) => {
		if (error) {
			// Doesn't exist, send a 404 to the client.
			error404Page(res);
			global.modules.consoleHelper.printInfo(emoji.cross, `${req.method}: ${node_modules.chalk.red("[404]")} ${req.url} ${Date.now() - startTime}ms`);
		} else {
			// File does exist, send it back to the client.
			res.sendFile(__dirname + BASE_PATH + "/files"+req.url);
			global.modules.consoleHelper.printInfo(emoji.heavy_check, `${req.method}: ${node_modules.chalk.green("[200]")} ${req.url} ${Date.now() - startTime}ms`);
		}
	});
}

function error404Page(res) {
	res.status(404).send("404!<hr>EUS");
}

module.exports = {
	init: init,
	extras:async function() {
		// Setup express to use busboy
		global.app.use(node_modules.busboy());
		startupFinished = true;
		//cacheJSON = JSON.stringify(await cacheFilesAndSpace());
		//cacheIsReady = true;
	},
	get:async function(req, res) {
		/*
			req - Request from client
			res - Response from server
		*/
		
		// Set some headers
		res.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
		res.set("X-XSS-Protection", "1; mode=block");
		res.set("Feature-Policy", "fullscreen 'none'");
		res.set("Permissions-Policy", "microphone=(), geolocation=(), magnetometer=(), camera=(), payment=(), usb=(), accelerometer=(), gyroscope=()");
		res.set("Referrer-Policy", "strict-origin-when-cross-origin");
		res.set("Content-Security-Policy", "block-all-mixed-content;frame-ancestors 'self'");
		res.set("X-Frame-Options", "SAMEORIGIN");
		res.set("X-Content-Type-Options", "nosniff");

		req.url = cleanURL(req.url);

		// Check if returned value is true.
		if (req.url.includes("/api/")) return handleAPI(req, res);

		// Register the time at the start of the request
		const startTime = Date.now();

		// Get the requested image
		let urs = `${req.url}`; urs = urs.split("/")[1];
		// Check if we even need to query the DB
		const dbAble = (!/[^0-9A-Za-z]/.test(urs)) && urs != "" && urs != "index" && (req.url.split("/").length == 2);

		if (dbAble) {
			if (dbConnection.dbActive) {
				// Try to get what we think is an image's details from the DB
				const dbEntry = await dbConnection.query(`SELECT imageType FROM images WHERE imageId = "${urs}" LIMIT 1`);

				// There's an entry in the DB for this, send the file back.
				if (dbEntry != null) {
					res.sendFile(`${__dirname}${BASE_PATH}/i/${urs}.${dbEntry.imageType}`);
					global.modules.consoleHelper.printInfo(emoji.heavy_check, `${req.method}: ${node_modules.chalk.green("[200]")} (ImageReq) ${req.url} ${Date.now() - startTime}ms`);
				}
				// There's no entry, so treat this as a regular file.
				else regularFile(req, res, urs, startTime);
			}
			else res.status(400).end("EUS is restarting, please try again in a few secs.");
		}
		// We can still serve files if they are not dbable
		// since we don't need to check the db
		else regularFile(req, res, urs, startTime);
	},
	post:async function(req, res) {
		/*
			req - Request from client
			res - Response from server
		*/

		// Make sure the endpoint is /upload
		// If it isn't upload send an empty response
		if (req.url != "/upload") return res.end("");

		// Get time at the start of upload

		if (useUploadKey && eusConfig["uploadKey"] != req.header("key")) return res.end("Incorrect key provided for upload");

		const startTime = Date.now();
		var fstream;
		var thefe;
		// Pipe the request to busboy
		req.pipe(req.busboy);
		req.busboy.on('file', function (fieldname, file, info) {
			// Make a new file name
			fileOutName = node_modules.randomstring.generate(14);
			global.modules.consoleHelper.printInfo(emoji.fast_up, `${req.method}: Upload of ${fileOutName} started.`);
			// Check the file is within the accepted file types
			const fileType = info.filename.split(".").slice(-1);
			if (eusConfig.acceptedTypes.includes(`.${fileType}`)) {
				// File is accepted, set the extention of the file in thefe for later use.
				thefe = fileType;
			} else {
				// File isn't accepted, send response back to client stating so.
				res.status(403).end("This file type isn't accepted currently.");
				return;
			}
			// Create a write stream for the file
			fstream = fs.createWriteStream(__dirname + BASE_PATH + "/i/" + fileOutName + "." + thefe);
			// Create meter for tracking the size of the file
			const meter = node_modules.streamMeter();
			file.pipe(meter).pipe(fstream);
			fstream.on('close', async () => {
				// Add this image to the database
				await dbConnection.query(`INSERT INTO images (id, imageId, imageType, imageSize) VALUES (NULL, "${fileOutName}", "${thefe}", ${meter.bytes})`);
				
				// Send URL of the uploaded image to the client           
				res.end(eusConfig.baseURL + fileOutName);
				global.modules.consoleHelper.printInfo(emoji.heavy_check, `${req.method}: Upload of ${fileOutName} finished. Took ${Date.now() - startTime}ms`);

				// Update cached files & space
				cacheJSON = JSON.stringify(await cacheFilesAndSpace());
				cacheIsReady = true;
			});
		});
	}
}

async function handleAPI(req, res) {
	const startTime = Date.now();
	let jsonaa = {}, filesaa = 0, spaceaa = 0;
	switch (req.url.split("?")[0]) {
		// Status check to see the online status of EUS
		// Used by ESL to make sure EUS is online
		case "/api/get-server-status":
			global.modules.consoleHelper.printInfo(emoji.heavy_check, `${req.method}: ${node_modules.chalk.green("[200]")} (APIReq) ${req.url} ${Date.now() - startTime}ms`);
			return res.end('{"status":1,"version":"'+global.internals.version+'"}');
		
		/*  Stats api endpoint
			Query inputs
			  f : Values [0,1]
			  s : Values [0,1]
		*/
		case "/api/get-stats":
			filesaa = req.query["f"];
			spaceaa = req.query["s"];
			if (!cacheIsReady) return res.end("Cache is not ready");
			jsonaa = JSON.parse(cacheJSON);
			// If total files is asked for
			if (filesaa == 1) {
				// If getting the space used on the server isn't required send the json
				if (spaceaa != 1) {
					global.modules.consoleHelper.printInfo(emoji.heavy_check, `${req.method}: ${node_modules.chalk.green("[200]")} (APIReq) ${req.url} ${Date.now() - startTime}ms`);
					delete jsonaa["space"];
					return res.end(JSON.stringify(jsonaa));
				}
			}
			// Getting space is required
			if (spaceaa == 1) {
				global.modules.consoleHelper.printInfo(emoji.heavy_check, `${req.method}: ${node_modules.chalk.green("[200]")} (APIReq) ${req.url} ${Date.now() - startTime}ms`);
				if (filesaa != 1) delete jsonaa["files"];
				return res.end(JSON.stringify(jsonaa));
			}

			if (filesaa != 1 && spaceaa != 1) {
				global.modules.consoleHelper.printInfo(emoji.heavy_check, `${req.method}: ${node_modules.chalk.green("[200]")} (APIReq) ${req.url} ${Date.now() - startTime}ms`);
				return res.end("Please add f and or s to your queries to get the files and space");
			}
		break;

		// Information API
		case "/api/get-info":
			global.modules.consoleHelper.printInfo(emoji.heavy_check, `${req.method}: ${node_modules.chalk.green("[200]")} (APIReq) ${req.url} ${Date.now() - startTime}ms`);
			return res.end(JSON.stringify({
				version: global.internals.version,
				instance: config["server"]["instance_type"]
			}));

		default:
			global.modules.consoleHelper.printInfo(emoji.heavy_check, `${req.method}: ${node_modules.chalk.green("[200]")} (APIReq) ${req.url} ${Date.now() - startTime}ms`);
			return res.send(`
				<h2>All currently avaliable api endpoints</h2>
				<a href="/api/get-server-status">/api/get-server-status</a>
				<a href="/api/get-stats">/api/get-stats</a>
				<a href="/api/get-info">/api/get-info</a>
			`);
	}
}

const spaceValues = ["B", "KB", "MB", "GB", "TB", "PB", "EB"]; // Futureproofing™

async function spaceToLowest(spaceValue, includeStringValue) {
	return new Promise((resolve, reject) => {
		// Converts space values to lower values e.g MB, GB, TB etc depending on the size of the number
		let i1 = 1;
		// Loop through until value is at it's lowest
		while (spaceValue >= 1024) {
			spaceValue = spaceValue / 1024;
			if (spaceValue >= 1024) i1++;
		}

		if (includeStringValue) resolve(`${spaceValue.toFixed(2)} ${spaceValues[i1]}`);
		else resolve(spaceValue);
	});
}

module.exports.MOD_FUNC = MODULE_FUNCTION;

module.exports.REQUIRED_NODE_MODULES = [
	"chalk", "connect-busboy", "randomstring",
	"diskusage", "stream-meter", "mysql"
];