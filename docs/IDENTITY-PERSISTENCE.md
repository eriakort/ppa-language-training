# Identity, persistence and privacy architecture

## Chosen model

The app uses a **hybrid identity model**:

- A person can sign in with an individual account and resume on another device.
- A shared tablet can hold several learner profiles without requiring each learner
  to manage an account.
- A profile can be shared with an owner, caregiver, therapist and (where appropriate)
  the learner. Membership is explicit and enforced by database row-level security.
- Both self-registration and caregiver/therapist-managed onboarding are supported
  by the intended account model. Managed invitations must be issued by a trusted
  server-side flow, never by exposing a Supabase service-role key in the browser.

## Data model

The first migration is `supabase/migrations/202611110001_hybrid_identity.sql`.

| Table | Purpose |
| --- | --- |
| `learner_profiles` | Learner profile identity, separate from login identity |
| `profile_members` | User-to-profile relationship and role |
| `profile_data` | Preferences, placement and the versioned local backup snapshot |
| `learning_sessions` | Active checkpoints, completion state and summaries (reserved for detailed sync) |

## Incremental delivery

1. **Local checkpointing:** save the active exercise state after each screen
   update and restore it after refresh. This works on the current single-device
   deployment and does not upload data.
2. **Shared-device profiles:** create and switch between local learner profiles.
   Preferences, placement, progress, history, checkpoints, therapist PIN and
   IndexedDB recordings are partitioned by profile. Existing single-profile data
   is migrated into the first local profile on this device.
3. **Account access backend:** trusted profile creation and role-limited invitations
   through the `profile-access` Edge Function. Client role grants are revoked;
   the service-role key stays server-side.
4. **Account UI:** bilingual sign-in, self-registration, email-confirmation
   messaging, password recovery/reset and sign-out. Account access is optional
   and does not change local profile storage.
5. **Manual cloud backup (this increment):** after explicit per-profile consent,
   an authenticated user can create/update a cloud profile backup or restore it
   on another device. There is no background upload or automatic merge. Restore
   requires confirmation because it replaces the covered local profile data.
6. **Automatic cross-device sync:** after a profile has been backed up or restored
   with consent, local changes are queued and uploaded after a short debounce;
   offline changes remain queued until connectivity returns. Each device tracks
   the last cloud revision it observed. A conditional update prevents a stale
   device from silently overwriting a newer cloud revision. If both sides changed,
   the app reports a conflict and the user chooses the existing Backup or Restore
   action; clean devices can receive a newer cloud snapshot automatically.
   Audio remains local. This is revision-based conflict protection, not a semantic
   merge of simultaneous exercise answers.
7. **Therapist access and lifecycle:** therapist membership is read-only. Therapists
   can read the scoped aggregate metrics projection, not unrestricted session
   checkpoints or summaries, and cannot read the broad profile snapshot or write
   learner data. Owners/caregivers retain profile snapshot management; learners
   can participate in session writes. Later increments add account/profile deletion
   and retention controls.

## Local checkpoint and backup contents

The active checkpoint is stored in profile-scoped `localStorage`. It contains
the already-generated steps, current index, interaction state and answer log.
Audio blobs remain in the existing IndexedDB recording store and are never
included in the cloud backup.

Automatic sync reuses the explicit allowlist and consent established by manual
backup. It never uploads audio recordings. A local change event marks the profile
dirty; a debounced upload runs while online, and the dirty marker survives offline
periods and page reloads. On reconnect, the queued snapshot is retried. A database-managed integer
revision is compared with the last revision seen by that device; a stale write is
rejected rather than overwriting newer cloud data. When local data
is clean, a newer cloud snapshot can be restored automatically. When local data
is also dirty, the app stops and asks the user to choose Backup or Restore.

The manual backup uses an explicit allowlist of local profile keys: profile
details, settings, placement, history, completed session summaries, personal
phrases in both languages and the active exercise checkpoint. The profile name,
optional birth year, town/interests, personal phrases and speech-recognition
transcripts may therefore be included. Read the notice in the app before
consenting. No profile data is uploaded merely by signing in.

