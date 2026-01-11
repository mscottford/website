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

# =============================================================================
# Terraform State Bucket (shared across environments)
# =============================================================================

resource "aws_s3_bucket" "terraform_state" {
  bucket = "mscottford.com-tfstate"

  lifecycle {
    prevent_destroy = false
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

# =============================================================================
# Route 53 Zone (shared data source)
# =============================================================================

data "aws_route53_zone" "main" {
  name         = var.domain_name
  private_zone = false
}

# =============================================================================
# Static Site S3 Bucket
# =============================================================================

resource "aws_s3_bucket" "static_site" {
  bucket = local.site_bucket_name

  tags = {
    Name        = "StaticSite"
    Environment = local.environment_tag
  }
}

resource "aws_s3_bucket_website_configuration" "static_site" {
  bucket = aws_s3_bucket.static_site.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "404.html"
  }

  routing_rules = file("${path.module}/s3-routing-rules.json")
}

resource "aws_s3_bucket_public_access_block" "public_access" {
  bucket = aws_s3_bucket.static_site.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_policy" "public_policy" {
  bucket = aws_s3_bucket.static_site.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid       = "PublicReadGetObject"
      Effect    = "Allow"
      Principal = "*"
      Action    = "s3:GetObject"
      Resource  = "${aws_s3_bucket.static_site.arn}/*"
    }]
  })
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
# CloudFront Distribution for Site
# =============================================================================

resource "aws_cloudfront_distribution" "cdn" {
  # Use S3 website endpoint as custom origin to support routing rules (redirects)
  origin {
    domain_name = aws_s3_bucket_website_configuration.static_site.website_endpoint
    origin_id   = "s3-website-origin"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only" # S3 website endpoints only support HTTP
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  aliases             = [local.hostname]

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "s3-website-origin"

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
    acm_certificate_arn      = aws_acm_certificate_validation.site.certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  tags = {
    Name        = "S3-CloudFront-CDN"
    Environment = local.environment_tag
  }
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

  tags = {
    Name        = "WWW Redirect"
    Environment = local.environment_tag
  }
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

  tags = {
    Name        = "WWW-Redirect-CDN"
    Environment = local.environment_tag
  }
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
