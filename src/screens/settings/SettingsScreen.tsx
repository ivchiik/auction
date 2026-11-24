import { useTranslation } from "react-i18next";
import { View } from "react-native";

import {
  AppButton,
  AppScreen,
  AppSheet,
  AppSwitch,
  AppText,
  ButtonVariant,
  ConfirmSheet,
  RulesSheet,
  ScreenHeader,
} from "components";
import { TextVariant, useTheme } from "theme";

import { SettingsSheet, useSettings } from "./container/useSettings";
import { _styles } from "./SettingsScreen.styles";

interface SettingRowProps {
  title: string;
  body: string;
  value: boolean;
  onChange: (value: boolean) => void;
  isFirst?: boolean;
  disabled?: boolean;
  testID: string;
}

const SettingRow = ({
  title,
  body,
  value,
  onChange,
  isFirst,
  disabled,
  testID,
}: SettingRowProps) => {
  const { styles } = useTheme(_styles);
  return (
    <View style={[styles.row, !isFirst && styles.rowDivider]}>
      <View style={styles.rowText}>
        <AppText variant={TextVariant.Subhead}>{title}</AppText>
        <AppText variant={TextVariant.Body} color="textMuted">
          {body}
        </AppText>
      </View>
      <AppSwitch
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        accessibilityLabel={title}
        accessibilityHint={body}
        testID={testID}
      />
    </View>
  );
};

export const SettingsScreen = () => {
  const { styles } = useTheme(_styles);
  const { t } = useTranslation();
  const settings = useSettings();

  return (
    <>
      <AppScreen
        header={<ScreenHeader onBack={settings.handleBack} testID="settings" />}
        testID="settings-screen"
      >
        <AppText
          variant={TextVariant.Display}
          style={styles.title}
          i18nKey="settings.title"
          accessibilityRole="header"
        />
        {settings.message ? (
          <AppText variant={TextVariant.BodyStrong} color="accent" accessibilityRole="alert">
            {settings.message}
          </AppText>
        ) : null}

        <View style={styles.section}>
          <AppText variant={TextVariant.Label} color="textMuted" i18nKey="settings.preferences" />
          <View style={styles.card}>
            <SettingRow
              title={t("settings.haptics")}
              body={t("settings.hapticsBody")}
              value={settings.hapticsEnabled}
              onChange={settings.handleToggleHaptics}
              isFirst
              testID="settings-haptics"
            />
            <SettingRow
              title={t("settings.motion")}
              body={
                settings.isSystemReducedMotion
                  ? t("settings.motionSystem")
                  : t("settings.motionBody")
              }
              value={settings.reduceMotion || settings.isSystemReducedMotion}
              onChange={settings.handleToggleReduceMotion}
              disabled={settings.isSystemReducedMotion}
              testID="settings-motion"
            />
            <SettingRow
              title={t("settings.clock")}
              body={t("settings.clockBody")}
              value={settings.shotClockEnabled}
              onChange={settings.handleToggleShotClock}
              testID="settings-clock"
            />
          </View>
        </View>

        <View style={styles.section}>
          <AppText variant={TextVariant.Label} color="textMuted" i18nKey="settings.learn" />
          <View style={styles.links}>
            <AppButton
              i18nKey="settings.rules"
              variant={ButtonVariant.Secondary}
              pill
              onPress={() => settings.handleOpenSheet(SettingsSheet.Rules)}
              style={styles.linkButton}
              testID="settings-rules"
            />
            <AppButton
              i18nKey="settings.grades"
              variant={ButtonVariant.Secondary}
              pill
              onPress={() => settings.handleOpenSheet(SettingsSheet.Grades)}
              style={styles.linkButton}
              testID="settings-grades"
            />
          </View>
        </View>

        <View style={styles.section}>
          <AppText variant={TextVariant.Label} color="textMuted">
            {t("settings.about", { app: settings.appName })}
          </AppText>
          <AppText variant={TextVariant.Body}>{settings.aboutBody}</AppText>
        </View>

        <View style={styles.section}>
          <AppText variant={TextVariant.Label} color="textMuted" i18nKey="settings.content" />
          <AppText variant={TextVariant.Body}>{settings.contentBody}</AppText>
        </View>

        <View style={styles.section}>
          <AppText variant={TextVariant.Label} color="textMuted" i18nKey="settings.money" />
          <AppText variant={TextVariant.Body}>{settings.moneyBody}</AppText>
        </View>

        <View style={styles.section}>
          <AppText variant={TextVariant.Label} color="textMuted" i18nKey="settings.data" />
          <AppText variant={TextVariant.Body} i18nKey="settings.dataBody" />
          <AppButton
            i18nKey="settings.reset"
            variant={ButtonVariant.Secondary}
            pill
            onPress={() => settings.handleOpenSheet(SettingsSheet.Reset)}
            style={styles.linkButton}
            testID="settings-reset"
          />
        </View>
      </AppScreen>

      <RulesSheet
        visible={settings.sheet === SettingsSheet.Rules}
        onClose={settings.handleCloseSheet}
      />
      <AppSheet
        visible={settings.sheet === SettingsSheet.Grades}
        onClose={settings.handleCloseSheet}
        title={t("verdict.gradeHelp")}
        testID="settings-grades-sheet"
      >
        <AppText variant={TextVariant.Body} color="textMuted" i18nKey="verdict.gradeHelpBody" />
      </AppSheet>
      <ConfirmSheet
        visible={settings.sheet === SettingsSheet.Reset}
        title={t("settings.resetTitle")}
        body={t("settings.resetBody")}
        confirmLabel={t("settings.resetConfirm")}
        cancelLabel={t("common.cancel")}
        onConfirm={settings.handleConfirmReset}
        onCancel={settings.handleCloseSheet}
        destructive
        testID="settings-reset-sheet"
      />
    </>
  );
};
