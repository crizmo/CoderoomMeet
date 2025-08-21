import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import VideoFuc from './components/VideoFuc';
import Home from './components/Home';
import VitalsChart from './components/VitalsChart';
import { useState } from 'react';

const App = () => {
  const [login, setLogin] = useState(false);
  const [username, setUsername] = useState('');

  const handleLoginSet = () => {
    setLogin(true);
  };

  const handleUsernameSet = (username) => {
    setUsername(username);
  };

  return (
    <div>
      <Router>
        <Routes>
          <Route
            path="/"
            element={<Home onLoginSet={handleLoginSet} onUsernameSet={handleUsernameSet} />}
          />
          <Route path="/:room/:username/charts" element={<VitalsChart />} />
          <Route path="/:url" element={<VideoFuc login={login} username={username} />} />
        </Routes>
      </Router>
    </div>
  );
};

export default App;
