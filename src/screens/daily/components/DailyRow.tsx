import { useTranslation } from "react-i18next";
import { View } from "react-native";

import {
  AppText,
  ArrowUpRightIcon,
  CheckIcon,
  Pill,
  PillTone,
  PressableCard,
  TOPIC_SURFACE,
  TopicIcon,
} from "components";
import { DailyTopicState } from "game";
import { TextVariant, useTheme } from "theme";

import type { DailyRowModel } from "../container/useDaily";
import { _styles } from "./DailyRow.styles";

export interface DailyRowProps {
  row: DailyRowModel;
  onPress: (row: DailyRowModel) => void;
}

const STATE_TONE: Record<DailyTopicState, PillTone> = {
  [DailyTopicState.Available]: PillTone.Outline,
  [DailyTopicState.InProgress]: PillTone.Acid,
  [DailyTopicState.Abandoned]: PillTone.Outline,
  [DailyTopicState.Completed]: PillTone.Forest,
  [DailyTopicState.Unavailable]: PillTone.Outline,
};

export const DailyRow = ({ row, onPress }: DailyRowProps) => {
  const { styles, theme } = useTheme(_styles);
  const { t } = useTranslation();
  return (
    <PressableCard
      onPress={() => onPress(row)}
      accessibilityLabel={t("daily.rowLabel", { topic: row.name, state: row.stateLabel })}
      style={styles.row}
      testID={`daily-row-${row.topicId}`}
    >
      <View style={[styles.tile, { backgroundColor: theme.color[TOPIC_SURFACE[row.topicId]] }]}>
        <TopicIcon topic={row.topicId} size={28} />
      </View>
      <View style={styles.text}>
        <AppText variant={TextVariant.Subhead}>{row.name}</AppText>
        <AppText variant={TextVariant.Body} color="textMuted" numberOfLines={2}>
          {row.line}
        </AppText>
      </View>
      <View style={styles.status}>
        {row.state === DailyTopicState.Available ? (
          <ArrowUpRightIcon size={30} color={theme.color.primary} strokeWidth={1.75} />
        ) : (
          <Pill
            label={row.stateLabel}
            tone={STATE_TONE[row.state]}
            icon={row.state === DailyTopicState.Completed ? CheckIcon : undefined}
          />
        )}
      </View>
    </PressableCard>
  );
};
