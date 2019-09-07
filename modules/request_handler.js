"use strict";
let d = new Date(),
startTime,
endTime,
filesC;

module.exports = {
    handle: function(logger, image_json, internals, emoji, config, fs, chalk, req, res, dirname) {
        d = new Date();
        startTime = d.getTime();
        res.set('Server-Type', 'Revolution EUS');
        if (req.url == "/" || req.url == "/index.html") {
            fs.readFile('./files/index.html', function(err, data) {
                if (err) throw err;
                fs.readdir(dirname+"i/", (err, files) => {
                    if (err) throw err;
                    filesC = data.toString().replace("|replaceVersion|", internals.version).replace("|replaceInstance|", config.server.instance_type);
                    res.send(filesC);
                    d = new Date();
                    endTime = d.getTime();
                    logger.log(`${internals.types.b}: ${req.method}`, emoji.page, `${req.ip} | ${chalk.green("[200]")} ${req.url} ${endTime - startTime}ms`)
                });
            });
        } else {
            let urs = ""+req.url; urs = urs.split("/")[1];
            fs.access(config.server.image_dir+urs+image_json[urs], error => {
                if (error) {
                    fs.access("./files"+req.url, error => {
                        if (error) {
                            res.status(404).end("404!");
                            d = new Date();
                            endTime = d.getTime();
                            logger.log(`${internals.types.b}: ${req.method}`, emoji.cross, `${req.ip} | ${chalk.red("[404]")} ${req.url} ${endTime - startTime}ms`);
                        } else {
                            res.sendFile(dirname+"files"+req.url);
                            d = new Date();
                            endTime = d.getTime();
                            logger.log(`${internals.types.b}: ${req.method}`, emoji.heavy_check, `${req.ip} | ${chalk.green("[200]")} ${req.url} ${endTime - startTime}ms`);
                        }
                    });
                } else {
                    res.sendFile(dirname+"i/"+urs+image_json[urs]);
                    d = new Date();
                    endTime = d.getTime();
                    logger.log(`${internals.types.b}: ${req.method}`, emoji.heavy_check, `${req.ip} | ${chalk.green("[200]")} ${req.url} ${endTime - startTime}ms`);
                }
            });
        }
    }
}