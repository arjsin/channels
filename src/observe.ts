import { MultiReceiverChannel, SimpleChannel } from "./";

interface Observer<T> {
	notify: () => void;
	receiver: () => SimpleChannel<T>;
	removeReceiver: (chan: SimpleChannel<T>) => void;
}

export type Observable<T> = T & Observer<T>;

export const observe = <T extends {}>(t: T): Observable<T> => {
	Object.defineProperties(t, {
		chan: {
			value: new MultiReceiverChannel(),
		},
		notify: {
			value: function(): void {
				this.chan.send(this);
			}
		},
		receiver: {
			value: function(): SimpleChannel<T> {
				return this.chan.receiver();
			}
		},
		removeReceiver: {
			value: function(r: SimpleChannel<T>): void {
				this.chan.close();
				this.chan.removeReceiver(r);
			}
		}
	});

	return t as Observable<T>;
};
