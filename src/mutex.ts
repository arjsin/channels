type ResolveList = ((guard: Guard) => void)[];

export class Mutex {
	private resolveList: ResolveList;
	private locked: [boolean];

	constructor() {
		this.resolveList = [];
		this.locked = [false];
	}

	acquire(): Promise<Guard> {
		return new Promise((resolve) => {
			if (!this.locked[0]) {
				this.locked[0] = true;
				// eslint-disable-next-line @typescript-eslint/no-use-before-define
				const guard = new Guard(this.resolveList, this.locked);
				resolve(guard);
			} else {
				this.resolveList.push(resolve);
			}
		});
	}
}

export class Guard {
	private resolveList: ResolveList;
	private locked: [boolean];
	constructor(lockList: ResolveList, locked: [boolean]) {
		this.resolveList = lockList;
		this.locked = locked;
	}

	release(): void {
		const resolve = this.resolveList.shift();
		if (resolve) {
			resolve(this);
		} else {
			this.locked[0] = false;
		}
	}
}
