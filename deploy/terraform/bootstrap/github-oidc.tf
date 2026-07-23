# =============================================================================
# GitHub Actions OIDC Identity
# =============================================================================
# Lets GitHub Actions assume an AWS role via a short-lived OIDC token instead of
# long-lived access keys stored as repository secrets.
#
# This role is scoped to what deploy/terraform (the per-environment config) needs.
# It deliberately grants nothing for this bootstrap config: bootstrap is applied
# manually and depends on gitignored secrets.auto.tfvars, so running it from CI
# would silently destroy the budget alerting.
#
# Also manages the repository-side settings the workflows read, so a single
# `pnpm deploy:bootstrap` leaves GitHub ready to deploy.
# =============================================================================

locals {
  github_enabled = var.github_repository != ""

  # "owner/repo" -> parts. try() keeps this safe when github_repository is "".
  github_owner     = try(split("/", var.github_repository)[0], "")
  github_repo_name = try(split("/", var.github_repository)[1], "")

  # Buckets created by deploy/terraform, across both environments. Derived from
  # the same naming rules used in deploy/terraform/variables.tf.
  deploy_buckets = [
    "${var.domain_name}-staging",
    "${var.domain_name}-staging-logs",
    "${var.domain_name}-production",
    "${var.domain_name}-production-logs",
    "www.staging.${var.domain_name}",
    "www.${var.domain_name}",
  ]

  deploy_bucket_arns = concat(
    [for b in local.deploy_buckets : "arn:aws:s3:::${b}"],
    [for b in local.deploy_buckets : "arn:aws:s3:::${b}/*"],
  )
}

# Hosted zone the deploy role is allowed to write records into
data "aws_route53_zone" "main" {
  name         = var.domain_name
  private_zone = false
}

# =============================================================================
# OIDC Provider
# =============================================================================

resource "aws_iam_openid_connect_provider" "github" {
  url            = "https://token.actions.githubusercontent.com"
  client_id_list = ["sts.amazonaws.com"]

  tags = merge(local.common_tags, {
    Name = "GitHub Actions OIDC"
  })
}

# =============================================================================
# Deploy Role
# =============================================================================

data "aws_iam_policy_document" "github_actions_assume_role" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.github.arn]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    # Restrict to this repository, and within it to pushes on main and to pull
    # requests. The repository is public, so an unscoped subject would let any
    # fork's workflow assume this role.
    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      values = [
        "repo:${var.github_repository}:ref:refs/heads/main",
        "repo:${var.github_repository}:pull_request",
      ]
    }
  }
}

resource "aws_iam_role" "github_actions" {
  name               = "${var.project_name}-github-actions"
  description        = "Deploy role assumed by GitHub Actions via OIDC"
  assume_role_policy = data.aws_iam_policy_document.github_actions_assume_role.json

  tags = merge(local.common_tags, {
    Name = "GitHub Actions Deploy"
  })
}

data "aws_iam_policy_document" "github_actions_deploy" {
  # --- Terraform state -------------------------------------------------------
  statement {
    sid       = "TerraformStateBucket"
    effect    = "Allow"
    actions   = ["s3:ListBucket", "s3:GetBucketLocation"]
    resources = [aws_s3_bucket.terraform_state.arn]
  }

  statement {
    sid    = "TerraformStateObjects"
    effect = "Allow"
    actions = [
      "s3:GetObject",
      "s3:PutObject",
      "s3:DeleteObject",
    ]
    # Covers both the state files and the sibling *.tflock objects written when
    # the backend has use_lockfile enabled.
    resources = [
      "${aws_s3_bucket.terraform_state.arn}/staging/*",
      "${aws_s3_bucket.terraform_state.arn}/production/*",
    ]
  }

  # --- Site buckets ----------------------------------------------------------
  # Scoped by resource rather than by action on purpose: refreshing an
  # aws_s3_bucket issues a long and provider-version-dependent list of
  # GetBucket*/GetAccelerate*/GetReplication* calls, and enumerating them breaks
  # on every provider upgrade.
  statement {
    sid       = "SiteBuckets"
    effect    = "Allow"
    actions   = ["s3:*"]
    resources = local.deploy_bucket_arns
  }

  # --- CloudFront ------------------------------------------------------------
  # Distributions, functions, origin access controls, and invalidations have no
  # resource-level IAM support, so these must be granted on "*".
  statement {
    sid       = "CloudFront"
    effect    = "Allow"
    actions   = ["cloudfront:*"]
    resources = ["*"]
  }

  # --- ACM -------------------------------------------------------------------
  statement {
    sid    = "Certificates"
    effect = "Allow"
    actions = [
      "acm:RequestCertificate",
      "acm:DescribeCertificate",
      "acm:ListCertificates",
      "acm:DeleteCertificate",
      "acm:AddTagsToCertificate",
      "acm:RemoveTagsFromCertificate",
      "acm:ListTagsForCertificate",
    ]
    resources = ["*"]
  }

  # --- Route 53 --------------------------------------------------------------
  statement {
    sid    = "HostedZoneRecords"
    effect = "Allow"
    actions = [
      "route53:ChangeResourceRecordSets",
      "route53:ListResourceRecordSets",
      "route53:GetHostedZone",
      "route53:ListTagsForResource",
    ]
    resources = ["arn:aws:route53:::hostedzone/${data.aws_route53_zone.main.zone_id}"]
  }

  statement {
    sid    = "HostedZoneLookup"
    effect = "Allow"
    actions = [
      "route53:ListHostedZones",
      "route53:ListHostedZonesByName",
      "route53:GetChange",
    ]
    resources = ["*"]
  }
}

resource "aws_iam_role_policy" "github_actions_deploy" {
  name   = "${var.project_name}-github-actions-deploy"
  role   = aws_iam_role.github_actions.id
  policy = data.aws_iam_policy_document.github_actions_deploy.json
}

# =============================================================================
# Repository Settings
# =============================================================================
# Authenticates from GITHUB_TOKEN; the pnpm deploy:*bootstrap scripts supply it
# from `gh auth token`. Set github_repository = "" to skip GitHub management
# entirely, in which case the provider is never invoked and no token is needed.

provider "github" {
  owner = local.github_owner
}

# The role ARN is not sensitive, so it goes in as a variable rather than a secret.
resource "github_actions_variable" "aws_deploy_role_arn" {
  count = local.github_enabled ? 1 : 0

  repository    = local.github_repo_name
  variable_name = "AWS_DEPLOY_ROLE_ARN"
  value         = aws_iam_role.github_actions.arn
}

# Needed at build time by src/app/calendar/page.tsx. Without it the build still
# succeeds but /calendar renders "Calendar Unavailable".
resource "github_actions_secret" "calendar_booking_url" {
  count = local.github_enabled && var.calendar_booking_url != "" ? 1 : 0

  repository      = local.github_repo_name
  secret_name     = "NEXT_PUBLIC_CALENDAR_BOOKING_URL"
  plaintext_value = var.calendar_booking_url
}
