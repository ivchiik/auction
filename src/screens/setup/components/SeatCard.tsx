import { useTranslation } from "react-i18next";
import { Pressable, TextInput, View } from "react-native";

import {
  AppText,
  CheckIcon,
  ChevronDownIcon,
  IconButton,
  IconButtonVariant,
  PencilIcon,
  SeatAvatar,
} from "components";
import { SeatKind } from "engine";
import { personalityBlurbKey, personalityNameKey } from "i18n";
import type { SetupSeatParam } from "navigation";
import { TextVariant, useTheme } from "theme";

import { MAX_NAME_LENGTH, SEAT_CHOICES, type SeatChoice } from "../container/useSetup";
import { _styles } from "./SeatCard.styles";

export interface SeatCardProps {
  index: number;
  seat: SetupSeatParam;
  subtitle: string;
  isEditing: boolean;
  isPickerOpen: boolean;
  isChoiceBlocked: (index: number, choice: SeatChoice) => boolean;
  onStartEditing: (index: number) => void;
  onNameChange: (index: number, name: string) => void;
  onFinishEditing: () => void;
  onTogglePicker: (index: number) => void;
  onChoose: (index: number, choice: SeatChoice) => void;
  onLayoutY: (index: number, y: number) => void;
}

export const SeatCard = ({
  index,
  seat,
  subtitle,
  isEditing,
  isPickerOpen,
  isChoiceBlocked,
  onStartEditing,
  onNameChange,
  onFinishEditing,
  onTogglePicker,
  onChoose,
  onLayoutY,
}: SeatCardProps) => {
  const { styles, theme } = useTheme(_styles);
  const { t } = useTranslation();
  const seatNumber = index + 1;
  const isHuman = seat.kind === SeatKind.Human;
  const currentChoice: SeatChoice = isHuman || !seat.personality ? "person" : seat.personality;
  const showBlockedHint =
    isPickerOpen && SEAT_CHOICES.some((choice) => isChoiceBlocked(index, choice));

  return (
    <View
      style={[styles.card, (isEditing || isPickerOpen) && styles.cardActive]}
      onLayout={(event) => onLayoutY(index, event.nativeEvent.layout.y)}
      testID={`setup-seat-${index}`}
    >
      <View style={styles.row}>
        <SeatAvatar seat={index} size={44} />
        <View style={styles.text}>
          {isEditing ? (
            <TextInput
              value={seat.name}
              onChangeText={(text) => onNameChange(index, text)}
              onBlur={onFinishEditing}
              onSubmitEditing={onFinishEditing}
              autoFocus
              autoCapitalize="words"
              autoCorrect={false}
              maxLength={MAX_NAME_LENGTH}
              returnKeyType="done"
              selectTextOnFocus
              placeholder={t("setup.defaultName", { seat: seatNumber })}
              placeholderTextColor={theme.color.textMuted}
              accessibilityLabel={t("setup.nameLabel", { seat: seatNumber })}
              maxFontSizeMultiplier={1.4}
              style={styles.input}
              testID={`setup-seat-${index}-input`}
            />
          ) : (
            <AppText variant={TextVariant.Subhead} numberOfLines={2}>
              {seat.name}
            </AppText>
          )}
          <AppText variant={TextVariant.Body} color="textMuted" numberOfLines={2}>
            {subtitle}
          </AppText>
        </View>
        {isHuman && !isEditing ? (
          <IconButton
            icon={PencilIcon}
            variant={IconButtonVariant.Plain}
            accessibilityLabel={t("setup.editName", { seat: seatNumber })}
            onPress={() => onStartEditing(index)}
            testID={`setup-seat-${index}-edit`}
          />
        ) : null}
        <IconButton
          icon={ChevronDownIcon}
          variant={IconButtonVariant.Plain}
          accessibilityLabel={t("setup.chooseSeat", { seat: seatNumber })}
          accessibilityHint={subtitle}
          onPress={() => onTogglePicker(index)}
          testID={`setup-seat-${index}-picker`}
        />
      </View>

      {isPickerOpen ? (
        <View
          style={styles.picker}
          accessibilityRole="radiogroup"
          accessibilityLabel={t("setup.seatPickerTitle", { seat: seatNumber })}
        >
          {SEAT_CHOICES.map((choice) => {
            const isSelected = choice === currentChoice;
            const isBlocked = isChoiceBlocked(index, choice);
            const title = choice === "person" ? t("setup.person") : t(personalityNameKey(choice));
            const blurb =
              choice === "person" ? t("setup.personBlurb") : t(personalityBlurbKey(choice));
            return (
              <Pressable
                key={choice}
                accessibilityRole="radio"
                accessibilityLabel={`${title}, ${blurb}`}
                accessibilityState={{ checked: isSelected, disabled: isBlocked }}
                disabled={isBlocked}
                onPress={() => onChoose(index, choice)}
                testID={`setup-seat-${index}-choice-${choice}`}
                style={({ pressed }) => [
                  styles.option,
                  isSelected && styles.optionSelected,
                  isBlocked && styles.optionBlocked,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.optionText}>
                  <AppText variant={TextVariant.BodyStrong}>{title}</AppText>
                  <AppText variant={TextVariant.Caption} color="textMuted">
                    {blurb}
                  </AppText>
                </View>
                {isSelected ? <CheckIcon size={20} color={theme.color.primary} /> : null}
              </Pressable>
            );
          })}
          {showBlockedHint ? (
            <AppText variant={TextVariant.Caption} color="textMuted" style={styles.hint}>
              {t("setup.needsHuman")}
            </AppText>
          ) : null}
        </View>
      ) : null}
    </View>
  );
};
