"use strict";

const { printBanner } = require("./utils/branding");
printBanner();

const { spawn } = require("child_process");

function startProject() {
    const child = spawn("node", ["sabbir.js"], {
        cwd: __dirname,
        stdio: "inherit",
        shell: true
    });

    child.on("close", (code) => {
        if (code == 2) {
            console.log("Restarting Project...");
            startProject();
        }
    });
}

startProject();
