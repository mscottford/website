# =============================================================================
# Bootstrap Configuration - Shared Resources
# =============================================================================
# This configuration manages resources shared across all environments:
# - Terraform state S3 bucket
# - Cost budget and alerts (SNS topic, subscriptions, budget)
#
# Run this configuration once before setting up environments.
# =============================================================================

provider "aws" {
  region = var.region
}

# =============================================================================
# Terraform State Bucket
# =============================================================================

resource "aws_s3_bucket" "terraform_state" {
  bucket = "${var.domain_name}-tfstate"

  tags = merge(local.common_tags, {
    Name = "Terraform State"
  })

  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_s3_bucket_versioning" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Block public access to state bucket
resource "aws_s3_bucket_public_access_block" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# =============================================================================
# Cost Budget and Alerts
# Created when TF_VAR_alert_phone environment variable is set
# =============================================================================

# SNS topic for budget alerts
resource "aws_sns_topic" "budget_alerts" {
  count = var.alert_phone != "" ? 1 : 0
  name  = "${var.project_name}-budget-alerts"

  tags = merge(local.common_tags, {
    Name = "Budget Alerts"
  })
}

# SNS topic policy to allow AWS Budgets to publish
resource "aws_sns_topic_policy" "budget_alerts" {
  count = var.alert_phone != "" ? 1 : 0
  arn   = aws_sns_topic.budget_alerts[0].arn
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid    = "AllowBudgetsPublish"
      Effect = "Allow"
      Principal = {
        Service = "budgets.amazonaws.com"
      }
      Action   = "SNS:Publish"
      Resource = aws_sns_topic.budget_alerts[0].arn
    }]
  })
}

# SMS subscription for budget alerts
resource "aws_sns_topic_subscription" "budget_alerts_sms" {
  count     = var.alert_phone != "" ? 1 : 0
  topic_arn = aws_sns_topic.budget_alerts[0].arn
  protocol  = "sms"
  endpoint  = var.alert_phone
}

# AWS Budget tracking only resources tagged with Project = var.project_name
resource "aws_budgets_budget" "monthly" {
  count        = var.alert_phone != "" ? 1 : 0
  name         = "${var.project_name}-monthly"
  budget_type  = "COST"
  limit_amount = tostring(var.monthly_budget)
  limit_unit   = "USD"
  time_unit    = "MONTHLY"

  # Filter to only track resources with our project tag
  # Format is "TagKey$TagValue" - the $ is a literal separator
  cost_filter {
    name   = "TagKeyValue"
    values = ["Project${"$"}${var.project_name}"]
  }

  # Alert at 80% of budget
  notification {
    comparison_operator       = "GREATER_THAN"
    threshold                 = 80
    threshold_type            = "PERCENTAGE"
    notification_type         = "ACTUAL"
    subscriber_sns_topic_arns = [aws_sns_topic.budget_alerts[0].arn]
  }

  # Alert when forecast exceeds budget
  notification {
    comparison_operator       = "GREATER_THAN"
    threshold                 = 100
    threshold_type            = "PERCENTAGE"
    notification_type         = "FORECASTED"
    subscriber_sns_topic_arns = [aws_sns_topic.budget_alerts[0].arn]
  }

  # Alert when actual exceeds budget
  notification {
    comparison_operator       = "GREATER_THAN"
    threshold                 = 100
    threshold_type            = "PERCENTAGE"
    notification_type         = "ACTUAL"
    subscriber_sns_topic_arns = [aws_sns_topic.budget_alerts[0].arn]
  }
}
