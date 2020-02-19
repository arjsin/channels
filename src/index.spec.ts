import { Channel } from "./index";

test("receive and then send", async () => {
	const ch = new Channel();
	const p1 = ch.receive().then((val) => expect(val).toBe(2));
	const p2 = ch.receive().then((val) => expect(val).toBe(4));
	expect(ch.state).toBe("receiver");
	ch.send(2);
	ch.send(4);
	await Promise.all([p1, p2]);
	expect(ch.state).toBe("empty");
});

test("send and then receive", async () => {
	const ch = new Channel();
	ch.send(2);
	expect(ch.state).toBe("data");
	await ch.receive().then((val) => expect(val).toBe(2));
	expect(ch.state).toBe("empty");
});

test("send and then receive in async iterator", async () => {
	const ch = new Channel();
	ch.send(2);
	ch.send(4);
	let iter = 0;
	for await(const data of ch) {
		if(iter === 0) {
			expect(data).toBe(2);
		} else {
			expect(data).toBe(4);
			break;
		}
		iter++;
	}
	expect(ch.state).toBe("empty");
});
