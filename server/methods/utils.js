const fs = require('fs');
const path = require('path');
const xss = require("xss");

const sanitizeString = (str) => {
    return xss(str);
};

const logRoomInfo = (connections) => {
    console.log("Room Information:");
    for (const room in connections) {
        if (connections[room].length > 0) {
            console.log(`Room ${room}: Users ${connections[room].length}`);
        } else {
            delete connections[room];
        }
    }
};

module.exports = { logRoomInfo };

const extractRoomName = (room) => {
    const match = room.match(/#\/([^\/]+)/);
    return match ? match[1].replace(/[^a-z0-9]/gi, '_').toLowerCase() : 'unknown_room';
};

const saveConnectionsToJSON = (connectionJson) => {
    const logsDir = path.join(__dirname, 'logs');
    if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir);
    }

    const date = new Date().toISOString().split('T')[0];

    for (const room in connectionJson.connections) {
        const sanitizedRoomName = extractRoomName(room);
        const filename = `${sanitizedRoomName}-${date}.json`;
        const filePath = path.join(logsDir, filename);

        fs.writeFileSync(filePath, JSON.stringify(connectionJson.connections[room]), 'utf8');
        console.log(`Saved connections for room ${room} to JSON file: ${filePath}`);
    }
};

module.exports = { sanitizeString, logRoomInfo, extractRoomName, saveConnectionsToJSON };