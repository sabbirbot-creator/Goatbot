const moment = require("moment-timezone");

const botName = "SABBIR CHAT BOT";
const logPrefix = `[ ${botName} ] »`;

const colors = {
    hex: (color) => (text) => text,
    greenBright: (text) => `\x1b[92m${text}\x1b[0m`,
    yellowBright: (text) => `\x1b[93m${text}\x1b[0m`,
    redBright: (text) => `\x1b[91m${text}\x1b[0m`,
    cyanBright: (text) => `\x1b[96m${text}\x1b[0m`,
    blueBright: (text) => `\x1b[94m${text}\x1b[0m`,
    yellow: (text) => `\x1b[33m${text}\x1b[0m`,
    cyan: (text) => `\x1b[36m${text}\x1b[0m`,
    gray: (text) => `\x1b[90m${text}\x1b[0m`,
    green: (text) => `\x1b[32m${text}\x1b[0m`,
    blue: (text) => `\x1b[34m${text}\x1b[0m`,
    red: (text) => `\x1b[31m${text}\x1b[0m`,
    white: (text) => `\x1b[37m${text}\x1b[0m`,
    bold: (text) => `\x1b[1m${text}\x1b[0m`
};

const getCurrentTime = () => colors.gray(moment().tz("Asia/Dhaka").format("HH:mm:ss DD/MM/YYYY"));

if (!global.__sabbirStreamPatched) {
    global.__sabbirStreamPatched = true;
    const patchStream = (stream) => {
        const originalWrite = stream.write.bind(stream);
        let pending = "";
        const formatOutputLine = (line) => {
            if (!line.trim() || line.trimStart().startsWith(logPrefix) || /^\x1b\[[0-9;?]*[A-Za-z]$/.test(line)) return line;
            return `${logPrefix} ${line}`;
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
        console.log(`${getCurrentTime()} ${colors.redBright(`${prefix}:`)}`, message);
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
        console.log(`${getCurrentTime()} ${colors.yellowBright(`${prefix}:`)}`, message);
    },
    info: function (prefix, message) {
        if (message === undefined) {
            message = prefix;
            prefix = "INFO";
        }
        console.log(`${getCurrentTime()} ${colors.greenBright(`${prefix}:`)}`, message);
    },
    success: function (prefix, message) {
        if (message === undefined) {
            message = prefix;
            prefix = "SUCCESS";
        }
        console.log(`${getCurrentTime()} ${colors.cyanBright(`${prefix}:`)}`, message);
    },
    master: function (prefix, message) {
        if (message === undefined) {
            message = prefix;
            prefix = "MASTER";
        }
        console.log(`${getCurrentTime()} ${colors.hex("#eb6734")(`${prefix}:`)}`, message);
    }
};
