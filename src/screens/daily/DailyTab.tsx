import { useTranslation } from "react-i18next";
import { View } from "react-native";

import {
  AppButton,
  AppScreen,
  AppSheet,
  AppText,
  ArrowRightIcon,
  ButtonVariant,
  SeatAvatar,
  SunIcon,
} from "components";
import { DailyTopicState } from "game";
import { TextVariant, useTheme } from "theme";

import { DailyRow } from "./components/DailyRow";
import { useDaily, type DailyPreviewModel } from "./container/useDaily";
import { _styles } from "./DailyTab.styles";

export const DailyTab = () => {
  const { styles, theme } = useTheme(_styles);
  const { t } = useTranslation();
  const daily = useDaily();
  const preview: DailyPreviewModel | null = daily.preview;
  const previewState = preview?.status.state ?? null;

  const previewFooter = (() => {
    if (!preview) return null;
    if (daily.isReplaceOpen) {
      return (
        <>
          <AppButton
            i18nKey="daily.replaceConfirm"
            variant={ButtonVariant.Danger}
            pill
            onPress={daily.handleConfirmReplace}
            testID="daily-replace-confirm"
          />
          <AppButton
            i18nKey="setup.keepOld"
            variant={ButtonVariant.Secondary}
            pill
            onPress={daily.handleCancelReplace}
            testID="daily-replace-cancel"
          />
        </>
      );
    }
    if (previewState === DailyTopicState.Available) {
      return (
        <AppButton
          i18nKey="daily.start"
          pill
          onPress={daily.handleStart}
          trailing={<ArrowRightIcon size={22} color={theme.color.onPrimary} />}
          testID="daily-start"
        />
      );
    }
    if (previewState === DailyTopicState.InProgress) {
      return (
        <AppButton i18nKey="daily.resume" pill onPress={daily.handleResume} testID="daily-resume" />
      );
    }
    if (previewState === DailyTopicState.Completed) {
      return (
        <AppButton
          i18nKey="daily.seeResult"
          pill
          onPress={daily.handleSeeResult}
          testID="daily-see-result"
        />
      );
    }
    return null;
  })();

  return (
    <>
      <AppScreen ignoreBottomInset testID="daily-screen">
        <AppText variant={TextVariant.Label} color="textMuted">
          {daily.dateLabel}
        </AppText>
        <AppText
          variant={TextVariant.Display}
          style={styles.title}
          i18nKey="daily.title"
          accessibilityRole="header"
        />
        <AppText variant={TextVariant.Lead} color="textMuted" i18nKey="daily.lead" />

        <View
          style={styles.progressCard}
          accessible
          accessibilityLabel={`${t("daily.tableEyebrow")}: ${t("daily.progress", {
            done: daily.done,
            total: daily.total,
          })}. ${daily.streakLabel}`}
          testID="daily-progress"
        >
          <View style={styles.progressText}>
            <AppText variant={TextVariant.Label} color="onHighlight" i18nKey="daily.tableEyebrow" />
            <AppText variant={TextVariant.Title} color="onHighlight">
              {t("daily.progress", { done: daily.done, total: daily.total })}
            </AppText>
            <AppText variant={TextVariant.Caption} color="onHighlight">
              {daily.streakLabel}
            </AppText>
          </View>
          <SunIcon size={52} color={theme.color.onHighlight} strokeWidth={1.75} />
        </View>

        <View style={styles.list}>
          {daily.rows.map((row) => (
            <DailyRow
              key={row.topicId}
              row={row}
              onPress={() => daily.handleOpenTopic(row.topicId)}
            />
          ))}
        </View>

        <AppText variant={TextVariant.Caption} color="textMuted" i18nKey="daily.footer" />
      </AppScreen>

      <AppSheet
        visible={!!preview}
        onClose={daily.handleClosePreview}
        eyebrow={preview?.eyebrow}
        title={daily.isReplaceOpen ? daily.replaceTitle : preview?.packTitle}
        footer={previewFooter}
        testID="daily-preview"
      >
        {preview && daily.isReplaceOpen ? (
          <AppText variant={TextVariant.Lead} color="textMuted">
            {daily.replaceBody}
          </AppText>
        ) : null}
        {preview && !daily.isReplaceOpen ? (
          <>
            <AppText variant={TextVariant.Label} color="textMuted">
              {preview.packSubtitle}
            </AppText>
            {preview.versus ? (
              <View style={styles.versus} accessible accessibilityLabel={preview.versus}>
                <SeatAvatar seat={0} size={40} />
                <SeatAvatar seat={1} size={40} />
                <AppText variant={TextVariant.Subhead} style={styles.versusText}>
                  {preview.versus}
                </AppText>
              </View>
            ) : null}
            <View style={styles.previewSection}>
              {preview.opponentLine ? (
                <AppText variant={TextVariant.Body} color="textMuted">
                  {preview.opponentLine}
                </AppText>
              ) : null}
              <AppText variant={TextVariant.Body} color="textMuted">
                {preview.rulesLine}
              </AppText>
              <AppText variant={TextVariant.BodyStrong}>
                {previewState === DailyTopicState.Abandoned
                  ? t("daily.abandonedBody")
                  : t("daily.previewOneShot")}
              </AppText>
            </View>
          </>
        ) : null}
      </AppSheet>
    </>
  );
};
