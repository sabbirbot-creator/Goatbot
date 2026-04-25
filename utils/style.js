// Stylish output helpers — digital/monospace look using Unicode

const DIGITAL_DIGITS = {
        "0": "𝟢", "1": "𝟣", "2": "𝟤", "3": "𝟥", "4": "𝟦",
        "5": "𝟧", "6": "𝟨", "7": "𝟩", "8": "𝟪", "9": "𝟫"
};

const BOLD_LETTERS = {
        a:"𝗮",b:"𝗯",c:"𝗰",d:"𝗱",e:"𝗲",f:"𝗳",g:"𝗴",h:"𝗵",i:"𝗶",j:"𝗷",k:"𝗸",l:"𝗹",m:"𝗺",
        n:"𝗻",o:"𝗼",p:"𝗽",q:"𝗾",r:"𝗿",s:"𝘀",t:"𝘁",u:"𝘂",v:"𝘃",w:"𝘄",x:"𝘅",y:"𝘆",z:"𝘇",
        A:"𝗔",B:"𝗕",C:"𝗖",D:"𝗗",E:"𝗘",F:"𝗙",G:"𝗚",H:"𝗛",I:"𝗜",J:"𝗝",K:"𝗞",L:"𝗟",M:"𝗠",
        N:"𝗡",O:"𝗢",P:"𝗣",Q:"𝗤",R:"𝗥",S:"𝗦",T:"𝗧",U:"𝗨",V:"𝗩",W:"𝗪",X:"𝗫",Y:"𝗬",Z:"𝗭"
};

function digital(num) {
        return String(num).split("").map(c => DIGITAL_DIGITS[c] || c).join("");
}

function bold(text) {
        return String(text).split("").map(c => BOLD_LETTERS[c] || c).join("");
}

function header(title) {
        return `╔═══ ✦ ${bold(title)} ✦ ═══╗`;
}

function footer() {
        return `╚════════════════════╝`;
}

function divider() {
        return `─────────────────────`;
}

function box(title, lines) {
        let out = header(title) + "\n";
        for (const l of lines) out += `│ ${l}\n`;
        out += footer();
        return out;
}

function progressBar(percent, width = 20) {
        const p = Math.max(0, Math.min(100, percent));
        const filled = Math.round((p / 100) * width);
        const empty = width - filled;
        return `[${"█".repeat(filled)}${"░".repeat(empty)}] ${digital(p)}%`;
}

function relativeTime(ms) {
        if (!ms || ms < 0) return "—";
        const sec = Math.floor(ms / 1000);
        if (sec < 60) return `${digital(sec)}s`;
        const min = Math.floor(sec / 60);
        if (min < 60) return `${digital(min)}m ${digital(sec % 60)}s`;
        const hr = Math.floor(min / 60);
        if (hr < 24) return `${digital(hr)}h ${digital(min % 60)}m`;
        const day = Math.floor(hr / 24);
        return `${digital(day)}d ${digital(hr % 24)}h`;
}

module.exports = { digital, bold, header, footer, divider, box, progressBar, relativeTime };
