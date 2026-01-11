provider "aws" {
  region = var.region
}

# =============================================================================
# Resource Migrations (rename old staging-specific resources to generic names)
# These can be removed after the migration is complete.
# =============================================================================

moved {
  from = aws_acm_certificate.staging
  to   = aws_acm_certificate.site
}

moved {
  from = aws_acm_certificate_validation.staging
  to   = aws_acm_certificate_validation.site
}

moved {
  from = aws_route53_record.staging
  to   = aws_route53_record.site
}

moved {
  from = aws_route53_record.staging_cert_validation
  to   = aws_route53_record.site_cert_validation
}

# Migrate renamed S3 bucket resources (for OAC migration)
moved {
  from = aws_s3_bucket_public_access_block.public_access
  to   = aws_s3_bucket_public_access_block.static_site
}

moved {
  from = aws_s3_bucket_policy.public_policy
  to   = aws_s3_bucket_policy.static_site
}

# =============================================================================
# CloudFront Access Logs Bucket
# =============================================================================

resource "aws_s3_bucket" "logs" {
  bucket = "${local.site_bucket_name}-logs"

  tags = merge(local.common_tags, {
    Name = "CloudFront Access Logs"
  })
}

# Grant CloudFront permission to write logs
resource "aws_s3_bucket_ownership_controls" "logs" {
  bucket = aws_s3_bucket.logs.id
  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}

resource "aws_s3_bucket_acl" "logs" {
  bucket     = aws_s3_bucket.logs.id
  acl        = "private"
  depends_on = [aws_s3_bucket_ownership_controls.logs]
}

# Block public access to logs
resource "aws_s3_bucket_public_access_block" "logs" {
  bucket = aws_s3_bucket.logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Lifecycle rules for cost control:
# - Expire logs after 14 days (staging) or 30 days (production)
resource "aws_s3_bucket_lifecycle_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id

  rule {
    id     = "expire-old-logs"
    status = "Enabled"

    expiration {
      days = var.environment == "production" ? 30 : 14
    }

    # Also clean up incomplete multipart uploads
    abort_incomplete_multipart_upload {
      days_after_initiation = 1
    }
  }
}

# =============================================================================
# Route 53 Zone (shared data source)
# =============================================================================

data "aws_route53_zone" "main" {
  name         = var.domain_name
  private_zone = false
}

# =============================================================================
# Static Site S3 Bucket (Private - accessed only via CloudFront OAC)
# =============================================================================

resource "aws_s3_bucket" "static_site" {
  bucket = local.site_bucket_name

  tags = merge(local.common_tags, {
    Name = "StaticSite"
  })
}

# Enable versioning for rollback capability
resource "aws_s3_bucket_versioning" "static_site" {
  bucket = aws_s3_bucket.static_site.id
  versioning_configuration {
    status = "Enabled"
  }
}

# Lifecycle rule to expire old versions after 30 days, but keep at least 2
resource "aws_s3_bucket_lifecycle_configuration" "static_site" {
  bucket = aws_s3_bucket.static_site.id

  rule {
    id     = "expire-old-versions"
    status = "Enabled"

    noncurrent_version_expiration {
      noncurrent_days          = 30
      newer_noncurrent_versions = 2
    }
  }

  depends_on = [aws_s3_bucket_versioning.static_site]
}

# Block all public access - CloudFront OAC will be used instead
resource "aws_s3_bucket_public_access_block" "static_site" {
  bucket = aws_s3_bucket.static_site.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Bucket policy allowing only CloudFront OAC access
resource "aws_s3_bucket_policy" "static_site" {
  bucket = aws_s3_bucket.static_site.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid       = "AllowCloudFrontServicePrincipal"
      Effect    = "Allow"
      Principal = {
        Service = "cloudfront.amazonaws.com"
      }
      Action   = "s3:GetObject"
      Resource = "${aws_s3_bucket.static_site.arn}/*"
      Condition = {
        StringEquals = {
          "AWS:SourceArn" = aws_cloudfront_distribution.cdn.arn
        }
      }
    }]
  })

  depends_on = [aws_s3_bucket_public_access_block.static_site]
}

# =============================================================================
# Content Type Mapping for S3 Objects
# =============================================================================

locals {
  content_type_map = {
    "html"  = "text/html"
    "css"   = "text/css"
    "js"    = "application/javascript"
    "json"  = "application/json"
    "png"   = "image/png"
    "jpg"   = "image/jpeg"
    "jpeg"  = "image/jpeg"
    "gif"   = "image/gif"
    "svg"   = "image/svg+xml"
    "ico"   = "image/x-icon"
    "webp"  = "image/webp"
    "woff"  = "font/woff"
    "woff2" = "font/woff2"
    "ttf"   = "font/ttf"
    "eot"   = "application/vnd.ms-fontobject"
    "xml"   = "application/xml"
    "txt"   = "text/plain"
    "pdf"   = "application/pdf"
    "map"   = "application/json"
  }
}

resource "aws_s3_object" "website_files" {
  for_each = fileset("../../out", "**/*")

  bucket       = aws_s3_bucket.static_site.id
  key          = each.value
  source       = "../../out/${each.value}"
  etag         = filemd5("../../out/${each.value}")
  content_type = lookup(local.content_type_map, try(regex("[^.]+$", each.value), ""), "application/octet-stream")
}

# =============================================================================
# ACM Certificate for Site
# =============================================================================

resource "aws_acm_certificate" "site" {
  domain_name       = local.hostname
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_route53_record" "site_cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.site.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = data.aws_route53_zone.main.zone_id
}

