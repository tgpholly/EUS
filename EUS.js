const fs = require("fs"),
config = require("../config/config.json"),
chalk = require("chalk"),
busboy = require("connect-busboy"),
randomstring = require("randomstring"),
emoji = require("../misc/emoji_list.json");

// Defines the function of this module
const MODULE_FUNCTION = "handle_requests",

// Base path for module folder creation and navigation
BASE_PATH = "/EUS";

const exportURI = "http://localhost:"+config.server.port+"/";
const acceptedTypes = [
    ".png",
    ".jpg",
    ".jpeg",
    ".gif"
];
let image_json = {},
d = new Date(),
startTime,
endTime;

// Only ran on startup so using sync functions is fine
// Makes the folders for files of the module
if (!fs.existsSync(__dirname + BASE_PATH)) {
    fs.mkdirSync(__dirname + BASE_PATH);
    console.log(`[EUS] Made EUS module folder`);
}
if (!fs.existsSync(__dirname + BASE_PATH + "/files")) {
    fs.mkdirSync(__dirname + BASE_PATH + "/files");
    console.log(`[EUS] Made EUS web files folder`);
}
if (!fs.existsSync(__dirname + BASE_PATH + "/i")) {
    fs.mkdirSync(__dirname + BASE_PATH + "/i");
    console.log(`[EUS] Made EUS images folder`);
}
fs.access(`${__dirname}${BASE_PATH}/image-type.json`, error => {
    if (error) {
        fs.writeFile(`${__dirname}${BASE_PATH}/image-type.json`, '{\n\}', function(err) {
            if (err) throw err;
            global.modules.consoleHelper.printInfo(emoji.heavy_check, "Created image-type File!");
            image_json = require(`${__dirname}${BASE_PATH}/image-type.json`);
        });
    } else {
        image_json = require(`${__dirname}${BASE_PATH}/image-type.json`);
    }
});

module.exports = {
    extras:function() {
        global.app.use(busboy());
    },
    get:function(req, res) {
        /*
            req - Request from client
            res - Response from server
        */
        
        d = new Date();
        startTime = d.getTime();
        let urs = ""+req.url; urs = urs.split("/")[1];
        fs.access(__dirname + BASE_PATH + "/i/"+urs+image_json[urs], error => {
            if (error) {
                fs.access(__dirname + BASE_PATH + "/files"+req.url, error => {
                    if (error) {
                        res.status(404).end("404!");
                        d = new Date();
                        endTime = d.getTime();
                        global.modules.consoleHelper.printInfo(emoji.cross, `${req.method}: ${chalk.red("[404]")} ${req.url} ${endTime - startTime}ms`);
                    } else {
                        res.sendFile(__dirname + BASE_PATH + "/files"+req.url);
                        d = new Date();
                        endTime = d.getTime();
                        global.modules.consoleHelper.printInfo(emoji.heavy_check, `${req.method}: ${chalk.green("[200]")} ${req.url} ${endTime - startTime}ms`);
                    }
                });
            } else {
                res.sendFile(__dirname + BASE_PATH + "/i/"+urs+image_json[urs]);
                d = new Date();
                endTime = d.getTime();
                global.modules.consoleHelper.printInfo(emoji.heavy_check, `${req.method}: ${chalk.green("[200]")} ${req.url} ${endTime - startTime}ms`);
            }
        });
    },
    post:function(req, res) {
        /*
            req - Request from client
            res - Response from server
        */

        if (req.url != "/upload") return req.end("");

        d = new Date(); startTime = d.getTime();
        var fstream;
        var thefe;
        req.pipe(req.busboy);
        req.busboy.on('file', function (fieldname, file, filename) {
            image_json = require(`${__dirname}${BASE_PATH}/image-type.json`);
            fileOutName = randomstring.generate(14);
            global.modules.consoleHelper.printInfo(emoji.fast_up, `${req.method}: Upload of ${fileOutName} started.`);  
            if (acceptedTypes.includes(`.${filename.split(".")[filename.split(".").length-1]}`)) {
                thefe = `.${filename.split(".")[filename.split(".").length-1]}`;
            } else {
                res.end("This file type isn't accepted currently.");
                return;
            }
            //Path where image will be uploaded
            fstream = fs.createWriteStream(__dirname + BASE_PATH + "/i/" + fileOutName + thefe);
            file.pipe(fstream);
            fstream.on('close', function () {
                d = new Date();
                endTime = d.getTime();
                image_json[fileOutName] = `.${filename.split(".")[filename.split(".").length-1]}`;
                fs.writeFile(`${__dirname}${BASE_PATH}/image-type.json`, JSON.stringify(image_json), function(err) {
                    if (err) throw err;
                    global.modules.consoleHelper.printInfo(emoji.heavy_check, `${req.method}: Upload of ${fileOutName} finished. Took ${endTime - startTime}ms`);             
                    res.end(exportURI+""+fileOutName);
                });
            });
        });
    }
}

module.exports.MOD_FUNC = MODULE_FUNCTION;