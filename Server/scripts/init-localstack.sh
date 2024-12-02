#!/bin/bash

echo "Waiting for LocalStack to start..."
until curl -sf http://localstack:4566 > /dev/null; do
  sleep 2
  echo "Waiting for LocalStack to be ready..."
done

echo "LocalStack is up. Initializing S3 bucket..."

# Ensure S3 bucket exists
awslocal s3api create-bucket --bucket citrineos-s3-bucket --region us-east-1 || true

# Wait to ensure bucket is initialized
sleep 5

# Apply CORS configuration
echo "Applying CORS configuration..."
cat <<EOT > cors.json
{
    "CORSRules": [
        {
            "AllowedOrigins": ["*"],
            "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
            "AllowedHeaders": ["*"],
            "ExposeHeaders": ["ETag"]
        }
    ]
}
EOT

awslocal s3api put-bucket-cors --bucket citrineos-s3-bucket --cors-configuration file://cors.json
echo "CORS configuration applied successfully."

# Verify bucket and configuration
echo "Verifying bucket and CORS configuration..."
awslocal s3api get-bucket-cors --bucket citrineos-s3-bucket
