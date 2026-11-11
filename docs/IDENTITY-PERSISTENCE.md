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
2. **Shared-device profiles:** create and switch between local learner profiles.
   Preferences, placement, progress, history, checkpoints, therapist PIN and
   IndexedDB recordings are partitioned by profile. Existing single-profile data
   is migrated into the first local profile on this device.
3. **Account access backend:** trusted profile creation and role-limited invitations
   through the `profile-access` Edge Function. Client role grants are revoked;
   the service-role key stays server-side.
4. **Account UI (this increment):** bilingual sign-in, self-registration,
   email-confirmation messaging, password recovery/reset and sign-out. Account
   access is optional and does not change local profile storage.
5. **Cloud persistence:** explicit opt-in, profile-scoped session sync, conflict
   handling and cross-device resume.
6. **Therapist access and lifecycle:** role-limited history, export, account/profile
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

## Supabase account-access setup

Create a Supabase project and apply migrations in filename order. Deploy the
`profile-access` Edge Function with server-side secrets:
`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
`APP_SITE_URL` (origin only, e.g. `https://eriakort.github.io`) and
`AUTH_REDIRECT_URL` (the complete app URL, including
`/ppa-language-training/`). Configure the same complete URL in Supabase Auth's
allowed redirect URLs.

When ready to enable browser sign-in, put the project URL and publishable/anon key
in `js/supabase-config.js`. That file is deliberately empty by default; without
both values the account entry explains that online access is not configured.
The publishable/anon key is designed for browser use with RLS. Never place the
service-role key in `js/supabase-config.js`, another browser asset or Git.

The account interface supports email/password registration and sign-in, email
confirmation, password reset and sign-out. Invitation acceptance uses Supabase's
email confirmation redirect and reports the invited profile when the invitation
metadata is present. Cloud syncing is not implemented: local learner data and
recordings are not uploaded, exported or migrated by signing in. The account
currently establishes authentication only, not cross-device learner continuity.
