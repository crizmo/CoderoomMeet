const http = require('http');
const socketIo = require('socket.io');
const { handleRequest } = require('./routes/routes.js');
const { handleSocketConnection } = require('./socket/socket.js');

const port = 8501;

let connectionJson = {
  connections: {},
};

const server = http.createServer((req, res) => handleRequest(io)(req, res));

const io = socketIo(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"],
        transports: ['websocket', 'polling'],
        credentials: true
    },
    allowEIO3: true,
    path: '/samiksha/socket.io'
});

handleSocketConnection(io, connectionJson);

server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

module.exports = { io };