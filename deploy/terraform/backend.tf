# Backend configuration uses partial configuration.
# The 'key' is specified via -backend-config at init time to separate state per environment.
#
# Initialize for staging:
#   tofu init -backend-config="key=staging/terraform.tfstate" -reconfigure
#
# Initialize for production:
#   tofu init -backend-config="key=production/terraform.tfstate" -reconfigure

terraform {
  backend "s3" {
    bucket  = "mscottford.com-tfstate"
    region  = "us-east-1"
    encrypt = true
    # key is provided via -backend-config to allow separate state per environment
  }
}
