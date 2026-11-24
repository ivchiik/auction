import { useTranslation } from "react-i18next";
import { View } from "react-native";

import {
  AppScreen,
  AppText,
  ArrowRightIcon,
  EmptyState,
  PressableCard,
  TOPIC_SURFACE,
  TopicIcon,
} from "components";
import { TextVariant, useTheme } from "theme";

import { _styles } from "./CollectionTab.styles";
import { useCollection } from "./container/useCollection";

export const CollectionTab = () => {
  const { styles, theme } = useTheme(_styles);
  const { t } = useTranslation();
  const collection = useCollection();

  return (
    <AppScreen ignoreBottomInset testID="collection-screen">
      <AppText
        variant={TextVariant.Display}
        style={styles.title}
        i18nKey="collection.title"
        accessibilityRole="header"
      />
      <AppText variant={TextVariant.Lead} color="textMuted" i18nKey="collection.lead" />

      {collection.items.length === 0 ? (
        <EmptyState
          title={t("collection.emptyTitle")}
          body={t("collection.emptyBody")}
          actionLabel={t("collection.emptyCta")}
          onAction={collection.handleStart}
          testID="collection-empty"
        />
      ) : (
        <>
          <AppText variant={TextVariant.Label} color="textMuted">
            {collection.statsLine}
          </AppText>
          <View style={styles.list}>
            {collection.items.map((item) => (
              <PressableCard
                key={item.id}
                onPress={() => collection.handleOpen(item.id)}
                accessibilityLabel={item.accessibilityLabel}
                style={styles.item}
                testID={`collection-item-${item.id}`}
              >
                <View
                  style={[styles.tile, { backgroundColor: theme.color[TOPIC_SURFACE[item.topic]] }]}
                >
                  <TopicIcon topic={item.topic} sport={item.sport} size={28} />
                </View>
                <View style={styles.text}>
                  <AppText variant={TextVariant.Caption} color="textMuted">
                    {item.meta}
                  </AppText>
                  <AppText variant={TextVariant.Subhead}>{item.packTitle}</AppText>
                  <AppText variant={TextVariant.Body} color="textMuted">
                    {item.result}
                  </AppText>
                </View>
                <ArrowRightIcon size={22} color={theme.color.primary} />
              </PressableCard>
            ))}
          </View>
        </>
      )}
    </AppScreen>
  );
};
