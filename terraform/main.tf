# ─────────────────────────────────────────────────────────────────────────────
# MEC2 Tracker — Core infrastructure
# EC2 API server, S3 image bucket, IAM role, networking, outputs
# ─────────────────────────────────────────────────────────────────────────────

# ─── Computed values ──────────────────────────────────────────────────────────

locals {
  project     = "mec2-tracker"
  environment = "dev"

  ssh_public_key = trimspace(file(pathexpand(var.ssh_public_key_file)))
  vpc_id         = data.aws_vpc.default.id
  ec2_subnet_id  = data.aws_subnets.in_vpc.ids[0]

  common_tags = {
    Project     = "mec2-tracker"
    Environment = "dev"
  }
}

# ─── Network data (uses the account default VPC) ─────────────────────────────

data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "in_vpc" {
  filter {
    name   = "vpc-id"
    values = [local.vpc_id]
  }
}

data "aws_ami" "al2023" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-kernel-*-x86_64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# ─── SSH Key Pair ─────────────────────────────────────────────────────────────

resource "aws_key_pair" "deploy" {
  key_name   = "${local.project}-deploy-${local.environment}"
  public_key = local.ssh_public_key
}

# ─── EC2 Security Group ──────────────────────────────────────────────────────

resource "aws_security_group" "ec2" {
  name        = "${local.project}-ec2-sg"
  description = "API host: SSH from allowed CIDR; HTTP/HTTPS for future API (SRS HTTPS)."
  vpc_id      = local.vpc_id

  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.allowed_ssh_cidr]
  }

  ingress {
    description = "HTTP (redirect or dev API)"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS (terminate on instance or proxy)"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "Express dev API"
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, { Name = "${local.project}-ec2-sg" })
}

# ─── IAM Role (lets EC2 read/write S3 delivery images without hardcoded keys)─

data "aws_iam_policy_document" "ec2_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
  }
}

data "aws_iam_policy_document" "ec2_s3_delivery_images" {
  statement {
    sid    = "ObjectRWUnderDeliveriesPrefix"
    effect = "Allow"
    actions = [
      "s3:PutObject",
      "s3:GetObject",
      "s3:DeleteObject",
    ]
    resources = ["${aws_s3_bucket.delivery_images.arn}/deliveries/*"]
  }

  statement {
    sid    = "BootstrapBundleRead"
    effect = "Allow"
    actions = [
      "s3:GetObject",
    ]
    resources = ["${aws_s3_bucket.delivery_images.arn}/bootstrap/*"]
  }

  statement {
    sid    = "ListDeliveriesPrefix"
    effect = "Allow"
    actions = [
      "s3:ListBucket",
    ]
    resources = [aws_s3_bucket.delivery_images.arn]
    condition {
      test     = "StringLike"
      variable = "s3:prefix"
      values   = ["deliveries/*"]
    }
  }
}

resource "aws_iam_role" "ec2_app" {
  name               = "${local.project}-ec2-app-role"
  assume_role_policy = data.aws_iam_policy_document.ec2_assume.json

  tags = merge(local.common_tags, { Name = "${local.project}-ec2-app-role" })
}

resource "aws_iam_role_policy" "ec2_s3" {
  name   = "${local.project}-ec2-s3-delivery-images"
  role   = aws_iam_role.ec2_app.id
  policy = data.aws_iam_policy_document.ec2_s3_delivery_images.json
}

resource "aws_iam_instance_profile" "ec2_app" {
  name = "${local.project}-ec2-app-profile"
  role = aws_iam_role.ec2_app.name
}

# Session Manager (no SSH required for troubleshooting: aws ssm start-session --target <instance-id>)
resource "aws_iam_role_policy_attachment" "ec2_ssm_core" {
  role       = aws_iam_role.ec2_app.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

# ─── EC2 Instance ─────────────────────────────────────────────────────────────

resource "aws_instance" "api" {
  ami                         = data.aws_ami.al2023.id
  count                       = var.enable_ec2 ? 1 : 0
  # t3.nano is not Free Tier–eligible; t3.micro is (see AWS EC2 Free Tier).
  instance_type               = "t3.micro"
  subnet_id                   = local.ec2_subnet_id
  associate_public_ip_address = true
  vpc_security_group_ids      = [aws_security_group.ec2.id]
  key_name                    = aws_key_pair.deploy.key_name
  iam_instance_profile        = aws_iam_instance_profile.ec2_app.name

  user_data = templatefile("${path.module}/user_data.tpl", {
    ssh_public_key = local.ssh_public_key
    db_host        = aws_db_instance.main[0].address
    db_port        = 5432
    db_name        = var.db_name
    db_user        = var.db_username
    db_password    = var.db_password != "" ? var.db_password : random_password.db[0].result
    s3_bucket      = aws_s3_bucket.delivery_images.id
    aws_region     = var.aws_region
  })

  user_data_replace_on_change = true

  # RDS ready; bootstrap zip in S3 (user_data < 16 KiB — code loaded from S3).
  depends_on = [
    aws_db_instance.main,
    aws_s3_object.api_bootstrap,
  ]

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
  }

  root_block_device {
    # AMI root snapshot (e.g. AL2023) enforces a minimum size (often 30 GiB).
    # Smaller values fail with: InvalidBlockDeviceMapping ... expect size >= 30GB
    volume_size           = 30
    volume_type           = "gp3"
    encrypted             = true
    delete_on_termination = true
  }

  tags = merge(local.common_tags, {
    Name = "${local.project}-api"
  })
}

