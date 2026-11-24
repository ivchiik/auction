import type { IconComponent } from "../icons/icons";

export enum IconButtonVariant {
  /** Hairline circle on ivory, as in the design's header buttons. */
  Outline = "outline",
  /** No frame: back arrows. */
  Plain = "plain",
  /** Hairline circle on forest surfaces. */
  OnDark = "onDark",
}

export interface IconButtonProps {
  icon: IconComponent;
  /** Required: every icon-only control needs a spoken name. */
  accessibilityLabel: string;
  accessibilityHint?: string;
  onPress: () => void;
  variant?: IconButtonVariant;
  disabled?: boolean;
  testID?: string;
}
