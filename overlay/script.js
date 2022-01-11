async function createOffer() {
	let resolveLastICECandidate
	const lastICECandidatePromise = new Promise(r => resolveLastICECandidate = r)

	const events = new EventTarget()

	const peerConnection = createPeerConnection(resolveLastICECandidate)
	peerConnection.onconnectionstatechange = (ev) => {
		events.dispatchEvent(new CustomEvent('statechange', { detail: ev }))
	}

	const defaultDataChannel = createDataChannel(peerConnection, 'default')

	const firstOffer = await peerConnection.createOffer()
	await peerConnection.setLocalDescription(firstOffer)

	await lastICECandidatePromise
	const offer = peerConnection.localDescription

	return Object.assign(events, {
		offer,
		setAnswer: peerConnection.setRemoteDescription,
		createDataChannel: createDataChannel.bind(this, peerConnection),
		defaultDataChannel,
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
		state: dataChannel.readyState,
	}
}
