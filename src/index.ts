type State = "empty" | "receiver" | "data";

// Multi Producer Single Consumer Channel
export class SimpleChannel<T> {
	receivers: ((t: T) => void)[];
	data: T[];
	_state: State;

	get state(): string {
		return this._state;
	}

	constructor() {
		this.receivers = [];
		this.data = [];
		this._state = "empty";
	}

	async receive(): Promise<T> {
		if(this._state === "data") {
			const data = this.data.shift() as T;
			if(this.data.length === 0) {
				this._state = "empty";
			}
			return Promise.resolve(data);
		} else {
			return new Promise((resolve) => {
				// executor runs before creating the Promise
				this.receivers.push(resolve);
				this._state = "receiver";
			});
		}
	}

	send(data: T): void {
		if(this._state !== "receiver") { // when no receiver
			this.data.push(data);
			this._state = "data";
		} else { // at least one receiver is available
			const receiver = this.receivers.shift() as (t: T) => void;
			receiver(data);
			if(this.receivers.length === 0) {
				this._state = "empty";
			}
		}
	}

	async *[Symbol.asyncIterator](): AsyncIterableIterator<T> {
		while(true) {
			yield await this.receive();
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

	receiver(): SimpleChannel<T> {
		const chan = new SimpleChannel<T>();
		this.chan.add(chan);
		return chan;
	}

	removeReceiver(chan: SimpleChannel<T>): void {
		this.chan.delete(chan);
	}
}
