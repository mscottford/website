# =============================================================================
# Environment Configuration
# =============================================================================

variable "environment" {
  description = "Deployment environment (staging or production)"
  type        = string

  validation {
    condition     = contains(["staging", "production"], var.environment)
    error_message = "Environment must be either 'staging' or 'production'."
  }
}

variable "region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "us-east-1"
}

variable "domain_name" {
  description = "Root domain name"
  type        = string
  default     = "mscottford.com"
}

# =============================================================================
# Derived Values
# =============================================================================

locals {
  # Full hostname for this environment
  hostname = var.environment == "production" ? var.domain_name : "${var.environment}.${var.domain_name}"

  # S3 bucket name for static site
  site_bucket_name = "${var.domain_name}-${var.environment}"

  # WWW redirect bucket name
  www_bucket_name = "www.${local.hostname}"

  # Environment tag (capitalized)
  environment_tag = var.environment == "production" ? "Production" : "Staging"

  # Site URL for build
  site_url = "https://${local.hostname}"

  # Common tags applied to all resources for cost tracking
  common_tags = {
    Project     = "mscottford-website"
    Environment = local.environment_tag
  }
}
