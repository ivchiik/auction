import { Pressable, View } from "react-native";

import { TextVariant, useTheme } from "theme";

import { AppText } from "../AppText/AppText";
import { _styles } from "./SegmentedControl.styles";

export interface SegmentOption<T extends string | number> {
  value: T;
  label: string;
  accessibilityLabel?: string;
}

export interface SegmentedControlProps<T extends string | number> {
  options: readonly SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel: string;
  testID?: string;
}

export const SegmentedControl = <T extends string | number>({
  options,
  value,
  onChange,
  accessibilityLabel,
  testID,
}: SegmentedControlProps<T>) => {
  const { styles } = useTheme(_styles);
  return (
    <View
      style={styles.track}
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel}
      testID={testID}
    >
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <Pressable
            key={String(option.value)}
            accessibilityRole="radio"
            accessibilityLabel={option.accessibilityLabel ?? option.label}
            accessibilityState={{ checked: isSelected, selected: isSelected }}
            onPress={() => onChange(option.value)}
            testID={testID ? `${testID}-${option.value}` : undefined}
            style={({ pressed }) => [
              styles.segment,
              isSelected && styles.selected,
              pressed && !isSelected && styles.pressed,
            ]}
          >
            <AppText
              variant={isSelected ? TextVariant.BodyStrong : TextVariant.Body}
              color={isSelected ? "onPrimary" : "textMuted"}
              maxFontSizeMultiplier={1.3}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.75}
            >
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
};
