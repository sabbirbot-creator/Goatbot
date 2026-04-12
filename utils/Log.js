module.exports = (data, type = "INFO") => {
  const name = "SABBIR CHAT BOT";
  const colors = {
    info: "\x1b[36m",   // Cyan
    login: "\x1b[32m",  // Green
    error: "\x1b[31m",  // Red
    warn: "\x1b[33m",   // Yellow
    reset: "\x1b[0m"    // Reset
  };

  const color = colors[type.toLowerCase()] || colors.reset;
  console.log(`${color}[ ${type.toUpperCase()} ]${colors.reset} ${data}`);
};
