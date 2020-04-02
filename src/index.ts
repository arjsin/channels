type State = "empty" | "receiver" | "data" | "close";

// Multi Producer Single Consumer Channel
export class SimpleChannel<T> {
	receivers: [((t: T) => void), (() => void)][];
	data: (T|null)[];
	_state: State;

	get state(): string {
		return this._state;
	}

	constructor() {
		this.receivers = [];
		this.data = [];
		this._state = "empty";
	}

	receive(): Promise<T> {
		if(this._state === "close") {
			return Promise.reject();
		} else if(this._state === "data") {
			const data = this.data.shift() as T;
			if(data === null) {
				this._state = "close";
				return Promise.reject();
			}
			if(this.data.length === 0) {
				this._state = "empty";
			}
			return Promise.resolve(data);
		} else {
			return new Promise((resolve, reject) => {
				// executor runs before creating the Promise
				this.receivers.push([resolve, reject]);
				this._state = "receiver";
			});
		}
	}

	send(data: T): void {
		if(this._state === "close") {
			throw "sending on closed channel";
		} else if(this._state !== "receiver") { // when no receiver
			this.data.push(data);
			this._state = "data";
		} else { // at least one receiver is available
			const [resolve] = this.receivers.shift() as [(t: T) => void, () => void];
			resolve(data);
			if(this.receivers.length === 0) {
				this._state = "empty";
			}
		}
	}

	close(): void {
		if(this._state !== "receiver") { // when no receiver
			this.data.push(null);
			this._state = "data";
		} else { // at least one receiver is available
			const [, reject] = this.receivers.shift() as [(t: T) => void, () => void];
			reject();
			if(this.receivers.length === 0) {
				this._state = "close";
			}
		}

	}

	async *[Symbol.asyncIterator](): AsyncIterableIterator<T> {
		try {
			while(true) {
				const val = await this.receive();
				yield val;
			}
		} catch {
			// assume we're done with the channel
		}
	}
}

// Multi Producer Multi Consumer Channel
export class MultiReceiverChannel<T> {
	private chan: Set<SimpleChannel<T>>;
	constructor() {
		this.chan = new Set();
	}

	send(data: T): void {
		for(const chan of this.chan) {
			chan.send(data);
		}
	}

	close(): void {
		for(const chan of this.chan) {
			chan.close();
		}
	}

	receiver(): SimpleChannel<T> {
		const chan = new SimpleChannel<T>();
		this.chan.add(chan);
		return chan;
	}

	removeReceiver(chan: SimpleChannel<T>): void {
		this.chan.delete(chan);
	}
}
