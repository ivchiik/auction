import type { ComponentType } from "react";

/** Any icon the app draws: Lucide glyphs and the two custom marks share this shape. */
export type IconComponent = ComponentType<{
  color?: string;
  size?: number;
  strokeWidth?: number;
}>;

// One import per glyph keeps the bundle to the icons actually used.
export { default as ArrowLeftIcon } from "lucide-react-native/icons/arrow-left";
export { default as ArrowRightIcon } from "lucide-react-native/icons/arrow-right";
export { default as ArrowUpRightIcon } from "lucide-react-native/icons/arrow-up-right";
export { default as BadgeCheckIcon } from "lucide-react-native/icons/badge-check";
export { default as CarIcon } from "lucide-react-native/icons/car";
export { default as CheckIcon } from "lucide-react-native/icons/check";
export { default as ChevronDownIcon } from "lucide-react-native/icons/chevron-down";
export { default as CircleHelpIcon } from "lucide-react-native/icons/circle-help";
export { default as CrownIcon } from "lucide-react-native/icons/crown";
export { default as Disc3Icon } from "lucide-react-native/icons/disc-3";
export { default as ExternalLinkIcon } from "lucide-react-native/icons/external-link";
export { default as FilmIcon } from "lucide-react-native/icons/film";
export { default as FlameIcon } from "lucide-react-native/icons/flame";
export { default as InfoIcon } from "lucide-react-native/icons/info";
export { default as LayersIcon } from "lucide-react-native/icons/layers";
export { default as LayoutGridIcon } from "lucide-react-native/icons/layout-grid";
export { default as LockIcon } from "lucide-react-native/icons/lock";
export { default as PencilIcon } from "lucide-react-native/icons/pencil";
// Lucide's rugby ball is the pointed, laced American football the NFL design shows.
export { default as RugbyBallIcon } from "lucide-react-native/icons/rugby-ball";
export { default as SettingsIcon } from "lucide-react-native/icons/settings";
export { default as ShareIcon } from "lucide-react-native/icons/share";
export { default as SunIcon } from "lucide-react-native/icons/sun";
export { default as TimerIcon } from "lucide-react-native/icons/timer";
export { default as TrendingDownIcon } from "lucide-react-native/icons/trending-down";
export { default as XIcon } from "lucide-react-native/icons/x";
