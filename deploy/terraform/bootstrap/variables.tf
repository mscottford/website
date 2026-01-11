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
