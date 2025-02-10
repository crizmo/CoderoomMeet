const { EventEmitter } = require('events');
const { sanitizeString, saveConnectionsToJSON, logRoomInfo, extractRoomName } = require('../methods/utils');
const { userVitals } = require('../methods/vitals');

let connections = {};
let connectionsWithNames = {};
let messages = {};
let timeOnline = {};

const feedEmitter = new EventEmitter();

const handleSocketConnection = (io, connectionJson) => {
    const coderoomNamespace = io.of('/coderoom');

    console.log('Connection information:', connections);
    // Listen for feed data and emit it to the room
    feedEmitter.on('feed', (bed, id, data) => {
        console.log(`Socket : Received feed data for bed ${bed} and id ${id}:`, data.length);
        coderoomNamespace.emit(`feed-${bed}`, { id, data });
    });

    coderoomNamespace.on('connection', (socket) => {
        console.log('New client connected', socket.id);

        socket.on('join-call', (path, username) => {
            console.log('User joined call:', path, username);
            if (connections[path] === undefined) {
                connections[path] = [];
            }
            connections[path].push(socket.id);
            connectionsWithNames[socket.id] = username;

            if (connectionJson.connections[path] === undefined) {
                connectionJson.connections[path] = {};
            }
            connectionJson.connections[path][socket.id] = { socket_id: socket.id, name: username };

            timeOnline[socket.id] = new Date();

            for (let a = 0; a < connections[path].length; ++a) {
                coderoomNamespace.to(connections[path][a]).emit("user-joined", socket.id, connections[path], connectionsWithNames);
            }

            setInterval(() => {
                if (!connections[path] || connections[path].length === 0) return;

                const roomName = path.split('#/')[1];
                const vitalsArray = connections[path].map(id => {
                    const username = connectionsWithNames[id].toLowerCase();
                    const userData = userVitals[roomName]?.[username];
                    const isDataRecent = userData?.timestamp && (new Date() - new Date(userData.timestamp)) < 2000;

                    if (userData && isDataRecent) {
                        return {
                            id,
                            username: connectionsWithNames[id],
                            ...userData
                        };
                    }
                    return {
                        id,
                        username: connectionsWithNames[id],
                        pulse: null,
                        left_rr: null,
                        right_rr: null,
                        timestamp: new Date().toISOString()
                    };
                });

                connections[path].forEach(id => {
                    coderoomNamespace.to(id).emit("vitals", vitalsArray);
                });
            }, 1000);

            if (messages[path] !== undefined) {
                for (let a = 0; a < messages[path].length; ++a) {
                    coderoomNamespace.to(socket.id).emit("chat-message", messages[path][a]['data'],
                        messages[path][a]['sender'], messages[path][a]['socket-id-sender']);
                }
            }

            saveConnectionsToJSON(connectionJson);
        });

        socket.on('signal', (toId, message) => {
            coderoomNamespace.to(toId).emit('signal', socket.id, message);
        });

        socket.on('globalData', (data) => {
            coderoomNamespace.emit('globalData', data);
        });

        socket.on('posenetData', (data) => {
            coderoomNamespace.emit('posenetData', data);
        });

        socket.on('stopPosenet', (data) => {
            const { socketId } = data;
            coderoomNamespace.emit('stopPosenet', { socketId });
        });

        socket.on('chat-message', (data, sender) => {
            data = sanitizeString(data);
            sender = sanitizeString(sender);

            var key;
            var ok = false;
            for (const [k, v] of Object.entries(connections)) {
                for (let a = 0; a < v.length; ++a) {
                    if (v[a] === socket.id) {
                        key = k;
                        ok = true;
                    }
                }
            }

            if (ok === true) {
                if (messages[key] === undefined) {
                    messages[key] = [];
                }
                messages[key].push({ "sender": sender, "data": data, "socket-id-sender": socket.id });

                for (let a = 0; a < connections[key].length; ++a) {
                    coderoomNamespace.to(connections[key][a]).emit("chat-message", data, sender, socket.id);
                }
            }

            saveConnectionsToJSON();
        });

        socket.on('disconnect', () => {
            var diffTime = Math.abs(timeOnline[socket.id] - new Date());
            var key;
            for (const [k, v] of JSON.parse(JSON.stringify(Object.entries(connections)))) {
                for (let a = 0; a < v.length; ++a) {
                    if (v[a] === socket.id) {
                        key = k;

                        for (let a = 0; a < connections[key].length; ++a) {
                            coderoomNamespace.to(connections[key][a]).emit("user-left", socket.id);
                        }

                        var index = connections[key].indexOf(socket.id);
                        connections[key].splice(index, 1);

                        if (connections[key].length === 0) {
                            delete connections[key];
                        }
                        delete connectionsWithNames[socket.id];

                        delete connectionJson.connections[key][socket.id];
                    }
                }
            }
        });
    });

    setInterval(() => logRoomInfo(connections), 10000);
};

module.exports = { handleSocketConnection, feedEmitter };