import { FlatList, View } from "react-native";

import { AppScreen, AppText, ScreenHeader } from "components";
import type { RootRoute, RootScreenProps } from "navigation";
import { TextVariant, useTheme } from "theme";

import { PackCard } from "./components/PackCard";
import { PackDetailSheet } from "./components/PackDetailSheet";
import { SportCard } from "./components/SportCard";
import { useTopic } from "./container/useTopic";
import { _styles } from "./TopicScreen.styles";

/** A topic's packs, or for Sports the list of sports (each opens its own modes). */
export const TopicScreen = ({ route }: RootScreenProps<RootRoute.TOPIC>) => {
  const { styles } = useTheme(_styles);
  const topic = useTopic(route.params.topicId);

  return (
    <>
      <AppScreen
        scroll={false}
        header={<ScreenHeader eyebrow={topic.topicName} onBack={topic.handleBack} testID="topic" />}
        testID="topic-screen"
      >
        {topic.isSports ? (
          <FlatList
            style={styles.list}
            contentContainerStyle={styles.listContent}
            data={topic.sports}
            keyExtractor={(row) => row.sport}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              <View style={styles.intro}>
                <AppText
                  variant={TextVariant.Display}
                  i18nKey="sports.title"
                  accessibilityRole="header"
                />
                <AppText variant={TextVariant.Lead} color="textMuted" i18nKey="sports.lead" />
              </View>
            }
            renderItem={({ item }) => <SportCard model={item} onPress={topic.handleOpenSport} />}
            ListFooterComponent={
              <AppText
                variant={TextVariant.Label}
                color="textMuted"
                i18nKey="sports.footer"
                style={styles.footer}
              />
            }
          />
        ) : (
          <FlatList
            style={styles.list}
            contentContainerStyle={styles.listContent}
            data={topic.packs}
            keyExtractor={(pack) => pack.id}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              <View style={styles.intro}>
                <AppText
                  variant={TextVariant.Display}
                  i18nKey="topic.title"
                  accessibilityRole="header"
                />
                <AppText variant={TextVariant.Lead} color="textMuted">
                  {topic.topicBlurb}
                </AppText>
              </View>
            }
            renderItem={({ item }) => (
              <PackCard
                pack={item}
                onChoose={topic.handleChoose}
                onAbout={topic.handleOpenDetail}
              />
            )}
          />
        )}
      </AppScreen>

      <PackDetailSheet detail={topic.detail} onClose={topic.handleCloseDetail} />
    </>
  );
};
