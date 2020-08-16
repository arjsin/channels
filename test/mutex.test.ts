import { Mutex } from "../src";

const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

test("mutex blocking", async (done) => {
	const mutex = new Mutex;
	let count = 0;
	const task1 = async (): Promise<void> => {
		const lock = await mutex.acquire();
		await delay(10);
		expect(count).toBe(0);
		count++;
		lock.release();
	};
	const task2 = async (): Promise<void> => {
		await delay(2);
		const lock = await mutex.acquire();
		await delay(5);
		expect(count).toBe(1);
		count++;
		lock.release();
	};
	const task3 = async (): Promise<void> => {
		await delay(4);
		const lock = await mutex.acquire();
		await delay(2);
		expect(count).toBe(2);
		count++;
		lock.release();
	};
	await Promise.all([task3(), task2(), task1()]);
	expect(count).toBe(3);
	done();
});
