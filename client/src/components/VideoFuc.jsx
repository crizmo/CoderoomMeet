import React, { useState, useEffect, useCallback, useMemo } from 'react';
import io from 'socket.io-client';

import { Row } from 'reactstrap';
import {
	IconButton,
	useMediaQuery
} from '@mui/material';

import Popup from 'reactjs-popup';
import 'reactjs-popup/dist/index.css';

import {
	Mic as MicIcon,
	MicOff as MicOffIcon,
	CallEnd as CallEndIcon,
	Download as DownloadIcon,
	PlayArrow as PlayIcon,
	Stop as StopIcon,
	Videocam as VideocamIcon,
	VideocamOff as VideocamOffIcon,
	CenterFocusWeak as CenterFocusWeakIcon,
	Visibility as VisibilityIcon,
} from '@mui/icons-material';
import 'antd/dist/antd.css';
import 'bootstrap/dist/css/bootstrap.css';
import "../style/Video.css";

import changeCssVideos from '../methods/changeCssVideos';
import {
	switchCamera,
	switchSetupCamera,
	populateCameraList,

	getUserMediaSuccess,

	silence,
	black,
} from '../methods/media';

import {
	setStream,
	handleSourceOpen,
	startRecording,
	stopRecording,
	download,
} from '../methods/record';

import SetupVideo from './SetupVideo';

import tesseract from 'tesseract.js';

import peerConnectionConfig from '../methods/peerConnectionConfig';

import * as posenet from '@tensorflow-models/posenet';
import '@tensorflow/tfjs';

import { drawKeypoints, drawSkeleton } from "../methods/utilities"

import VitalsChart from './VitalsChart';

const serverUrl = import.meta.env.VITE_SERVER_URL;
const server_url = process.env.NODE_ENV === 'production' ? serverUrl : serverUrl;
console.log("server_url", server_url);

var connections = {}

// var socket = io.connect(server_url, { secure: true });
var socket = io(server_url, {
	path: '/samiksha/socket.io'
});

console.log("Connecting to socket server", socket);
var socketId = null
var elms = 0

let mediaRecorder = [];
let recordedBlobs = [];
let sourceBuffer = [];

let canvasArray = [{
	username: "",
	socketId: "",
	clstream: null,
	track: null,
}];
let streams = [{
	username: "",
	socketId: "",
	stream: null
}];

const mediaSource = new MediaSource();
mediaSource.addEventListener('sourceopen', handleSourceOpen(event, streams, sourceBuffer, mediaSource), false);


