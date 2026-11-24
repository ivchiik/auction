import { TopicId } from "data";
import type { ColorToken } from "theme";

/** Pastel surface for each topic, as in the design exports. */
export const TOPIC_SURFACE: Record<TopicId, ColorToken> = {
  [TopicId.Sports]: "topicSports",
  [TopicId.Movies]: "topicMovies",
  [TopicId.Characters]: "topicCharacters",
  [TopicId.Songs]: "topicSongs",
  [TopicId.Cars]: "topicCars",
};
