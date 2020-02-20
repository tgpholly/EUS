const fs = require("fs"),
config = require("../config/config.json"),
chalk = require("chalk"),
busboy = require("connect-busboy"),
randomstring = require("randomstring"),
getSize = require('get-folder-size'),
emoji = require("../misc/emoji_list.json");

// Defines the function of this module
const MODULE_FUNCTION = "handle_requests",

// Base path for module folder creation and navigation
BASE_PATH = "/EUS";

let eusConfig = {},
image_json = {},
d = new Date(),
startTime,
endTime;

// Only ran on startup so using sync functions is fine
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
// Makes the image-type file
fs.access(`${__dirname}${BASE_PATH}/image-type.json`, error => {
    if (error) {
        // Doesn't exist, create it.
        fs.writeFile(`${__dirname}${BASE_PATH}/image-type.json`, '{\n\}', function(err) {
            if (err) throw err;
            global.modules.consoleHelper.printInfo(emoji.heavy_check, "Created image-type File!");
            // File has been created, load it.
            image_json = require(`${__dirname}${BASE_PATH}/image-type.json`);
        });
    } else {
        // File already exists, load it.
        image_json = require(`${__dirname}${BASE_PATH}/image-type.json`);
    }
});
// Makes the config file
fs.access(`${__dirname}${BASE_PATH}/config.json`, error => {
    if (error) {
        // Config doesn't exist, make it.
        fs.writeFile(`${__dirname}${BASE_PATH}/config.json`, '{\n\t"baseURL":"http://example.com",\n\t"acceptedTypes": [\n\t\t".png",\n\t\t".jpg",\n\t\t".jpeg",\n\t\t".gif"\n\t]\n}', function(err) {
            if (err) throw err;
            global.modules.consoleHelper.printInfo(emoji.heavy_check, "Created config File!");
            global.modules.consoleHelper.printInfo(emoji.wave, "Please edit the EUS Config file before restarting.");
            // Config has been made, close framework.
            process.exit(0);
        });
    } else {
        eusConfig = require(`${__dirname}${BASE_PATH}/config.json`);
    }
});

