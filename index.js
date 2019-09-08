const express = require("express"), app = express(), config = require("./config/config.json"), emoji = require("./misc/emoji_list.json"), randomstring = require("randomstring"), fs = require("fs"), chalk = require("chalk"), busboy = require("connect-busboy"), dirname = __dirname+"/";
internals = {
    version:"0.0.5 Open",
    types: {
        a:"INFO",
        b:"REQUEST",
        c:"WARN"
    }
};
let dE = new Date(), startTime = dE.getTime(), endTime, modules = [], image_json;

// Clear console before printing anything
console.clear();
fs.readFile('./misc/ascii.txt', function(err, data) {
    if (err) throw err;
    fs.readdir(config.server.image_dir, (err, files) => {
        // Generate the banner
        let asciiOut = data.toString()
        .replace("|replaceVersion|", `${chalk.yellow("Version:")} ${chalk.cyan(internals.version)}`)
        .replace("|titlecard|", chalk.yellow("The web server made for EUS"))
        .replace("DEV", chalk.red("DEV")).replace("RELEASE", chalk.green("RELEASE"))
        .replace("|replaceType|", `${chalk.yellow("Type: ")}${chalk.cyan(config.server.instance_type)}`)
        .replace("|replaceStats|", `${chalk.yellow("Images: ")}${chalk.cyan(files.length)}`);
        // Print the banner
        console.log(asciiOut);
        // Get the modules from the ./modules folder
        fs.readdir("./modules", (err, files) => {
            if (err) throw err;
            for (var i = 0; i < files.length; i++) {
                /*
                    For every file in the array, output that it was found 
                    in the console and attempt to load it using require.
                    Oh, and check that it has .js in it's file name!
                */
                if (files[i].includes(".js")) {
                    modules[files[i].toString().replace(".js", "")] = require(`./modules/${files[i].toString()}`);
                    console.log(`[Modules] Found module ${files[i].toString()}`);
                } else {
                    console.log(`[Modules] Found file ${files[i]}. It is not a module.`)
                }
            }
            fs.access("./image-type.json", error => {
                if (error) {
                    fs.writeFile('./image-type.json', '{\n\}', function(err) {
                        if (err) throw err;
                        modules.logger.log(internals.types.a, emoji.heavy_check, "Created image-type File!");
                        image_json = require("./image-type.json");
                    });
                } else {
                    image_json = require("./image-type.json");
                }
            });
            fs.access(config.server.image_dir, error => {
                if (error) {
                    fs.mkdirSync(config.server.image_dir);
                }
            });
            modules.logger.log(internals.types.a, emoji.wave, "Starting Revolution...");
            server();
        });
    });
});

// File name that is returned to the uploader
let fileOutName;

function server() {
    app.use(busboy());
    app.route('/upload')
    .post(function (req, res, next) {
        dE = new Date(); startTime = dE.getTime();
        var fstream;
        var thefe;
        req.pipe(req.busboy);
        req.busboy.on('file', function (fieldname, file, filename) {
            image_json = require("./image-type.json");
            fileOutName = randomstring.generate(14);
            modules.logger.log(`${internals.types.b}: ${req.method}`, emoji.fast_up, `Upload of ${fileOutName} started.`);  
            if (config.server.acceptedTypes.includes(`.${filename.split(".")[filename.split(".").length-1]}`)) {
                thefe = `.${filename.split(".")[filename.split(".").length-1]}`;
            } else {
                res.end("This file type isn't accepted currently.");
                return;
            }
            //Path where image will be uploaded
            fstream = fs.createWriteStream(__dirname + '/i/' + fileOutName + thefe);
            file.pipe(fstream);
            fstream.on('close', function () {
                dE = new Date();
                endTime = dE.getTime();
                image_json[fileOutName] = `.${filename.split(".")[filename.split(".").length-1]}`;
                fs.writeFile('./image-type.json', JSON.stringify(image_json), function(err) {
                    if (err) throw err;
                    modules.logger.log(`${internals.types.b}: ${req.method}`, emoji.heavy_check, ` Upload of ${fileOutName} finished. Took ${endTime - startTime}ms`);             
                    res.end(config.server.export_uri+""+fileOutName);
                });
            });
        });
    })
    .get(function (req, res, next) {
        res.status(405).send("405! You requested the \"/upload\" endpoint with method \"GET\" but it was expecting POST<hr>Revolution - A web server designed for EUS")
    });
    app.get('*', (req, res) => { modules.request_handler.handle(modules.logger, image_json, internals, emoji, config, fs, chalk, req, res, dirname); });
    app.listen(config.server.port, () => { dE = new Date(), endTime = dE.getTime();
        modules.logger.log(internals.types.a, emoji.thumb_up, `Started Revolution on port ${config.server.port}! Took ${endTime - startTime}ms`);
    });
}