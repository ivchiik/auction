import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useHiddenBehindSheet } from "hooks";
import type { TranslationKey } from "i18n";
import { MainTab } from "navigation";
import { TextVariant, useTheme } from "theme";

import { AppText } from "../AppText/AppText";
import { LayersIcon, LayoutGridIcon, SunIcon, type IconComponent } from "../icons/icons";
import { _styles } from "./TabBar.styles";

const TABS: readonly { tab: MainTab; labelKey: TranslationKey; icon: IconComponent }[] = [
  { tab: MainTab.Play, labelKey: "tabs.play", icon: LayoutGridIcon },
  { tab: MainTab.Daily, labelKey: "tabs.daily", icon: SunIcon },
  { tab: MainTab.Collection, labelKey: "tabs.collection", icon: LayersIcon },
];

export interface TabBarProps {
  active: MainTab;
  onSelect: (tab: MainTab) => void;
}

/**
 * Play / Daily / Collection, sitting above the home indicator. It sits outside the tab's
 * AppScreen, so it hides itself from screen readers while a Home or Daily sheet is open.
 */
export const TabBar = ({ active, onSelect }: TabBarProps) => {
  const { styles, theme } = useTheme(_styles);
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const behindSheet = useHiddenBehindSheet();
  return (
    <View
      {...behindSheet}
      style={[styles.bar, { paddingBottom: Math.max(insets.bottom, theme.space.sm) }]}
      accessibilityRole="tablist"
    >
      {TABS.map(({ tab, labelKey, icon: Icon }) => {
        const isActive = tab === active;
        const color = isActive ? theme.color.primary : theme.color.textMuted;
        return (
          <Pressable
            key={tab}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={t(labelKey)}
            onPress={() => onSelect(tab)}
            testID={`tab-${tab}`}
            style={({ pressed }) => [styles.tab, pressed && styles.pressed]}
          >
            <Icon size={26} color={color} strokeWidth={isActive ? 2.25 : 1.75} />
            <AppText
              variant={isActive ? TextVariant.BodyStrong : TextVariant.Body}
              color={isActive ? "primary" : "textMuted"}
              maxFontSizeMultiplier={1.3}
              numberOfLines={1}
            >
              {t(labelKey)}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
};
