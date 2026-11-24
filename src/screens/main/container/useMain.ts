import { useNavigation } from "@react-navigation/native";
import { useCallback, useEffect } from "react";

import type { MainTab, RootNavigation } from "navigation";
import { useUIStore } from "stores";

/** Tab state lives in a tiny store so any screen can send the player to a tab. */
export const useMain = (requestedTab: MainTab | undefined) => {
  const navigation = useNavigation<RootNavigation>();
  const activeTab = useUIStore((state) => state.activeTab);
  const setActiveTab = useUIStore((state) => state.setActiveTab);

  useEffect(() => {
    if (!requestedTab) return;
    setActiveTab(requestedTab);
    navigation.setParams({ tab: undefined });
  }, [requestedTab, setActiveTab, navigation]);

  const handleSelectTab = useCallback((tab: MainTab) => setActiveTab(tab), [setActiveTab]);

  return { activeTab, handleSelectTab };
};
