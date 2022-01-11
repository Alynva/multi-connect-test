/**
 * @typedef ConnectionEvents
 * @property {(e: "statechange", listener: (state: RTCPeerConnectionState) => void) => void} addEventListener
 */

async function createOffer() {
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
	const peerConnection = new RTCPeerConnection(rtcConfiguration)
	peerConnection.onicecandidate = e => e.candidate == null && resolveLastICECandidate()
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
		get offerText() { return toText(offer) },
		setAnswer: peerConnection.setRemoteDescription.bind(peerConnection),
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
		get send() { return dataChannel.send.bind(dataChannel) },
		get state() { return dataChannel.readyState },
	}
}

function toText(obj) {
	return JSON.stringify(obj)
		.replace(/\\r\\n/g, "\r\n")
}