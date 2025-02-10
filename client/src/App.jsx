import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import MeetFuc from './pages/MeetFuc';
import Home from './pages/Home';
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
          <Route path="/meet/:url" element={<MeetFuc login={login} username={username} />} />
        </Routes>
      </Router>
    </div>
  );
};

export default App;
