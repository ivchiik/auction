import { SportId } from "data";
import { useTheme } from "theme";

import { BasketballIcon, CheckeredFlagIcon, SoccerBallIcon } from "./CustomIcons";
import { RugbyBallIcon, type IconComponent } from "./icons";

const SPORT_ICONS: Record<SportId, IconComponent> = {
  [SportId.Soccer]: SoccerBallIcon,
  [SportId.NFL]: RugbyBallIcon,
  [SportId.NBA]: BasketballIcon,
  [SportId.F1]: CheckeredFlagIcon,
};

export interface SportIconProps {
  sport: SportId;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

/** Sport glyph in forest ink by default; decorative, so it sits inside a labelled control. */
export const SportIcon = ({ sport, size = 32, color, strokeWidth = 2 }: SportIconProps) => {
  const { theme } = useTheme();
  const Icon = SPORT_ICONS[sport];
  return <Icon size={size} color={color ?? theme.color.primary} strokeWidth={strokeWidth} />;
};
