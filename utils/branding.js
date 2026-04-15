"use strict";

const _tag = Buffer.from("WyBTQUJCSVIgQ0hBVCBCT1QgXQ==", "base64").toString("utf8");
const _owner = Buffer.from("TWQgYXJpZnVsIGlzbGFtIHNhYmJpcg==", "base64").toString("utf8");
const _prefix = " \u00bb ";

const TAG = `${_tag}${_prefix}`;
const OWNER = _owner;

const ASCII_ART = `
  ____    _    ____  ____ ___ ____  
 / ___|  / \\  | __ )| __ )_ _|  _ \\ 
 \\___ \\ / _ \\ |  _ \\|  _ \\| || |_) |
  ___) / ___ \\| |_) | |_) | ||  _ < 
 |____/_/   \\_\\____/|____/___|_| \\_\\
`;

function printBanner() {
    console.log(ASCII_ART);
    console.log(`  Owner: ${OWNER}`);
    console.log();
}

module.exports = { TAG, OWNER, ASCII_ART, printBanner };
