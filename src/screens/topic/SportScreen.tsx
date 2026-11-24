import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { AppScreen, AppText, EmptyState, ScreenHeader, SegmentedControl } from "components";
import type { RootRoute, RootScreenProps } from "navigation";
import { TextVariant, useTheme } from "theme";

import { LineupCard } from "./components/LineupCard";
import { ModeRow } from "./components/ModeRow";
import { PackDetailSheet } from "./components/PackDetailSheet";
import { useSport } from "./container/useSport";
import { _styles } from "./SportScreen.styles";

/**
 * One sport's modes as a scrolling page: headline, current / all-time switch where both exist,
 * the whole-team lineups first, then single-position modes and the narrower extras.
 */
export const SportScreen = ({ route }: RootScreenProps<RootRoute.SPORT>) => {
  const { styles } = useTheme(_styles);
  const { t } = useTranslation();
  const sport = useSport(route.params.sportId);

  return (
    <>
      <AppScreen
        header={<ScreenHeader eyebrow={sport.eyebrow} onBack={sport.handleBack} testID="sport" />}
        testID="sport-screen"
      >
        {sport.hasModes ? (
          <>
            <View style={styles.intro}>
              <AppText variant={TextVariant.Display} accessibilityRole="header">
                {sport.headline}
              </AppText>
              {sport.eraOptions ? (
                <SegmentedControl
                  options={sport.eraOptions}
                  value={sport.era}
                  onChange={sport.handleSelectEra}
                  accessibilityLabel={t("sport.eraLabel")}
                  testID="sport-era"
                />
              ) : null}
            </View>

            {sport.lineups.map((lineup) => (
              <LineupCard
                key={lineup.pack.id}
                model={lineup}
                onChoose={sport.handleChoose}
                onAbout={sport.handleOpenDetail}
              />
            ))}

            {sport.rows.length > 0 ? (
              <View style={sport.lineups.length > 0 ? styles.afterLineups : undefined}>
                {sport.rows.map((row) => (
                  <ModeRow
                    key={row.pack.id}
                    model={row}
                    onChoose={sport.handleChoose}
                    onAbout={sport.handleOpenDetail}
                  />
                ))}
              </View>
            ) : null}

            {sport.extras.length > 0 ? (
              <View>
                <View style={styles.moreIntro}>
                  <AppText
                    variant={TextVariant.Heading}
                    i18nKey="sport.moreTitle"
                    accessibilityRole="header"
                  />
                  <AppText variant={TextVariant.Body} color="textMuted" i18nKey="sport.moreLead" />
                </View>
                {sport.extras.map((row) => (
                  <ModeRow
                    key={row.pack.id}
                    model={row}
                    onChoose={sport.handleChoose}
                    onAbout={sport.handleOpenDetail}
                  />
                ))}
              </View>
            ) : null}

            <AppText
              variant={TextVariant.Body}
              color="textMuted"
              i18nKey="sport.footer"
              style={styles.footnote}
            />
          </>
        ) : (
          <EmptyState title={t("common.packMissing")} body="" />
        )}
      </AppScreen>

      <PackDetailSheet detail={sport.detail} onClose={sport.handleCloseDetail} />
    </>
  );
};
