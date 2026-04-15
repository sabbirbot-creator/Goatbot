const art = `
  ____    _    ____  ____ ___ ____  
 / ___|  / \  | __ )| __ )_ _|  _ \\ 
 \\___ \\ / _ \\ |  _ \\|  _ \\| || |_) |
  ___) / ___ \\| |_) | |_) | ||  _ < 
 |____/_/   \\_\\____/|____/___|_| \\_\\
`;

console.log(art);
console.log("  Owner: Ariful Islam Sabbir");
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
