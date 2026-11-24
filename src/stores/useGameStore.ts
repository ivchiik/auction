import { create } from "zustand";

import {
  applyActionForStep,
  createDraft,
  EngineErrorCode,
  type CreateDraftInput,
  type DraftAction,
  type DraftState,
  type EngineError,
  type EngineResult,
} from "engine";
import {
  abandonSession,
  closeSession,
  createEmptyGameData,
  revealSession,
  serializeGameData,
  SessionBlock,
  startSession,
  updateSessionDraft,
  type GameData,
  type GameDataNotice,
  type ParsedGameData,
  type SessionOptions,
} from "game";
import { gameDataWriter } from "storage";
import { appClock } from "utils";

export type StartDraftOutcome =
  { ok: true; draft: DraftState } | { ok: false; reason: SessionBlock | EngineErrorCode };

export interface StartDraftRequest {
  draft: Omit<CreateDraftInput, "now">;
  options: SessionOptions;
  /** Only after the player confirmed ending the unfinished draft. */
  replaceUnfinished: boolean;
}

export interface GameStoreState {
  isHydrated: boolean;
  /** False when device storage could not be read: nothing is written, so nothing is lost. */
  canPersist: boolean;
  data: GameData;
  notice: GameDataNotice | null;
  hydrate: (parsed: ParsedGameData, canPersist: boolean) => void;
  dismissNotice: () => void;
  startDraft: (request: StartDraftRequest) => StartDraftOutcome;
  /** Applies an action only if the table is still on `stepKey` (taps, bots and timers). */
  dispatchForStep: (stepKey: string, action: DraftAction) => EngineResult<DraftState>;
  reveal: () => boolean;
  closeSession: () => void;
  abandonSession: () => void;
  resetAll: () => void;
}

const NO_DRAFT: EngineError = { code: EngineErrorCode.NotBidding, message: "no draft in progress" };

/**
 * Game data (active draft, reveal state, daily attempts, history) lives in one store and is
 * persisted as one document through one serialised writer, so each change lands atomically and
 * an older snapshot can never overwrite a newer one. Nothing is written before hydration.
 */
export const useGameStore = create<GameStoreState>((set, get) => {
  const commit = (data: GameData) => {
    set({ data });
    const { isHydrated, canPersist } = get();
    if (isHydrated && canPersist) gameDataWriter.schedule(serializeGameData(data));
  };

  return {
    isHydrated: false,
    canPersist: false,
    data: createEmptyGameData(),
    notice: null,
    hydrate: (parsed, canPersist) => {
      if (get().isHydrated) return;
      set({ isHydrated: true, canPersist, data: parsed.data, notice: parsed.notice });
      // Persist a repaired document once, so a dropped draft does not come back next launch.
      if (canPersist && parsed.notice) gameDataWriter.schedule(serializeGameData(parsed.data));
    },
    dismissNotice: () => set({ notice: null }),
    startDraft: ({ draft: draftInput, options, replaceUnfinished }) => {
      const now = appClock.now();
      const created = createDraft({ ...draftInput, now });
      if (!created.ok) return { ok: false, reason: created.error.code };
      const change = startSession(get().data, {
        draft: created.value,
        options,
        now,
        replaceUnfinished,
      });
      if (!change.ok) return { ok: false, reason: change.reason };
      commit(change.data);
      return { ok: true, draft: created.value };
    },
    dispatchForStep: (stepKey, action) => {
      const session = get().data.session;
      if (!session || session.revealed) return { ok: false, error: NO_DRAFT };
      const result = applyActionForStep(session.draft, stepKey, action, appClock.now());
      if (result.ok) commit(updateSessionDraft(get().data, result.value));
      return result;
    },
    reveal: () => {
      const change = revealSession(get().data, appClock.now());
      if (change.ok) commit(change.data);
      return change.ok;
    },
    closeSession: () => commit(closeSession(get().data)),
    abandonSession: () => commit(abandonSession(get().data)),
    resetAll: () => commit(createEmptyGameData()),
  };
});
