/* ------------------------- Camera Methods ------------------------- */

export const switchCamera = async ({ deviceId, localVideoref }) => {
    if (localVideoref.current && localVideoref.current.srcObject) {
        const tracks = localVideoref.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
    }

    const constraints = {
        video: { deviceId: { exact: deviceId } }
    };

    console.log('Switching camera to:', deviceId);

    try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        console.log('Got stream with new camera:', stream);
        localVideoref.current.srcObject = stream;
        // window.localStream = stream;
        return ({ selectedCamera: deviceId });
    } catch (error) {
        console.log('Error switching camera:', error);
    }
};

export const switchSetupCamera = async ({ deviceId, localVideoref }) => {
    if (localVideoref.current && localVideoref.current.srcObject) {
        // Stop all tracks of the current stream
        const tracks = localVideoref.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
    }

    const constraints = {
        video: { deviceId: { exact: deviceId } }
    };

    console.log('Switching camera to:', deviceId);

    try {
        // Get a new stream with the selected camera
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        console.log('Got stream with new camera:', stream);
        
        // Assign the new stream to the video element
        localVideoref.current.srcObject = stream;
        
        // Return both the selected camera and the new stream
        return { selectedCamera: deviceId, stream };
    } catch (error) {
        console.error('Error switching camera:', error);
        
        // Return an error state for the caller to handle
        return { error, selectedCamera: null };
    }
};


// export const setupMic = async ({ localVideoref }) => {
//     const audio = await navigator.mediaDevices.getUserMedia({ audio: true });
//     localVideoref.current.srcObject = audio;
//     window.localStream = audio;
// }

export const populateCameraList = async () => {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        
        // Filter out only video input devices for cameras
        const cameras = devices.filter(device => device.kind === 'videoinput');

        // Filter out devices without permission
        const filteredCameras = cameras.filter(camera => {
            return camera.label && camera.deviceId;
        });

        // Get the deviceId of the first camera (if available) to set as the selectedCamera
        const selectedCamera = filteredCameras.length > 0 ? filteredCameras[0].deviceId : '';

        return { cameraList: filteredCameras, selectedCamera };
    } catch (error) {
        console.error('Error populating camera list:', error);
        return { cameraList: [], selectedCamera: '' }; // Return empty lists in case of error
    }
};


/* ------------------------- Media Methods ------------------------- */

export const getDislayMedia = ({ screen, getDislayMediaSuccess }) => {
    if (screen) {
        if (navigator.mediaDevices.getDisplayMedia) {
            navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
                .then(getDislayMediaSuccess)
                .then((stream) => { })
                .catch((e) => console.log(e))
        }
    }
}

export const getUserMediaSuccess = ({
    stream,
    setVideo,
    setAudio,
    connections,
    socket,
    socketId,
    localVideoref
}) => {
    console.log('Stream:', stream);
    try {
        window.localStream.getTracks().forEach(track => track.stop())
    } catch (e) { console.log(e) }

    window.localStream = stream
    localVideoref.current.srcObject = stream

    for (let id in connections) {
        if (id === socketId) continue

        connections[id].addStream(window.localStream)

        connections[id].createOffer()
            .then(description => {
                return connections[id].setLocalDescription(description);
            })
            .then(() => {
                socket.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }));
            })
            .catch(e => console.log(e));

    }

    stream.getTracks().forEach(track => track.onended = () => {
        setVideo(false)
        setAudio(false)
            , () => {
                try {
                    let tracks = localVideoref.current.srcObject.getTracks()
                    tracks.forEach(track => track.stop())
                } catch (e) { console.log(e) }

                let blackSilence = (...args) => new MediaStream([black(...args), silence()])
                window.localStream = blackSilence()
                localVideoref.current.srcObject = window.localStream

                for (let id in connections) {
                    connections[id].addStream(window.localStream)

                    connections[id].createOffer().then((description) => {
                        connections[id].setLocalDescription(description)
                            .then(() => {
                                socket.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }))
                            })
                            .catch(e => console.log(e))
                    })
                }
            }
    })
}

/* ------------------------- Audio / Video Methods ------------------------- */

export const silence = () => {
    let ctx = new AudioContext()
    let oscillator = ctx.createOscillator()
    let dst = oscillator.connect(ctx.createMediaStreamDestination())
    oscillator.start()
    ctx.resume()
    console.log(dst.stream.getAudioTracks())
    return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false })
}
	
export const black = ({ width = 640, height = 480 } = {}) => {
    let canvas = Object.assign(document.createElement("canvas"), { width, height })
    canvas.getContext('2d').fillRect(0, 0, width, height)
    let stream = canvas.captureStream()
    console.log(stream.getVideoTracks())
    return Object.assign(stream.getVideoTracks()[0], { enabled: false })
}

