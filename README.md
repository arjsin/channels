# channel-ts
>Minimal Async/Await Channels in Typescript

[![Node.js CI](https://img.shields.io/github/workflow/status/arjsin/channels/Node.js%20CI?style=flat-square)](https://github.com/arjsin/channels/actions?query=workflow%3A%22Node.js+CI%22)
[![License](https://img.shields.io/:license-mit-blue.svg?style=flat-square)](/LICENSE)
[![NPM](https://img.shields.io/npm/v/channel-ts?style=flat-square)](https://www.npmjs.com/package/channel-ts)

## Features
- Simple API with JavaScript's async iterators for receivers
- Broadcast on MultiReceiverChannel
- Observe on object and notify manually
- Mutex

## Examples
### Multi producer and single consumer
This channel allows multiple sender to send data to a single receiver.
The messages starts buffering as soon as the channel is created.
No messages are lost.

```typescript
import { SimpleChannel } from "channel-ts";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// printer waits for the messages on the channel until it closes
async function printer(chan: SimpleChannel<string>) {
    for await(const data of chan) { // use async iterator to receive data
        console.log(`Received: ${data}`);
    }
    console.log("Closed");
}

// sender sends some messages to the channel
async function sender(id: number, chan: SimpleChannel<string>) {
    await delay(id*2000);
    chan.send(`hello from ${id}`); // sends data, boundless channels don't block
    await delay(2800);
    chan.send(`bye from ${id}`); // sends some data again
}

async function main() {
    const chan = new SimpleChannel<string>(); // creates a new simple channel
    const p1 = printer(chan); // uses the channel to print the received data
    const p2 = [0, 1, 2, 3, 4].map(async i => sender(i, chan)); // creates and spawns senders

    await Promise.all(p2); // waits for the sender
    chan.close(); // closes the channel on the server end
    await p1; // waits for the channel to close on the receiver end too
}

main();
```

### Output
[![Simple Output](../assets/simple_output.svg?raw=true&sanitize=true)](#)

## Multi producer and multi consumer
This channel allows multiple senders to send data to a multiple receivers.
This channel needs explicit creation of receiver.
All the messages are broadcast and buffered for receivers to receive.
So messages are lost for the duration when the receiver was not created.
Creation of receiver is similar to subscription in publisher-subscriber pattern.

```typescript
import { MultiReceiverChannel, SimpleReceiver } from "channel-ts";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// printer waits for the messages on the channel until it closes
async function printer(id: string, chan: SimpleReceiver<string>) {
    for await(const data of chan) { // use async iterator to receive data
        console.log(`Printer ${id} received: ${data}`);
    }
    console.log(`Printer ${id} closed`);
}

// sender sends some messages to the channel
async function sender(id: number, chan: MultiReceiverChannel<string>) {
    await delay(id*2000);
    chan.send(`hello from ${id}`); // sends data, boundless channels don't block
    await delay(2800);
    chan.send(`bye from ${id}`); // sends some data again
}

async function main() {
    const chan = new MultiReceiverChannel<string>(); // creates a new simple channel
    const r1 = chan.receiver();
    const p1 = printer("A", r1); // uses the channel to print the received data
    const r2 = chan.receiver();
    const p2 = printer("B", r2); // uses the channel to print the received data
    const p3 = [0, 1, 2, 3, 4].map(async i => sender(i, chan)); // create and spawn senders

    await Promise.all(p3); // wait for sender
    chan.removeReceiver(r1); // close channel
    chan.removeReceiver(r2); // close channel
    chan.close();
    await Promise.all([p1, p2]); // wait for channel to close on receiver end
}

main();
```

### Output
[![Simple Output](../assets/multi_output.svg?raw=true&sanitize=true)](#)

## Observe
Observe is a function which creates Observable type of JavaScript objects.
The object is mutated and `notify()` is called to send data to receiver.
This technique is similar to observer pattern.

Please note that the object is shared between the sender and the receiver, so the receiver while reading the received message might run into a risk of observing further changes made by the sender.
To guarantee that a received message is not modified, please make sure that each receiver is not pre-empted for the entire duration of reading the message and the message is not mutated by the receivers.

```typescript
import { observe, SimpleReceiver, Observable } from "channel-ts";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// printer waits for the messages on the channel until it closes
async function printer(id: string, chan: SimpleReceiver<number[]>) {
    for await(const data of chan) { // use async iterator to receive data
        console.log(`Printer ${id} received: ${JSON.stringify(data)}`);
    }
    console.log(`Printer ${id} closed`);
}

// sender sends some messages to the channel
async function sender(id: number, array: Observable<number[]>) {
    await delay(id*1500);
    array.fill(1); // does some manipulation
    array.notify(); // notifies all the receivers with the value
    await delay(2200);
    array[0] = id * 111; // does some manipulation
    array[1] = 0;
    array[2] = (9-id) * 111;
    array.notify(); // notifies all the receivers with the value
}

async function main() {
    const chan = observe([0, 0, 0]); // creates a new observable, works with objects
    const r1 = chan.receiver();
    const p1 = printer("A", r1); // uses the channel to print received data
    const r2 = chan.receiver();
    const p2 = printer("B", r2); // uses the channel to print received data
    const p3 = [0, 1, 2, 3, 4].map(async i => sender(i, chan)); // create and spawn senders

    await Promise.all(p3); // wait for sender
    chan.removeReceiver(r1); // close channel
    chan.removeReceiver(r2); // close channel
    await Promise.all([p1, p2]); // wait for channel to close on receiver end
}

main();
```
### Output
[![Simple Output](../assets/observe_output.svg?raw=true&sanitize=true)](#)

## Mutex
Mutex allows asynchronous program to have synchronization by the application of locking. This is useful when a shared resource is accessed concurrently.
```typescript
import { Mutex } from "channel-ts";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const main = async () => {
	const task1 = async (): Promise<void> => {
		console.log("task 1: going to start");
		const guard = await mutex.acquire();
		console.log("task 1: mutex acquired");
		await delay(2000);  // assume shared access done by task 1
		console.log("task 1: finished");
		guard.release();
		console.log("task 1: mutex released");
	};
	const task2 = async (): Promise<void> => {
		await delay(200);
		console.log("task 2: going to start");
		const guard = await mutex.acquire();
		console.log("task 2: mutex acquired");
		await delay(1500);  // assume shared access done by task 2
		console.log("task 2: finished");
		guard.release();
		console.log("task 2: mutex released");
	};
	const task3 = async (): Promise<void> => {
		await delay(400);
		console.log("task 3: going to start");
		const guard = await mutex.acquire();
		console.log("task 3: mutex acquired");
		await delay(1800);  // assume shared access done by task 3
		console.log("task 3: finished");
		guard.release();
		console.log("task 3: mutex released");
	};
	// wait for all our tasks
	await Promise.all([task1(), task2(), task3()]);
};

main();
```
### Output
[![Simple Output](../assets/mutex_output.svg?raw=true&sanitize=true)](#)

## License
 **[MIT license](/LICENSE)**
