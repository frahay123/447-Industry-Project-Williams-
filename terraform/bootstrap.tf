# Zip the backend repo so EC2 user_data can download it instead of embedding it directly.
# This helps keep user_data under the 16 KiB size limit.
data "archive_file" "api_bootstrap" {
  # Create a zip file.
  type = "zip"

  # Folder that will be zipped.
  # This points to the backend folder one level above this Terraform module.
  source_dir = abspath("${path.module}/../backend")

  # Where Terraform will save the generated zip file locally.
  output_path = "${path.module}/.terraform/mec2-api-bootstrap.zip"

  # Files/folders to leave out of the zip.
  # node_modules is excluded because it is large and can be installed later.
  # .DS_Store is excluded because it is just a macOS metadata file.
  excludes = [
    "node_modules",
    "**/node_modules/**",
    ".DS_Store",
    "**/.DS_Store"
  ]
}

# Upload the generated backend zip file to S3.
resource "aws_s3_object" "api_bootstrap" {
  # The S3 bucket where the zip file will be stored.
  bucket = aws_s3_bucket.delivery_images.id

  # The path/name of the file inside the S3 bucket.
  key = "bootstrap/mec2-api.zip"

  # The local zip file that gets uploaded.
  source = data.archive_file.api_bootstrap.output_path

  # Used by Terraform to detect when the zip file changes.
  # If the zip changes, Terraform knows it needs to re-upload it.
  etag = data.archive_file.api_bootstrap.output_md5

  # Tells S3 that this object is a zip file.
  content_type = "application/zip"

  # Make sure these S3 bucket settings are applied before uploading the zip.
  depends_on = [
    aws_s3_bucket_versioning.delivery_images,
    aws_s3_bucket_public_access_block.delivery_images,
  ]
}