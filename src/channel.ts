export enum State {
	empty = "empty",
	receiver = "receiver",
	data = "data",
	close = "close"
}

// Multi Producer Single Consumer Channel
export class SimpleChannel<T> {
	private receivers: [((t: T) => void), (() => void)][];
	private data: (T|null)[];
	private _state: State;

	get state(): State {
		return this._state;
	}

	constructor() {
		this.receivers = [];
		this.data = [];
		this._state = State.empty;
	}

	receive(): Promise<T> {
		if(this._state === State.close) {
			return Promise.reject();
		} else if(this._state === State.data) {
			const data = this.data.shift() as T;
			if(data === null) {
				this._state = State.close;
				return Promise.reject();
			}
			if(this.data.length === 0) {
				this._state = State.empty;
			}
			return Promise.resolve(data);
		} else {
			return new Promise((resolve, reject) => {
				// executor runs before creating the Promise
				this.receivers.push([resolve, reject]);
				this._state = State.receiver;
			});
		}
	}

	send(data: T): void {
		if(this._state === State.close) {
			throw "sending on closed channel";
		} else if(this._state !== State.receiver) { // when no receiver
			this.data.push(data);
			this._state = State.data;
		} else { // at least one receiver is available
			const [resolve] = this.receivers.shift() as [(t: T) => void, () => void];
			resolve(data);
			if(this.receivers.length === 0) {
				this._state = State.empty;
			}
		}
	}

	close(): void {
		if(this._state === State.close) { // when already closed
			return;
		} else if(this._state !== State.receiver) { // when no receiver
			this.data.push(null);
			this._state = State.data;
		} else { // at least one receiver is available
			const [, reject] = this.receivers.shift() as [(t: T) => void, () => void];
			reject();
			if(this.receivers.length === 0) {
				this._state = State.close;
			}
		}

	}

	async *[Symbol.asyncIterator](): AsyncIterableIterator<T> {
		try {
			while(true) {
				yield await this.receive();
			}
		} catch {
			// assume we're done with the channel
		}
	}
}

export interface SimpleReceiver<T> {
	receive: () => Promise<T>;
	[Symbol.asyncIterator]: () => AsyncIterableIterator<T>;
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

	receiver(): SimpleReceiver<T> {
		const chan = new SimpleChannel<T>();
		this.chan.add(chan);
		return chan;
	}

	removeReceiver(chan: SimpleReceiver<T>): void {
		this.chan.delete(chan as SimpleChannel<T>);
	}
}
