//currently rusty3699email
const peerConnectionConfig = {
	iceServers: [
		{
		  urls: "stun:stun.relay.metered.ca:80",
		},
		{
		  urls: "turn:standard.relay.metered.ca:80",
		  username: "f469b445f887dd27db5a11a3",
		  credential: "6+hinRoy5jHq6tD6",
		},
		{
		  urls: "turn:standard.relay.metered.ca:80?transport=tcp",
		  username: "f469b445f887dd27db5a11a3",
		  credential: "6+hinRoy5jHq6tD6",
		},
		{
		  urls: "turn:standard.relay.metered.ca:443",
		  username: "f469b445f887dd27db5a11a3",
		  credential: "6+hinRoy5jHq6tD6",
		},
		{
		  urls: "turn:standard.relay.metered.ca:443?transport=tcp",
		  username: "f469b445f887dd27db5a11a3",
		  credential: "6+hinRoy5jHq6tD6",
		},
	],
}

export default peerConnectionConfig;