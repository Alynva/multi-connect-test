

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

	#initialized = false

	constructor() {
		super()

		this.#peerConnection = new RTCPeerConnection(this.#config)
		this.#peerConnection.onicecandidate = this.#onICECandidateListener.bind(this)
		this.#peerConnection.onconnectionstatechange = this.#stateChange.bind(this)
	}

	/**
	 * @param {"sender" | "receiver"} type
	 * @param {RTCSessionDescriptionInit} [offer] Only used when `type` is "receiver"
	 */
	async init(type, offer) {
		if (this.#initialized) throw new Error('This instance was already initilized.')

		if (type === 'sender') await this.#senderInit()
		else if (type === 'receiver') await this.#receiverInit(offer)
		else throw new Error('Invalid type. It must be "sender" or "receiver".')

		await this.#lastICECandidatePromise

		const localDesc = this.#peerConnection.localDescription

		const descName = { 'sender': 'offer', 'receiver': 'answer' }[type]

		Object.defineProperties(this, {
			/** SDP offer/answer */
			[descName]: { get: () => localDesc },
			/** SDP offer/answer in string format */
			[descName + "Text"]: { get: () => this.#toText(localDesc) },

			send: { get: () => this.#defaultDataChannel.send.bind(this.#defaultDataChannel) },
			state: { get: () => this.#defaultDataChannel.readyState }
		})

		if (type === 'sender') Object.defineProperty(this, 'setAnswer', {
			get: () => this.#peerConnection.setRemoteDescription.bind(this.#peerConnection),
		})

		this.#initialized = true
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
		this.#defaultDataChannel.onopen = this.#onopen.bind(this)
		this.#defaultDataChannel.onmessage = this.#onmessage.bind(this)

		const initialOffer = await this.#peerConnection.createOffer()
		await this.#peerConnection.setLocalDescription(initialOffer)
	}

	/** @param {RTCSessionDescriptionInit} offer */
	async #receiverInit(offer) {
		/** @type {RTCDataChannel} */
		this.#defaultDataChannel = {}

		this.#peerConnection.ondatachannel = this.#changeDataChannel.bind(this)

		await this.#peerConnection.setRemoteDescription(offer)
		const initialAnswer = await this.#peerConnection.createAnswer()
		await this.#peerConnection.setLocalDescription(initialAnswer)
	}

	/** @param {RTCDataChannelEvent} event */
	#changeDataChannel(event) {
		this.#defaultDataChannel = event.channel;
		this.#defaultDataChannel.onopen = this.#onopen.bind(this)
		this.#defaultDataChannel.onmessage = this.#onmessage.bind(this)
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
