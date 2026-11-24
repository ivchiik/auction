import { useTranslation } from "react-i18next";
import { View } from "react-native";

import {
  AppScreen,
  AppText,
  ConfirmSheet,
  IconButton,
  NoticeBanner,
  SettingsIcon,
} from "components";
import { TopicId } from "data";
import { TextVariant, useTheme } from "theme";

import { DailyHero } from "./components/DailyHero";
import { ResumeCard } from "./components/ResumeCard";
import { TopicTile } from "./components/TopicTile";
import { useHome } from "./container/useHome";
import { _styles } from "./HomeTab.styles";

const GRID_ROWS: readonly (readonly TopicId[])[] = [
  [TopicId.Sports, TopicId.Movies],
  [TopicId.Characters, TopicId.Songs],
];

export const HomeTab = () => {
  const { styles } = useTheme(_styles);
  const { t } = useTranslation();
  const home = useHome();

  return (
    <>
      <AppScreen ignoreBottomInset testID="home-screen">
        <View style={styles.topRow}>
          <View
            style={styles.wordmarkRow}
            accessible
            accessibilityRole="header"
            accessibilityLabel={t("app.name")}
          >
            <AppText variant={TextVariant.Title} style={styles.wordmark} i18nKey="app.name" />
            <View style={styles.dot} />
          </View>
          <IconButton
            icon={SettingsIcon}
            accessibilityLabel={t("home.settings")}
            onPress={home.handleOpenSettings}
            testID="home-settings"
          />
        </View>

        <View style={styles.intro}>
          <AppText variant={TextVariant.Display} style={styles.tagline} i18nKey="app.tagline" />
          <AppText variant={TextVariant.Lead} color="textMuted" i18nKey="app.pitch" />
        </View>

        {home.noticeText ? (
          <NoticeBanner
            message={home.noticeText}
            onDismiss={home.handleDismissNotice}
            testID="home-notice"
          />
        ) : null}

        {home.resume ? (
          <ResumeCard
            model={home.resume}
            onResume={home.handleResume}
            onDiscard={home.handleRequestDiscard}
          />
        ) : null}

        <DailyHero
          done={home.dailyDone}
          total={home.dailyTotal}
          featuredTopic={home.featuredTopic}
          onOpen={home.handleOpenDaily}
        />

        <AppText
          variant={TextVariant.Title}
          i18nKey="home.pickTitle"
          accessibilityRole="header"
          style={styles.sectionTitle}
        />
        <View style={styles.grid}>
          {GRID_ROWS.map((row) => (
            <View key={row.join("-")} style={styles.gridRow}>
              {row.map((topic) => (
                <TopicTile key={topic} topic={topic} onPress={home.handleOpenTopic} />
              ))}
            </View>
          ))}
          <TopicTile topic={TopicId.Cars} wide onPress={home.handleOpenTopic} />
        </View>
      </AppScreen>

      <ConfirmSheet
        visible={home.isDiscardOpen}
        title={t("home.discardTitle")}
        body={home.discardBody}
        confirmLabel={t("home.discardConfirm")}
        cancelLabel={t("home.keep")}
        onConfirm={home.handleConfirmDiscard}
        onCancel={home.handleCancelDiscard}
        destructive
        testID="home-discard-sheet"
      />
    </>
  );
};
