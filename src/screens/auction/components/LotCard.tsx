import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Animated, View } from "react-native";

import { AppText, CardArt, LockIcon, Pill, PillTone, TOPIC_SURFACE } from "components";
import type { PublicCard, TopicId } from "data";
import { LotOutcomeKind } from "engine";
import { TextVariant, useTheme, type ColorToken } from "theme";

import type { OutcomeModel } from "../container/useAuction";
import { _styles, lotArtSize } from "./LotCard.styles";

export interface LotCardProps {
  card: PublicCard;
  topic: TopicId;
  lotNumber: number;
  outcome: OutcomeModel | null;
  /** "Goalkeeper" when the pack mixes positions. */
  positionLabel?: string | null;
  accessibilityLabel: string;
  isReducedMotion: boolean;
}

const ENTER_MS = 240;
const ENTER_OFFSET = 14;

/** The card on the block. Rating and basis never reach this component (PublicCard only). */
export const LotCard = ({
  card,
  topic,
  lotNumber,
  outcome,
  positionLabel,
  accessibilityLabel,
  isReducedMotion,
}: LotCardProps) => {
  const { styles, theme, dimensions } = useTheme(_styles);
  const { t } = useTranslation();
  const art = lotArtSize(theme, dimensions);
  const [enter] = useState(() => new Animated.Value(1));
  const [stamp] = useState(() => new Animated.Value(1));

  useEffect(() => {
    if (isReducedMotion) {
      enter.setValue(1);
      return;
    }
    enter.setValue(0);
    Animated.timing(enter, { toValue: 1, duration: ENTER_MS, useNativeDriver: true }).start();
  }, [lotNumber, isReducedMotion, enter]);

  useEffect(() => {
    if (!outcome) return;
    if (isReducedMotion) {
      stamp.setValue(1);
      return;
    }
    stamp.setValue(0);
    Animated.spring(stamp, { toValue: 1, friction: 6, useNativeDriver: true }).start();
  }, [outcome, isReducedMotion, stamp]);

  const stampStyle =
    outcome?.kind === LotOutcomeKind.Sold
      ? styles.stampSold
      : outcome?.kind === LotOutcomeKind.ForcedFill
        ? styles.stampForced
        : styles.stampGone;
  const stampInk: ColorToken =
    outcome?.kind === LotOutcomeKind.ForcedFill ? "onHighlight" : "onPrimary";

  return (
    <Animated.View
      accessible
      accessibilityLabel={accessibilityLabel}
      testID="auction-lot-card"
      style={[
        styles.card,
        {
          backgroundColor: theme.color[TOPIC_SURFACE[topic]],
          opacity: enter,
          transform: [
            {
              translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [ENTER_OFFSET, 0] }),
            },
          ],
        },
      ]}
    >
      <AppText variant={TextVariant.Label} color="textMuted" numberOfLines={2}>
        {card.subtitle}
      </AppText>
      <AppText style={styles.name} maxFontSizeMultiplier={1.25}>
        {card.name}
      </AppText>
      <View style={styles.bottom}>
        <View style={styles.details}>
          {card.note ? (
            <AppText variant={TextVariant.Body} color="text">
              {card.note}
            </AppText>
          ) : null}
          {positionLabel ? <Pill label={positionLabel} tone={PillTone.Forest} shout /> : null}
          <Pill label={t("auction.ratingHidden")} icon={LockIcon} tone={PillTone.Ivory} />
        </View>
        <CardArt
          name={card.name}
          topic={topic}
          imageUri={card.image?.uri ?? null}
          width={art.width}
          height={art.height}
          radius={theme.radius.md}
        />
      </View>
      {outcome ? (
        <Animated.View style={[styles.stampAnchor, { transform: [{ scale: stamp }] }]}>
          <View style={[styles.stamp, stampStyle]}>
            <AppText variant={TextVariant.Label} color={stampInk} maxFontSizeMultiplier={1.2}>
              {outcome.stamp}
            </AppText>
          </View>
        </Animated.View>
      ) : null}
    </Animated.View>
  );
};
