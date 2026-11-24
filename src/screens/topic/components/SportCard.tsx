import { View } from "react-native";

import { AppText, ArrowRightIcon, PressableCard, SportIcon } from "components";
import type { SportId } from "data";
import { TextVariant, useTheme } from "theme";

import type { SportRowModel } from "../container/useTopic";
import { _styles } from "./SportCard.styles";

export interface SportCardProps {
  model: SportRowModel;
  onPress: (sport: SportId) => void;
}

/** One sport in the Sports chooser, as in the design: glyph, name, what it offers, arrow. */
export const SportCard = ({ model, onPress }: SportCardProps) => {
  const { styles, theme } = useTheme(_styles);
  return (
    <PressableCard
      onPress={() => onPress(model.sport)}
      accessibilityLabel={model.label}
      style={styles.card}
      testID={`sport-${model.sport}`}
    >
      <SportIcon sport={model.sport} size={34} />
      <View style={styles.text}>
        <AppText variant={TextVariant.Title}>{model.name}</AppText>
        <AppText variant={TextVariant.Body} color="textMuted">
          {model.blurb}
        </AppText>
      </View>
      <ArrowRightIcon size={28} color={theme.color.primary} />
    </PressableCard>
  );
};
