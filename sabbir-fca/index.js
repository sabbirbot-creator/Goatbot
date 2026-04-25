'use strict';
/* eslint-disable linebreak-style */
const utils = require('./utils');
global.Fca = new Object({
    isThread: new Array(),
    isUser: new Array(),
    startTime: Date.now(),
    Setting: new Map(),
    Version: require('./package.json').version,
    Require: new Object({
        fs: require("fs"),
        Fetch: require('axios'), // Axios ব্যবহার করা হয়েছে
        log: require("npmlog"),
        utils: require("./utils.js"),
        logger: require('./logger.js'),
        languageFile: require('./Language/index.json'),
        Security: require('./Extra/Src/uuid.js')
    }),
    getText: function(...Data) {
        var Main = (Data.splice(0,1)).toString();
            for (let i = 0; i < Data.length; i++) Main = Main.replace(RegExp(`%${i + 1}`, 'g'), Data[i]);
        return Main;
    },
    Data: new Object({
        ObjFastConfig: {
            "Language": "en",
            "PreKey": "",
            "AutoUpdate": true,
            "MainColor": "#9900FF",
            "MainName": "[ SABBIR-FCA ]",
            "Uptime": false,
            "Config": "default",
            "DevMode": false,
            "Login2Fa": false,
            "AutoLogin": false,
            "BroadCast": true,
            "AuthString": "SD4S XQ32 O2JA WXB3 FUX2 OPJ7 Q7JZ 4R6Z",
            "EncryptFeature": true,
            "ResetDataLogin": false,
            "AutoInstallNode": false,
            "AntiSendAppState": true,
            "AutoRestartMinutes": 0,
            "RestartMQTT_Minutes": 0,
            "Websocket_Extension": {
                "Status": false,
                "ResetData": false,
                "AppState_Path": "appstate.json"
            },
            "HTML": {   
                "HTML": true,
                "UserName": "Guest",
                "MusicLink": "https://drive.google.com/uc?id=1zlAALlxk1TnO7jXtEP_O6yvemtzA2ukA&export=download"
            },
            "AntiGetInfo": {
                "Database_Type": "default",
                "AntiGetThreadInfo": true,
                "AntiGetUserInfo": true
            },
            "Stable_Version": {
                "Accept": false,
                "Version": ""
            },
            "CheckPointBypass": {
                "956": {
                    "Allow": false,
                    "Difficult": "Easy",
                    "Notification": "Turn on with AutoLogin!"
                }
            },
            "AntiStuckAndMemoryLeak": {
                "AutoRestart": {
                    "Use": true,
                    "Explain": "AutoRestart to avoid freezing."
                },
                "LogFile": {
                    "Use": false,
                    "Explain": "Record memory usage logs."
                }
            }
        },
        CountTime: function() {
            var fs = global.Fca.Require.fs;
            if (fs.existsSync(__dirname + '/CountTime.json')) {
                try {
                    var data = Number(fs.readFileSync(__dirname + '/CountTime.json', 'utf8')),
                    hours = Math.floor(data / (60 * 60));
                }
                catch (e) {
                    fs.writeFileSync(__dirname + '/CountTime.json', 0);
                    hours = 0;
                }
            }
            else {
                hours = 0;
            }
            return `${hours} Hours`;
        }
    }),
    Action: async function(Type, ctx, Code, defaultFuncs) {
        // Action logic remains same...
    }
});

// --- কনফিগারেশন ফাইল চেকিং এবং ক্রিয়েশন অংশ মুছে ফেলা হয়েছে ---
try {
    // সরাসরি ডিফল্ট সেটিংস লোড করা হচ্ছে
    var Data_Setting = global.Fca.Data.ObjFastConfig; 
    
    // ল্যাঙ্গুয়েজ সেটআপ
    global.Fca.Require.Language = global.Fca.Require.languageFile.find(i => i.Language == Data_Setting.Language).Folder;
    global.Fca.Require.FastConfig = Data_Setting;
    
    console.log("Config loaded directly from code. No JSON file will be created.");
}
catch (e) {
    console.log("Error loading default config:", e);
}

module.exports = function(loginData, options, callback) {
    var login;
    try {
        login = require('./Main');
    }
    catch (e) {
        console.log(e);
    }
    require('./Extra/Database');
    
    try {
        login(loginData, options, callback);
    }
    catch (e) {
        console.log(e);
    }
};
