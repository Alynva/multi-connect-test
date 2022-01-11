async function createOffer() {
	let resolveLastICECandidate
	const lastICECandidatePromise = new Promise(r => resolveLastICECandidate = r)

	const peerConnection = createPeerConnection(resolveLastICECandidate)

	function createDataChannel(name, onopen, onmessage) {
		const dataChannel = peerConnection.createDataChannel(name)
		dataChannel.onopen = onopen
		dataChannel.onmessage = onmessage

		return {
			send: dataChannel.send.bind(),
		}
	}

	const defaultDataChannel = createDataChannel('default')

	const firstOffer = await peerConnection.createOffer()
	await peerConnection.setLocalDescription(firstOffer)

	const offer = await lastICECandidatePromise

	return {
		offer,
		setAnswer: peerConnection.setRemoteDescription.bind(),
		createDataChannel,
		defaultDataChannel
	}
}

function lasticecandidate() {
	offer = peerConnection.localDescription
	console.log({offer})
}

function test() {
	const onopen = () => console.log('connected')
	const onmessage = message => console.log({ message })
	return createOffer(onopen, onmessage)
}