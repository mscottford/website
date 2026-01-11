# =============================================================================
# Environment Backend Configuration
# =============================================================================
#
# This configuration manages per-environment resources (S3 site, CloudFront, DNS).
# Shared resources (tfstate bucket, budget alerts) are managed in bootstrap/.
#
# State files are stored per-environment:
#   - bootstrap/terraform.tfstate  (shared resources)
#   - staging/terraform.tfstate    (staging environment)
#   - production/terraform.tfstate (production environment)
#
# IMPORTANT: Always use the pnpm scripts to ensure correct backend initialization.
# Running tofu commands directly without proper init can cause cross-environment
# state corruption (e.g., production deploy deleting staging resources).
#
# Safe commands:
#   pnpm deploy:plan:bootstrap      # Plan shared infrastructure changes
#   pnpm deploy:bootstrap           # Apply shared infrastructure
#   pnpm deploy:plan:staging        # Plan staging changes
#   pnpm deploy:plan:production     # Plan production changes
#   pnpm deploy:staging             # Full staging deploy
#   pnpm deploy:production          # Full production deploy
#   pnpm deploy:terraform:staging   # Apply terraform only (includes init)
#   pnpm deploy:terraform:production # Apply terraform only (includes init)

terraform {
  backend "s3" {
    bucket  = "mscottford.com-tfstate"
    region  = "us-east-1"
    encrypt = true
    # key is provided via -backend-config to allow separate state per environment
  }
}
