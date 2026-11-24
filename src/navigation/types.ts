import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from "@react-navigation/native-stack";

import type { SportId, TopicId } from "data";
import type { BotPersonality, SeatKind } from "engine";

import type { MainTab, RootRoute } from "./navNames";

export type BaseScreenParams = undefined;

/** A seat as configured in setup (used to prefill "play again"). */
export interface SetupSeatParam {
  kind: SeatKind;
  personality: BotPersonality | null;
  name: string;
}

export interface SetupParams {
  packId: string;
  seats?: SetupSeatParam[];
  shotClock?: boolean;
}

export type RootStackParamList = {
  [RootRoute.MAIN]: { tab?: MainTab } | undefined;
  [RootRoute.TOPIC]: { topicId: TopicId };
  [RootRoute.SPORT]: { sportId: SportId };
  [RootRoute.SETUP]: SetupParams;
  /** The draft lives in the game store, so a resumed auction needs no params. */
  [RootRoute.AUCTION]: BaseScreenParams;
  [RootRoute.VERDICT]: BaseScreenParams;
  [RootRoute.HISTORY_DETAIL]: { recordId: string };
  [RootRoute.SETTINGS]: BaseScreenParams;
};

/** `useNavigation<RootNavigation>()` */
export type RootNavigation = NativeStackNavigationProp<RootStackParamList>;

export type RootScreenProps<Route extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  Route
>;
