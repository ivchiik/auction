import { useNavigation } from "@react-navigation/native";
import { useCallback, useMemo, useRef, useState } from "react";
import type { ScrollViewInstance } from "react-native";
import { useTranslation } from "react-i18next";

import { getPack, rulesForPack, sportOfPack, toEngineCards } from "data";
import { BotPersonality, DraftMode, MAX_SEATS, MIN_SEATS, SeatKind } from "engine";
import { SessionBlock, SHOT_CLOCK_MS } from "game";
import {
  describePackPositions,
  personalityBlurbKey,
  personalityNameKey,
  type TranslationKey,
  type TranslationValues,
} from "i18n";
import { RootRoute, type RootNavigation, type SetupParams, type SetupSeatParam } from "navigation";
import { useGameStore, useSettingsStore } from "stores";
import { createSeed } from "utils";

export const MAX_NAME_LENGTH = 18;

/** New computer seats cycle through the personalities, Shark first as in the design. */
const BOT_ORDER: readonly BotPersonality[] = [
  BotPersonality.Shark,
  BotPersonality.Accountant,
  BotPersonality.Gambler,
];

export type SeatChoice = "person" | BotPersonality;

export const SEAT_CHOICES: readonly SeatChoice[] = [
  "person",
  BotPersonality.Accountant,
  BotPersonality.Shark,
  BotPersonality.Gambler,
];

