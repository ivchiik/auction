import { Switch } from "react-native";

import { useTheme } from "theme";

export interface AppSwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  accessibilityLabel: string;
  accessibilityHint?: string;
  disabled?: boolean;
  testID?: string;
}

/** Native switch in the theme's colours (forest on, stone off). */
export const AppSwitch = ({
  value,
  onValueChange,
  accessibilityLabel,
  accessibilityHint,
  disabled = false,
  testID,
}: AppSwitchProps) => {
  const { theme } = useTheme();
  return (
    <Switch
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      trackColor={{ false: theme.color.surfaceMuted, true: theme.color.primary }}
      thumbColor={theme.color.surface}
      ios_backgroundColor={theme.color.surfaceMuted}
      testID={testID}
    />
  );
};
