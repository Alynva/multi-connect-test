

class Connection extends EventTarget {
	/** @type {RTCConfiguration} */
	#config = {
		iceServers: [{
			urls: "stun:stun.stunprotocol.org"
		}]
	}

	/** @type {RTCPeerConnection} */
	#peerConnection

	/** @type {() => void} */
	#resolveLastICECandidate
	/** @type {Promise<void>} */
	#lastICECandidatePromise = new Promise(r => this.#resolveLastICECandidate = r)

	/** @type {RTCDataChannel} */
	#defaultDataChannel = {}

	constructor() {
		super()

		this.#peerConnection = new RTCPeerConnection(this.#config)
		this.#peerConnection.onicecandidate = this.#onICECandidateListener
		this.#peerConnection.onconnectionstatechange = this.#stateChange
	}

	/**
	 * @param {"sender" | "receiver"} type
	 * @param {RTCSessionDescriptionInit} [offer] Only used when `type` is "receiver"
	 */
	async init(type, offer) {
		if (type === 'sender') await this.#senderInit()
		else if (type === 'receiver') await this.#receiverInit(offer)
		else throw new Error('Invalid type. It must be "sender" or "receiver".')

		await this.#lastICECandidatePromise

		const localDesc = this.#peerConnection.localDescription

		const descName = { 'sender': 'offer', 'receiver': 'answer' }[type]

		return {
			get [descName]() { return localDesc },
			get [descName + "Text"]() { return toText(localDesc) },
			get setDataListener() {
				return ({ onopen, onmessage }) => {
					this.#defaultDataChannel.onopen = onopen;
					this.#defaultDataChannel.onmessage = onmessage;

					return {
						get send() { return this.#defaultDataChannel.send.bind(this.#defaultDataChannel) },
						get state() { return this.#defaultDataChannel.readyState }
					}
				}
			}
		}
	}

	/** @param {RTCPeerConnectionIceEvent} e */
	#onICECandidateListener(e) {
		if (e.candidate == null) this.#resolveLastICECandidate()
	}

	/** @param {Event} e */
	#stateChange(e) {
		const event = new CustomEvent('statechange', {
			detail: e.target.connectionState,
		})
		this.dispatchEvent(event)
	}

	async #senderInit() {
		this.#defaultDataChannel = this.#peerConnection.createDataChannel('default')
		this.#defaultDataChannel.onopen = this.#onopen
		this.#defaultDataChannel.onmessage = this.#onmessage

		const initialOffer = await this.#peerConnection.createOffer()
		await this.#peerConnection.setLocalDescription(initialOffer)
	}

	/** @param {RTCSessionDescriptionInit} offer */
	async #receiverInit(offer) {
		/** @type {RTCDataChannel} */
		this.#defaultDataChannel = {}

		this.#peerConnection.ondatachannel = this.#changeDataChannel

		await this.#peerConnection.setRemoteDescription(offer)
		const initialAnswer = await this.#peerConnection.createAnswer()
		await this.#peerConnection.setLocalDescription(initialAnswer)
	}

	/** @param {RTCDataChannelEvent} event */
	#changeDataChannel(event) {
		this.#defaultDataChannel = event.channel;
		this.#defaultDataChannel.onopen = this.#onopen
		this.#defaultDataChannel.onmessage = this.#onmessage
	}

	/** @param {Event} evt */
	#onopen(evt) {
		const event = new CustomEvent("open")
		this.dispatchEvent(event)
	}

	/** @param {MessageEvent<String>} evt */
	#onmessage(evt) {
		const event = new CustomEvent("message", { detail: evt.data })
		this.dispatchEvent(event)
	}

	#toText(obj) {
		return JSON.stringify(obj)
			.replace(/\\r\\n/g, "\r\n")
	}
}
