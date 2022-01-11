/**
 * @typedef ConnectionEvents
 * @property {(e: "statechange", listener: (state: RTCPeerConnectionState) => void) => void} addEventListener
 */

async function createOffer() {
	let resolveLastICECandidate
	const lastICECandidatePromise = new Promise(r => resolveLastICECandidate = r)

	/** @type {ConnectionEvents & EventTarget} */
	const events = new EventTarget()

	const peerConnection = createPeerConnection(resolveLastICECandidate)
	peerConnection.onconnectionstatechange = e => {
		events.dispatchEvent(new CustomEvent('statechange', { detail: e.target.connectionState }))
	}

	const defaultDataChannel = createDataChannel(peerConnection, 'default')

	const initialOffer = await peerConnection.createOffer()
	await peerConnection.setLocalDescription(initialOffer)

	await lastICECandidatePromise
	const offer = peerConnection.localDescription

	return Object.assign(events, {
		get offer() { return offer },
		setAnswer: peerConnection.setRemoteDescription,
		get defaultDataChannel() { return defaultDataChannel },
		createDataChannel: createDataChannel.bind(this, peerConnection),
	})
}

/**
 * @param {RTCPeerConnection} peerConnection 
 * @param {tring} name 
 * @param {(this: RTCDataChannel, ev: Event) => any} [onopen] 
 * @param {(this: RTCDataChannel, ev: MessageEvent<any>) => any} [onmessage] 
 */
function createDataChannel(peerConnection, name, onopen, onmessage) {
	const dataChannel = peerConnection.createDataChannel(name)
	dataChannel.onopen = onopen
	dataChannel.onmessage = onmessage

	return {
		send: dataChannel.send,
		get state() { return dataChannel.readyState },
	}
}
