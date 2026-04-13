const gradient = require("gradient-string");
const figlet = require("figlet");

const art = figlet.textSync("SABBIR", { font: "Big" });
console.log(gradient.passion(art));
console.log(gradient.pastel("  Owner: Ariful Islam Sabbir"));
console.log();

const { spawn } = require("child_process");

function startProject() {
	const child = spawn("node", ["sabbir.js"], {
		cwd: __dirname,
		stdio: "inherit",
		shell: true
	});

	child.on("close", (code) => {
		if (code == 2) {
			console.log("[ SABBIR CHAT BOT ] » Restarting Project...");
			startProject();
		}
	});
}

startProject();
