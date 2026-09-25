---
name: google-oauth
description: Wire Google OAuth credentials (optional; GitHub and emailed codes are the other sign-in methods). Use during setup, when login fails with a Google error, or when adding a production redirect URI before deploy.
---

# Google OAuth setup

Google is one of three sign-in methods (with GitHub, when configured, and
emailed codes). It is optional: set both keys and the "Continue with
Google" button (and One Tap) appears. The agent does all file edits and
verification; only the Google Console clicks need the user.

## What the user must do in the browser

Send them this checklist with the concrete values filled in (APP_URL =
`http://localhost:3000` for local, the production origin for deploy):

1. Open https://console.cloud.google.com/apis/credentials (create/select a
   project).
2. If first time: configure the OAuth consent screen — External, app name,
   support email. Default scopes (openid/email/profile) are enough; no extra
   scopes, no verification needed for these.
3. Create Credentials → OAuth client ID → **Web application**:
   - Authorized JavaScript origins: `<APP_URL>` — **for localhost, add BOTH
     `http://localhost:3000` AND `http://localhost`** (Google's GSI/One Tap
     requires the portless entry too; redirect login works without it, One
     Tap does not).
   - Authorized redirect URIs: `<APP_URL>/api/auth/callback/google`
4. Copy the Client ID and Client Secret back here.

For production, don't create a second client — add the production origin and
redirect URI to the **same** client.

## What the agent does with the values

- Local: write `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` into `.dev.vars`,
  then restart the dev server (env is read at boot).
- Production: `wrangler secret put GOOGLE_CLIENT_ID` etc. (interactive — have
  the user run `! wrangler secret put GOOGLE_CLIENT_ID` or pipe the value).

## Verify without a browser

```bash
curl -s -X POST http://localhost:3000/api/auth/sign-in/social \
  -H "Content-Type: application/json" -H "Origin: http://localhost:3000" \
  -d '{"provider":"google","callbackURL":"/dashboard"}'
```

Expect JSON containing a `url` pointing at `accounts.google.com` with the
client id embedded. If you get an error instead, the credentials didn't load
— check `.dev.vars` and that the server restarted. The full round-trip
(consent screen → redirected back logged-in) needs the user to click the
login button once.

## Common failures

- `redirect_uri_mismatch` on Google's page → the redirect URI in the console
  doesn't exactly match `<APP_URL>/api/auth/callback/google` (scheme, port,
  no trailing slash).
- `invalid_client` → wrong secret, or values swapped.
- Works locally, fails in prod → production origin/redirect URI not added to
  the client, or `APP_URL` secret in prod still points at localhost.

## One Tap specifically

Login works but One Tap doesn't show, console says
`[GSI_LOGGER]: The given origin is not allowed for the given client ID`
(gsi/status 403):

- Redirect login only validates redirect URIs; **One Tap validates
  Authorized JavaScript origins**. The origin (and for localhost, the
  portless `http://localhost` twin) must be in the client.
- Origin changes propagate slowly — "5 minutes to a few hours" per Google;
  usually minutes. Retry before debugging further.
- Ad/content blockers can block the GSI iframe entirely
  (`ERR_BLOCKED_BY_CONTENT_BLOCKER` on gsi/log is harmless, but if the
  prompt never appears, test in an incognito window with extensions off).
- The FedCM migration warning in the console is informational — the
  better-auth client already uses FedCM; no action needed.
- Google suppresses the prompt for a while after the user dismisses it
  (exponential cooldown) — an absent prompt is not necessarily a bug.
