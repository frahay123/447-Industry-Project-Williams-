# Zip repo ../backend and upload so EC2 user_data stays under the 16 KiB limit.

data "archive_file" "api_bootstrap" {
  type        = "zip"
  source_dir  = abspath("${path.module}/../backend")
  output_path = "${path.module}/.terraform/mec2-api-bootstrap.zip"
  excludes    = ["node_modules", "**/node_modules/**", ".DS_Store", "**/.DS_Store"]
}

resource "aws_s3_object" "api_bootstrap" {
  bucket       = aws_s3_bucket.delivery_images.id
  key          = "bootstrap/mec2-api.zip"
  source       = data.archive_file.api_bootstrap.output_path
  etag         = data.archive_file.api_bootstrap.output_md5
  content_type = "application/zip"

  depends_on = [
    aws_s3_bucket_versioning.delivery_images,
    aws_s3_bucket_public_access_block.delivery_images,
  ]
}
