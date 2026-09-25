// Single entry point for app-level configuration.
// Components read from here — never from import.meta.env directly.
//
// Everything below is a placeholder for the app you are building on this
// template. Work through it once before the first deploy: the name and URL
// reach the marketing pages and every transactional email, and the legal
// entity is printed verbatim on the Terms and Privacy pages.
export const appConfig = {
  name: 'ShipKit Lite',
  description:
    'The free, agent-first SaaS starter on TanStack Start and Cloudflare Workers',
  // Canonical production origin — used for hreflang alternate links.
  url: 'https://example.com',
  // Public origin serving the marketing images and clips (an R2 custom
  // domain, or any CDN). `scripts/upload-marketing.ts` publishes to it;
  // components/marketing/media.tsx reads keys under `<mediaUrl>/marketing`.
  // Leave it empty and every <Frame>/<Clip> renders its placeholder tint
  // instead of a broken image, so a fresh clone looks intentional with no
  // assets at all. Point it at your bucket when you have one.
  mediaUrl: '',
  // From address on transactional email. Deliberately on a SENDING SUBDOMAIN:
  // SPF is per-hostname, so send.example.com carries Resend's SPF/DKIM while
  // the root keeps whatever your inbound mail provider needs — no single
  // record has to serve two providers. It also keeps a bad sending run from
  // touching the root domain's reputation. Verify the subdomain in Resend
  // before changing this.
  //
  // It is a noreply, but replies are NOT lost: send.ts sets Reply-To to
  // supportEmail, which must forward to a real inbox.
  emailFrom: 'noreply@send.example.com',
  // Reply-To on every transactional email, the "Email support" link in Help &
  // feedback (app sidebar), the marketing footer, and the contact address on
  // the legal pages. Must stay deliverable.
  supportEmail: 'support@example.com',
  // OAuth client id is public by design (it appears in every auth URL); the
  // client needs it for Google One Tap. Register two Google clients — one for
  // localhost, one for your domain — and put each id here; this must be the
  // same client whose secret the server holds (GOOGLE_CLIENT_ID in
  // .dev.vars / .prod.vars), or One Tap's credential is rejected by the
  // callback. See the /google-oauth skill.
  googleClientId: import.meta.env.DEV ? '' : '',
  // The legal entity behind the Service — named in Terms, Privacy (as the
  // data controller) and on the DMCA page. Fill this in before you take a
  // single payment.
  legalEntity: {
    name: 'Your Company, Inc.',
    jurisdiction: 'Delaware, United States',
    address: ['123 Example Street', 'Wilmington, DE 19801', 'United States'],
    dmcaEmail: 'legal@example.com',
    dmcaPhone: '+1 555 0100',
  },
  social: {
    github: '',
    x: '',
  },
} as const
