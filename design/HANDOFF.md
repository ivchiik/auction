# Visual implementation handoff

Five reviewed core screens are saved in `canvas/Auction.bl`; two new sport/mode screens are in `canvas/Sports.bl`. PNG references are in `exports/`. Codex created these through Brilliant's local MCP. The Auction rename and result averages are reflected in the core screens. The last edits returned ready with no composition overflow warnings; exported screens were visually inspected.

Match the warm editorial direction, Fraunces headings, forest/ivory contrast, topic pastel surfaces, modest 12–20pt corner radii and generous whitespace. The designs use Inter for body; DM Sans is an acceptable consistent native substitute if already installed. Theme palette is in BRIEF.md.

Baseline is 393×852, but implement responsive screens, not fixed coordinates. Use safe areas from the actual OS; never draw fake status bars/home indicators. Use native input, keyboard-aware scrolling and bottom pinned controls with enough space on a short screen. Minimum 48pt tap target. Dynamic content must wrap or truncate intentionally.

The visual examples use NBA/Jordan as composition placeholders. The actual curated sports pack may be NFL quarterbacks; preserve its real name, note, image and rating basis. Do not invent NBA pack support to match an image. Use the actual data selected by phase 1, and show decorative topic art or safe initials when a remote image is absent.

Auction mock represents a mid-draft state: $4 current bid, $16 budget, three empty slots -> maximum legal bid $14. Buttons raise by $1/$2/$3 and show their resulting amount as hint/accessibility label. Display explicit budget reserve explanations when disabled. Hide ratings and bases that expose scores before the verdict. Respect forced bidding.

Missing from static screens but required in app: topic pack chooser, pre-verdict hidden-roster state, roster drawer, quit/resume flows, rules, local settings, history details, disabled/empty/loading/corrupt-save states. Apply the same system to these.

The giant winner score is a compositional example, not a seeded test expectation. All stats, grades, winner/tie and best-buy/overpay must come from real completed engine state. The Daily screen has five topics and honest on-device progress; it is not synchronized with website history.

The final user-approved app name is Auction. `exports/app-icon.png` is the reviewed original 1024px icon, editable in `canvas/Brand.bl`; its monogram is now “a.”. The updated exports have already been copied to `assets/icon.png` and `assets/adaptive-foreground.png`. Preserve the existing native identifiers for installed-save continuity.

Phase 3 sports direction: sport choice first, then modes, with current/all-time selection where supported. Prioritize the Starting XI mode and show its exact budget and formation. The new soccer reference is a scrolling page; do not squeeze it into a fixed phone height. Native implementation should use its existing shared components and accessible controls. Fraunces needs sufficient natural line height for descenders, including bold display headings.

Android foreground and splash artwork is now provided as `exports/adaptive-foreground.png`, a transparent 1024px Brilliant export with the mark comfortably inside the safe area. Use it over the forest `#193D31` adaptive background. Copy the supplied assets; no raster redraw is necessary.
