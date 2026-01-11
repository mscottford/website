output "environment" {
  description = "The deployment environment"
  value       = var.environment
}

output "site_url" {
  description = "The URL of the deployed site"
  value       = "https://${local.hostname}"
}

output "s3_bucket" {
  description = "The S3 bucket name for the static site"
  value       = aws_s3_bucket.static_site.bucket
}

output "s3_website_url" {
  description = "The S3 website endpoint URL"
  value       = "http://${aws_s3_bucket_website_configuration.static_site.website_endpoint}"
}

output "cloudfront_domain_name" {
  description = "The CloudFront distribution domain name"
  value       = aws_cloudfront_distribution.cdn.domain_name
}

output "cloudfront_distribution_id" {
  description = "The CloudFront distribution ID (for cache invalidation)"
  value       = aws_cloudfront_distribution.cdn.id
}
