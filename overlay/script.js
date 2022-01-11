async function createOffer() {
	let resolveLastICECandidate
	const lastICECandidatePromise = new Promise(r => resolveLastICECandidate = r)

	const peerConnection = createPeerConnection(resolveLastICECandidate)

	const defaultDataChannel = createDataChannel('default')

	const firstOffer = await peerConnection.createOffer()
	await peerConnection.setLocalDescription(firstOffer)

	await lastICECandidatePromise
	const offer = peerConnection.localDescription

	return {
		offer,
		setAnswer: peerConnection.setRemoteDescription,
		createDataChannel: createDataChannel.bind(this, peerConnection),
		defaultDataChannel,
	}
}

/**
 * @param {RTCPeerConnection} peerConnection 
 * @param {tring} name 
 * @param {(this: RTCDataChannel, ev: Event) => any} onopen 
 * @param {(this: RTCDataChannel, ev: MessageEvent<any>) => any} onmessage 
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
