import { View } from "react-native";

import {
  AppText,
  ArrowRightIcon,
  IconButton,
  IconButtonVariant,
  InfoIcon,
  PressableCard,
} from "components";
import type { ContentPack } from "data";
import { TextVariant, useTheme } from "theme";

import type { ModeRowModel } from "../container/useSport";
import { _styles, ARROW_SIZE } from "./ModeRow.styles";

export interface ModeRowProps {
  model: ModeRowModel;
  onChoose: (pack: ContentPack) => void;
  onAbout: (pack: ContentPack) => void;
}

/**
 * A compact single-position mode under a hairline: title, positions and format. The row chooses
 * the mode; the info button just before the arrow opens "About this pack".
 */
export const ModeRow = ({ model, onChoose, onAbout }: ModeRowProps) => {
  const { styles, theme } = useTheme(_styles);
  return (
    <View style={styles.row} testID={`pack-${model.pack.id}`}>
      <PressableCard
        onPress={() => onChoose(model.pack)}
        accessibilityLabel={model.label}
        style={styles.choose}
        testID={`pack-${model.pack.id}-choose`}
      >
        <View style={styles.text}>
          <AppText variant={TextVariant.Title}>{model.pack.title}</AppText>
          <AppText variant={TextVariant.Body} color="textMuted">
            {model.detail}
          </AppText>
        </View>
        <View style={styles.aboutSpace} />
        <ArrowRightIcon size={ARROW_SIZE} color={theme.color.primary} />
      </PressableCard>
      <View style={styles.about} pointerEvents="box-none">
        <IconButton
          icon={InfoIcon}
          variant={IconButtonVariant.Plain}
          accessibilityLabel={model.aboutLabel}
          onPress={() => onAbout(model.pack)}
          testID={`pack-${model.pack.id}-about`}
        />
      </View>
    </View>
  );
};
