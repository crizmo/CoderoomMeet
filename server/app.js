const http = require('http');
const fs = require('fs');
const path = require('path');
const socketIo = require('socket.io');
const xss = require("xss");

const port = 8501;

const userVitals = {};

const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathParts = url.pathname.split('/').filter(Boolean);

    console.log('Received request:', {
        method: req.method,
        url: req.url,
        pathParts: pathParts
    });

    if (pathParts.length === 4 && pathParts[0] === 'samiksha') {
        const [_, room, username, endpoint] = pathParts;
        
        console.log('Processing request for:', {
            room,
            username,
            endpoint
        });

        if (endpoint === 'vitals') {
            if (!userVitals[room]) {
                userVitals[room] = {};
            }

            if (req.method === 'POST') {
                let body = '';
                req.on('data', chunk => {
                    body += chunk.toString();
                });
                
                req.on('end', () => {
                    try {
                        console.log('Received body:', body);
                        const data = JSON.parse(body);
                        
                        userVitals[room][username.toLowerCase()] = {
                            pulse: parseInt(data.pulse) || null,
                            left_rr: parseInt(data.left_rr) || null,
                            right_rr: parseInt(data.right_rr) || null,
                            pulse_arr: data.pulse_arr,
                            left_rr_arr: data.left_rr_arr,
                            right_rr_arr: data.right_rr_arr,
                            ecg: data.ecg,
                            Resp_L: data.Resp_L,
                            Resp_R: data.Resp_R,
                            timestamp: new Date().toISOString()
                        };

                        console.log(`Stored vitals for ${username} in room ${room}:`, 
                            userVitals[room][username.toLowerCase()]);

                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ 
                            status: 'success', 
                            message: 'Vitals updated',
                            data: userVitals[room][username.toLowerCase()]
                        }));

                        const vitalsArray = Object.values(userVitals[room]).map(v => ({
                            username: v.username,
                            pulse: v.pulse,
                            left_rr: v.left_rr,
                            right_rr: v.right_rr,
                            pulse_arr: v.pulse_arr,
                            left_rr_arr: v.left_rr_arr,
                            right_rr_arr: v.right_rr_arr,
                            ecg: v.ecg,
                            Resp_L: v.Resp_L,
                            Resp_R: v.Resp_R,
                            timestamp: v.timestamp
                        }));

                        io.to(room).emit('vitals', vitalsArray);

                    } catch (error) {
                        console.error('Error processing vitals:', error);
                        console.error('Received body:', body);
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ 
                            status: 'error', 
                            message: 'Invalid data format',
                            error: error.message
                        }));
                    }
                });
            }
            return;
        }
    }

    console.log(req.url)
    if (req.url === '/samiksha/' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('Server is working');
    } else if (req.url.startsWith('/samiksha') && req.method === 'GET') {
        const filePath = path.join(__dirname, 'public', req.url.replace('/samiksha', ''));
        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('Not Found');
            } else {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(data);
            }
        });
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
    }
});

const io = socketIo(server, {
    cors: {
        // origin: "http://localhost:5173",
        origin: "https://camera-web-app.vercel.app",
        methods: ["GET", "POST"],
        transports: ['websocket', 'polling'],
        credentials: true
    },
    allowEIO3: true,
    path: '/samiksha/socket.io'
});

const sanitizeString = (str) => {
    return xss(str);
};

let connections = {};
let connectionsWithNames = {};
let messages = {};
let timeOnline = {};

let connectionJson = {
    connections: {},
};

// Define a function to log room information
function logRoomInfo() {
    console.log("Room Information:");
    for (const room in connections) {
        if (connections[room].length > 0) {
            console.log(`Room ${room}: Users ${connections[room].length}`);
        } else {
            // Optionally, you can remove empty rooms from the connections object
            delete connections[room];
        }
    }
}

setInterval(logRoomInfo, 10000); // 10 seconds in milliseconds

// Function to extract and sanitize room name for use in filenames
function extractRoomName(room) {
    const match = room.match(/#\/([^\/]+)/);
    return match ? match[1].replace(/[^a-z0-9]/gi, '_').toLowerCase() : 'unknown_room';
}

// Function to save connections data to a JSON file for each room
function saveConnectionsToJSON() {
    // Create logs directory if it doesn't exist
    const logsDir = path.join(__dirname, 'logs');
    if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir);
    }

    // Generate filename based on the current date
    const date = new Date().toISOString().split('T')[0];

    for (const room in connectionJson.connections) {
        const sanitizedRoomName = extractRoomName(room);
        const filename = `${sanitizedRoomName}-${date}.json`;
        const filePath = path.join(logsDir, filename);

        // Save the JSON file for each room
        fs.writeFileSync(filePath, JSON.stringify(connectionJson.connections[room]), 'utf8');
        console.log(`Saved connections for room ${room} to JSON file: ${filePath}`);
    }
}


