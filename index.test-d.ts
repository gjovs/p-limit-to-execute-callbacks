import {expectType} from 'tsd';
import pLimit  from './index.ts';

const limit = await pLimit(1);

const input = [
	limit(async () => 'bar'),
	limit(async () => 'foo'),
	limit(async () => undefined),
];

expectType<Promise<Array<string | undefined>>>(Promise.all(input));

// expectType<number>(limit.activeCount);
// expectType<number>(limit.pendingCount);
// expectType<void>(limit.clearQueue());
