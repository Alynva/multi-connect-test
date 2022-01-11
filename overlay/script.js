let peerConnection
function createOffer() {
	peerConnection = createPeerConnection(lasticecandidate);
	dataChannel = peerConnection.createDataChannel('chat');
	dataChannel.onopen = datachannelopen;
	dataChannel.onmessage = datachannelmessage;
	createOfferPromise = peerConnection.createOffer();
	createOfferPromise.then(createOfferDone, createOfferFailed);
}

function createOfferDone(offer) {
	console.log('createOfferDone');
	setLocalPromise = peerConnection.setLocalDescription(offer);
	setLocalPromise.then(setLocalDone, setLocalFailed);
}

function createOfferFailed(reason) {
	console.log('createOfferFailed');
	console.log({reason});
}

function setLocalDone() {
	console.log('setLocalDone');
}

function setLocalFailed(reason) {
	console.log('setLocalFailed');
	console.log({reason});
}

function lasticecandidate() {
	offer = peerConnection.localDescription;
	console.log({offer})
}

function answerPasted(answer) {
	answer = JSON.parse(textelement.value);
	setRemotePromise = peerConnection.setRemoteDescription(answer);
	setRemotePromise.then(setRemoteDone, setRemoteFailed);
}

function setRemoteDone() {
	console.log('setRemoteDone');
}

function setRemoteFailed(reason) {
	console.log('setRemoteFailed');
	console.log({reason});
}