# Elastic IP: stable public address when the instance is replaced (same URL after taint/apply).
# Full terraform destroy still releases the EIP; re-apply then run scripts/sync-expo-api-url.sh.
resource "aws_eip" "api" {
  count  = var.enable_ec2 ? 1 : 0
  domain = "vpc"

  tags = merge(local.common_tags, { Name = "${local.project}-api-eip" })
}

resource "aws_eip_association" "api" {
  count         = var.enable_ec2 ? 1 : 0
  instance_id   = aws_instance.api[0].id
  allocation_id = aws_eip.api[0].id
}

# ─── S3 Bucket (packing slip / delivery images) ──────────────────────────────

resource "random_id" "bucket_suffix" {
  byte_length = 4
}

resource "aws_s3_bucket" "delivery_images" {
  bucket        = "${local.project}-delivery-images-${random_id.bucket_suffix.hex}"
  force_destroy = true # empty bucket (all versions) on terraform destroy

  tags = merge(local.common_tags, {
    Name = "${local.project}-delivery-images"
  })
}

resource "aws_s3_bucket_public_access_block" "delivery_images" {
  bucket = aws_s3_bucket.delivery_images.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "delivery_images" {
  bucket = aws_s3_bucket.delivery_images.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_versioning" "delivery_images" {
  bucket = aws_s3_bucket.delivery_images.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_ownership_controls" "delivery_images" {
  bucket = aws_s3_bucket.delivery_images.id
  rule {
    object_ownership = "BucketOwnerEnforced"
  }

  depends_on = [aws_s3_bucket_public_access_block.delivery_images]
}

# Versioned buckets sometimes still fail DeleteBucket even with force_destroy; empty
# all versions/delete markers first (destroy order: this resource before the bucket).
resource "null_resource" "delivery_images_bucket_empty_on_destroy" {
  depends_on = [
    aws_s3_bucket.delivery_images,
    aws_s3_bucket_versioning.delivery_images,
    aws_s3_bucket_public_access_block.delivery_images,
    aws_s3_bucket_server_side_encryption_configuration.delivery_images,
    aws_s3_bucket_ownership_controls.delivery_images,
  ]

  triggers = {
    bucket_id  = aws_s3_bucket.delivery_images.id
    aws_region = var.aws_region
  }

  provisioner "local-exec" {
    when    = destroy
    command = "bash \"${path.module}/scripts/empty_versioned_bucket.sh\" \"${self.triggers.bucket_id}\" \"${self.triggers.aws_region}\""
  }
}

# ─── Outputs ──────────────────────────────────────────────────────────────────

output "ec2_public_ip" {
  description = "Elastic IP for the API (use this for SSH and the mobile app; stable across instance replacement)."
  value       = var.enable_ec2 ? aws_eip.api[0].public_ip : null
}

output "expo_extra_api_url" {
  description = "Paste into app.json → expo.extra.apiUrl (HTTP port 80 via nginx). After full destroy/apply, run scripts/sync-expo-api-url.sh to update the file."
  value       = var.enable_ec2 ? "http://${aws_eip.api[0].public_ip}" : null
}

output "ec2_public_dns" {
  description = "Public DNS name of the API EC2 instance."
  value       = var.enable_ec2 ? aws_instance.api[0].public_dns : null
}

output "ssh_deployer_command" {
  description = "Example SSH to deployment user after user_data completes."
  value       = var.enable_ec2 ? "ssh -i <path-to-private-key> deployer@${aws_eip.api[0].public_ip}" : null
}

output "ssh_ec2_user_command" {
  description = "SSH as ec2-user (same key pair; useful if deployer setup is still running)."
  value       = var.enable_ec2 ? "ssh -i <path-to-private-key> ec2-user@${aws_eip.api[0].public_ip}" : null
}

output "s3_bucket_name" {
  description = "Private bucket for delivery / packing slip images (SRS FR-9, §7.2)."
  value       = aws_s3_bucket.delivery_images.id
}

output "s3_deliveries_prefix" {
  description = "Use this key prefix in your API for IAM-scoped uploads."
  value       = "deliveries/"
}

output "ec2_security_group_id" {
  value = aws_security_group.ec2.id
}

output "rds_endpoint" {
  description = "RDS hostname:port (if create_rds is true)."
  value       = var.create_rds ? aws_db_instance.main[0].endpoint : null
}

output "rds_address" {
  description = "RDS hostname only."
  value       = var.create_rds ? aws_db_instance.main[0].address : null
}

output "rds_port" {
  value = var.create_rds ? aws_db_instance.main[0].port : null
}

output "rds_master_username" {
  description = "RDS master username."
  value       = var.create_rds ? var.db_username : null
}

output "rds_master_password" {
  description = "RDS master password when Terraform generated it (empty db_password). Null if you set db_password or RDS is disabled."
  value       = var.create_rds && var.db_password == "" ? random_password.db[0].result : null
  sensitive   = true
}

output "rds_engine" {
  value = var.create_rds ? aws_db_instance.main[0].engine : null
}
