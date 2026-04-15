"use strict";

const moment = require("moment-timezone");
const { TAG } = require("./branding");

const colors = {
    hex: () => (text) => text,
    greenBright: (text) => text,
    yellowBright: (text) => text,
    redBright: (text) => text,
    cyanBright: (text) => text,
    blueBright: (text) => text,
    yellow: (text) => text,
    cyan: (text) => text,
    gray: (text) => text,
    green: (text) => text,
    blue: (text) => text,
    red: (text) => text,
    white: (text) => text,
    bold: (text) => text
};

const getCurrentTime = () => moment().tz("Asia/Dhaka").format("HH:mm:ss DD/MM/YYYY");

if (!global.__sabbirStreamPatched) {
    global.__sabbirStreamPatched = true;
    const patchStream = (stream) => {
        const originalWrite = stream.write.bind(stream);
        let pending = "";
        const formatOutputLine = (line) => {
            if (!line.trim() || line.trimStart().startsWith(TAG) || /^\x1b\[[0-9;?]*[A-Za-z]$/.test(line)) return line;
            return `${TAG}${line}`;
        };
        stream.write = (chunk, encoding, callback) => {
            if (typeof encoding === "function") {
                callback = encoding;
                encoding = undefined;
            }
            const isBuffer = Buffer.isBuffer(chunk);
            let text = isBuffer ? chunk.toString(encoding || "utf8") : String(chunk);
            if (!text || text.startsWith("\x1b]2;") || /^\x1b\[[0-9;?]*[A-Za-z]$/.test(text)) {
                return originalWrite(chunk, encoding, callback);
            }
            pending += text.replace(/^\r+/, "");
            if (!pending.includes("\n")) {
                if (typeof callback === "function") callback();
                return true;
            }
            const lines = pending.split("\n");
            pending = lines.pop();
            const output = `${lines.map(formatOutputLine).join("\n")}\n`;
            return originalWrite(isBuffer ? Buffer.from(output, encoding || "utf8") : output, encoding, callback);
        };
    };
    patchStream(process.stdout);
    patchStream(process.stderr);
}

function logError(prefix, message) {
    if (message === undefined) {
        message = prefix;
        prefix = "ERROR";
    }
    console.log(`${getCurrentTime()} ${prefix}:`, message);
}

module.exports = {
    colors,
    err: logError,
    error: logError,
    warn: function (prefix, message) {
        if (message === undefined) {
            message = prefix;
            prefix = "WARN";
        }
        console.log(`${getCurrentTime()} ${prefix}:`, message);
    },
    info: function (prefix, message) {
        if (message === undefined) {
            message = prefix;
            prefix = "INFO";
        }
        console.log(`${getCurrentTime()} ${prefix}:`, message);
    },
    success: function (prefix, message) {
        if (message === undefined) {
            message = prefix;
            prefix = "SUCCESS";
        }
        console.log(`${getCurrentTime()} ${prefix}:`, message);
    },
    master: function (prefix, message) {
        if (message === undefined) {
            message = prefix;
            prefix = "MASTER";
        }
        console.log(`${getCurrentTime()} ${prefix}:`, message);
    }
};
