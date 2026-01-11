# =============================================================================
# Bootstrap Backend Configuration
# =============================================================================
#
# The bootstrap configuration stores its state in the same S3 bucket it manages.
# This works because the bucket already exists from previous deployments.
#
# For a brand new setup, you would need to:
# 1. Comment out the backend block below
# 2. Run: tofu init && tofu apply
# 3. Uncomment the backend block
# 4. Run: tofu init -migrate-state
#
# Initialize with:
#   cd deploy/terraform/bootstrap
#   tofu init
#
# Or use the pnpm script:
#   pnpm deploy:init:bootstrap

terraform {
  backend "s3" {
    bucket  = "mscottford.com-tfstate"
    key     = "bootstrap/terraform.tfstate"
    region  = "us-east-1"
    encrypt = true
  }
}
