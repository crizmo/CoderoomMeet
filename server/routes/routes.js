const fs = require('fs');
const path = require('path');
const { handleVitals } = require('../methods/vitals');
const { feedEmitter } = require('../socket/socket');

const handleRequest = (io) => (req, res) => {
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

    if (pathParts.length === 4 && pathParts[0] === 'samiksha') {
        const [_, room, username, endpoint] = pathParts;
        if (endpoint === 'vitals') {
            handleVitals(req, res, room, username);
            return;
        }
    }

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
    } else if (req.url.match(/^\/device\/test\d+\/\d+$/) && req.method === 'POST') {
        const urlParts = req.url.split('/');
        const bed = urlParts[2];
        const id = urlParts[3];
    
        req.on('data', (chunk) => {
            console.log(`Routes: Received cam data for bed ${bed} and id ${id}:`, chunk.length);
            feedEmitter.emit('feed', bed, id, chunk);
        });
        
        req.on('end', () => {
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end(`Received cam data for bed ${bed} and id ${id}`);
        });
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
    }
};

module.exports = { handleRequest };