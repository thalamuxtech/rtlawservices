// Secrets set with `wrangler secret put`. They are optional: without them the
// site works, but cannot send email or start a rebuild.
interface Env {
  BREVO_API_KEY?: string;
  GITHUB_TOKEN?: string;
}
