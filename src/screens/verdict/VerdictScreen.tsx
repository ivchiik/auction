import { useTranslation } from "react-i18next";
import { View } from "react-native";

import {
  AppButton,
  AppScreen,
  AppSheet,
  AppText,
  ArrowRightIcon,
  ButtonVariant,
  CircleHelpIcon,
  CrownIcon,
  HighlightCard,
  HighlightKind,
  Pill,
  PillTone,
  RatedRoster,
  ResultSeatTiles,
  RosterList,
  ScreenHeader,
  ShareIcon,
} from "components";
import { TextVariant, useTheme } from "theme";

import { useVerdict } from "./container/useVerdict";
import { _styles } from "./VerdictScreen.styles";

export const VerdictScreen = () => {
  const { styles, theme } = useTheme(_styles);
  const { t } = useTranslation();
  const verdict = useVerdict();

  if (!verdict.isReady) return <AppScreen testID="verdict-screen">{null}</AppScreen>;

  if (!verdict.isRevealed || !verdict.record) {
    return (
      <AppScreen
        testID="verdict-screen"
        header={
          <ScreenHeader eyebrow={t("verdict.preEyebrow")} onBack={verdict.handleLeaveForNow} />
        }
        footer={
          <AppButton
            i18nKey="verdict.reveal"
            pill
            onPress={verdict.handleReveal}
            testID="verdict-reveal"
          />
        }
      >
        <AppText
          variant={TextVariant.Display}
          style={styles.title}
          i18nKey="verdict.preTitle"
          accessibilityRole="header"
        />
        <AppText variant={TextVariant.Lead} color="textMuted" i18nKey="verdict.preBody" />
        {verdict.preView ? (
          <RosterList
            seats={verdict.preView.seats}
            slots={verdict.preView.slots}
            showHiddenMark
            testID="preverdict-rosters"
          />
        ) : null}
      </AppScreen>
    );
  }

  const { record } = verdict;
  return (
    <>
      <AppScreen
        background="primary"
        statusBar="light"
        testID="verdict-screen"
        footer={
          <>
            <AppButton
              i18nKey="verdict.share"
              variant={ButtonVariant.Highlight}
              pill
              onPress={verdict.handleShare}
              trailing={<ShareIcon size={20} color={theme.color.onHighlight} />}
              testID="verdict-share"
            />
            <View style={styles.footerRow}>
              {verdict.isDaily ? (
                <AppButton
                  i18nKey="verdict.dailyHome"
                  variant={ButtonVariant.OnDark}
                  pill
                  onPress={verdict.handleDailyHome}
                  style={styles.footerButton}
                  testID="verdict-daily"
                />
              ) : (
                <AppButton
                  i18nKey="verdict.playAgain"
                  variant={ButtonVariant.OnDark}
                  pill
                  onPress={verdict.handlePlayAgain}
                  accessibilityHint={t("verdict.playAgainLine")}
                  trailing={<ArrowRightIcon size={18} color={theme.color.textOnDark} />}
                  style={styles.footerButton}
                  testID="verdict-play-again"
                />
              )}
              <AppButton
                i18nKey="verdict.home"
                variant={ButtonVariant.OnDark}
                pill
                onPress={verdict.handleHome}
                style={styles.footerButton}
                testID="verdict-home"
              />
            </View>
          </>
        }
      >
        <AppText variant={TextVariant.Label} color="highlight" i18nKey="verdict.eyebrow" />
        <AppText
          variant={TextVariant.Display}
          style={[styles.title, styles.titleOnDark]}
          i18nKey="verdict.title"
          accessibilityRole="header"
        />
        <View style={styles.center}>
          <Pill label={verdict.winnerTitle} tone={PillTone.Acid} icon={CrownIcon} shout />
          <AppText
            variant={TextVariant.Score}
            color="textOnDark"
            style={styles.score}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.6}
            accessibilityLabel={`${verdict.winnerTitle}. ${t("verdict.pts", { points: verdict.scoreLabel })}`}
            testID="verdict-score"
          >
            {verdict.scoreLabel}
          </AppText>
          <AppText variant={TextVariant.Label} color="textMutedOnDark" style={styles.centerText}>
            {verdict.gradeLine}
          </AppText>
        </View>

        <ResultSeatTiles seats={record.seats} onDark displayPoints={verdict.displayPoints} />

        {verdict.steal ? (
          <HighlightCard
            kind={HighlightKind.Steal}
            eyebrow={t("verdict.stealEyebrow")}
            title={verdict.steal.title}
            body={verdict.steal.body}
            onDark
            testID="verdict-steal"
          />
        ) : null}
        {verdict.overpay ? (
          <HighlightCard
            kind={HighlightKind.Overpay}
            eyebrow={t("verdict.overpayEyebrow")}
            title={verdict.overpay.title}
            body={verdict.overpay.body}
            onDark
            testID="verdict-overpay"
          />
        ) : null}
        {verdict.shareError ? (
          <AppText variant={TextVariant.Body} color="highlight" accessibilityRole="alert">
            {verdict.shareError}
          </AppText>
        ) : null}

        <AppText
          variant={TextVariant.Heading}
          color="textOnDark"
          i18nKey="verdict.rostersTitle"
          accessibilityRole="header"
          style={styles.sectionTitle}
        />
        <RatedRoster seats={record.seats} onDark positionOf={verdict.positionOf} />
        <AppButton
          i18nKey="verdict.gradeHelp"
          variant={ButtonVariant.OnDark}
          pill
          onPress={verdict.handleOpenGradeHelp}
          leading={<CircleHelpIcon size={18} color={theme.color.textOnDark} />}
          style={styles.helpLink}
          testID="verdict-grade-help"
        />
      </AppScreen>

      <AppSheet
        visible={verdict.isGradeHelpOpen}
        onClose={verdict.handleCloseGradeHelp}
        title={t("verdict.gradeHelp")}
        testID="grade-help-sheet"
      >
        <AppText variant={TextVariant.Body} color="textMuted" i18nKey="verdict.gradeHelpBody" />
      </AppSheet>
    </>
  );
};
