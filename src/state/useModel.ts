import { useMemo } from 'react';
import { type Model, buildModel } from '../domain/model';
import { useStore } from './store';

/** Everything derived from the stored events, as of `now`. */
export function useModel(now: number): Model {
  const { events, settings } = useStore();
  return useMemo(() => buildModel(events, settings, now), [events, settings, now]);
}
