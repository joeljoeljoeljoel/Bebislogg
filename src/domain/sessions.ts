import type { Meal } from './types';
import { MIN } from './time';

/** Max gap from the previous meal for a meal to join the same session. */
export const SESSION_GAP = 30 * MIN;

/** A feeding session: breast and bottle meals logged close together. */
export interface Session {
  /** Start, the time of the first meal */
  t: number;
  /** Time of the last meal */
  end: number;
  meals: Meal[];
}

/**
 * Groups meals (sorted by time) into sessions. A meal joins the current
 * session if it comes at most 30 min after the previous meal, unless it is a
 * breastfeed on a side already used in the session: two feeds on the same
 * side are never merged.
 */
export function buildSessions(meals: Meal[]): Session[] {
  const sessions: Session[] = [];
  for (const meal of meals) {
    const cur = sessions[sessions.length - 1];
    const sameSide =
      meal.type === 'feed' && cur?.meals.some((x) => x.type === 'feed' && x.side === meal.side);
    if (cur && meal.t - cur.end <= SESSION_GAP && !sameSide) {
      cur.meals.push(meal);
      cur.end = meal.t;
    } else {
      sessions.push({ t: meal.t, end: meal.t, meals: [meal] });
    }
  }
  return sessions;
}
