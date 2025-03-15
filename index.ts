export type LimitFunction = {
  <T>(firstTask: () => Promise<T>): Promise<T>;
  <T>(
    firstTask: () => Promise<T>,
    ...otherTasks: Array<() => Promise<T>>
  ): Promise<T[]>;
};

type TaskEntry<T> = {
  task: () => Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: unknown) => void;
};

export interface EventAdapter {
  on(event: string, callback: (details?: unknown[]) => void): void;
  emit(event: string, details?: unknown[]): void;
}

export async function createEventHandler(): Promise<EventAdapter> {
  // Browser environment check.
  if (
    typeof window !== "undefined" &&
    !!window.document &&
    typeof window.EventTarget !== "undefined"
  ) {
    const eventTarget = new EventTarget();
    return {
      on(event: string, callback: (details?: unknown[]) => void): void {
        eventTarget.addEventListener(event, (e: Event) => {
          callback((e as CustomEvent).detail);
        });
      },
      emit(event: string, details?: unknown[]): void {
        eventTarget.dispatchEvent(new CustomEvent(event, { detail: details }));
      },
    };
  }
  // Node.js environment check.
  if (
    typeof process !== "undefined" &&
    process.versions != null &&
    process.versions.node != null
  ) {
    const { EventEmitter } = await import("node:events");
    const emitter = new EventEmitter();
    return {
      on(event: string, callback: (details?: unknown[]) => void): void {
        emitter.on(event, callback);
      },
      emit(event: string, details?: unknown[]): void {
        emitter.emit(event, details);
      },
    };
  }
  throw new Error(
    "No compatible event system found: This environment is not supported"
  );
}

export default async (maxRunning: number): Promise<LimitFunction> => {
  if (!Number.isInteger(maxRunning) || maxRunning <= 0) {
    throw new TypeError(
      "Expected `maxRunning` to be an integer greater than 0"
    );
  }

  const queue: TaskEntry<unknown>[] = [];
  let activeCount = 0;
  const RUN_NEXT_EVENT = "runNext";
  const eventHandler = await createEventHandler();

  // Run one task entry.
  const runTask = <T>(entry: TaskEntry<T>): void => {
    activeCount++;
    entry
      .task()
      .then(entry.resolve)
      .catch(entry.reject)
      .finally(() => {
        activeCount--;
        eventHandler.emit(RUN_NEXT_EVENT);
      });
  };

  // Resume tasks until under concurrency limit.
  const resumeNext = (): void => {
    while (activeCount < maxRunning && queue.length) {
      const entry = queue.shift()!;
      runTask(entry);
    }
  };

  eventHandler.on(RUN_NEXT_EVENT, resumeNext);

  return <T>(
    firstTask: () => Promise<T>,
    ...otherTasks: Array<() => Promise<T>>
  ): Promise<T> | Promise<T[]> => {
    const tasks = [firstTask, ...otherTasks];
    const promises: Promise<T>[] = tasks.map((task) => {
      if (typeof task !== "function") {
        throw new TypeError("Task must be a function returning a promise");
      }
      return new Promise<any>((resolve, reject) => {
        // Enqueue the task entry.
        queue.push({ task, resolve, reject });
      });
    });

    resumeNext();

    return promises.length === 1 ? promises[0] : Promise.all(promises);
  };
}
