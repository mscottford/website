# GitHub Actions Deployments

Deploys run from GitHub Actions using short-lived AWS credentials obtained via OIDC. No
AWS access keys are stored in the repository.

## Workflows

| Workflow | Trigger | What it does |
|----------|---------|--------------|
| `ci.yml` | Pull request to `main` | Builds the site and verifies `deploy/terraform/cloudfront-redirects.js` is not stale. No AWS access, so it also runs for fork PRs. |
| `deploy-staging.yml` | Pull request to `main`, or manual dispatch | Deploys to `staging.mscottford.com` and comments the URL on the PR. |
| `deploy-production.yml` | Push to `main`, or manual dispatch | Deploys to `mscottford.com`. |

`deploy.yml` is a reusable workflow holding the shared build-and-apply steps; the two
deploy workflows are thin callers. Keeping the steps in one place means staging exercises
exactly the path production takes.

### Concurrency

Each environment has one shared S3 bucket and one terraform state file, so deploys are
serialized with a `concurrency` group per environment. `cancel-in-progress` is **false** on
both: interrupting a `terraform apply` can strand the S3 state lock or leave a partially
applied change. GitHub only cancels runs that are still queued, never one already running,
so a burst of merges collapses to "current run finishes, latest queued run goes next".

### Fork pull requests

The repository is public. Pull requests from forks get no secrets and no `id-token: write`
permission, so `deploy-staging.yml` skips itself when
`github.event.pull_request.head.repo.full_name != github.repository`. Fork PRs still get
the `ci.yml` build check.

## One-time setup

Everything below is applied by the bootstrap terraform config, which is run manually and
never from CI.

1. Add the calendar booking URL to `deploy/terraform/bootstrap/secrets.auto.tfvars`
   (gitignored), copying the value from the root `.env`:

   ```hcl
   calendar_booking_url = "https://calendar.google.com/..."
   ```

2. Preview, then apply:

   ```bash
   pnpm deploy:plan:bootstrap
   pnpm deploy:bootstrap
   ```

   This creates the GitHub OIDC provider, the `mscottford-website-github-actions` role, and
   writes the repository settings the workflows read. It needs an AWS identity with IAM
   create permissions, and a GitHub token with `repo` scope — the pnpm scripts pick one up
   from `gh auth token` automatically, or you can set `GITHUB_TOKEN` yourself.

3. Confirm the repository settings landed:

   ```bash
   gh variable list   # expect AWS_DEPLOY_ROLE_ARN
   gh secret list     # expect NEXT_PUBLIC_CALENDAR_BOOKING_URL
   ```

Set `github_repository = ""` in the bootstrap config to skip the OIDC role and repository
management entirely; the GitHub provider is then never invoked and no token is required.

## Repository settings

| Name | Kind | Source |
|------|------|--------|
| `AWS_DEPLOY_ROLE_ARN` | Variable | `github_actions_role_arn` output. Not sensitive. |
| `NEXT_PUBLIC_CALENDAR_BOOKING_URL` | Secret | `calendar_booking_url` bootstrap variable. Inlined into the static build by `src/app/calendar/page.tsx`; without it `/calendar` renders "Calendar Unavailable". |

## Why CI does not run bootstrap

`pnpm deploy:staging` and `pnpm deploy:production` run `deploy:bootstrap` first. CI instead
uses `deploy:ci:staging` / `deploy:ci:production`, which are identical minus that step.

This matters: `bootstrap/main.tf` gates the SNS topic and AWS Budget on
`var.alert_phone != ""`, and `alert_phone` comes from the gitignored
`bootstrap/secrets.auto.tfvars`. A bootstrap apply from CI would see an empty value and
**destroy the cost alerting**. Bootstrap changes stay manual.

## IAM permissions

The deploy role (`deploy/terraform/bootstrap/github-oidc.tf`) grants only what the
per-environment config touches:

- Terraform state objects under `staging/` and `production/`, including the `.tflock`
  objects used by S3-native locking.
- `s3:*` scoped by resource to the six buckets the environment config manages. Scoped by
  resource rather than by action deliberately — refreshing an `aws_s3_bucket` issues a long,
  provider-version-dependent list of `GetBucket*` calls that breaks on every upgrade.
- `cloudfront:*` on `*`. Distributions, functions, origin access controls, and invalidations
  have no resource-level IAM support.
- ACM certificate management, and Route 53 record changes scoped to the `mscottford.com`
  hosted zone.

The trust policy restricts the token `sub` to `refs/heads/main` and `pull_request` on
`mscottford/website`. Because the repository is public, an unscoped subject would let any
fork's workflow assume the role.

## Troubleshooting

**A run failed mid-apply and later runs report a state lock.** The S3 backend now uses
native locking (`use_lockfile = true` in `deploy/terraform/backend.tf`). Confirm no deploy
is actually running, then take the lock ID from the error message and:

```bash
pnpm deploy:init:staging   # or :production
cd deploy/terraform && terraform force-unlock <LOCK_ID>
```

**`configure-aws-credentials` fails to assume the role.** Check that `AWS_DEPLOY_ROLE_ARN`
is set as a repository *variable* (not a secret), and that the branch or event matches the
trust policy's `sub` conditions.

**Rolling back.** `pnpm rollback:staging` / `pnpm rollback:production` restore previous S3
object versions; see `scripts/rollback-deployment.ts`.
