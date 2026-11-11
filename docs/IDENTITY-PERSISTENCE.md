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
| `profile_data` | Preferences and placement state |
| `learning_sessions` | Active checkpoints, completion state and summaries |

A session stores its generated exercise list and current interaction state as JSON.
That is deliberate: rebuilding a randomized session after sign-in would not resume
the same exercise.

## Incremental delivery

1. **Local checkpointing:** save the active exercise state after each screen
   update and restore it after refresh. This works on the current single-device
   deployment and does not upload data.
2. **Shared-device profiles (this increment):** create and switch between local
   learner profiles. Preferences, placement, progress, history, checkpoints,
   therapist PIN and IndexedDB recordings are partitioned by profile. Existing
   single-profile browser data is migrated into the first local profile.
3. **Identity and account access:** Supabase Auth, self-registration, and trusted
   caregiver/therapist invitations, with clear ownership and recovery flows.
4. **Cloud persistence:** explicit opt-in, profile-scoped session sync, conflict
   handling and cross-device resume.
5. **Therapist access and lifecycle:** role-limited history, export, account/profile
   deletion and retention controls.

## Current local checkpoint behavior

The active checkpoint is stored in `localStorage` under `pog_active_session`.
It contains the already-generated steps, current index, interaction state and
answer log. Audio blobs are not copied into this checkpoint; they remain in the
existing IndexedDB recording store. A refresh restores the exact current step.
Completing or leaving the exercise clears the active checkpoint. The current
implementation is device/browser-local; it is not yet a cross-device backup.

## Privacy and deployment gates

- Do not enable cloud sync until the user-facing notice, consent capture and
  data-processing arrangements have been reviewed for the intended use in the EU.
  PPA-related information may be health data under GDPR.
- Keep audio recordings device-only by default. Cloud audio upload is out of scope.
- Use a Supabase project in an appropriate EU region, TLS, least-privilege access
  and row-level security on every learner-data table.
- Only the Supabase publishable/anon key may be used in browser code. Never ship a
  service-role key or other server secret to GitHub Pages.
- The SQL migration establishes tables and row-level policies, but does not itself
  provision an account flow or enable syncing. The trusted signup/invitation flow
  must create the first owner membership; this is intentionally not client-writable.
- This prototype remains a language-practice aid, not a medical device or validated
  clinical assessment.

## Supabase setup (later increment)

Create a Supabase project, apply the migration, then configure only the public
project URL and publishable key for the static frontend. Before connecting the
client, implement Auth, account recovery, membership bootstrap/invitations,
consent, offline behavior and cross-device conflict handling. Do not add secrets
to the repository.
