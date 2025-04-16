import React, { useState, useMemo, useCallback } from 'react';
import {
	TextField,
	Button,
	Box,
	Typography,
	Container,
	Paper,
	useMediaQuery,
	ThemeProvider,
	createTheme
} from '@mui/material';
import { blue, green } from '@mui/material/colors';
import { useTheme } from '@mui/material/styles';
import allowedRooms from '../components/allowedRooms.json';
import logoImage from '../assets/logo1.png';

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

	const [inputs, setInputs] = useState({
		username: '',
		password: '',
		roomName: ''
	});

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

	const handleChange = useCallback((e) => {
		const { name, value } = e.target;
		setInputs((prev) => ({ ...prev, [name]: value }));
	}, []);

	const handleJoin = useCallback((path) => {
		const { roomName, username, password } = inputs;

		if (!roomName || !username || !password) {
			alert('Please fill in all fields.');
			return;
		}

		if (isAllowedRoom(roomName)) {
			if (isValidCredentials(roomName, username, password)) {
				onLoginSet();
				onUsernameSet(username);
				window.location.href = `/#/${path}/${roomName}`;
			} else {
				alert('Invalid username or password.');
			}
		} else {
			alert('Error: Invalid room name or room not allowed. Contact admin.');
		}
	}, [inputs, isAllowedRoom, isValidCredentials, onLoginSet, onUsernameSet]);

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
					<Box
						sx={{
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							marginBottom: 3,
							textAlign: 'center'
						}}
					>
						<Typography
							variant={isMobile ? "h5" : "h4"}
							component="h1"
							sx={{
								fontWeight: 'bold',
								color: theme.palette.primary.main,
								marginBottom: 1
							}}
						>
							Coderoom
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
							Join a room to start your session
						</Typography>
					</Box>

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
							name="roomName"
							value={inputs.roomName}
							onChange={handleChange}
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
							name="username"
							value={inputs.username}
							onChange={handleChange}
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
							name="password"
							value={inputs.password}
							onChange={handleChange}
							InputProps={{
								sx: { borderRadius: 2 }
							}}
						/>
						<Box
							sx={{
								display: 'flex',
								flexDirection: 'column',
								alignItems: 'center'
							}}
						>
							{/* 
							DO NOT
							<Button
								type="button"
								fullWidth
								variant="contained"
								color="primary"
								sx={{
									mt: 2,
									mb: 2,
									py: 1.5,
									borderRadius: 2,
									textTransform: 'none',
									fontWeight: 'bold'
								}}
								onClick={() => handleJoin('device')}
							>
								Connect to Device
							</Button> 
							*/}
							<Button
								type="button"
								fullWidth
								variant="contained"
								color="primary"
								sx={{
									mt: 2,
									mb: 2,
									py: 1.5,
									borderRadius: 2,
									textTransform: 'none',
									fontWeight: 'bold'
								}}
								onClick={() => handleJoin('meet')}
							>
								Connect to Session
							</Button>
						</Box>
					</Box>
				</Paper>
			</Container>
		</ThemeProvider>
	);
};

export default Home;