The initial backup or restore establishes a per-device revision baseline. Subsequent
local changes are queued and synchronized after a short debounce. Every cloud update
advances a database-managed revision, and automatic writes compare the revision they
last observed before saving. A mismatch is surfaced as a conflict; the user must
choose whether to back up the local copy or restore the cloud copy. Offline changes
remain queued until connectivity returns. Audio remains device-only.

## Privacy and deployment gates

- PPA-related information may be health data under GDPR. Review the notice,
  lawful basis, data-processing arrangements, retention and transfer settings
  with an appropriate EU privacy professional before real-world use.
- Use a Supabase project in an appropriate EU region, TLS, least-privilege access
  and row-level security on every learner-data table.
- Keep audio recordings device-only. Cloud audio upload is out of scope.
- Only the Supabase publishable/anon key may be used in browser code. Never ship a
  service-role key or other server secret to GitHub Pages.
- Therapist membership is read-only: session history is visible to profile members,
  but therapists cannot read the broader profile snapshot or write session data.
- Client cloud writes are limited by membership RLS. The cloud profile is created
  by the trusted `profile-access` Edge Function; clients cannot grant roles.
- Revoke consent in the cloud-backup panel to stop further backups/restores from
  this device. Revocation does not delete the cloud copy; account/profile deletion
  and remote data deletion are a separate lifecycle increment.
- This prototype remains a language-practice aid, not a medical device or validated
  clinical assessment.

## Supabase setup

Create a Supabase project and apply migrations in filename order. Deploy the
`profile-access` Edge Function with server-side secrets:
`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
`APP_SITE_URL` (origin only, e.g. `https://eriakort.github.io`) and
`AUTH_REDIRECT_URL` (the complete app URL, including
`/ppa-language-training/`). Configure the complete URL in Supabase Auth's
allowed redirect URLs.

When ready to enable browser sign-in and backup, put the project URL and
publishable/anon key in `js/supabase-config.js`. That file is deliberately
empty by default. Never place the service-role key in browser code or Git.

The app's backup controls require an authenticated session, a local learner
profile and an explicit per-profile consent choice. A cloud profile and initial
backup are created only after the user presses the create/backup action.


## Therapist session history projection

The therapist dashboard reads only `therapist_session_metrics`, a dedicated aggregate projection. Authenticated readers can select the session date/mode, item and spoken counts, and aggregate onset, words-per-minute and pause measures. Column grants exclude the client-supplied JSON result-count field. Direct browser writes are revoked; a membership-checked database function accepts only the fixed metric fields. The projection does not contain exercise labels, personal phrases, recognition transcripts, audio, or raw session JSON. The client publishes at most the latest 60 local session aggregates only when the learner profile has explicit cloud consent and is already linked to a cloud profile. The dashboard lists only profiles explicitly shared with the signed-in account and exports the same limited columns as CSV. Therapists have SELECT only on the approved columns; owners/caregivers/learners publish through the same scoped function; no client delete policy is provided.


## Remote progress statistics

Migration `202611140001_therapist_progress_metrics.sql` adds two more numeric projections for the
"Progress and statistics" view on a therapist's own device:

- `therapist_game_metrics`: one row per exercise per session (game name from a fixed list, level,
  item count, accuracy 0–1, average hints, median time per item, median onset, median words per
  minute). Rows reference their `therapist_session_metrics` row and are deleted with it, so the
  retention period and profile deletion apply automatically.
- `therapist_checkin_metrics`: one row per speech check-in (names correct of 10, animals counted,
  repetition 0–1, description words per minute, mode). Same per-profile retention, same
  finite / not-in-the-future timestamp guard, deleted with the profile.

Both are readable column by column by owners, caregivers and therapists of the profile; there are no
client write policies. The browser publishes through the membership-checked
`upsert_therapist_progress_metrics` function, only with cloud consent and a linked cloud profile,
after the session aggregates. No labels, phrases, recognised words, check-in transcripts, word lists
or audio are sent. `session_id` and `player_mode` of `therapist_session_metrics` are now readable so
the view can join exercises to sessions and filter by "on my own" / "with help". Deploy with
`supabase db push`; until then the app keeps working and the remote statistics button reports that
the server needs the update.

