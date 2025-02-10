const userVitals = {};

const handleVitals = (req, res, room, username) => {
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
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    status: 'error',
                    message: 'Invalid data format',
                    error: error.message
                }));
            }
        });
    }
};

module.exports = { handleVitals, userVitals };