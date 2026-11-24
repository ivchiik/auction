import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { AppSheet, AppText } from "components";
import { TextVariant, useTheme } from "theme";

import type { PackDetailModel } from "../container/usePackDetail";
import { _styles } from "./PackDetailSheet.styles";

export interface PackDetailSheetProps {
  detail: PackDetailModel | null;
  onClose: () => void;
}

/** Positions, snapshot, rating method and photo credits. The card-data source is not named. */
export const PackDetailSheet = ({ detail, onClose }: PackDetailSheetProps) => {
  const { styles } = useTheme(_styles);
  const { t } = useTranslation();
  return (
    <AppSheet
      visible={!!detail}
      onClose={onClose}
      eyebrow={detail?.pack.subtitle ?? t("topic.detailEyebrow")}
      title={detail?.pack.title}
      testID="pack-detail"
    >
      {detail ? (
        <>
          {detail.positions ? (
            <View style={styles.section}>
              <AppText variant={TextVariant.Subhead} i18nKey="topic.positions" />
              <AppText variant={TextVariant.Body} color="textMuted">
                {detail.positions}
              </AppText>
            </View>
          ) : null}
          <View style={styles.section}>
            <AppText variant={TextVariant.Subhead} i18nKey="topic.snapshot" />
            <AppText variant={TextVariant.Body} color="textMuted">
              {detail.snapshot}
            </AppText>
          </View>
          <View style={styles.section}>
            <AppText variant={TextVariant.Subhead} i18nKey="topic.method" />
            <AppText variant={TextVariant.Body} color="textMuted">
              {detail.pack.provenance.ratingMethod}
            </AppText>
          </View>
          <View style={styles.section}>
            <AppText variant={TextVariant.Subhead} i18nKey="topic.images" />
            <AppText variant={TextVariant.Body} color="textMuted">
              {detail.imagesLine}
            </AppText>
          </View>
        </>
      ) : null}
    </AppSheet>
  );
};
