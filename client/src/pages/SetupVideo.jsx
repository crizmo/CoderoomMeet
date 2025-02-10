import React from 'react';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import { IconButton, Button, Typography, Box, FormControl, InputLabel, Select, MenuItem, useMediaQuery } from '@mui/material';
import logoImage from '../assets/logo1.png';

const SetupVideo = ({
    localVideoref,
    video,
    handleSetupVideo,
    connects,
    login,
    selectedCamera,
    setSelectedCamera,
    cameraList,
    switchSetupCamera,
    handleAudio,
    audio,
}) => {
    const isMobile = useMediaQuery('(max-width:600px)');

    return (
        <Box
            className='setup'
            sx={{
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
                alignItems: "center",
                width: "100%",
                height: "100vh",
                backgroundColor: "#f5f5f5",
                justifyContent: "center",
                padding: isMobile ? "10px" : "20px",
            }}
        >
            <Box
                className='video'
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    width: isMobile ? "100%" : "40%",
                    padding: isMobile ? "10px" : "20px",
                    minWidth: "300px",
                    backgroundColor: "#f5f5f5",
                }}
            >
                <video
                    id="my-video"
                    ref={localVideoref}
                    autoPlay
                    muted
                    style={{
                        border: "1px solid #bdbdbd",
                        objectFit: "cover",
                        maxWidth: "100%",
                        maxHeight: isMobile ? "40vh" : "60vh",
                        width: "auto",
                        height: "auto",
                        borderRadius: "10px"
                    }}
                ></video>

                <Box
                    sx={{
                        display: "flex",
                        flexDirection: isMobile ? "column" : "row",
                        alignItems: "center",
                        marginTop: "20px",
                        gap: "10px",
                    }}
                >
                    <IconButton style={{ color: "#424242" }} onClick={handleSetupVideo}>
                        {video ? (
                            <>
                                <VideocamIcon />
                                <Typography sx={{ marginLeft: "5px", fontSize: isMobile ? "12px" : "16px" }}>Video On</Typography>
                            </>
                        ) : (
                            <>
                                <VideocamOffIcon />
                                <Typography sx={{ marginLeft: "5px", fontSize: isMobile ? "12px" : "16px" }}>Video Off</Typography>
                            </>
                        )}
                    </IconButton>
                    <IconButton style={{ color: "#424242" }} onClick={handleAudio}>
                        {audio ? (
                            <>
                                <MicIcon />
                                <Typography sx={{ marginLeft: "5px", fontSize: isMobile ? "12px" : "16px" }}>Mic On</Typography>
                            </>
                        ) : (
                            <>
                                <MicOffIcon />
                                <Typography sx={{ marginLeft: "5px", fontSize: isMobile ? "12px" : "16px" }}>Mic Off</Typography>
                            </>
                        )}
                    </IconButton>
                </Box>

                <FormControl sx={{ marginTop: "20px", width: "100%" }}>
                    <InputLabel id="camera-select-label">Camera</InputLabel>
                    <Select
                        labelId="camera-select-label"
                        id="camera-select"
                        value={selectedCamera}
                        onChange={(e) => {
                            if (localVideoref.current && localVideoref.current.srcObject) {
                                localVideoref.current.srcObject.getTracks().forEach((track) => track.stop());
                            }
                            switchSetupCamera({ deviceId: e.target.value, localVideoref: localVideoref })
                                .then(({ selectedCamera, stream }) => {
                                    setSelectedCamera(selectedCamera);
                                    localVideoref.current.srcObject = stream;
                                })
                                .catch((err) => {
                                    console.error("Error switching camera:", err);
                                });
                        }}
                        style={{ minWidth: "120px" }}
                    >
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
                    width: isMobile ? "100%" : "30%",
                    padding: isMobile ? "10px" : "20px",
                    minWidth: "300px",
                    backgroundColor: "#f5f5f5",
                }}
            >
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
                    sx={{ margin: "20px", width: isMobile ? "100%" : "auto" }}
                >
                    Join
                </Button>
            </Box>
        </Box>
    )
}

export default SetupVideo;