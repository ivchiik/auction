import { useNavigation } from "@react-navigation/native";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { getSportCatalog, rosterSizeOf, SportEra, type ContentPack, type SportId } from "data";
import {
  describeLineup,
  describePackPositions,
  sportHeadlineKey,
  sportNameKey,
  type TranslationKey,
  type TranslationValues,
} from "i18n";
import { RootRoute, type RootNavigation } from "navigation";

import { usePackDetail } from "./usePackDetail";

/** The forest "whole team" card: a lineup with its budget and formation. */
export interface LineupCardModel {
  pack: ContentPack;
  /** "$40 each · 11 picks" */
  stats: string;
  /** "GK ×1 · CB ×2 · FB ×2 · MID ×3 · W ×2 · ST ×1" */
  formation: string;
  label: string;
  aboutLabel: string;
}

/** A compact single-slot mode row. */
export interface ModeRowModel {
  pack: ContentPack;
  /** "Strikers or wingers · $20 · 5 picks" */
  detail: string;
  label: string;
  aboutLabel: string;
}

interface SportSections {
  lineups: LineupCardModel[];
  rows: ModeRowModel[];
  extras: ModeRowModel[];
}

const ERA_LABEL_KEYS = {
  [SportEra.Current]: "sport.eraCurrent",
  [SportEra.AllTime]: "sport.eraAllTime",
} as const;

/**
 * One sport's modes for the chosen era. Whole-team lineups lead as forest cards, so the Starting
 * XI is the first thing on the soccer page; single-position modes follow as compact rows, and
 * narrower extras sit under "More modes".
 */
export const useSport = (sportId: SportId) => {
  const navigation = useNavigation<RootNavigation>();
  const { t } = useTranslation();
  const catalog = useMemo(() => getSportCatalog(sportId), [sportId]);
  const [era, setEra] = useState<SportEra>(catalog.eras[0] ?? SportEra.Current);
  const packDetail = usePackDetail();
  const translate = useCallback(
    (key: TranslationKey, values?: TranslationValues) => t(key, values ?? {}),
    [t]
  );

  const sections = useMemo<SportSections>(() => {
    const eraName = t(ERA_LABEL_KEYS[era]);
    const result: SportSections = { lineups: [], rows: [], extras: [] };
    for (const mode of catalog.modes) {
      const pack = mode.packs[era];
      if (!pack) continue;
      const values = { title: pack.title, era: eraName, budget: pack.budget };
      const picks = rosterSizeOf(pack);
      const aboutLabel = t("topic.aboutLabel", { pack: pack.title });
      const lineup = describeLineup(pack.slots, translate);
      if (lineup) {
        result.lineups.push({
          pack,
          stats: t("sport.lineupStats", { budget: pack.budget, picks }),
          formation: lineup.text,
          label: t("sport.lineupLabel", { ...values, picks, formation: lineup.label }),
          aboutLabel,
        });
        continue;
      }
      const positions = describePackPositions(pack.slots, translate);
      const format = t("topic.format", { budget: pack.budget, picks });
      (mode.isExtra ? result.extras : result.rows).push({
        pack,
        detail: positions ? `${positions.text} · ${format}` : format,
        label: positions
          ? t("sport.modeLabelPositions", { ...values, picks, positions: positions.label })
          : t("sport.modeLabel", { ...values, picks }),
        aboutLabel,
      });
    }
    return result;
  }, [catalog, era, t, translate]);

  const handleChoose = useCallback(
    (pack: ContentPack) => navigation.navigate(RootRoute.SETUP, { packId: pack.id }),
    [navigation]
  );

  return {
    eyebrow: t(sportNameKey(sportId)),
    headline: t(sportHeadlineKey(sportId)),
    hasModes: catalog.modes.length > 0,
    era,
    eraOptions:
      catalog.eras.length > 1
        ? catalog.eras.map((value) => ({ value, label: t(ERA_LABEL_KEYS[value]) }))
        : null,
    ...sections,
    ...packDetail,
    handleSelectEra: setEra,
    handleChoose,
    handleBack: () => navigation.goBack(),
  };
};
