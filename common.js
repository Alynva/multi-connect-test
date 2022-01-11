
function chatlog(msg) {
	const textContent = '[' + new Date() + '] ' + msg;
	console.log({textContent})
}

/** @type {RTCConfiguration} */
const rtcConfiguration = {
	iceServers: [{
		urls: "stun:stun.stunprotocol.org"
	}]
};

function createPeerConnection(lasticecandidate) {
	const peerConnection = new RTCPeerConnection(rtcConfiguration);

	peerConnection.onicecandidate = handleicecandidate(lasticecandidate);
	peerConnection.onconnectionstatechange = handleconnectionstatechange;
	peerConnection.oniceconnectionstatechange = handleiceconnectionstatechange;
	return peerConnection;
}

function handleicecandidate(lasticecandidate) {
	return function (event) {
		if (event.candidate != null) {
			console.log('new ice candidate');
		} else {
			console.log('all ice candidates');
			lasticecandidate();
		}
	}
}

function handleconnectionstatechange(event) {
	console.log('handleconnectionstatechange');
	console.log(event);
}

function handleiceconnectionstatechange(event) {
	console.log('ice connection state: ' + event.target.iceConnectionState);
}
