import { TopicId, type SportId } from "data";
import { useTheme } from "theme";

import { BasketballIcon, MaskIcon } from "./CustomIcons";
import { CarIcon, Disc3Icon, FilmIcon, type IconComponent } from "./icons";
import { SportIcon } from "./SportIcon";

const TOPIC_ICONS: Record<TopicId, IconComponent> = {
  [TopicId.Sports]: BasketballIcon,
  [TopicId.Movies]: FilmIcon,
  [TopicId.Characters]: MaskIcon,
  [TopicId.Songs]: Disc3Icon,
  [TopicId.Cars]: CarIcon,
};

export interface TopicIconProps {
  topic: TopicId;
  /** A sports pack's own sport: its glyph replaces the generic Sports basketball. */
  sport?: SportId | null;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

/** Topic glyph in forest ink by default; decorative, so screen readers skip it. */
export const TopicIcon = ({ topic, sport, size = 28, color, strokeWidth = 2 }: TopicIconProps) => {
  const { theme } = useTheme();
  if (sport) {
    return <SportIcon sport={sport} size={size} color={color} strokeWidth={strokeWidth} />;
  }
  const Icon = TOPIC_ICONS[topic];
  return <Icon size={size} color={color ?? theme.color.primary} strokeWidth={strokeWidth} />;
};