const VideoFuc = ({ login, username }) => {
	const localVideoref = React.useRef(null);
	const canvasRef = React.useRef(null);

	const [videoAvailable, setVideoAvailable] = useState(false);
	const [audioAvailable, setAudioAvailable] = useState(false);

	const [video, setVideo] = useState(false)
	const [audio, setAudio] = useState(false)

	const [setupVideo, setSetupVideo] = useState(false)

	const [cameraList, setCameraList] = useState([]);
	const [selectedCamera, setSelectedCamera] = useState('');
	const [screenAvailable, setScreenAvailable] = useState(false);
	const [connect, setConnect] = useState(true);

	const [ocr, setOcr] = useState(false)
	const [intervalId, setIntervalId] = useState(null);

	const [isPopupOpen, setIsPopupOpen] = useState(false);

	const handleVitalsClick = () => {
		setIsPopupOpen(true);
	};

	const detectWebcamFeed = async (posenet_model) => {
		if (localVideoref.current) {
			const video = localVideoref.current;
			console.log(video);
			console.log("Video Ready");
			if (video.readyState === 4) { // Ensure the video is ready
				const videoWidth = video.videoWidth;
				const videoHeight = video.videoHeight;
				// Set video width
				video.width = videoWidth;
				video.height = videoHeight;
				// Make Estimation
				const pose = await posenet_model.estimateSinglePose(video);
				console.log(pose);
				drawResult(pose, video, videoWidth, videoHeight, canvasRef);

				// Emit the posenet data to the server
				let socketId = socket.id;
				socket.emit('posenetData', { pose, socketId });
			}
		}
	};

	const runPosenet = async () => {
		const posenet_model = await posenet.load({
			inputResolution: { width: 640, height: 480 },
			scale: 0.8
		});
		console.log("Posenet Model Loaded");
		const id = setInterval(() => {
			detectWebcamFeed(posenet_model);
		}, 700);
		setIntervalId(id);
	};

	const drawResult = (pose, video, videoWidth, videoHeight, canvas) => {
		const ctx = canvas.current.getContext("2d");
		canvas.current.width = videoWidth;
		canvas.current.height = videoHeight;
		drawKeypoints(pose["keypoints"], 0.6, ctx);
		drawSkeleton(pose["keypoints"], 0.7, ctx);
		console.log("Drawing Pose");
	};

	const showPose = () => {
		if (intervalId) {
			clearInterval(intervalId);
			setIntervalId(null);
			console.log("Posenet Stopped");

			// Clear the local canvas
			const ctx = canvasRef.current.getContext("2d");
			ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

			// Emit an event to the server to notify other users
			socket.emit('stopPosenet', { socketId: socket.id });
		} else {
			runPosenet();
		}
	};

	useEffect(() => {
		socket.on('posenetData', (data) => {
			const { pose, socketId } = data;
			console.log("Received PoseNet Data", pose, socketId);
			console.log("socketId", socketId);

			let canvas = document.getElementsByClassName(`client-canvas-${socketId}`)[0];
			console.log("Canvas", canvas);

			if (!canvas) {
				// Create and append the canvas element if it doesn't exist
				canvas = document.createElement('canvas');
				canvas.style.position = "absolute";
				canvas.style.top = 0;
				canvas.style.left = 0;
				canvas.style.width = "100%";
				canvas.style.height = "100%";
				canvas.style.zIndex = 1;
				canvas.style.borderTopLeftRadius = "15px";
				canvas.style.borderBottomRightRadius = "15px";
				canvas.className = `client-canvas-${socketId}`;
				canvas.setAttribute('data-socket', socketId);
				document.body.appendChild(canvas); // Append to the body or appropriate container
			}

			const video = document.querySelector(`video[data-socket="${socketId}"]`);
			console.log("Video", video);

			if (video) {
				const videoWidth = video.videoWidth;
				const videoHeight = video.videoHeight;
				canvas.width = videoWidth;
				canvas.height = videoHeight;

				const ctx = canvas.getContext("2d");
				if (ctx) {
					drawKeypoints(pose["keypoints"], 0.6, ctx);
					drawSkeleton(pose["keypoints"], 0.7, ctx);
					console.log("Drawing Pose for socketId:", socketId);
				} else {
					console.error("Failed to obtain 2D context for canvas");
				}
			} else {
				console.error("Video element not found for socketId:", socketId);
			}
		});

		socket.on('stopPosenet', (data) => {
			const { socketId } = data;
			console.log("Received stopPosenet event for socketId:", socketId);

			// Clear the canvas for the specified socketId
			let canvas = document.getElementsByClassName(`client-canvas-${socketId}`)[0];
			if (canvas) {
				const ctx = canvas.getContext("2d");
				ctx.clearRect(0, 0, canvas.width, canvas.height);
			}
		});

		return () => {
			socket.off('posenetData');
			socket.off('stopPosenet');
		};
	}, []);

	useEffect(() => {
		const getPermissions = async () => {
			try {
				const { cameraList, selectedCamera } = await populateCameraList();
				setCameraList(cameraList);
				setSelectedCamera(selectedCamera);

				const mediaConstraints = { video: true, audio: true };
				const permission = await navigator.mediaDevices.getUserMedia(mediaConstraints);
				setVideoAvailable(!!permission);
				setAudioAvailable(!!permission);

				setVideo(videoAvailable ? true : false)
				setAudio(audioAvailable ? true : false)

				setScreenAvailable(!!navigator.mediaDevices.getDisplayMedia);

				if (permission) {
					const cameras = await navigator.mediaDevices.enumerateDevices();
					const selectedCamera = cameras.find(camera => camera.kind === 'videoinput' && camera.label === permission.getVideoTracks()[0].label);
					setSelectedCamera(selectedCamera.deviceId);
				}

				if (permission) {
					window.localStream = permission;
					localVideoref.current.srcObject = permission;
				}
			} catch (error) {
				console.error('Error getting permissions:', error);
			}
		};

		getPermissions();
	}, [videoAvailable, audioAvailable]);

	const updateMediaTracks = useCallback(async (video, audio, currentCamera) => {
		try {
			const videoConstraints = video
				? {
					width: { ideal: 1920, max: 1920 }, // Request up to 1080p resolution
					height: { ideal: 1080, max: 1080 },
					frameRate: { ideal: 60, max: 60 }, // Request up to 60 fps
					deviceId: currentCamera ? { exact: currentCamera } : undefined,
				}
				: false;

			const audioConstraints = audio ? true : false;

			const constraints = {
				video: videoConstraints,
				audio: audioConstraints,
			};

			if (video || audio) {
				const stream = await navigator.mediaDevices.getUserMedia(constraints);
				getUserMediaSuccess({
					stream,
					setVideo,
					setAudio,
					connections,
					socket,
					socketId,
					localVideoref,
				});
			} else {
				stopTracks();
			}
		} catch (e) {
			console.log(e);
		}
	}, []);

	const stopTracks = useCallback(() => {
		try {
			const tracks = localVideoref.current.srcObject.getTracks();
			tracks.forEach((track) => track.stop());

			const blackSilence = (...args) => new MediaStream([black(...args), silence()]);
			window.localStream = blackSilence();
			localVideoref.current.srcObject = window.localStream;

			for (let id in connections) {
				if (id === socketId) continue;

				connections[id].addStream(window.localStream);

				connections[id]
					.createOffer()
					.then((description) => connections[id].setLocalDescription(description))
					.then(() => {
						socket.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }));
					})
					.catch((e) => console.log(e));
			}
		} catch (e) {
			console.log('Error stopping tracks:', e);
		}
	}, []);


	const startOCR = useCallback(() => {
		const canvas = document.createElement('canvas');
		const ctx = canvas.getContext('2d');

		canvas.width = localVideoref.current.videoWidth;
		canvas.height = localVideoref.current.videoHeight;

		ctx.drawImage(localVideoref.current, 0, 0, canvas.width, canvas.height);

		tesseract.recognize(canvas, 'eng', { logger: m => console.log(m) })
			.then(({ data: { text } }) => {
				console.log(text);
			});
	}, []);

	useEffect(() => {
		if (ocr) {
			const interval = setInterval(() => {
				startOCR();
			}, 5000);

			return () => clearInterval(interval);
		} else {
			console.log("OCR Turned Off");
		}
	}, [ocr, startOCR]);

	const handleOcr = useCallback(() => {
		setOcr(prevOcr => !prevOcr);
	}, []);

	const gotMessageFromServer = (fromId, message) => {
		var signal = JSON.parse(message)

		if (fromId !== socketId) {
			if (signal.sdp) {
				connections[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(() => {
					if (signal.sdp.type === 'offer') {
						connections[fromId].createAnswer().then((description) => {
							connections[fromId].setLocalDescription(description).then(() => {
								socket.emit('signal', fromId, JSON.stringify({ 'sdp': connections[fromId].localDescription }))
							}).catch(e => console.log(e))
						}).catch(e => console.log(e))
					}
				}).catch(e => console.log(e))
			}

			if (signal.ice) {
				connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice)).catch(e => console.log(e))
			}
		}
	}

	const connectToSocketServer = () => {
		console.log("Attempting to connect to socket server at", server_url);
		socket = io(server_url, {
			path: '/samiksha/socket.io'
		});
		console.log("Connecting to socket server", socket);
		console.log("Connecting to socket server")
		socket.on('signal', gotMessageFromServer)
		socket.on('connect', () => {
			console.log("Connected to socket server")
			socket.emit('join-call', window.location.href, username)
			socketId = socket.id

			socket.on('globalData', (data) => {
				console.log("Received global data", data);
			});

			socket.on('temperature', (tempArray) => {

				let usersDisplay = document.querySelectorAll('.videoWrapper');
				usersDisplay.forEach((user) => {
					let userId = user.id;
					tempArray.forEach((temp) => {
						if (temp.id === userId) {
							let idDisplay = user.querySelector('div');
							idDisplay.innerText = `${temp.username.charAt(0).toUpperCase() + temp.username.slice(1)} Temperature : ${temp.temp}°C`
						}
					})
				})

				let localVideoDisplay = document.querySelector('.localVideoDisplay');
				tempArray.forEach((temp) => {
					if (temp.id === socketId) {
						localVideoDisplay.innerText = `${temp.username.charAt(0).toUpperCase() + temp.username.slice(1)} Temperature : ${temp.temp}°C`
					}
				})

			})

			socket.on('vitals', (vitalsArray) => {

				let usersDisplay = document.querySelectorAll('.videoWrapper');
				usersDisplay.forEach((user) => {
					let userId = user.id;
					vitalsArray.forEach((vital) => {
						if (vital.id === userId) {
							let vitalsDisplay = user.querySelector('.vitals-display');
							if (!vitalsDisplay) {
								vitalsDisplay = document.createElement('div');
								vitalsDisplay.className = 'vitals-display';
								vitalsDisplay.style.cursor = 'pointer';
								vitalsDisplay.zIndex = 3;
								// if the the user clicks on the vitals display, then open a pop with VitalChart component 
								// which will show the vitals chart of the user , use PopUp component from reactjs-popup library when i click on the vitals display div
								// vitalsDisplay.onclick = () => {
								// 	handleVitalsClick();
								// }


								user.insertBefore(vitalsDisplay, user.firstChild);
							}
						}
					});
				});

				const localWrapper = document.querySelector('.localVideoWrapper');
				if (localWrapper) {
					vitalsArray.forEach((vital) => {
						if (vital.id === socketId) {
							let vitalsDisplay = localWrapper.querySelector('.vitals-display');
							if (!vitalsDisplay) {
								vitalsDisplay = document.createElement('div');
								vitalsDisplay.className = 'vitals-display';
								vitalsDisplay.style.cursor = 'pointer';
								vitalsDisplay.zIndex = 4;
								// vitalsDisplay.onclick = () => {
								// 	handleVitalsClick();
								// }
								localWrapper.insertBefore(vitalsDisplay, localWrapper.firstChild);
							}
						}
					});
				}
			});

			let main = document.getElementById('main')
			changeCssVideos({ main, elms });

			socket.on('user-left', (id) => {
				let videoWrapper = document.getElementById(id)
				if (videoWrapper) {
					elms--
					videoWrapper.parentNode.removeChild(videoWrapper)

					let main = document.getElementById('main')
					changeCssVideos({ main, elms });
				}

				// remove the user from the canvasArray and streams array
				for (let i = 0; i < canvasArray.length; i++) {
					if (canvasArray[i].socketId === id) {
						canvasArray.splice(i, 1);
						break;
					}
				}
				for (let i = 0; i < streams.length; i++) {
					if (streams[i].socketId === id) {
						streams.splice(i, 1);
						break;
					}
				}
			})

			socket.on('user-joined', (id, clients, connectionsWithNames) => {
				clients.forEach((socketListId) => {
					connections[socketListId] = new RTCPeerConnection(peerConnectionConfig)
					// Wait for their ice candidate      
					connections[socketListId].onicecandidate = function (event) {
						if (event.candidate != null) {
							socket.emit('signal', socketListId, JSON.stringify({ 'ice': event.candidate }))
						}
					}

					// Wait for their video stream
					connections[socketListId].onaddstream = (event) => {
						var searchVidep = document.querySelector(`[data-socket="${socketListId}"]`)
						if (searchVidep !== null) {
							searchVidep.srcObject = event.stream
						} else {
							elms = clients.length
							let main = document.getElementById('main')
							let cssMesure = changeCssVideos({ main, elms });

							let videoWrapper = document.createElement('div')
							let video = document.createElement('video')

							videoWrapper.id = socketListId
							videoWrapper.className = "videoWrapper"

							const idDisplay = document.createElement('div');
							// idDisplay.innerText = connectionsWithNames[socketListId];
							// {username.charAt(0).toUpperCase() + username.slice(1)}
							idDisplay.innerText = connectionsWithNames[socketListId].charAt(0).toUpperCase() + connectionsWithNames[socketListId].slice(1);

							videoWrapper.style.display = "flex";
							videoWrapper.style.flexDirection = "column";
							videoWrapper.style.justifyContent = "flex-start";
							videoWrapper.style.alignItems = "flex-start";
							videoWrapper.style.position = "relative";
							videoWrapper.style.zIndex = "1";
							videoWrapper.style.border = "2px solid white";
							videoWrapper.style.borderRadius = "15px";


							idDisplay.style.position = "absolute";
							idDisplay.style.top = "0px";
							idDisplay.style.left = "0px";
							idDisplay.style.zIndex = "3";
							idDisplay.style.padding = "10px";
							idDisplay.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
							idDisplay.style.color = "white";
							idDisplay.style.fontWeight = "bold";
							idDisplay.style.fontSize = "12px";
							idDisplay.style.width = "auto";
							idDisplay.style.whiteSpace = "nowrap";
							idDisplay.style.borderTopLeftRadius = "15px";
							idDisplay.style.borderBottomRightRadius = "15px";


							let css = {
								minWidth: cssMesure.minWidth,
								minHeight: cssMesure.minHeight,
								maxHeight: "100%",
								margin: "10px",
								borderStyle: "solid",
								borderColor: "#bdbdbd",
								objectFit: "fill"
							}

							for (let prop in css) {
								videoWrapper.style[prop] = css[prop];
							}
							videoWrapper.style.setProperty("width", cssMesure.width)
							videoWrapper.style.setProperty("height", cssMesure.height)

							// for (let i in css) videos

							video.style.width = "100%";
							video.style.height = "100%";
							video.style.objectFit = "fill";
							// add classname to video element
							video.className = `client-video-${socketListId}`

							video.setAttribute('data-socket', socketListId)
							video.srcObject = event.stream
							video.autoplay = true
							video.playsinline = true

							canvasArray.push({
								username: connectionsWithNames[socketListId],
								socketId: socketListId,
								clstream: connections[socketListId].getLocalStreams()[0],
								track: connections[socketListId].getLocalStreams()[0].getVideoTracks()[0]
							});
							console.log("canvasArray", canvasArray);

							videoWrapper.appendChild(idDisplay);
							videoWrapper.appendChild(video)

							// make a canvas for the user and add it to the canvasArray

							// Create and append the canvas element
							let canvas = document.createElement('canvas');
							canvas.width = video.videoWidth;
							canvas.height = video.videoHeight;
							canvas.style.position = "absolute";
							canvas.style.top = 0;
							canvas.style.left = 0;
							canvas.style.width = "100%";
							canvas.style.height = "100%";
							canvas.style.zIndex = 1;
							canvas.style.borderTopLeftRadius = "15px";
							canvas.style.borderBottomRightRadius = "15px";
							canvas.className = `client-canvas-${socketListId}`;
							videoWrapper.appendChild(canvas);
							console.log('videoWrapper', videoWrapper);
							main.appendChild(videoWrapper)

							setStream(canvasArray, streams);
						}
					}

					// if the user switches the camera, then update the canvasArray and rerun the setStream function
					connections[socketListId].ontrack = (event) => {
						console.log("event", event);
						if (event.track.kind === "video") {
							for (let i = 0; i < canvasArray.length; i++) {
								if (canvasArray[i].socketId === socketListId) {
									canvasArray[i].clstream = event.streams[0];
									canvasArray[i].track = event.track;
									break;
								}
							}
							setStream(canvasArray, streams);
						}
					}

					// Add the local video stream
					if (window.localStream !== undefined && window.localStream !== null) {
						connections[socketListId].addStream(window.localStream)
					} else {
						let blackSilence = (...args) => new MediaStream([black(...args), silence()])
						window.localStream = blackSilence()
						connections[socketListId].addStream(window.localStream)
					}


				})

				if (id === socketId) {
					for (let id2 in connections) {
						if (id2 === socketId) continue

						try {
							connections[id2].addStream(window.localStream)
						} catch (e) { }

						connections[id2].createOffer().then((description) => {
							connections[id2].setLocalDescription(description)
								.then(() => {
									socket.emit('signal', id2, JSON.stringify({ 'sdp': connections[id2].localDescription }))
								})
								.catch(e => console.log(e))
						})
					}
				}
			})
		})
	}

	const handleVideo = useCallback(() => {
		setVideo(prevVideo => {
			const newVideoState = !prevVideo;
			updateMediaTracks(newVideoState, audio, selectedCamera);
			return newVideoState;
		});
	}, [audio, selectedCamera, updateMediaTracks]);

	const handleAudio = useCallback(() => {
		setAudio(prevAudio => {
			const newAudioState = !prevAudio;
			updateMediaTracks(video, newAudioState, selectedCamera);
			return newAudioState;
		});
	}, [video, selectedCamera, updateMediaTracks]);


	const handleSetupVideo = useCallback(() => {
		setSetupVideo(prevSetupVideo => {
			const newSetupVideoState = !prevSetupVideo;

			if (newSetupVideoState) {
				setVideo(true);
				navigator.mediaDevices.getUserMedia({
					video: {
						width: { ideal: 1920, max: 1920 }, // Request up to 1080p resolution
						height: { ideal: 1080, max: 1080 },
						frameRate: { ideal: 60, max: 60 }, // Request up to 60 fps
					}
				})
					.then((stream) => {
						window.localStream = stream;
						localVideoref.current.srcObject = stream;
					})
					.catch((e) => {
						console.error("Error accessing camera: ", e);
					});
			} else {
				setVideo(false);
				const blackSilenceStream = new MediaStream([black(), silence()]);
				window.localStream = blackSilenceStream;
				localVideoref.current.srcObject = blackSilenceStream;
			}

			return newSetupVideoState;
		});
	}, []);

	const handleEndCall = useCallback(() => {
		try {
			const tracks = localVideoref.current.srcObject.getTracks();
			tracks.forEach(track => track.stop());
		} catch (e) { }
		window.location.href = "/";
	}, []);

	const connects = useCallback(() => {
		setConnect(false);
		updateMediaTracks(video, audio, selectedCamera);
		connectToSocketServer();
	}, [audio, selectedCamera, updateMediaTracks, video]);

	const room = useMemo(() => window.location.hash.replace('#/', ''), []);


	const isMobile = useMediaQuery('(max-width:600px)');

	return (
		<>
			<div>
				{login ? (
					<div>
						{connect ? (
							<>
								<SetupVideo
									localVideoref={localVideoref}
									video={video}
									handleSetupVideo={handleSetupVideo}
									connects={connects}
									login={login}
									videoAvailable={videoAvailable}
									selectedCamera={selectedCamera}
									cameraList={cameraList}
									setSelectedCamera={setSelectedCamera}
									handleVideo={handleVideo}
									switchSetupCamera={switchSetupCamera}

									handleAudio={handleAudio}
									audio={audio}
								/>
							</>
						) : (
							<>
								<div>
									<div style={{
										position: "fixed",
										bottom: 0,
										left: 0,
										width: "100%",
										display: "flex",
										flexDirection: isMobile ? "column" : "row", // Change direction based on mobile
										alignItems: "center",
										padding: "10px 20px",
										zIndex: "1000",
									}}>
										<div style={{ display: "flex", alignItems: "center", justifyContent: isMobile ? "center" : "flex-start", width: "100%" }}>
											<span style={{ color: "whitesmoke", fontSize: "14px" }}>{room}</span>
										</div>

										<div style={{
											display: "flex",
											justifyContent: isMobile ? "center" : "center", // Center buttons in mobile
											flexDirection: isMobile ? "column" : "row", // Stack buttons on mobile
											alignItems: "center",
											width: "100%"
										}}>
											{/* {username === "ocr" && (
												<IconButton style={{ color: "white", margin: isMobile ? "5px 0" : "0 10px" }} onClick={handleOcr}>
													<CenterFocusWeakIcon />
												</IconButton>
											)} */}
											

											<IconButton style={{ color: "white", margin: isMobile ? "5px 0" : "0 10px" }} onClick={handleOcr}>
												<CenterFocusWeakIcon />
											</IconButton>

											<div style={{ display: "flex", alignItems: "center" }}>
												<IconButton style={{ color: "white", margin: isMobile ? "5px 0" : "0 10px" }} onClick={handleAudio}>
													{audio ? <MicIcon /> : <MicOffIcon />}
												</IconButton>

												<IconButton style={{ color: "white", margin: isMobile ? "5px 0" : "0 10px" }} onClick={handleVideo}>
													{video ? <VideocamIcon /> : <VideocamOffIcon />}
												</IconButton>

												<IconButton style={{ color: "white", margin: isMobile ? "5px 0" : "0 10px" }} onClick={() => { showPose() }}>
													<VisibilityIcon />
												</IconButton>

												{/* share posenet buttn */}


												{username === "admin" && (
													<>
														<IconButton style={{ color: "white", margin: isMobile ? "5px 0" : "0 10px" }} onClick={() => {
															startRecording(streams, mediaRecorder, recordedBlobs);
														}}>
															<PlayIcon />
														</IconButton>

														<IconButton style={{ color: "white", margin: isMobile ? "5px 0" : "0 10px" }} onClick={() => {
															stopRecording(mediaRecorder, recordedBlobs);
														}}>
															<StopIcon />
														</IconButton>

														<IconButton style={{ color: "white", margin: isMobile ? "5px 0" : "0 10px" }} onClick={() => {
															download(recordedBlobs, streams);
														}}>
															<DownloadIcon />
														</IconButton>
													</>
												)}

												<IconButton style={{ color: "#f44336", margin: isMobile ? "5px 0" : "0 10px" }} onClick={handleEndCall}>
													<CallEndIcon />
												</IconButton>
											</div>
										</div>

										<div style={{
											display: "flex",
											justifyContent: "flex-end",
											alignItems: "center",
											width: "100%",
										}}>
											{selectedCamera && (
												<select
													value={selectedCamera}
													disabled={!video}
													onChange={(e) => {
														const newCameraId = e.target.value;
														switchCamera({ deviceId: newCameraId, localVideoref })
															.then(({ selectedCamera }) => {
																setSelectedCamera(selectedCamera);
																updateMediaTracks(true, audio, selectedCamera);
																console.log("Media tracks updated with new camera");
															})
															.catch((err) => console.log('Error during camera switch:', err));
													}}
													style={{
														color: "black",
														backgroundColor: "#424242",
														border: "none",
														padding: "5px 10px",
														borderRadius: "5px",
														cursor: "pointer",
														marginTop: isMobile ? "10px" : "0", // Add margin for mobile view
													}}
												>
													{cameraList.map((camera) => (
														<option key={camera.deviceId} value={camera.deviceId}>
															{camera.label}
														</option>
													))}
												</select>
											)}
										</div>
									</div>
									{isPopupOpen && (
										<Popup
											open={isPopupOpen}
											onClose={() => setIsPopupOpen(false)}
											position="right center"
											modal
											contentStyle={{
												maxWidth: '90%',
												width: 'auto',
												maxHeight: '80%',
												overflow: 'auto',
												padding: '20px',
												backgroundColor: '#202124',
												borderRadius: '10px',
												color: 'white'
											}}
										>
											<VitalsChart socket={socket} room={room} username={username} />
										</Popup>
									)}
									<div className="container">
										<Row id="main" className="flex-container"
											style={{
												margin: 0,
												padding: 0,
											}}>
											<div className='localVideoWrapper'
												style={{
													display: "flex",
													flexDirection: "column",
													justifyContent: "flex-start",
													alignItems: "flex-start",
													position: "relative",
													zIndex: "1",
													borderStyle: "solid",
													borderColor: "white",
													borderRadius: "15px",
													borderWidth: "2px",
												}}
											>
												<div
													className='localVideoDisplay'
													style={{
														position: "absolute",
														top: "0px",
														left: "0px",
														zIndex: "2",
														padding: "10px",
														backgroundColor: "rgba(0, 0, 0, 0.5)",
														color: "white",
														fontWeight: "bold",
														fontSize: "12px",
														borderTopLeftRadius: "15px",
														borderBottomRightRadius: "15px",
														width: "auto",
														whiteSpace: "nowrap"
													}}
												>
													{username.charAt(0).toUpperCase() + username.slice(1)}
												</div>
												<video
													id="my-video"
													className="my-video"
													ref={localVideoref}
													autoPlay
													muted
													style={{
														objectFit: "fill",
														width: "100%",
														height: "100%",
													}}
												></video>
												<canvas
													ref={canvasRef}
													style={{
														position: "absolute",
														top: 0,
														left: 0,
														width: "100%",
														height: "100%"
													}}
												></canvas>
											</div>
										</Row>
									</div>
								</div>
							</>
						)}
					</div>
				) : (
					<div className="container2">
						{(
							// console.log("Redirecting to Home")
							//redirect to home
							window.location.href = "/"

						)}
					</div>
				)}
			</div>
		</>
	);
};

export default VideoFuc;