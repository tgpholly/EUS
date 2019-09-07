"use strict";
const fs = require("fs");
const chalk = require("chalk");
let d = new Date();

module.exports = {
    log: function(type, emoji, text) {
        d = new Date();
        console.log(`${chalk.green(`[${timeNumbers(d.getHours())}:${timeNumbers(d.getMinutes())}:${timeNumbers(d.getSeconds())} - ${type}]`)} ${emoji} ${text}`)
    }
}

function timeNumbers(inp) {
    if (inp <= 9) {
        return "0"+inp;
    } else {
        return inp;
    }
}