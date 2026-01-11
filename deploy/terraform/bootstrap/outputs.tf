# =============================================================================
# Bootstrap Outputs
# These values are referenced by environment configurations via remote state
# =============================================================================

output "terraform_state_bucket" {
  description = "The S3 bucket name for Terraform state"
  value       = aws_s3_bucket.terraform_state.bucket
}

output "terraform_state_bucket_arn" {
  description = "The ARN of the Terraform state S3 bucket"
  value       = aws_s3_bucket.terraform_state.arn
}

output "sns_topic_arn" {
  description = "The ARN of the SNS topic for budget alerts (empty if not configured)"
  value       = length(aws_sns_topic.budget_alerts) > 0 ? aws_sns_topic.budget_alerts[0].arn : ""
}

output "budget_name" {
  description = "The name of the AWS Budget (empty if not configured)"
  value       = length(aws_budgets_budget.monthly) > 0 ? aws_budgets_budget.monthly[0].name : ""
}
