- test2
# Vital Signs Simulation and Visualization System

## System Architecture

### Components
1. **Simulation Script** (`simulate_data.py`)
   - Generates simulated vital signs data
   - Sends data to backend server via HTTP POST

2. **Backend Server** (`app.js`)
   - Node.js server running on port 8501
   - Handles HTTP requests and WebSocket connections
   - Routes: `/coderoom/{room}/{username}/vitals`
   - WebSocket path: `/coderoom/socket.io`

3. **Frontend Application** (`VitalsChart.jsx`, `VideoFuc.jsx`)
   - React application running on port 5173
   - Real-time visualization of vital signs
   - WebSocket client for live updates

### Data Flow
1. **Data Generation**
   ```python
   # simulate_data.py generates vital signs
   vitals = {
       "pulse": 75,          # Heart rate (BPM)
       "left_rr": 16,        # Left respiratory rate
       "right_rr": 15,       # Right respiratory rate
       "ecg": -0.5,         # Single ECG point (-2 to +2)
       "Resp_L": 70,        # Left respiratory signal (0-140)
       "Resp_R": 70,        # Right respiratory signal (0-140)
       "timestamp": 1234567890
   }
   ```

2. **Server Communication**
   ```javascript
   // app.js (Backend)
   app.post('/coderoom/:room/:username/vitals', (req, res) => {
       const { room, username } = req.params;
       const vitals = req.body;
       
       // Add user info to vitals
       vitals.id = getSocketId(username);
       vitals.username = username;
       
       // Broadcast to all clients in room via WebSocket
       io.to(`#/${room}`).emit('vitals', [vitals]);
   });
   ```

3. **Frontend Reception**
   ```javascript
   // VitalsChart.jsx
   socket.on('vitals', (vitalsArray) => {
       const userVitals = vitalsArray.find(v => 
           v.username.toLowerCase() === username.toLowerCase()
       );
       
       if (userVitals) {
           setHeartRateData(prev => [...prev, userVitals.pulse].slice(-30));
           setEcgData(prev => [...prev, userVitals.ecg].slice(-100));
           // ... similar for respiratory data
       }
   });
   ```

## Communication Flow
1. **Data Generation & Sending**
   - Simulation script generates data every 50ms
   - Sends HTTP POST to: `http://localhost:8501/coderoom/{room}/{username}/vitals`

2. **Server Processing**
   - Backend receives POST request
   - Adds socket ID and username to data
   - Broadcasts via WebSocket to all clients in the room

3. **Frontend Reception**
   - Frontend connects to WebSocket on initialization
   - Joins specific room: `socket.emit('join-call', '#/${room}', username)`
   - Listens for 'vitals' events
   - Updates charts with new data points

## Room & User Management
1. **Room Structure**
   - Rooms are identified by URL path: `/#/test1`
   - Users join rooms via WebSocket: `socket.emit('join-call', '#/test1', 'anish')`

2. **Socket.IO Integration**
   ```javascript
   // Backend (app.js)
   io.on('connection', (socket) => {
       socket.on('join-call', (room, username) => {
           socket.join(room);
           // Store socket ID and username mapping
       });
   });
   ```

## Data Visualization
1. **Chart Components**
   - Heart Rate: Line chart showing last 30 points
   - ECG Signal: Line chart showing last 100 points
   - Respiratory Signals: Dual line chart showing last 100 points

2. **Update Logic**
   ```javascript
   // Data accumulation in frontend
   setEcgData(prev => [...prev, newPoint].slice(-100));
   ```

## Configuration
1. **Backend URL**
   ```python
   # Local development
   SERVER_URL = "http://localhost:8501/coderoom"
   # Production
   SERVER_URL = "https://project.iith.ac.in/coderoom"
   ```

2. **Sampling Rates**
   - Data generation: 50ms intervals (20 Hz)
   - Chart updates: Real-time
   - Buffer sizes: 100 points for signals, 30 points for rates

## Signal Ranges
1. **Heart Rate**: 65-85 BPM
2. **ECG Signal**: -2 to +2 mV
3. **Respiratory Rate**: 12-18 breaths/min
4. **Respiratory Signals**: 30-110 units

## Error Handling
1. **Server Connection**
   - Retries on connection failure
   - Error logging for failed requests

2. **Data Validation**
   - Range checking for vital signs
   - Timestamp validation
   - User authentication via room/username

## Dependencies
1. **Backend**
   - Node.js
   - Socket.IO
   - Express

2. **Frontend**
   - React
   - Chart.js
   - Socket.IO Client

3. **Simulation**
   - Python
   - NumPy
   - Requests
