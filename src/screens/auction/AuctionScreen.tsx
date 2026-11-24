import { useTranslation } from "react-i18next";
import { View } from "react-native";

import {
  AppScreen,
  AppSheet,
  AppText,
  CircleHelpIcon,
  ConfirmSheet,
  IconButton,
  IconButtonVariant,
  LayersIcon,
  RosterList,
  RulesSheet,
  XIcon,
} from "components";
import { TextVariant, useTheme } from "theme";

import { _styles } from "./AuctionScreen.styles";
import { BidDock } from "./components/BidDock";
import { LotCard } from "./components/LotCard";
import { SeatStrip } from "./components/SeatStrip";
import { AuctionOverlay, useAuction } from "./container/useAuction";

export const AuctionScreen = () => {
  const { styles } = useTheme(_styles);
  const { t } = useTranslation();
  const auction = useAuction();
  const { lot, pack } = auction;

  if (!auction.isReady || !lot || !pack) {
    return <AppScreen testID="auction-screen">{null}</AppScreen>;
  }

  return (
    <>
      <AppScreen
        testID="auction-screen"
        header={
          <View style={styles.header}>
            <View style={styles.leave}>
              <IconButton
                icon={XIcon}
                variant={IconButtonVariant.Plain}
                accessibilityLabel={t("auction.leave")}
                onPress={auction.handleRequestLeave}
                testID="auction-leave"
              />
            </View>
            <View style={styles.spacer} />
            <IconButton
              icon={CircleHelpIcon}
              accessibilityLabel={t("auction.rulesLabel")}
              onPress={auction.handleOpenRules}
              testID="auction-rules"
            />
            <IconButton
              icon={LayersIcon}
              accessibilityLabel={t("auction.rosterLabel")}
              onPress={auction.handleOpenRoster}
              testID="auction-roster"
            />
          </View>
        }
        footer={
          <BidDock
            banner={auction.banner}
            isResolved={auction.isResolved}
            bidButtons={auction.bidButtons}
            bidHint={auction.bidHint}
            pass={auction.pass}
            hasShotClock={auction.hasShotClock}
            getShotClockMs={auction.getShotClockMs}
            amountLabel={auction.amountLabel}
            leaderLine={auction.leaderLine}
            nudge={auction.nudge}
            onBid={auction.handleBid}
            onPass={auction.handlePass}
            onNext={auction.handleNext}
          />
        }
      >
        <AppText variant={TextVariant.Title} i18nKey="auction.title" accessibilityRole="header" />
        <View style={styles.meta}>
          <AppText variant={TextVariant.Label} color="textMuted">
            {auction.cardOfLabel}
          </AppText>
          <AppText variant={TextVariant.Label} color="textMuted" style={styles.context}>
            {auction.contextLabel}
          </AppText>
        </View>
        <LotCard
          card={lot.card}
          topic={pack.topic}
          lotNumber={lot.number}
          outcome={auction.outcome}
          positionLabel={auction.positionLabel}
          accessibilityLabel={auction.cardAccessibilityLabel}
          isReducedMotion={auction.isReducedMotion}
        />
        <SeatStrip seats={auction.seats} lotTag={auction.lotTag} />
      </AppScreen>

      <AppSheet
        visible={auction.overlay === AuctionOverlay.Roster}
        onClose={auction.handleCloseOverlay}
        title={t("auction.rosterTitle")}
        testID="roster-sheet"
      >
        <RosterList
          seats={auction.seats}
          slots={auction.slots}
          showHiddenMark
          testID="roster-list"
        />
      </AppSheet>
      <RulesSheet
        visible={auction.overlay === AuctionOverlay.Rules}
        onClose={auction.handleCloseOverlay}
      />
      <ConfirmSheet
        visible={auction.overlay === AuctionOverlay.Leave}
        title={t("auction.leaveTitle")}
        body={t("auction.leaveBody")}
        confirmLabel={t("auction.leaveConfirm")}
        cancelLabel={t("auction.stay")}
        onConfirm={auction.handleConfirmLeave}
        onCancel={auction.handleCloseOverlay}
        testID="leave-sheet"
      />
    </>
  );
};
