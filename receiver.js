async function receiveOffer(offer) {
	let resolveLastICECandidate
	const lastICECandidatePromise = new Promise(r => resolveLastICECandidate = r)

	/** @type {ConnectionEvents & EventTarget} */
	const events = new EventTarget()

	/** @type {RTCConfiguration} */
	const rtcConfiguration = {
		iceServers: [{
			urls: "stun:stun.stunprotocol.org"
		}]
	};
	const peerConnection = new RTCPeerConnection(rtcConfiguration);
	peerConnection.onicecandidate = e => e.candidate == null && resolveLastICECandidate()
	peerConnection.onconnectionstatechange = e => {
		events.dispatchEvent(new CustomEvent('statechange', { detail: e.target.connectionState }))
	}

	/** @type {RTCDataChannel} */
	let defaultDataChannel
	peerConnection.ondatachannel = event => {
		if (defaultDataChannel) {
			defaultDataChannel.onopen = null
			defaultDataChannel.onmessage = null
		}

		defaultDataChannel = event.channel;
	};

	await peerConnection.setRemoteDescription(offer)
	const initialAnswer = await peerConnection.createAnswer()
	await peerConnection.setLocalDescription(initialAnswer)

	await lastICECandidatePromise
	const answer = peerConnection.localDescription

	return Object.assign(events, {
		get answer() { return answer },
		get answerText() { return toText(answer) },
		get setDataChannelListener() {
			return ({ onopen, onmessage }) => {
				defaultDataChannel.onopen = onopen;
				defaultDataChannel.onmessage = onmessage;

				return {
					get send() { return defaultDataChannel.send.bind(defaultDataChannel) },
					get state() { return defaultDataChannel.readyState }
				}
			}
		},
	})
}

function toText(obj) {
	return JSON.stringify(obj)
		.replace(/\\r\\n/g, "\r\n")
}