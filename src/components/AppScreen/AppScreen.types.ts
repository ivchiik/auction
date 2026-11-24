import type { ReactNode, RefObject } from "react";
import type { ScrollViewInstance } from "react-native";

import type { ColorToken } from "theme";

export interface AppScreenProps {
  children: ReactNode;
  /** Scrolls the content independently of header and footer (default true). */
  scroll?: boolean;
  /** Fixed above the scrolling content, e.g. a back row. */
  header?: ReactNode;
  /** Pinned controls kept clear of the home indicator and navigation bar. */
  footer?: ReactNode;
  background?: ColorToken;
  statusBar?: "dark" | "light";
  /** Forms: lift the footer and focused field above the keyboard. */
  keyboardAware?: boolean;
  /** Tab content: the tab bar below already handles the bottom inset. */
  ignoreBottomInset?: boolean;
  /** Lets forms scroll a field into view. */
  scrollRef?: RefObject<ScrollViewInstance | null>;
  testID?: string;
}
