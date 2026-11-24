import { Image } from "expo-image";
import { useState } from "react";
import { Text, View } from "react-native";

import type { TopicId } from "data";
import { useReducedMotion } from "hooks";
import { clipFreeLineHeight, useTheme } from "theme";

import { TopicIcon } from "../icons/TopicIcon";
import { _styles } from "./CardArt.styles";

export interface CardArtProps {
  name: string;
  topic: TopicId;
  imageUri: string | null;
  width: number;
  height: number;
  radius?: number;
}

const SKIP_WORDS = new Set(["the", "a", "an"]);
const NON_WORD = /[\s\-–—·:;,.!?&'’"()/]+/;

/** Two-letter mark for drawn cards: "Josh Allen" → "JA", "The Abyss" → "AB", "F40" → "F40". */
export const monogramFor = (name: string): string => {
  const words = name.split(NON_WORD).filter((word) => word.length > 0);
  const meaningful = words.filter((word) => !SKIP_WORDS.has(word.toLowerCase()));
  const pool = meaningful.length > 0 ? meaningful : words;
  if (pool.length === 0) return "?";
  if (pool.length === 1) {
    const [word] = pool;
    return (word.length <= 3 ? word : word.slice(0, 2)).toUpperCase();
  }
  return `${pool[0][0]}${pool[1][0]}`.toUpperCase();
};

const FADE_MS = 180;

/**
 * Card artwork. A remote photo when it loads; otherwise (no photo, offline, failed) a drawn card
 * with a monogram and the topic glyph, so play never depends on the network. Decorative for
 * screen readers: the parent card carries the spoken label.
 */
interface LoadState {
  uri: string | null;
  hasLoaded: boolean;
  hasFailed: boolean;
}

export const CardArt = ({ name, topic, imageUri, width, height, radius = 0 }: CardArtProps) => {
  const { styles } = useTheme(_styles);
  const isReducedMotion = useReducedMotion();
  const [loadState, setLoadState] = useState<LoadState>({
    uri: imageUri,
    hasLoaded: false,
    hasFailed: false,
  });
  // A new card starts fresh without an effect: state recorded for another URL is ignored.
  const { hasLoaded, hasFailed } =
    loadState.uri === imageUri ? loadState : { hasLoaded: false, hasFailed: false };

  const showPhoto = !!imageUri && !hasFailed;
  const monogramSize = Math.round(Math.min(width, height) * 0.42);

  return (
    <View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={[styles.frame, { width, height, borderRadius: radius }]}
    >
      {!showPhoto || !hasLoaded ? (
        <View style={styles.fallback}>
          <Text
            allowFontScaling={false}
            numberOfLines={1}
            adjustsFontSizeToFit
            style={[
              styles.monogram,
              { fontSize: monogramSize, lineHeight: clipFreeLineHeight(monogramSize) },
            ]}
          >
            {monogramFor(name)}
          </Text>
          <View style={styles.glyph}>
            <TopicIcon topic={topic} size={Math.max(18, Math.round(width * 0.16))} />
          </View>
        </View>
      ) : null}
      {showPhoto ? (
        <Image
          source={{ uri: imageUri }}
          style={styles.fill}
          contentFit="contain"
          cachePolicy="memory-disk"
          recyclingKey={imageUri}
          transition={isReducedMotion ? 0 : FADE_MS}
          onLoad={() => setLoadState({ uri: imageUri, hasLoaded: true, hasFailed: false })}
          onError={() => setLoadState({ uri: imageUri, hasLoaded: false, hasFailed: true })}
          accessible={false}
        />
      ) : null}
    </View>
  );
};
