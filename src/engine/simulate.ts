import { botRngFor, chooseBotAction } from "./bots";
import { applyAction } from "./draft";
import { createRng, deriveSeed } from "./rng";
import { getTurnOptions } from "./selectors";
import { DraftPhase, SeatKind, type DraftAction, type DraftState, type Rng } from "./types";

/** Decides for a human seat when a draft is driven without a person (tests, demos). */
export type SeatPolicy = (state: DraftState, rng: Rng) => DraftAction | null;

/** Uniformly random legal action: a fuzzing policy that explores every corner of the rules. */
export const randomLegalAction: SeatPolicy = (state, rng) => {
  const options = getTurnOptions(state);
  if (!options) return null;
  const choices: DraftAction[] = options.bids.map((amount) => ({
    type: "bid",
    seat: options.seat,
    amount,
  }));
  if (options.canPass) choices.push({ type: "pass", seat: options.seat });
  return choices[rng.int(0, choices.length - 1)];
};

export interface RunDraftOptions {
  /** Clock reading stamped on every transition. */
  now: number;
  /** Policy for human seats; bots always use their personality. */
  humanPolicy?: SeatPolicy;
  /** Seed for the human policy's randomness. */
  policySeed?: number;
  /** Safety valve against non-terminating loops. */
  maxActions?: number;
  onStep?: (state: DraftState, action: DraftAction) => void;
}

/** Plays a draft to the end. Throws if anything illegal happens: callers treat that as a bug. */
export const runDraft = (initial: DraftState, options: RunDraftOptions): DraftState => {
  const policyRng = createRng(deriveSeed(options.policySeed ?? initial.seed, "human-policy"));
  const humanPolicy = options.humanPolicy ?? randomLegalAction;
  const maxActions = options.maxActions ?? 10_000;
  let state = initial;

  for (let count = 0; count < maxActions; count += 1) {
    if (state.phase === DraftPhase.Complete) return state;
    let action: DraftAction | null;
    if (state.phase === DraftPhase.Resolved) {
      action = { type: "advance" };
    } else {
      const seat = state.lot?.turn ?? null;
      const isBot = seat !== null && state.seats[seat].kind === SeatKind.Bot;
      const rng = botRngFor(state);
      action = isBot && rng ? chooseBotAction(state, rng) : humanPolicy(state, policyRng);
    }
    if (!action) throw new Error(`no action available in phase ${state.phase}`);
    const result = applyAction(state, action, options.now);
    if (!result.ok) throw new Error(`${result.error.code}: ${result.error.message}`);
    state = result.value;
    options.onStep?.(state, action);
  }
  throw new Error(`draft did not finish within ${maxActions} actions`);
};
