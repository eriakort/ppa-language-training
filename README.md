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
  → naming pictures → personal phrases → reading aloud → repeating
  → optional maze → sequences.
- **Reading aloud** with words highlighted one at a time at a steady pace
  (levels: whole passage, word by word, slowly word by word, listen then read).
- **Levels that step down over time.** Each game starts at level 1, its hardest
  form, and moves to an easier level when it becomes too hard (average under
  60% over the last 3 sessions). It can move back up after 5 sessions over 90%.
  A family member or therapist can set levels by hand.
- **Shared tablet profiles:** create several learner profiles and switch between them; each profile keeps its own preferences, levels, session history, resumable exercise and local voice recordings. Existing single-profile data is migrated to the first profile on this device.\n- **First-time setup:** name, optional year of birth, town, interests,
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
- **Voice recordings (optional, after consent).** Answers can be recorded for
  the therapist, on the device only, deleted automatically after 30 days.
  In assisted mode the helper can record an answer with one tap.
- **Speaking measures** for the therapist: time to start answering, words per
  minute, number and length of pauses. They are rough indicators for trends,
  not clinical measurements.
- **Therapist area behind a PIN** with speaking trends, recordings to play,
  download or delete, and a CSV export of all results.

## Accounts (optional)

A bilingual account entry supports email/password sign-in, self-registration,
email confirmation, password recovery and sign-out. It is disabled until a
Supabase project is configured in `js/supabase-config.js` with its public URL
and publishable/anon key. The service-role key is never used in the browser.
Signing in does not upload learner profiles, exercise history or recordings;
cloud synchronization is a separate future increment.

## Where it runs

**Main version: GitHub Pages** (https://eriakort.github.io/ppa-language-training/).
Speech recognition uses the browser's Web Speech API:

| Browser | Speech checking | Recording |
| --- | --- | --- |
| Chrome (computer, Android) | Yes (audio goes to Google's speech service) | Yes |
| Safari (Mac, iPhone, iPad) | Yes (audio goes to Apple's speech service) | Yes |
| Samsung Internet | Yes, as far as we know | Yes |
| Edge | Uncertain; caniuse lists it as unsupported | Yes |
| Firefox | No: self-rating instead | Yes |

On some phones the microphone can't record and recognise at the same time. The
app detects this and switches that device to recognition only; it can also be
set in "Levels and settings". This has not yet been tested on real phones.

**Claude artifact version:** uses the Claude host's dictation instead (Chrome,
Edge or the Claude desktop app only) and can't record audio.

Spoken prompts use the device's built-in voice (Web Speech API), so quality
depends on the device.

## Data and privacy

Everything stays in the browser on that device: profile, phrases, levels,
session history (local storage) and voice recordings (IndexedDB). The app
does not send font requests to Google Fonts: the Atkinson Hyperlegible font is
served with the app. The Supabase client library is also served with the app;
account and cloud features connect to the configured Supabase project when
used.

- **Speech recognition** sends the audio to the browser's speech service
  (Google in Chrome, Apple in Safari; Anthropic in the Claude artifact).
- **Recordings** start only after a consent screen, stay on the device, are
  deleted after 30 days, and can be deleted any time from the therapist area.
- **The PIN** keeps the patient out of the therapist area. It is not strong
  security: anyone with the device and browser tools could read the data.
- Clearing the browser's site data deletes everything.

## Project structure

```
index.html            Page shell: loads the files below
css/styles.css        Styles, light and dark themes
js/strings.js         Interface text (Italian and English)
js/app.js             App logic: sessions, levels, placement, games, scoring,
                      consent, therapist area
js/account.js         Optional bilingual Supabase Auth interface
js/supabase-config.js Public Supabase URL/key configuration (empty by default)
js/speech.js          Speech input: Claude host dictation or the browser's Web Speech API
js/recorder.js        Microphone recording and speaking measures
js/recordings.js      Recording storage on the device (IndexedDB), 30-day clean-up
js/utility-menu.js    "Account and data" menu in the page header; collects the account,
                      cloud, therapist and privacy buttons (load it after those modules)
content/base.js       Everyday content for everyone
content/interests.js  Interest packs (topics, words, crossword words, phrases)
tools/build.js        Builds dist/parole-ogni-giorno.html, one self-contained file
tests/content.test.js Checks content and every generated crossword
tests/speech.test.js  Speaking measures and speech engine, with a fake recogniser
tests/account.test.js Static checks for account and recovery safeguards\ntests/cloud-sync.test.js Checks consent and cloud backup privacy safeguards
tests/smoke.test.js   Browser click-through of the built page
```

## Working on it

Open `index.html` in a browser to try it locally (no build needed).

```sh
npm test                 # content and speech checks, no install needed
npm run build            # writes dist/parole-ogni-giorno.html
npm install && npx playwright install chromium
npm run test:browser     # build + browser click-through
```

## Updating content

Most updates only touch `content/`:

- **Reading passages:** `C.READ` in `content/base.js` (interests reuse their
  `echo` sentences).
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
