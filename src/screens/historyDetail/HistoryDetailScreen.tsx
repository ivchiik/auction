import { useTranslation } from "react-i18next";
import { View } from "react-native";

import {
  AppButton,
  AppScreen,
  AppText,
  ButtonVariant,
  CrownIcon,
  EmptyState,
  HighlightCard,
  HighlightKind,
  Pill,
  PillTone,
  RatedRoster,
  ResultSeatTiles,
  ScreenHeader,
  ShareIcon,
  TOPIC_SURFACE,
  TopicIcon,
} from "components";
import type { RootRoute, RootScreenProps } from "navigation";
import { TextVariant, useTheme } from "theme";

import { useHistoryDetail } from "./container/useHistoryDetail";
import { _styles } from "./HistoryDetailScreen.styles";

export const HistoryDetailScreen = ({ route }: RootScreenProps<RootRoute.HISTORY_DETAIL>) => {
  const { styles, theme } = useTheme(_styles);
  const { t } = useTranslation();
  const detail = useHistoryDetail(route.params.recordId);
  const { model } = detail;

  if (!model) {
    return (
      <AppScreen header={<ScreenHeader onBack={detail.handleBack} />} testID="history-screen">
        <EmptyState title={t("history.notFound")} body="" />
      </AppScreen>
    );
  }

  const { record } = model;
  return (
    <AppScreen
      testID="history-screen"
      header={<ScreenHeader eyebrow={model.eyebrow} onBack={detail.handleBack} testID="history" />}
      footer={
        <AppButton
          i18nKey="verdict.share"
          variant={ButtonVariant.Primary}
          pill
          onPress={detail.handleShare}
          trailing={<ShareIcon size={20} color={theme.color.onPrimary} />}
          testID="history-share"
        />
      }
    >
      <View style={styles.titleRow}>
        <View style={[styles.tile, { backgroundColor: theme.color[TOPIC_SURFACE[model.topic]] }]}>
          <TopicIcon topic={model.topic} sport={model.sport} size={28} />
        </View>
        <AppText variant={TextVariant.Display} style={styles.title} accessibilityRole="header">
          {record.packTitle}
        </AppText>
      </View>
      <AppText variant={TextVariant.Label} color="textMuted">
        {record.packSubtitle}
      </AppText>
      <Pill label={model.winnerTitle} tone={PillTone.Acid} icon={CrownIcon} shout />
      <ResultSeatTiles seats={record.seats} onDark={false} />
      {model.steal ? (
        <HighlightCard
          kind={HighlightKind.Steal}
          eyebrow={t("verdict.stealEyebrow")}
          title={t("verdict.stealTitle")}
          body={model.steal}
          onDark={false}
        />
      ) : null}
      {model.overpay ? (
        <HighlightCard
          kind={HighlightKind.Overpay}
          eyebrow={t("verdict.overpayEyebrow")}
          title={t("verdict.overpayTitle")}
          body={model.overpay}
          onDark={false}
        />
      ) : null}
      {detail.shareError ? (
        <AppText variant={TextVariant.Body} color="accent" accessibilityRole="alert">
          {detail.shareError}
        </AppText>
      ) : null}
      <AppText
        variant={TextVariant.Heading}
        i18nKey="verdict.rostersTitle"
        accessibilityRole="header"
        style={styles.sectionTitle}
      />
      <RatedRoster seats={record.seats} onDark={false} positionOf={detail.positionOf} />
    </AppScreen>
  );
};
