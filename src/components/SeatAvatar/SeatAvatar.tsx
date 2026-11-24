import { Text, View } from "react-native";

import { SEAT_TOKENS, useTheme } from "theme";

import { _styles } from "./SeatAvatar.styles";

export interface SeatAvatarProps {
  /** Zero-based seat index; shown as "01".."04". */
  seat: number;
  size?: number;
  /** Ivory ring, for avatars sitting on coloured banners. */
  ringed?: boolean;
}

export const seatLabel = (seat: number) => String(seat + 1).padStart(2, "0");

/** Seat identity: colour plus the seat number, never colour alone. Decorative for readers. */
export const SeatAvatar = ({ seat, size = 40, ringed = false }: SeatAvatarProps) => {
  const { styles, theme } = useTheme(_styles);
  const tokens = SEAT_TOKENS[seat % SEAT_TOKENS.length];
  return (
    <View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.circle,
        ringed && styles.ring,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: theme.color[tokens.fill],
        },
      ]}
    >
      <Text
        allowFontScaling={false}
        style={[styles.number, { color: theme.color[tokens.ink], fontSize: size * 0.38 }]}
      >
        {seatLabel(seat)}
      </Text>
    </View>
  );
};
