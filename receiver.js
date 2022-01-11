async function receiveOffer(offer) {
	let resolveLastICECandidate
	const lastICECandidatePromise = new Promise(r => resolveLastICECandidate = r)

	/** @type {ConnectionEvents & EventTarget} */
	const events = new EventTarget()

	const peerConnection = createPeerConnection(resolveLastICECandidate);
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
		set defaultDataChannelListener(onopen, onmessage) {
			defaultDataChannel.onopen = onopen;
			defaultDataChannel.onmessage = onmessage;

			return {
				send: defaultDataChannel.send,
				get state() { return defaultDataChannel.readyState }
			}
		},
	})
}

