/** Raw palette from design/BRIEF.md plus supporting tones sampled from the design exports. */
export const PALETTE = {
  ivory: "#F6F2E9",
  ink: "#1C2520",
  forest: "#193D31",
  forestRaised: "#2A4C3F",
  forestLine: "#4E6D60",
  vermilion: "#F25736",
  lavender: "#D8D0F0",
  acid: "#E4EF85",
  white: "#FFFFFF",
  inkMuted: "#5B655F",
  mistOnForest: "#C3D0C7",
  hairline: "#CFCDC3",
  stone: "#E7E5DC",
  sage: "#E3E7D9",
  sand: "#E9DDCF",
  citron: "#E8EBBE",
  blush: "#EFD3C8",
  scrim: "rgba(28, 37, 32, 0.45)",
} as const;

/** Purpose tokens: styles use these, never raw hex values. */
export interface ColorTheme {
  background: string;
  surface: string;
  surfaceMuted: string;
  text: string;
  textMuted: string;
  textOnDark: string;
  textMutedOnDark: string;
  primary: string;
  primaryRaised: string;
  lineOnPrimary: string;
  onPrimary: string;
  accent: string;
  onAccent: string;
  highlight: string;
  onHighlight: string;
  border: string;
  overlay: string;
  topicSports: string;
  topicMovies: string;
  topicCharacters: string;
  topicSongs: string;
  topicCars: string;
  seat1: string;
  onSeat1: string;
  seat2: string;
  onSeat2: string;
  seat3: string;
  onSeat3: string;
  seat4: string;
  onSeat4: string;
}

export type ColorToken = keyof ColorTheme;

export const LIGHT_COLORS: ColorTheme = {
  background: PALETTE.ivory,
  surface: PALETTE.white,
  surfaceMuted: PALETTE.stone,
  text: PALETTE.ink,
  textMuted: PALETTE.inkMuted,
  textOnDark: PALETTE.ivory,
  textMutedOnDark: PALETTE.mistOnForest,
  primary: PALETTE.forest,
  primaryRaised: PALETTE.forestRaised,
  lineOnPrimary: PALETTE.forestLine,
  onPrimary: PALETTE.ivory,
  accent: PALETTE.vermilion,
  onAccent: PALETTE.ivory,
  highlight: PALETTE.acid,
  onHighlight: PALETTE.forest,
  border: PALETTE.hairline,
  overlay: PALETTE.scrim,
  topicSports: PALETTE.sage,
  topicMovies: PALETTE.sand,
  topicCharacters: PALETTE.lavender,
  topicSongs: PALETTE.citron,
  topicCars: PALETTE.blush,
  seat1: PALETTE.vermilion,
  onSeat1: PALETTE.ivory,
  seat2: PALETTE.lavender,
  onSeat2: PALETTE.forest,
  seat3: PALETTE.acid,
  onSeat3: PALETTE.forest,
  seat4: PALETTE.forest,
  onSeat4: PALETTE.ivory,
};

/** Seat identity: colour plus the seat number, so colour is never the only cue. */
export const SEAT_TOKENS: readonly { fill: ColorToken; ink: ColorToken }[] = [
  { fill: "seat1", ink: "onSeat1" },
  { fill: "seat2", ink: "onSeat2" },
  { fill: "seat3", ink: "onSeat3" },
  { fill: "seat4", ink: "onSeat4" },
];