## Profile export and shared-access lifecycle

The Profile privacy panel exports the active local profile's JSON data allowlist
(profile details, settings, placement, history, completed session summaries,
bilingual personal phrases and active checkpoint). The export is generated on
the device and is not uploaded. IndexedDB audio recordings remain device-only
and are not included in this JSON export.

For linked cloud profiles, owners can view shared membership and revoke access
for non-owner members. Caregivers can revoke learner access only. Therapists
cannot manage membership. The browser cannot write membership rows: listing
and revocation are authorized by the profile-access Edge Function using the
server-side service-role key. Owners cannot revoke another owner or remove
themselves through this action. This increment does not delete the learner
profile, cloud snapshot, session metrics, or authentication account.


## Deletion requests and retention controls

Migration: `supabase/migrations/202611110007_deletion_retention_controls.sql`.

A cloud profile owner who is its sole owner may request deletion. The request
has a 30-day grace period and can be cancelled by the same owner before its
scheduled date. Shared ownership must be resolved before a request is accepted.
When processed, the cloud learner profile is deleted; its linked profile
snapshot, learning sessions, therapist metrics, retention settings and shared
memberships are removed by database foreign-key cascades. The deletion request
audit row remains with its status and timestamps. Device-local data and
IndexedDB audio are not remotely erased by this operation.

Owners and caregivers can choose a therapist aggregate-metric retention period
of 30, 90, 180, 365 or 730 days. This policy applies only to
`therapist_session_metrics`; it does not delete the full local session history,
the cloud profile snapshot, or local recordings. The default is 365 days.
Expired metrics are removed by the scheduled maintenance function.

Deploy the `profile-lifecycle-worker` Edge Function with
`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` and a strong
`LIFECYCLE_WORKER_SECRET`. Schedule a daily POST to the function and send
the secret in `x-lifecycle-worker-secret`. Its `verify_jwt = false` setting is
required because the scheduler authenticates with this dedicated header instead
of a user JWT; the handler rejects requests without the secret before creating
the privileged client. The worker calls the database
maintenance function, which processes due deletion requests and applies metric
retention in one transaction. Do not expose the worker secret in browser code.
A deployment is not operational until the migration, function and scheduled
invocation are configured and verified in the Supabase project.

This increment does not delete authentication accounts. Account deletion
requires a separate account-level workflow that checks all profile memberships,
ownership transfers and outstanding legal retention obligations.


## Ownership transfer

Migration: `supabase/migrations/202611110008_profile_ownership_transfer.sql`.

A current owner can request transfer to an existing caregiver on the same cloud
profile. The caregiver must accept within seven days. Acceptance is performed
through a trusted Edge Function and a service-role-only database function that
atomically promotes the recipient to owner and changes the former owner to
caregiver. The former owner retains access; no learner data is copied or deleted.
A pending profile deletion blocks transfer until it is cancelled. Only one
pending transfer per profile is allowed. The recipient must already have an
account and caregiver membership; invitations and role changes are not performed
by the browser. This is a prerequisite for safe account-level deletion and
ownership changes, not an account deletion feature.

## Account deletion preflight (read-only)

The account-deletion review checks every profile membership for the signed-in
user, the number of owners and caregivers on each profile, pending profile
deletion requests, and incoming or outgoing ownership transfers. It identifies
owned profiles that must first be transferred to an existing caregiver or
deleted, and shared memberships that must be revoked during account closure.
A profile already scheduled for deletion remains a blocker until the scheduled
profile deletion has completed. Pending transfer invitations must also be
resolved before account closure.

This step is deliberately read-only: it does not remove memberships, alter
ownership, delete profiles, erase local data, or delete the Supabase Auth user.
A future account-deletion operation must re-check these dependencies
transactionally immediately before deletion, handle any applicable legal
retention obligations, revoke remaining memberships, and delete the Auth user
only after all owned profiles have been resolved. Device-local data and
IndexedDB recordings cannot be erased remotely and must be clearly disclosed.
