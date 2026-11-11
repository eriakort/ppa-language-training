# Parole ogni giorno · Words every day

A prototype tablet app for short daily language practice for people with
**primary progressive aphasia (PPA)**, in Italian and English.

> **Prototype, not a medical device.** It is not a treatment and not a clinical
> test. Content, thresholds and the level rules are design choices that still
> need review by a speech and language therapist. An app that assesses or
> monitors a patient may fall under the EU Medical Device Regulation; check
> with a regulatory expert before any clinical use.

## What it does

- **Daily session, about 10 minutes**, ordered from the most demanding game to
  the easiest, so it always ends on something the person can do:
  telling (a story on a topic) → crossword or word building (alternate days)
  → naming pictures → personal phrases → repeating → optional maze → sequences.
- **Levels that step down over time.** Each game starts at level 1, its hardest
  form, and moves to an easier level when it becomes too hard (average under
  60% over the last 3 sessions). It can move back up after 5 sessions over 90%.
  A family member or therapist can set levels by hand.
- **First-time setup:** name, optional year of birth, town, interests,
  favourite team, and an untimed placement check that picks a starting level
  for each game. It can be paused, resumed or skipped.
- **Interests** (football, politics and current affairs, fashion, showbiz and
  gossip, cooking, music, plus free text) shape the topics, words, crosswords
  and phrases.
- **Two ways to play**, chosen at the start of each session:
  - *With someone else:* a family member or therapist rates spoken answers.
  - *On my own:* the microphone turns speech into text and the app checks it.
    Matching is lenient because speech recognition often mishears slow or
    effortful speech. Open answers ("telling") can't be checked for
    correctness; the app only measures how much was said.
- **No "wrong" on screen.** A missed answer adds a hint, then plays the model,
  then moves on.

## Where it runs

The app is published as a Claude artifact. The microphone check uses the
artifact host's dictation feature, which works only in a Chromium browser
(Chrome, Edge) or the Claude desktop app, and only for people in the artifact
owner's organization. It is **not available on iPad, Safari or the Claude
mobile apps**; there, and when opened as a plain web page (for example from
this repository), the person rates their own spoken answers instead.

Spoken prompts use the device's built-in voice (Web Speech API), so quality
depends on the device.

## Data and privacy

Everything stays in the browser's local storage on that device: profile,
phrases, levels and history. The app sends none of this anywhere; the only
outside request it makes is for the Atkinson Hyperlegible font from Google Fonts.
In solo mode, speech is converted to text by the host's speech service; the app
keeps only the text, never audio. Clearing the browser's site data resets
everything.

## Project structure

```
index.html            Page shell: loads the files below
css/styles.css        Styles, light and dark themes
js/strings.js         Interface text (Italian and English)
js/app.js             App logic: sessions, levels, placement, games, scoring
content/base.js       Everyday content for everyone
content/interests.js  Interest packs (topics, words, crossword words, phrases)
tools/build.js        Builds dist/parole-ogni-giorno.html, one self-contained file
tests/content.test.js Checks content and every generated crossword
tests/smoke.test.js   Browser click-through of the built page
```

## Working on it

Open `index.html` in a browser to try it locally (no build needed).

```sh
npm test                 # content checks, no install needed
npm run build            # writes dist/parole-ogni-giorno.html
npm install && npx playwright install chromium
npm run test:browser     # build + browser click-through
```

## Updating content

Most updates only touch `content/`:

- **New interest:** add an entry to `C.PACKS` in `content/interests.js` and its
  key to `C.PACK_KEYS`. Each pack needs `describe` topics, `name` items
  (`[word, hint, first sound]`), crossword words `cw` (capitals, no accents)
  and `echo` phrases for 3 levels, in both `it` and `en`.
- **Titles with the town or team:** use `{ c: "… {city}", n: "fallback" }` or
  `{ t: "… {team}", n: "fallback" }`.
- **Keep it evergreen by default.** Content avoids real people and current
  news, because the app has no live source and stale facts would confuse.
  Time-sensitive content, if added, should be reviewed by a person before it
  goes live.

Run `npm test` after any content change: it checks that every crossword the
app can build from the new words has correct crossings.

## Publishing

`npm run build`, then publish `dist/parole-ogni-giorno.html` to the existing
Claude artifact (same link), keeping the `dictation` capability declared.
Republishing doesn't affect data saved on the tablet.
