# ─────────────────────────────────────────────────────────────────────────────
# RDS Postgres — only created when create_rds = true
# Set create_rds = false in terraform.tfvars to skip (saves ~$15/mo).
# ─────────────────────────────────────────────────────────────────────────────

resource "random_password" "db" {
  count   = var.create_rds ? 1 : 0
  length  = 24
  special = false
}

resource "aws_security_group" "rds" {
  count = var.create_rds ? 1 : 0

  name        = "${local.project}-rds-sg"
  description = "RDS: allow DB port only from EC2 API security group."
  vpc_id      = local.vpc_id

  ingress {
    description     = "Database from API host"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, { Name = "${local.project}-rds-sg" })
}

resource "aws_db_subnet_group" "main" {
  count = var.create_rds ? 1 : 0

  name       = "${local.project}-db-subnet"
  subnet_ids = data.aws_subnets.in_vpc.ids

  tags = merge(local.common_tags, { Name = "${local.project}-db-subnet-group" })
}

resource "aws_db_instance" "main" {
  count = var.create_rds ? 1 : 0

  identifier                 = "${local.project}-db"
  db_subnet_group_name       = aws_db_subnet_group.main[0].name
  vpc_security_group_ids     = [aws_security_group.rds[0].id]
  engine                     = "postgres"
  engine_version             = "16"
  instance_class             = "db.t3.micro"
  allocated_storage          = 20
  storage_type               = "gp3"
  storage_encrypted          = true
  db_name                    = var.db_name
  username                   = var.db_username
  password                   = var.db_password != "" ? var.db_password : random_password.db[0].result
  skip_final_snapshot        = true
  publicly_accessible        = false
  backup_retention_period    = 1
  auto_minor_version_upgrade = true

  tags = merge(local.common_tags, { Name = "${local.project}-rds" })
}