module.exports = {
    extras:function() {
        // Setup express to use busboy
        global.app.use(busboy());
    },
    get:function(req, res) {
        /*
            req - Request from client
            res - Response from server
        */
        
        let isAPI = false;

        if (req.query["stat"] == "get") return res.end('{ "status":1, "version":"'+global.internals.version+'" }');

        if (req.url.split("?")[0] == "/api/get-stats") {
            isAPI = true;
            const filesaa = req.query["f"],
            spaceaa = req.query["s"];
            let jsonaa = {};
            if (filesaa == 1) {
                jsonaa["files"] = {};
                for (var i2 = 0; i2 < eusConfig.acceptedTypes.length; i2++) {
                    jsonaa["files"][`${eusConfig.acceptedTypes[i2]}`.replace(".", "")] = 0;
                }
                fs.readdir(__dirname + BASE_PATH + "/i", (err, files) => {
                    if (err) throw err;
                    for (var i = 0; i < files.length; i++) {
                        for (var i1 = 0; i1 < eusConfig.acceptedTypes.length; i1++) {
                            const jsudfg = files[i].split(".");
                            if (`.${jsudfg[jsudfg.length-1]}` == eusConfig.acceptedTypes[i1]) {
                                jsonaa["files"][eusConfig.acceptedTypes[i1].replace(".", "")]++;
                            }
                        }
                    }
                    if (spaceaa != 1) return res.end(JSON.stringify(jsonaa));
                });
            }
            if (spaceaa == 1) {
                jsonaa["used"] = "";
                getSize(__dirname + BASE_PATH + "/i", (err, size) => {
                    if (err) throw err;
                    const sizeOfFolder = (size / 1024 / 1024 / 1024).toFixed(2);
                    jsonaa["used"] = `${sizeOfFolder} GB`;
                    return res.end(JSON.stringify(jsonaa));
                });
            }
        }

        if (!isAPI) {
            // Register the time at the start of the request
            d = new Date();
            startTime = d.getTime();
            // Get the requested image
            let urs = ""+req.url; urs = urs.split("/")[1];
            // Get the file type of the image from image_json and make sure it exists
            fs.access(__dirname + BASE_PATH + "/i/"+urs+image_json[urs], error => {
                if (error) {
                    // Doesn't exist, handle request normaly
                    if (req.url === "/") { urs = "/index.html" } else { urs = req.url };
                    fs.access(__dirname + BASE_PATH + "/files"+urs, error => {
                        if (error) {
                            // Doesn't exist, send a 404 to the client.
                            res.status(404).end("404!");
                            d = new Date();
                            endTime = d.getTime();
                            global.modules.consoleHelper.printInfo(emoji.cross, `${req.method}: ${chalk.red("[404]")} ${req.url} ${endTime - startTime}ms`);
                        } else {
                            // File does exist, send it back to the client.
                            res.sendFile(__dirname + BASE_PATH + "/files"+req.url);
                            d = new Date();
                            endTime = d.getTime();
                            global.modules.consoleHelper.printInfo(emoji.heavy_check, `${req.method}: ${chalk.green("[200]")} ${req.url} ${endTime - startTime}ms`);
                        }
                    });
                } else {
                    // Image does exist, send it back.
                    res.sendFile(__dirname + BASE_PATH + "/i/"+urs+image_json[urs]);
                    d = new Date();
                    endTime = d.getTime();
                    global.modules.consoleHelper.printInfo(emoji.heavy_check, `${req.method}: ${chalk.green("[200]")} ${req.url} ${endTime - startTime}ms`);
                }
            });
        }
    },
    post:function(req, res) {
        /*
            req - Request from client
            res - Response from server
        */

        // Make sure the endpoint is /upload
        // If it isn't upload send an empty response
        if (req.url != "/upload") return req.end("");

        // Get time at the start of upload
        d = new Date(); startTime = d.getTime();
        var fstream;
        var thefe;
        // Pipe the request to busboy
        req.pipe(req.busboy);
        req.busboy.on('file', function (fieldname, file, filename) {
            // Get the image-type json
            image_json = require(`${__dirname}${BASE_PATH}/image-type.json`);
            // Make a new file name
            fileOutName = randomstring.generate(14);
            global.modules.consoleHelper.printInfo(emoji.fast_up, `${req.method}: Upload of ${fileOutName} started.`);
            // Check the file is within the accepted file types  
            if (eusConfig.acceptedTypes.includes(`.${filename.split(".")[filename.split(".").length-1]}`)) {
                // File is accepted, set the extention of the file in thefe for later use.
                thefe = `.${filename.split(".")[filename.split(".").length-1]}`;
            } else {
                // File isn't accepted, send response back to client stating so.
                res.end("This file type isn't accepted currently.");
                return;
            }
            // Create a write stream for the file
            fstream = fs.createWriteStream(__dirname + BASE_PATH + "/i/" + fileOutName + thefe);
            file.pipe(fstream);
            fstream.on('close', function () {
                // Get the time at the end of the upload
                d = new Date(); endTime = d.getTime();
                // Add image file type to the image_json array
                image_json[fileOutName] = `.${filename.split(".")[filename.split(".").length-1]}`;
                // Save image_json array to the file
                fs.writeFile(`${__dirname}${BASE_PATH}/image-type.json`, JSON.stringify(image_json), function(err) {
                    if (err) throw err;
                    global.modules.consoleHelper.printInfo(emoji.heavy_check, `${req.method}: Upload of ${fileOutName} finished. Took ${endTime - startTime}ms`);
                    // Send URL of the uploaded image to the client           
                    res.end(eusConfig.baseURL+""+fileOutName);
                });
            });
        });
    }
}

module.exports.MOD_FUNC = MODULE_FUNCTION;