export const useSetup = (params: SetupParams) => {
  const navigation = useNavigation<RootNavigation>();
  const { t } = useTranslation();
  const pack = getPack(params.packId);
  const startDraft = useGameStore((state) => state.startDraft);
  const unfinished = useGameStore((state) =>
    state.data.session && !state.data.session.revealed ? state.data.session.draft : null
  );
  const shotClockDefault = useSettingsStore((state) => state.shotClockEnabled);
  const scrollRef = useRef<ScrollViewInstance | null>(null);
  const seatsTopRef = useRef(0);
  const seatOffsetsRef = useRef<number[]>([]);

  const defaultName = useCallback(
    (seat: SetupSeatParam, index: number) =>
      seat.kind === SeatKind.Human || !seat.personality
        ? index === 0
          ? t("common.you")
          : t("setup.defaultName", { seat: index + 1 })
        : t(personalityNameKey(seat.personality)),
    [t]
  );

  const makeSeat = useCallback(
    (index: number): SetupSeatParam => {
      if (index === 0) return { kind: SeatKind.Human, personality: null, name: t("common.you") };
      const personality = BOT_ORDER[(index - 1) % BOT_ORDER.length];
      return { kind: SeatKind.Bot, personality, name: t(personalityNameKey(personality)) };
    },
    [t]
  );

  const [seats, setSeats] = useState<SetupSeatParam[]>(() =>
    params.seats && params.seats.length >= MIN_SEATS && params.seats.length <= MAX_SEATS
      ? params.seats
      : [makeSeat(0), makeSeat(1)]
  );
  const [isShotClockOn, setIsShotClockOn] = useState(params.shotClock ?? shotClockDefault);
  const [editingSeat, setEditingSeat] = useState<number | null>(null);
  const [pickerSeat, setPickerSeat] = useState<number | null>(null);
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [isReplaceOpen, setIsReplaceOpen] = useState(false);

  const humanCount = seats.filter((seat) => seat.kind === SeatKind.Human).length;

  const handleSeatCount = useCallback(
    (count: number) => {
      setEditingSeat(null);
      setPickerSeat(null);
      setSeats((previous) => {
        let next =
          count > previous.length
            ? [
                ...previous,
                ...Array.from({ length: count - previous.length }, (_, offset) =>
                  makeSeat(previous.length + offset)
                ),
              ]
            : previous.slice(0, count);
        // Never leave the table without a person.
        if (!next.some((seat) => seat.kind === SeatKind.Human)) {
          next = [makeSeat(0), ...next.slice(1)];
        }
        return next;
      });
    },
    [makeSeat]
  );

  const handleNameChange = useCallback((index: number, name: string) => {
    setSeats((previous) =>
      previous.map((seat, at) =>
        at === index ? { ...seat, name: name.slice(0, MAX_NAME_LENGTH) } : seat
      )
    );
  }, []);

  /** Empty names fall back to a default, so a cleared field is never a dead end. */
  const handleFinishEditing = useCallback(() => {
    setSeats((previous) =>
      previous.map((seat, at) => {
        const trimmed = seat.name.trim();
        return { ...seat, name: trimmed.length > 0 ? trimmed : defaultName(seat, at) };
      })
    );
    setEditingSeat(null);
  }, [defaultName]);

  const handleStartEditing = useCallback((index: number) => {
    setPickerSeat(null);
    setEditingSeat(index);
    const offset = seatsTopRef.current + (seatOffsetsRef.current[index] ?? 0);
    scrollRef.current?.scrollTo({ y: Math.max(0, offset - 96), animated: true });
  }, []);

  const handleTogglePicker = useCallback((index: number) => {
    setEditingSeat(null);
    setPickerSeat((current) => (current === index ? null : index));
  }, []);

  const isChoiceBlocked = useCallback(
    (index: number, choice: SeatChoice) =>
      choice !== "person" && seats[index]?.kind === SeatKind.Human && humanCount <= 1,
    [seats, humanCount]
  );

  const handleChoose = useCallback(
    (index: number, choice: SeatChoice) => {
      if (isChoiceBlocked(index, choice)) return;
      setSeats((previous) =>
        previous.map((seat, at) => {
          if (at !== index) return seat;
          if (choice === "person") {
            return seat.kind === SeatKind.Human
              ? seat
              : {
                  kind: SeatKind.Human,
                  personality: null,
                  name: defaultName({ ...seat, kind: SeatKind.Human }, at),
                };
          }
          return { kind: SeatKind.Bot, personality: choice, name: t(personalityNameKey(choice)) };
        })
      );
      setPickerSeat(null);
    },
    [defaultName, isChoiceBlocked, t]
  );

  /** Trimmed, never empty, and numbered when two seats share a name. */
  const finalNames = useMemo(() => {
    const used = new Map<string, number>();
    return seats.map((seat, index) => {
      const base = seat.name.trim() || defaultName(seat, index);
      const key = base.toLowerCase();
      const seen = used.get(key) ?? 0;
      used.set(key, seen + 1);
      return seen === 0 ? base : `${base} ${seen + 1}`;
    });
  }, [seats, defaultName]);

  const start = useCallback(
    (replaceUnfinished: boolean) => {
      if (!pack) return;
      const outcome = startDraft({
        draft: {
          packId: pack.id,
          rules: rulesForPack(pack),
          pool: toEngineCards(pack),
          seats: seats.map((seat, index) => ({
            id: `seat-${index}`,
            name: finalNames[index],
            kind: seat.kind,
            personality: seat.personality,
          })),
          seed: createSeed(),
          mode: DraftMode.Quick,
        },
        options: { shotClockMs: isShotClockOn ? SHOT_CLOCK_MS : null },
        replaceUnfinished,
      });
      if (!outcome.ok) {
        if (outcome.reason === SessionBlock.UnfinishedSession) setIsReplaceOpen(true);
        return;
      }
      setIsReplaceOpen(false);
      navigation.reset({
        index: 1,
        routes: [{ name: RootRoute.MAIN }, { name: RootRoute.AUCTION }],
      });
    },
    [pack, startDraft, seats, finalNames, isShotClockOn, navigation]
  );

  const unfinishedPack = unfinished ? getPack(unfinished.packId) : null;
  const replaceBody = unfinished
    ? t(unfinished.mode === DraftMode.Daily ? "setup.replaceBodyDaily" : "setup.replaceBody", {
        pack: unfinishedPack?.title ?? "",
      })
    : "";

  const translate = useCallback(
    (key: TranslationKey, values?: TranslationValues) => t(key, values ?? {}),
    [t]
  );
  /** Lineups and multi-position packs spell out what every roster is made of. */
  const positions = useMemo(
    () => (pack ? describePackPositions(pack.slots, translate) : null),
    [pack, translate]
  );

  const seatSubtitle = (seat: SetupSeatParam) =>
    seat.kind === SeatKind.Human || !seat.personality
      ? t("setup.human")
      : t("setup.computer", { blurb: t(personalityBlurbKey(seat.personality)) });

  return {
    pack,
    sport: pack ? sportOfPack(pack) : null,
    picks: pack ? pack.slots.reduce((total, slot) => total + slot.count, 0) : 0,
    positions,
    seats,
    seatSubtitle,
    humanCount,
    isShotClockOn,
    editingSeat,
    pickerSeat,
    isRulesOpen,
    isReplaceOpen,
    replaceBody,
    scrollRef,
    handleSeatsLayout: (y: number) => {
      seatsTopRef.current = y;
    },
    handleSeatLayout: (index: number, y: number) => {
      seatOffsetsRef.current[index] = y;
    },
    handleBack: () => navigation.goBack(),
    handleSeatCount,
    handleNameChange,
    handleFinishEditing,
    handleStartEditing,
    handleTogglePicker,
    handleChoose,
    isChoiceBlocked,
    handleToggleShotClock: setIsShotClockOn,
    handleOpenRules: () => setIsRulesOpen(true),
    handleCloseRules: () => setIsRulesOpen(false),
    handleStart: () => start(false),
    handleConfirmReplace: () => start(true),
    handleCancelReplace: () => setIsReplaceOpen(false),
  };
};
