# =============================================================================
# Bootstrap Configuration Variables
# These are shared resources used by all environments
# =============================================================================

variable "region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "us-east-1"
}

variable "domain_name" {
  description = "Root domain name (used for naming conventions)"
  type        = string
  default     = "mscottford.com"
}

variable "project_name" {
  description = "Project name for tagging and resource naming"
  type        = string
  default     = "mscottford-website"
}

variable "alert_phone" {
  description = "Phone number for cost alerts in E.164 format, e.g. +12065551234 (set via TF_VAR_alert_phone environment variable)"
  type        = string
  default     = ""
  sensitive   = true
}

variable "monthly_budget" {
  description = "Monthly budget threshold in USD for cost alerts"
  type        = number
  default     = 10
}

variable "github_repository" {
  description = "GitHub repository as \"owner/repo\". Set to \"\" to skip creating the OIDC deploy role and managing repository settings."
  type        = string
  default     = "mscottford/website"

  validation {
    condition     = var.github_repository == "" || length(split("/", var.github_repository)) == 2
    error_message = "github_repository must be in \"owner/repo\" form, or an empty string to disable."
  }
}

variable "calendar_booking_url" {
  description = "Google Calendar booking URL, published to GitHub as the NEXT_PUBLIC_CALENDAR_BOOKING_URL Actions secret (set via secrets.auto.tfvars or TF_VAR_calendar_booking_url). Copy the value from the root .env file."
  type        = string
  default     = ""
  sensitive   = true
}

# =============================================================================
# Derived Values
# =============================================================================

locals {
  # Common tags for shared resources
  common_tags = {
    Project   = var.project_name
    ManagedBy = "terraform-bootstrap"
  }
}
