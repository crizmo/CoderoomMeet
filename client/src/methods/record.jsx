export function setStream(canvasArray, streams) {
	for (let i = 1; i < canvasArray.length; i++) {

		console.log(canvasArray[i].username, canvasArray[i].socketId, canvasArray[i].clstream, canvasArray[i].track);

		for (let j = 0; j < streams.length; j++) {
			if (streams[j].socketId === canvasArray[i].socketId) {
				streams.splice(j, 1);
				break;
			}
		}

		streams.push({
			username: canvasArray[i].username,
			socketId: canvasArray[i].socketId,
			stream: canvasArray[i].clstream
		});
		console.log('Set stream for: ', canvasArray[i].username);
	}

	console.log("streams", streams);
	console.log("canvasArray", canvasArray);
}

export function handleSourceOpen(event, streams, sourceBuffer, mediaSource) {
	sourceBuffer = [];
	for (let i = 1; i < streams.length; i++) {
		sourceBuffer.push(mediaSource.addSourceBuffer('video/webm; codecs="vp9"'));
		console.log('Source buffer: ', sourceBuffer[i]);
	}
}

export function handleDataAvailable(event, socketId, username, streams, recordedBlobs) {
	if (event.data && event.data.size > 0) {
		for (let i = 1; i < streams.length; i++) {
			if (streams[i].socketId === socketId) {
				recordedBlobs[i].push(event.data);
				console.log('Recorded Blobs: ', recordedBlobs[i]);
				break;
			}
		}
		console.log("For socketId: ", socketId, "with username: ", username, "recordedBlobs", recordedBlobs);
	} else {
		console.log('No data available');
	}
}

export function startRecording(streams, mediaRecorder, recordedBlobs) {
    const options = {
        mimeType: 'video/webm; codecs=vp9',
        videoBitsPerSecond: 50000000, // Increase the bitrate for higher quality
    };
    for (let i = 1; i < streams.length; i++) {
        const username = streams[i].username;
        const socketId = streams[i].socketId;
        const [track] = streams[i].stream.getVideoTracks();

        console.log("Recording track for:", username, track);

        if (!track) {
            console.error('No video track found for:', username);
            continue; // Skip this iteration if no track is available
        }

        if (mediaRecorder[i] && mediaRecorder[i].state !== 'inactive') {
            mediaRecorder[i].stop();
        }

        recordedBlobs[i] = []; // Initialize the recorded blobs for this user
        try {
            mediaRecorder[i] = new MediaRecorder(streams[i].stream, options);
            mediaRecorder[i].onstop = handleStop;
            mediaRecorder[i].ondataavailable = (event) => {
                if (event.data.size > 0) {
                    recordedBlobs[i].push(event.data);
                    console.log('Recorded Blobs: ', recordedBlobs[i]);
                }
            };
            mediaRecorder[i].start(100); // collect 100ms of data
            console.log('MediaRecorder started for', username);
        } catch (e) {
            console.error('Exception while creating MediaRecorder:', e);
        }
    }
}


export function handleStop(event) {
	console.log('Recorder stopped: ', event);
}

export function stopRecording(mediaRecorder, recordedBlobs) {
	const stopPromises = [];
	for (let i = 0; i < mediaRecorder.length; i++) {
		if (mediaRecorder[i]) {
			stopPromises.push(new Promise((resolve) => {
				mediaRecorder[i].onstop = () => {
					console.log('Recorded Blobs: ', recordedBlobs[i]);
					resolve();
				};
				mediaRecorder[i].stop();
			}));
		}
	}
	// Wait for all recordings to finish before proceeding
	Promise.all(stopPromises).then(() => {
		console.log('All recordings stopped');
	});
}

export function download(recordedBlobs, streams) {
	console.log("Starting download for all clients");
	for (let i = 1; i < recordedBlobs.length; i++) {
		if (recordedBlobs[i].length > 0) {
			const blob = new Blob(recordedBlobs[i], { type: 'video/webm' });
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.style.display = 'none';
			a.href = url;
			a.download = `${streams[i].username}.webm`;
			document.body.appendChild(a);
			a.click();
			setTimeout(() => {
				document.body.removeChild(a);
				window.URL.revokeObjectURL(url);
			}, 100);
		} else {
			console.warn(`No recorded blobs for ${streams[i].username}`);
		}
	}
	console.log("Downloaded for all clients");
}
