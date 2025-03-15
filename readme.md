# p-limit-to-execute-callbacks

> Run multiple promise-returning & async functions with limited concurrency

*Works in Node.js and browsers.*

## Install

```sh
npm install p-limit
```

## Usage

```ts
import pLimit from 'p-limit';

const limit = await pLimit(1);

const input = [
	limit(() => fetchSomething('foo')),
	limit(() => fetchSomething('bar')),
	limit(() => doSomething())
];

// Only one promise is run at once
const result = await Promise.all(input);
console.log(result);
```

## API

### pLimit(concurrency) <sup>default export</sup>

Returns a `limit` function.

#### concurrency

Type: `number`\
Minimum: `1`

Concurrency limit.

### limit(...fns)

Returns the promise returned by calling the `...fns()`.

#### fn

Type: `Function`

Promise-returning/async function.

## Related

- [p-throttle](https://github.com/sindresorhus/p-throttle) - Throttle promise-returning & async functions
- [p-debounce](https://github.com/sindresorhus/p-debounce) - Debounce promise-returning & async functions
- [p-all](https://github.com/sindresorhus/p-all) - Run promise-returning & async functions concurrently with optional limited concurrency
- [More…](https://github.com/sindresorhus/promise-fun)
