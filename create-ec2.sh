#!/bin/bash

# Configuration
REGION="ap-south-1"
KEY_NAME="lab-exam-key"
INSTANCE_NAME="lab-exam"
INSTANCE_TYPE="t2.micro"
SG_NAME="lab-exam-sg"
SG_DESC="Allow SSH on port 22"

echo "Creating AWS EC2 instance in region $REGION..."

# 1. Create a key pair and save the .pem file
echo "1. Creating key pair: $KEY_NAME"
aws ec2 create-key-pair \
    --region "$REGION" \
    --key-name "$KEY_NAME" \
    --query 'KeyMaterial' \
    --output text > "${KEY_NAME}.pem"

# Set permissions for the .pem file
chmod 400 "${KEY_NAME}.pem"
echo "   Key pair saved as ${KEY_NAME}.pem"

# 2. Create a security group
echo "2. Creating security group: $SG_NAME"
# Get the default VPC ID
VPC_ID=$(aws ec2 describe-vpcs --region "$REGION" --query 'Vpcs[?IsDefault==`true`].VpcId' --output text)

if [ -z "$VPC_ID" ] || [ "$VPC_ID" == "None" ]; then
    echo "Could not find a default VPC. Please specify a VPC manually."
    exit 1
fi

SG_ID=$(aws ec2 create-security-group \
    --region "$REGION" \
    --group-name "$SG_NAME" \
    --description "$SG_DESC" \
    --vpc-id "$VPC_ID" \
    --query 'GroupId' \
    --output text)
echo "   Created security group with ID: $SG_ID"

# Allow SSH on port 22
echo "   Authorizing SSH (port 22) ingress for $SG_ID"
aws ec2 authorize-security-group-ingress \
    --region "$REGION" \
    --group-id "$SG_ID" \
    --protocol tcp \
    --port 22 \
    --cidr 0.0.0.0/0

# 3. Get latest Amazon Linux 2 AMI ID in ap-south-1
echo "3. Fetching latest Amazon Linux 2 AMI in $REGION..."
AMI_ID=$(aws ssm get-parameters \
    --region "$REGION" \
    --names /aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2 \
    --query 'Parameters[0].Value' \
    --output text)

echo "   Using AMI ID: $AMI_ID"

# 4. Create the instance
echo "4. Launching EC2 instance ($INSTANCE_TYPE)..."
INSTANCE_ID=$(aws ec2 run-instances \
    --region "$REGION" \
    --image-id "$AMI_ID" \
    --instance-type "$INSTANCE_TYPE" \
    --key-name "$KEY_NAME" \
    --security-group-ids "$SG_ID" \
    --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=$INSTANCE_NAME}]" \
    --query 'Instances[0].InstanceId' \
    --output text)

echo "   Launched instance: $INSTANCE_ID"

echo "Waiting for instance to be in 'running' state..."
aws ec2 wait instance-running --region "$REGION" --instance-ids "$INSTANCE_ID"

# Get public IP
PUBLIC_IP=$(aws ec2 describe-instances \
    --region "$REGION" \
    --instance-ids "$INSTANCE_ID" \
    --query 'Reservations[0].Instances[0].PublicIpAddress' \
    --output text)

echo "========================================================"
echo "Instance '$INSTANCE_NAME' is successfully running!"
echo "Instance ID: $INSTANCE_ID"
echo "Public IP: $PUBLIC_IP"
echo "You can SSH into it using the following command:"
echo "ssh -i ${KEY_NAME}.pem ec2-user@$PUBLIC_IP"
echo "========================================================"
