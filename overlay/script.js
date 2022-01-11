async function createOffer() {
	const peerConnection = createPeerConnection(lasticecandidate)

	const offer = await peerConnection.createOffer()
	await peerConnection.setLocalDescription(offer)

	function createDataChannel(name, onopen, onmessage) {
		const dataChannel = peerConnection.createDataChannel(name)
		dataChannel.onopen = onopen
		dataChannel.onmessage = onmessage

		return {
			send: dataChannel.send.bind(),
		}
	}

	return {
		offer,
		setAnswer: peerConnection.setRemoteDescription.bind(),
		createDataChannel
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