import { MultiReceiverChannel, SimpleChannel, SimpleReceiver } from "./";

interface Observer<T> {
	notify: () => void;
	receiver: () => SimpleReceiver<T>;
	removeReceiver: (chan: SimpleReceiver<T>) => void;
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
			value: function(): SimpleReceiver<T> {
				return this.chan.receiver();
			}
		},
		removeReceiver: {
			value: function(r: SimpleReceiver<T>): void {
				(r as SimpleChannel<T>).close();
				this.chan.removeReceiver(r);
			}
		}
	});

	return t as Observable<T>;
};
