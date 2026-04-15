"use strict";

const { TAG } = require("./branding");

module.exports = (data, type = "INFO") => {
    console.log(`${TAG}[ ${type.toUpperCase()} ] ${data}`);
};
