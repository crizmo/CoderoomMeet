import React, { useState, useMemo, useCallback } from 'react';
import { 
	TextField, 
	Button, 
	Box, 
	Grid, 
	Typography, 
	Container, 
	Paper, 
	useMediaQuery,
	ThemeProvider, 
	createTheme 
} from '@mui/material';
import { blue, green } from '@mui/material/colors';
import { useTheme } from '@mui/material/styles';
import allowedRooms from './allowedRooms.json';
// import logoImage from '../assets/logo.jpg';
import logoImage from '../assets/logo1.png';

// Create a custom theme
const theme = createTheme({
	palette: {
		primary: {
			main: blue[600],
		},
		secondary: {
			main: green[600],
		},
	},
	typography: {
		fontFamily: 'Roboto, Arial, sans-serif',
	},
});

const Home = ({ onLoginSet, onUsernameSet }) => {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
	
	const [usernameInput, setUsernameInput] = useState('');
	const [passwordInput, setPasswordInput] = useState('');
	const [roomNameInput, setRoomNameInput] = useState('');

	// Memoize allowedRooms to avoid recalculating on every render
	const allowedRoomsInfo = useMemo(() => allowedRooms, []);

	const isAllowedRoom = useCallback((roomName) => {
		return allowedRoomsInfo.hasOwnProperty(roomName);
	}, [allowedRoomsInfo]);

	const isValidCredentials = useCallback((roomName, username, password) => {
		if (isAllowedRoom(roomName)) {
			return allowedRoomsInfo[roomName].some(
				(info) => info.username === username && info.password === password
			);
		}
		return false;
	}, [allowedRoomsInfo, isAllowedRoom]);

	const handleChange = useCallback((e, field) => {
		switch (field) {
			case 'roomNameInput':
				setRoomNameInput(e.target.value);
				break;
			case 'usernameInput':
				setUsernameInput(e.target.value);
				break;
			case 'passwordInput':
				setPasswordInput(e.target.value);
				break;
			default:
				break;
		}
	}, []);

	const join = useCallback(() => {
		const enteredRoom = roomNameInput.trim();
		const enteredUsername = usernameInput.trim();
		const enteredPassword = passwordInput.trim();

		if (!enteredRoom || !enteredUsername || !enteredPassword) {
			alert('Please fill in all fields.');
			return;
		}

		if (isAllowedRoom(enteredRoom)) {
			if (isValidCredentials(enteredRoom, enteredUsername, enteredPassword)) {
				onLoginSet();
				onUsernameSet(enteredUsername);
				window.location.href = `/#/${enteredRoom}`;
			} else {
				alert('Invalid username or password.');
			}
		} else {
			alert('Error: Invalid room name or room not allowed. Contact admin.');
		}
	}, [roomNameInput, usernameInput, passwordInput, isAllowedRoom, isValidCredentials, onLoginSet, onUsernameSet]);

	return (
		<ThemeProvider theme={theme}>
			<Container 
				maxWidth="xs"
				sx={{
					display: 'flex',
					flexDirection: 'column',
					justifyContent: 'center',
					alignItems: 'center',
					height: '100vh',
					padding: isMobile ? theme.spacing(2) : theme.spacing(4),
					backgroundColor: '#f0f2f5'
				}}
			>
				<Paper 
					elevation={6} 
					sx={{
						width: '100%',
						maxWidth: isMobile ? '100%' : 400,
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						padding: isMobile ? theme.spacing(2) : theme.spacing(4),
						borderRadius: 3,
						backgroundColor: 'white'
					}}
				>
					{/* Logo and Title Section */}
					<Box 
						sx={{
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							marginBottom: 3,
							textAlign: 'center'
						}}
					>
						<img 
							src={logoImage} 
							alt="Yoga Vigyan Logo" 
							style={{
								width: isMobile ? 150 : 200,
								height: 'auto',
								borderRadius: 10,
								marginBottom: 16
							}} 
						/>
						<Typography 
							variant={isMobile ? "h5" : "h4"} 
							component="h1" 
							sx={{ 
								fontWeight: 'bold', 
								color: theme.palette.primary.main,
								marginBottom: 1
							}}
						>
							Powered by BHERI
						</Typography>
						<Typography 
							variant={isMobile ? "subtitle2" : "subtitle1"} 
							sx={{ 
								textAlign: 'center', 
								color: 'text.secondary',
								fontWeight: 'bold',
								px: 1
							}}
						>
							Sensor enabled Conferencing Platforms for Yoga, Dance, Skill Instructors
						</Typography>
					</Box>

					{/* Login Form */}
					<Box 
						component="form" 
						sx={{ 
							width: '100%', 
							mt: 1 
						}}
					>
						<TextField
							variant="outlined"
							margin="normal"
							required
							fullWidth
							label="Room Name"
							value={roomNameInput}
							onChange={(e) => handleChange(e, 'roomNameInput')}
							InputProps={{
								sx: { borderRadius: 2 }
							}}
						/>
						<TextField
							variant="outlined"
							margin="normal"
							required
							fullWidth
							label="Username"
							value={usernameInput}
							onChange={(e) => handleChange(e, 'usernameInput')}
							InputProps={{
								sx: { borderRadius: 2 }
							}}
						/>
						<TextField
							variant="outlined"
							margin="normal"
							required
							fullWidth
							label="Password"
							type="password"
							value={passwordInput}
							onChange={(e) => handleChange(e, 'passwordInput')}
							InputProps={{
								sx: { borderRadius: 2 }
							}}
						/>
						<Button
							type="button"
							fullWidth
							variant="contained"
							color="primary"
							sx={{ 
								mt: 3, 
								mb: 2,
								py: 1.5,
								borderRadius: 2,
								textTransform: 'none',
								fontWeight: 'bold'
							}}
							onClick={join}
						>
							Connect to Session
						</Button>
					</Box>
				</Paper>
			</Container>
		</ThemeProvider>
	);
};

export default Home;