import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildSportCatalog,
  getPack,
  isQuickPack,
  PACKS,
  rulesForPack,
  SportEra,
  SportId,
  SPORT_ORDER,
  sportOfPackId,
  TopicId,
  toEngineCards,
  type ContentPack,
} from "data";
import { addDays, BotPersonality, createDraft, openSpots, runDraft, SeatKind } from "engine";

import { getDailyBoard, getDailyTopicStatus } from "../daily";
import { startDailyAttempt } from "../dailyRecords";
import { createEmptyGameData } from "../gameData";
import { buildTableView } from "../tableView";

const NOW = Date.UTC(2026, 10, 24, 12);

describe("sports modes", () => {
  it("group every sports pack under its sport, with current and all-time variants", () => {
    const grouped = SPORT_ORDER.flatMap((sport) =>
      buildSportCatalog(sport).modes.flatMap((mode) => Object.values(mode.packs))
    );
    const sportsPacks = PACKS.filter((pack) => pack.topic === TopicId.Sports);
    assert.deepEqual(
      grouped.map((pack) => pack.id).sort(),
      sportsPacks.map((pack) => pack.id).sort()
    );

    const soccer = buildSportCatalog(SportId.Soccer);
    assert.deepEqual(soccer.eras, [SportEra.Current, SportEra.AllTime]);
    const main = soccer.modes.filter((mode) => !mode.isExtra).map((mode) => mode.key);
    assert.deepEqual(main, ["attackers", "midfielders", "defenders", "starting-xi"]);
    for (const key of main) {
      const mode = soccer.modes.find((entry) => entry.key === key);
      assert.ok(mode?.packs.current && mode.packs.alltime, `${key} has both eras`);
    }
    const xi = soccer.modes.find((mode) => mode.key === "starting-xi")?.packs.current;
    assert.equal(xi?.budget, 40);
    assert.deepEqual(
      xi?.slots.map((slot) => [slot.accepts.join("/"), slot.count]),
      [
        ["gk", 1],
        ["cb", 2],
        ["fb", 2],
        ["mid", 3],
        ["w", 2],
        ["st", 1],
      ]
    );
  });

  it("list narrower single-position packs as extras, never lineups or broad modes", () => {
    const extras = SPORT_ORDER.flatMap((sport) =>
      buildSportCatalog(sport)
        .modes.filter((mode) => mode.isExtra)
        .map((mode) => `${sport}:${mode.key}`)
    );
    // Strikers sit inside Attackers and point guards inside Guards & wings.
    assert.deepEqual(extras.sort(), ["nba:point-guards", "soccer:strikers"]);
    const nfl = buildSportCatalog(SportId.NFL);
    assert.equal(nfl.modes[0].key, "quarterbacks");
    assert.deepEqual(nfl.eras, [SportEra.Current]);
  });

  it("name the sport behind a saved pack id, for its icon, and nothing otherwise", () => {
    assert.equal(sportOfPackId("soccer-starting-xi-current"), SportId.Soccer);
    assert.equal(sportOfPackId("soccer-strikers"), SportId.Soccer);
    assert.equal(sportOfPackId("nfl-quarterbacks"), SportId.NFL);
    assert.equal(sportOfPackId("nba-point-guards"), SportId.NBA);
    assert.equal(sportOfPackId("f1-fantasy-team-current"), SportId.F1);
    const moviesPack = PACKS.find((pack) => pack.topic === TopicId.Movies) as ContentPack;
    assert.equal(sportOfPackId(moviesPack.id), null);
    // A history record can outlive its pack; it falls back to the topic glyph.
    assert.equal(sportOfPackId("soccer-retired-pack"), null);
  });
});

describe("sports dailies", () => {
  it("only ever pick a quick $20, five-pick pack, never a lineup", () => {
    let date = "2026-11-24";
    const seen = new Set<string>();
    for (let day = 0; day < 120; day += 1) {
      const status = getDailyTopicStatus(createEmptyGameData(), date, TopicId.Sports);
      assert.ok(status.pack && isQuickPack(status.pack), `${date}: ${status.pack?.id}`);
      seen.add(status.pack.id);
      date = addDays(date, 1);
    }
    // The new quick sports modes take part too, not only the four first packs.
    assert.ok(seen.size > 4, `only ${seen.size} different sports dailies`);
  });

  it("keep an attempt's recorded pack even when today's plan would now pick another", () => {
    const dateKey = "2026-11-24";
    const planned = getDailyTopicStatus(createEmptyGameData(), dateKey, TopicId.Sports);
    const recordedPack = ["nfl-quarterbacks", "soccer-strikers"].find(
      (id) => id !== planned.pack?.id
    ) as string;
    const daily = startDailyAttempt(createEmptyGameData().daily, {
      dateKey,
      topicId: TopicId.Sports,
      packId: recordedPack,
      draftId: `daily-${dateKey}-${TopicId.Sports}`,
      startedAt: NOW,
    });
    assert.ok(daily);
    const data = { ...createEmptyGameData(), daily };
    assert.equal(getDailyTopicStatus(data, dateKey, TopicId.Sports).pack?.id, recordedPack);
    assert.equal(
      getDailyBoard(data, dateKey).topics.find((topic) => topic.topicId === TopicId.Sports)?.pack
        ?.id,
      recordedPack
    );
  });
});

describe("lineup table view", () => {
  it("shows open spots per position and who sits a card out, without ratings", () => {
    const pack = getPack("soccer-starting-xi-current") as ContentPack;
    const created = createDraft({
      packId: pack.id,
      rules: rulesForPack(pack),
      pool: toEngineCards(pack),
      seats: [
        { id: "a", name: "You", kind: SeatKind.Human },
        { id: "b", name: "The Shark", kind: SeatKind.Bot, personality: BotPersonality.Shark },
        { id: "c", name: "The Gambler", kind: SeatKind.Bot, personality: BotPersonality.Gambler },
      ],
      seed: 7,
      now: NOW,
    });
    assert.ok(created.ok);
    let checked = 0;
    runDraft(created.value, {
      now: NOW,
      policySeed: 7,
      onStep: (state) => {
        const view = buildTableView(state, pack);
        assert.doesNotMatch(JSON.stringify(view), /"(rating|ratingBasis|ratingSource)"\s*:/);
        assert.equal(view.slots.length, 6);
        for (const seat of view.seats) {
          const open = Object.values(seat.openBySlot).reduce((total, count) => total + count, 0);
          assert.equal(open, openSpots(state.seats[seat.index], state.rules));
          assert.equal(seat.hasRoomForLot, !state.lot || state.lot.eligible.includes(seat.index));
          for (const pickView of seat.picks) {
            const slot = view.slots.find((entry) => entry.id === pickView.slotId);
            assert.ok(slot?.accepts.includes(pickView.position));
          }
        }
        checked += 1;
      },
    });
    assert.ok(checked > 40);
  });
});
