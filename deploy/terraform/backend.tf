terraform {
  backend "s3" {
    bucket = "mscottford.com-tfstate"
    key    = "terraform.tfstate"
    region = "us-east-1"
    encrypt = true
  }
}
