import { useNavigation } from "@react-navigation/native";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";

import {
  getPacksForTopic,
  getSportCatalog,
  SPORT_ORDER,
  TopicId,
  type ContentPack,
  type SportId,
} from "data";
import { sportBlurbKey, sportNameKey, topicBlurbKey, topicNameKey } from "i18n";
import { RootRoute, type RootNavigation } from "navigation";

import { usePackDetail } from "./usePackDetail";

export interface SportRowModel {
  sport: SportId;
  name: string;
  /** "Positions & Starting XI" */
  blurb: string;
  /** "Soccer. Positions & Starting XI. 5 modes, current and all-time players." */
  label: string;
}

/**
 * One topic's chooser. Sports first asks which sport (then its modes on the Sport screen); every
 * other topic lists its packs straight away.
 */
export const useTopic = (topicId: TopicId) => {
  const navigation = useNavigation<RootNavigation>();
  const { t } = useTranslation();
  const isSports = topicId === TopicId.Sports;
  const packDetail = usePackDetail();

  const packs = useMemo(() => (isSports ? [] : getPacksForTopic(topicId)), [isSports, topicId]);
  const sports = useMemo<SportRowModel[]>(
    () =>
      isSports
        ? SPORT_ORDER.map((sport) => getSportCatalog(sport))
            .filter((catalog) => catalog.modes.length > 0)
            .map((catalog) => {
              const name = t(sportNameKey(catalog.sport));
              const blurb = t(sportBlurbKey(catalog.sport));
              return {
                sport: catalog.sport,
                name,
                blurb,
                label: t("sports.sportLabel", {
                  name,
                  blurb,
                  modes: t("sports.modes", { count: catalog.modes.length }),
                  eras: t(catalog.eras.length > 1 ? "sports.bothEras" : "sports.currentOnly"),
                }),
              };
            })
        : [],
    [isSports, t]
  );

  const handleChoose = useCallback(
    (pack: ContentPack) => navigation.navigate(RootRoute.SETUP, { packId: pack.id }),
    [navigation]
  );

  return {
    isSports,
    topicName: t(topicNameKey(topicId)),
    topicBlurb: t(topicBlurbKey(topicId)),
    packs,
    sports,
    ...packDetail,
    handleBack: () => navigation.goBack(),
    handleChoose,
    handleOpenSport: (sport: SportId) => navigation.navigate(RootRoute.SPORT, { sportId: sport }),
  };
};
