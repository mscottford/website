provider "aws" {
  region = var.region
}

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

resource "aws_s3_bucket" "static_site" {
  bucket = "mscottford.com-staging" # Change to a globally unique name

  tags = {
    Name        = "StaticSite"
    Environment = "Staging"
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
  aliases             = ["staging.${var.domain_name}"]

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
    acm_certificate_arn      = aws_acm_certificate_validation.staging.certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  tags = {
    Name = "S3-CloudFront-CDN"
  }
}


# Replace with your actual domain
variable "domain_name" {
  default = "mscottford.com"
}

data "aws_route53_zone" "main" {
  name         = var.domain_name
  private_zone = false
}

# ACM certificate for staging subdomain (must be in us-east-1 for CloudFront)
resource "aws_acm_certificate" "staging" {
  domain_name       = "staging.${var.domain_name}"
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

# DNS validation record for the certificate
resource "aws_route53_record" "staging_cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.staging.domain_validation_options : dvo.domain_name => {
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

# Wait for certificate validation
resource "aws_acm_certificate_validation" "staging" {
  certificate_arn         = aws_acm_certificate.staging.arn
  validation_record_fqdns = [for record in aws_route53_record.staging_cert_validation : record.fqdn]
}

resource "aws_route53_record" "staging" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = "staging.${var.domain_name}"
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.cdn.domain_name
    zone_id                = "Z2FDTNDATAQYW2" # CloudFront's hosted zone ID (always the same)
    evaluate_target_health = false
  }
}

