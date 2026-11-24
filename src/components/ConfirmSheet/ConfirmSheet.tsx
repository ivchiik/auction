import { TextVariant } from "theme";

import { AppButton } from "../AppButton/AppButton";
import { ButtonVariant } from "../AppButton/AppButton.types";
import { AppSheet } from "../AppSheet/AppSheet";
import { AppText } from "../AppText/AppText";

export interface ConfirmSheetProps {
  visible: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  /** Vermilion confirm for anything that deletes or ends something. */
  destructive?: boolean;
  testID?: string;
}

/** A deliberate yes/no: the safe choice is always one tap away and Android back cancels. */
export const ConfirmSheet = ({
  visible,
  title,
  body,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  destructive = false,
  testID,
}: ConfirmSheetProps) => (
  <AppSheet
    visible={visible}
    onClose={onCancel}
    title={title}
    testID={testID}
    footer={
      <>
        <AppButton
          label={confirmLabel}
          variant={destructive ? ButtonVariant.Danger : ButtonVariant.Primary}
          pill
          onPress={onConfirm}
          testID={testID ? `${testID}-confirm` : undefined}
        />
        <AppButton
          label={cancelLabel}
          variant={ButtonVariant.Secondary}
          pill
          onPress={onCancel}
          testID={testID ? `${testID}-cancel` : undefined}
        />
      </>
    }
  >
    <AppText variant={TextVariant.Lead} color="textMuted">
      {body}
    </AppText>
  </AppSheet>
);
