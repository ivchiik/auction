import { View } from "react-native";

import { TabBar } from "components";
import { MainTab, type RootRoute, type RootScreenProps } from "navigation";
import { useTheme } from "theme";

import { CollectionTab } from "../collection/CollectionTab";
import { DailyTab } from "../daily/DailyTab";
import { HomeTab } from "../home/HomeTab";
import { useMain } from "./container/useMain";
import { _styles } from "./MainScreen.styles";

/** Play / Daily / Collection behind one route, with a hand-rolled tab bar. */
export const MainScreen = ({ route }: RootScreenProps<RootRoute.MAIN>) => {
  const { styles } = useTheme(_styles);
  const { activeTab, handleSelectTab } = useMain(route.params?.tab);

  return (
    <View style={styles.root}>
      <View style={styles.content}>
        {activeTab === MainTab.Play ? <HomeTab /> : null}
        {activeTab === MainTab.Daily ? <DailyTab /> : null}
        {activeTab === MainTab.Collection ? <CollectionTab /> : null}
      </View>
      <TabBar active={activeTab} onSelect={handleSelectTab} />
    </View>
  );
};
