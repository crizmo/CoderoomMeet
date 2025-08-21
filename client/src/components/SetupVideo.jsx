import React from 'react';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import { IconButton, Button, Typography, Box, FormControl, InputLabel, Select, MenuItem, useMediaQuery } from '@mui/material';
// import logoImage from '../assets/logo.jpg'; // Import the logo
import logoImage from '../assets/logo1.png'; // Import the logo

const SetupVideo = ({
    localVideoref,
    video,
    handleSetupVideo,
    connects,
    login,
    videoAvailable,
    selectedCamera,
    setSelectedCamera,
    cameraList,
    handleVideo,
    switchSetupCamera,

    handleAudio,
    audio,
}) => {
    const isMobile = useMediaQuery('(max-width:600px)'); // Detect mobile screens

    return (
        <Box
            className='setup'
            sx={{
                display: "flex",
                flexDirection: isMobile ? "column" : "row", // Stack vertically on mobile
                alignItems: "center",
                width: "100%",
                height: "100vh",
                backgroundColor: "#f5f5f5",
                justifyContent: "center",
                padding: isMobile ? "10px" : "20px", // Adjust padding for mobile
            }}
        >
            <Box
                className='video'
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    width: isMobile ? "100%" : "40%", // Full width on mobile
                    padding: isMobile ? "10px" : "20px",
                    minWidth: "300px", // Adjust for smaller screens
                    backgroundColor: "#f5f5f5",
                }}
            >
                {/* Video preview */}
                <video
                    id="my-video"
                    ref={localVideoref}
                    autoPlay
                    muted
                    style={{
                        border: "1px solid #bdbdbd",
                        objectFit: "cover",
                        maxWidth: "100%",
                        maxHeight: isMobile ? "40vh" : "60vh", // Adjust video height on mobile
                        width: "auto",
                        height: "auto",
                        borderRadius: "10px"
                    }}
                ></video>

                {/* Buttons for video and audio */}
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: isMobile ? "column" : "row", // Stack buttons vertically on mobile
                        alignItems: "center",
                        marginTop: "20px", // Add margin below buttons
                        gap: isMobile ? "10px" : "10px", // Adjust gap for mobile
                    }}
                >
                    <IconButton style={{ color: "#424242" }} onClick={handleSetupVideo}>
                        {video ? (
                            <React.Fragment>
                                <VideocamIcon />
                                <Typography sx={{ marginLeft: "5px", fontSize: isMobile ? "12px" : "16px" }}>Video On</Typography>
                            </React.Fragment>
                        ) : (
                            <React.Fragment>
                                <VideocamOffIcon />
                                <Typography sx={{ marginLeft: "5px", fontSize: isMobile ? "12px" : "16px" }}>Video Off</Typography>
                            </React.Fragment>
                        )}
                    </IconButton>
                    <IconButton style={{ color: "#424242" }} onClick={handleAudio}>
                        {audio ? (
                            <React.Fragment>
                                <MicIcon />
                                <Typography sx={{ marginLeft: "5px", fontSize: isMobile ? "12px" : "16px" }}>Mic On</Typography>
                            </React.Fragment>
                        ) : (
                            <React.Fragment>
                                <MicOffIcon />
                                <Typography sx={{ marginLeft: "5px", fontSize: isMobile ? "12px" : "16px" }}>Mic Off</Typography>
                            </React.Fragment>
                        )}
                    </IconButton>
                </Box>

                {/* Camera selection dropdown */}
                <FormControl sx={{ marginTop: "20px", width: "100%" }}>
                    <InputLabel id="camera-select-label">Camera</InputLabel>
                    <Select
                        labelId="camera-select-label"
                        id="camera-select"
                        value={selectedCamera}
                        onChange={(e) => {
                            // Stop the current camera's video tracks if they are running
                            if (localVideoref.current && localVideoref.current.srcObject) {
                                localVideoref.current.srcObject.getTracks().forEach((track) => track.stop());
                            }

                            // Switch to the selected camera by calling switchSetupCamera
                            switchSetupCamera({ deviceId: e.target.value, localVideoref: localVideoref })
                                .then(({ selectedCamera, stream }) => {
                                    // Update the selected camera state and set the video stream
                                    setSelectedCamera(selectedCamera);
                                    localVideoref.current.srcObject = stream;
                                })
                                .catch((err) => {
                                    // Log any errors encountered while switching cameras
                                    console.error("Error switching camera:", err);
                                });
                        }}
                        style={{ minWidth: "120px" }}
                    >
                        {/* Map over the list of available cameras and create MenuItems */}
                        {cameraList.map((camera) => (
                            <MenuItem key={camera.deviceId} value={camera.deviceId}>
                                {camera.label}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

            </Box>

            <Box
                className='join'
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    width: isMobile ? "100%" : "30%", // Full width on mobile
                    padding: isMobile ? "10px" : "20px",
                    minWidth: "300px", // Adjust for smaller screens
                    backgroundColor: "#f5f5f5",
                }}
            >
                {/* Add logo */}
                <img 
                    src={logoImage} 
                    alt="Yoga Vigyan Logo" 
                    style={{
                        width: isMobile ? '150px' : '200px',
                        height: 'auto',
                        borderRadius: '10px',
                        marginBottom: '20px'
                    }} 
                />

                <Typography sx={{ margin: 0, fontWeight: "bold", fontSize: isMobile ? "14px" : "18px" }}>
                    Login Status: {login ? 'Logged In' : 'Not Logged In'}
                </Typography>
                <Typography sx={{ margin: 0, fontWeight: "bold", fontSize: isMobile ? "14px" : "18px" }}>
                    Ready to Join
                </Typography>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={connects}
                    sx={{ margin: "20px", width: isMobile ? "100%" : "auto" }} // Full-width button on mobile
                >
                    Join
                </Button>
            </Box>
        </Box>
    )
}

export default SetupVideo;