resource "aws_acm_certificate_validation" "site" {
  certificate_arn         = aws_acm_certificate.site.arn
  validation_record_fqdns = [for record in aws_route53_record.site_cert_validation : record.fqdn]
}

# =============================================================================
# CloudFront Origin Access Control (OAC)
# =============================================================================

resource "aws_cloudfront_origin_access_control" "static_site" {
  name                              = "${local.site_bucket_name}-oac"
  description                       = "OAC for ${local.hostname} static site"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# =============================================================================
# CloudFront Function for Redirects and URL Rewriting
# =============================================================================

resource "aws_cloudfront_function" "redirects" {
  name    = "${var.environment}-redirects"
  runtime = "cloudfront-js-2.0"
  comment = "Handle redirects and add index.html for directory requests"
  publish = true
  code    = file("${path.module}/cloudfront-redirects.js")
}

# =============================================================================
# CloudFront Distribution for Site
# =============================================================================

resource "aws_cloudfront_distribution" "cdn" {
  # Use S3 bucket with OAC (private bucket access)
  origin {
    domain_name              = aws_s3_bucket.static_site.bucket_regional_domain_name
    origin_id                = "s3-origin"
    origin_access_control_id = aws_cloudfront_origin_access_control.static_site.id
  }

  enabled         = true
  is_ipv6_enabled = true
  aliases         = [local.hostname]

  # Access logging configuration
  logging_config {
    bucket          = aws_s3_bucket.logs.bucket_domain_name
    prefix          = "cloudfront/"
    include_cookies = false
  }

  # Custom error response for 404s
  custom_error_response {
    error_code         = 404
    response_code      = 404
    response_page_path = "/404.html"
  }

  # Custom error response for 403s (S3 returns 403 for missing objects with OAC)
  custom_error_response {
    error_code         = 403
    response_code      = 404
    response_page_path = "/404.html"
  }

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "s3-origin"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    # Default: 1 day cache for HTML pages
    min_ttl     = 0
    default_ttl = 86400      # 1 day
    max_ttl     = 604800     # 7 days

    viewer_protocol_policy = "redirect-to-https"

    # Associate CloudFront Function for redirects and URL rewriting
    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.redirects.arn
    }
  }

  # Long cache for Next.js static assets (hashed filenames = immutable)
  ordered_cache_behavior {
    path_pattern     = "_next/static/*"
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "s3-origin"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 31536000   # 1 year
    default_ttl = 31536000   # 1 year
    max_ttl     = 31536000   # 1 year
    compress    = true

    viewer_protocol_policy = "redirect-to-https"
  }

  # Long cache for images
  ordered_cache_behavior {
    path_pattern     = "images/*"
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "s3-origin"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 2592000    # 30 days
    default_ttl = 2592000    # 30 days
    max_ttl     = 31536000   # 1 year
    compress    = true

    viewer_protocol_policy = "redirect-to-https"
  }

  # No cache for RSS feed (always fresh for subscribers)
  ordered_cache_behavior {
    path_pattern     = "feed.xml"
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "s3-origin"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 0
    default_ttl = 0          # No cache
    max_ttl     = 3600       # Max 1 hour if origin sets cache headers
    compress    = true

    viewer_protocol_policy = "redirect-to-https"

    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.redirects.arn
    }
  }

  price_class = "PriceClass_100"

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate_validation.site.certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  tags = merge(local.common_tags, {
    Name = "S3-CloudFront-CDN"
  })
}

# =============================================================================
# Route 53 Record for Site
# =============================================================================

resource "aws_route53_record" "site" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = local.hostname
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.cdn.domain_name
    zone_id                = "Z2FDTNDATAQYW2" # CloudFront's hosted zone ID (always the same)
    evaluate_target_health = false
  }
}

# =============================================================================
# WWW Redirect Infrastructure
# Redirects www.[hostname] to [hostname]
# =============================================================================

# S3 bucket configured purely for redirect (no content stored)
resource "aws_s3_bucket" "www_redirect" {
  bucket = local.www_bucket_name

  tags = merge(local.common_tags, {
    Name = "WWW Redirect"
  })
}

# Configure the bucket to redirect all requests to the main hostname
resource "aws_s3_bucket_website_configuration" "www_redirect" {
  bucket = aws_s3_bucket.www_redirect.id

  redirect_all_requests_to {
    host_name = local.hostname
    protocol  = "https"
  }
}

# ACM certificate for www subdomain
resource "aws_acm_certificate" "www" {
  domain_name       = "www.${local.hostname}"
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

# DNS validation record for www certificate
resource "aws_route53_record" "www_cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.www.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = data.aws_route53_zone.main.zone_id
}

# Wait for www certificate validation
resource "aws_acm_certificate_validation" "www" {
  certificate_arn         = aws_acm_certificate.www.arn
  validation_record_fqdns = [for record in aws_route53_record.www_cert_validation : record.fqdn]
}

# CloudFront distribution for www redirect
resource "aws_cloudfront_distribution" "www_redirect" {
  origin {
    domain_name = aws_s3_bucket_website_configuration.www_redirect.website_endpoint
    origin_id   = "s3-www-redirect"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  enabled         = true
  is_ipv6_enabled = true
  aliases         = ["www.${local.hostname}"]

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "s3-www-redirect"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
  }

  price_class = "PriceClass_100"

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate_validation.www.certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  tags = merge(local.common_tags, {
    Name = "WWW-Redirect-CDN"
  })
}

# Route 53 A record for www subdomain
resource "aws_route53_record" "www" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = "www.${local.hostname}"
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.www_redirect.domain_name
    zone_id                = "Z2FDTNDATAQYW2" # CloudFront's hosted zone ID
    evaluate_target_health = false
  }
}