// Create a namespace for the '/samiksha' endpoint
const samikshaNamespace = io.of('/samiksha');

// Bind a callback function to the 'connection' event on the namespace
samikshaNamespace.on('connection', (socket) => {
    console.log('New client connected', socket.id);

    socket.on('join-call', (path, username) => {
        console.log('join-call event received:', path, username);
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
            samikshaNamespace.to(connections[path][a]).emit("user-joined", socket.id, connections[path], connectionsWithNames);
            console.log("User", socket.id, "joined room", path);
        }

        setInterval(() => {
            if (!connections[path] || connections[path].length === 0) return;

            const roomName = path.split('#/')[1];
            
            const vitalsArray = connections[path].map(id => {
                const username = connectionsWithNames[id].toLowerCase();
                
                // console.log(`Checking vitals for ${username} in room ${roomName}`);
                // console.log('Available vitals:', userVitals[roomName]);
                
                // Check if we have recent data (within last 2 seconds instead of 30)
                const userData = userVitals[roomName]?.[username];
                const isDataRecent = userData?.timestamp && 
                    (new Date() - new Date(userData.timestamp)) < 2000;  // Changed from 30000 to 2000

                if (userData && isDataRecent) {
                    // console.log(`Found vitals for ${username}:`, userData);
                    return {
                        id,
                        username: connectionsWithNames[id],
                        ...userData
                    };
                }
                
                // console.log(`No recent vitals found for ${username}`);
                return {
                    id,
                    username: connectionsWithNames[id],
                    pulse: null,
                    left_rr: null,
                    right_rr: null,
                    timestamp: new Date().toISOString()
                };
            });
            
            // console.log('Sending vitals array:', vitalsArray);
            connections[path].forEach(id => {
                samikshaNamespace.to(id).emit("vitals", vitalsArray);
            });
        }, 1000);  // Changed from 25000 to 1000
 
       
        if (messages[path] !== undefined) {
            for (let a = 0; a < messages[path].length; ++a) {
                samikshaNamespace.to(socket.id).emit("chat-message", messages[path][a]['data'],
                    messages[path][a]['sender'], messages[path][a]['socket-id-sender']);
            }
        }

        console.log(path, connections[path], connectionsWithNames);

        saveConnectionsToJSON();
    });

        
    socket.on('signal', (toId, message) => {
        samikshaNamespace.to(toId).emit('signal', socket.id, message);
    });

    socket.on('globalData', (data) => {
        console.log('globalData event received:', data);
        samikshaNamespace.emit('globalData', data);
    });

    socket.on('posenetData', (data) => {
        console.log('posenetData event received:', data);
        samikshaNamespace.emit('posenetData', data);
    });

    socket.on('stopPosenet', (data) => {
        const { socketId } = data;
        console.log(`Received stopPosenet event from ${socketId}`);
        samikshaNamespace.emit('stopPosenet', { socketId });
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
            console.log("message", key, ":", sender, data);

            for (let a = 0; a < connections[key].length; ++a) {
                samikshaNamespace.to(connections[key][a]).emit("chat-message", data, sender, socket.id);
            }
        }

        saveConnectionsToJSON();
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected', socket.id);
        var diffTime = Math.abs(timeOnline[socket.id] - new Date());
        var key;
        for (const [k, v] of JSON.parse(JSON.stringify(Object.entries(connections)))) {
            for (let a = 0; a < v.length; ++a) {
                if (v[a] === socket.id) {
                    key = k;

                    for (let a = 0; a < connections[key].length; ++a) {
                        samikshaNamespace.to(connections[key][a]).emit("user-left", socket.id);
                    }

                    var index = connections[key].indexOf(socket.id);
                    connections[key].splice(index, 1);

                    console.log("Room", key, "with socket id", socket.id, "left after", Math.ceil(diffTime / 1000), "seconds");

                    if (connections[key].length === 0) {
                        delete connections[key];
                    }
                    delete connectionsWithNames[socket.id];

                    delete connectionJson.connections[key][socket.id];
                }
            }
        }

        // saveConnectionsToJSON();
    });
});

server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});