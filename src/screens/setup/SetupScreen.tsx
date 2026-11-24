import { useTranslation } from "react-i18next";
import { View } from "react-native";

import {
  AppButton,
  AppScreen,
  AppSwitch,
  AppText,
  ArrowRightIcon,
  CircleHelpIcon,
  ConfirmSheet,
  EmptyState,
  IconButton,
  RulesSheet,
  ScreenHeader,
  SegmentedControl,
  TOPIC_SURFACE,
  TopicIcon,
} from "components";
import { MAX_SEATS, MIN_SEATS } from "engine";
import type { RootRoute, RootScreenProps } from "navigation";
import { TextVariant, useTheme } from "theme";

import { SeatCard } from "./components/SeatCard";
import { useSetup } from "./container/useSetup";
import { _styles } from "./SetupScreen.styles";

const SEAT_COUNTS = Array.from(
  { length: MAX_SEATS - MIN_SEATS + 1 },
  (_, index) => MIN_SEATS + index
);

export const SetupScreen = ({ route }: RootScreenProps<RootRoute.SETUP>) => {
  const { styles, theme } = useTheme(_styles);
  const { t } = useTranslation();
  const setup = useSetup(route.params);
  const { pack } = setup;

  if (!pack) {
    return (
      <AppScreen header={<ScreenHeader onBack={setup.handleBack} />}>
        <EmptyState title={t("common.packMissing")} body="" />
      </AppScreen>
    );
  }

  return (
    <>
      <AppScreen
        keyboardAware
        scrollRef={setup.scrollRef}
        header={
          <ScreenHeader
            eyebrow={t("setup.eyebrow")}
            onBack={setup.handleBack}
            testID="setup"
            right={
              <IconButton
                icon={CircleHelpIcon}
                accessibilityLabel={t("setup.rules")}
                onPress={setup.handleOpenRules}
                testID="setup-rules"
              />
            }
          />
        }
        footer={
          <AppButton
            i18nKey="setup.start"
            pill
            onPress={setup.handleStart}
            trailing={<ArrowRightIcon size={22} color={theme.color.onPrimary} />}
            testID="setup-start"
          />
        }
        testID="setup-screen"
      >
        <AppText
          variant={TextVariant.Display}
          style={styles.title}
          i18nKey="setup.title"
          accessibilityRole="header"
        />

        <View
          style={[styles.packPill, { backgroundColor: theme.color[TOPIC_SURFACE[pack.topic]] }]}
          accessible
          accessibilityLabel={`${pack.title}. ${pack.subtitle}`}
        >
          <TopicIcon topic={pack.topic} sport={setup.sport} size={28} />
          <AppText variant={TextVariant.Subhead} style={styles.packText} numberOfLines={2}>
            {`${pack.title} · ${pack.subtitle}`}
          </AppText>
        </View>

        <View style={styles.section}>
          <AppText variant={TextVariant.Label} color="textMuted" i18nKey="setup.howMany" />
          <SegmentedControl
            options={SEAT_COUNTS.map((count) => ({
              value: count,
              label: t("setup.players", { count }),
              accessibilityLabel: t("setup.playersLabel", { count }),
            }))}
            value={setup.seats.length}
            onChange={setup.handleSeatCount}
            accessibilityLabel={t("setup.howMany")}
            testID="setup-count"
          />
        </View>

        <View
          style={styles.seats}
          onLayout={(event) => setup.handleSeatsLayout(event.nativeEvent.layout.y)}
        >
          {setup.seats.map((seat, index) => (
            <SeatCard
              key={`seat-${index}`}
              index={index}
              seat={seat}
              subtitle={setup.seatSubtitle(seat)}
              isEditing={setup.editingSeat === index}
              isPickerOpen={setup.pickerSeat === index}
              isChoiceBlocked={setup.isChoiceBlocked}
              onStartEditing={setup.handleStartEditing}
              onNameChange={setup.handleNameChange}
              onFinishEditing={setup.handleFinishEditing}
              onTogglePicker={setup.handleTogglePicker}
              onChoose={setup.handleChoose}
              onLayoutY={setup.handleSeatLayout}
            />
          ))}
        </View>

        <View style={styles.quickRow}>
          <View style={styles.quickText}>
            <AppText variant={TextVariant.Subhead} i18nKey="setup.quickTitle" />
            <AppText variant={TextVariant.Body} color="textMuted" i18nKey="setup.quickBody" />
          </View>
          <AppSwitch
            value={setup.isShotClockOn}
            onValueChange={setup.handleToggleShotClock}
            accessibilityLabel={`${t("setup.quickTitle")}. ${t("setup.quickBody")}`}
            testID="setup-shot-clock"
          />
        </View>

        <View style={styles.rule} />
        <View style={styles.section}>
          <View style={styles.stats}>
            <AppText variant={TextVariant.Stat} style={styles.stat}>
              {t("setup.budget", { amount: pack.budget })}
            </AppText>
            <AppText variant={TextVariant.Stat} style={styles.stat}>
              {t("setup.picks", { count: setup.picks })}
            </AppText>
          </View>
          {setup.positions ? (
            <AppText
              variant={TextVariant.BodyStrong}
              accessibilityLabel={setup.positions.label}
              testID="setup-positions"
            >
              {setup.positions.text}
            </AppText>
          ) : null}
          <AppText variant={TextVariant.Body} color="textMuted" i18nKey="setup.budgetNote" />
        </View>
      </AppScreen>

      <RulesSheet visible={setup.isRulesOpen} onClose={setup.handleCloseRules} />
      <ConfirmSheet
        visible={setup.isReplaceOpen}
        title={t("setup.replaceTitle")}
        body={setup.replaceBody}
        confirmLabel={t("setup.replaceConfirm")}
        cancelLabel={t("setup.keepOld")}
        onConfirm={setup.handleConfirmReplace}
        onCancel={setup.handleCancelReplace}
        destructive
        testID="setup-replace-sheet"
      />
    </>
  );
};
