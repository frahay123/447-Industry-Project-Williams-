# Only the values you actually need to set. Everything else is hardcoded
# for this project (us-east-1, t3.micro, Postgres, default VPC, Node 20).

variable "aws_region" {
  type        = string
  description = "AWS region for all resources."
  default     = "us-east-1"
}

variable "allowed_ssh_cidr" {
  type        = string
  description = "CIDR allowed to SSH into EC2. Set to your IP/32 for security."
  default     = "0.0.0.0/0"
}

variable "ssh_public_key_file" {
  type        = string
  description = "Path to your SSH public key file."
  default     = "~/.ssh/id_ed25519.pub"
}

variable "create_rds" {
  type        = bool
  description = "Create an RDS Postgres instance (adds ~$15/mo). Set false to skip."
  default     = true
}

variable "db_name" {
  type        = string
  description = "Postgres database name."
  default     = "mec2tracker"
}

variable "db_username" {
  type        = string
  description = "Postgres master username."
  default     = "mec2admin"
}

variable "db_password" {
  type        = string
  description = "Postgres master password. Leave empty to auto-generate."
  default     = ""
  sensitive   = true
}

variable "enable_ec2" {
  type        = bool
  description = "If true, create the EC2 backend for demos. If false, EC2 is destroyed (RDS/S3/IAM remain)."
  default     = false
}
