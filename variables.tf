

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

variable "bedrock_model_id" {
  type        = string
  description = "Amazon Bedrock model for PO/slip JSON normalization (Nova or Titan Text)."
  default     = "amazon.nova-pro-v1:0"
}

variable "ses_enable_email_identity" {
  type        = bool
  description = "If true, create and verify a single SES email identity (AWS sends a confirmation link). Disable if you verify senders manually or use a domain identity."
  default     = false
}

variable "ses_transactional_from_email" {
  type        = string
  description = "Default transactional From address for SES (must match Admin Settings / app DB unless you only use env)."
  default     = "frankhl1@umbc.edu"
}
