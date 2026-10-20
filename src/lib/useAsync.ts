import { useEffect, useState } from "react";

/** Resolves a promise-returning loader for the given key; undefined while loading. */
export function useAsync<T>(load: () => Promise<T>, deps: unknown[]): T | undefined {
  const [state, setState] = useState<{ deps: unknown[]; value: T } | undefined>();
  useEffect(() => {
    let live = true;
    load().then((value) => live && setState({ deps, value }));
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return state && state.deps.every((d, i) => Object.is(d, deps[i])) ? state.value : undefined;
}
