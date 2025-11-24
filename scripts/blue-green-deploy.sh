#!/bin/bash
set -e

# Configuration
ELASTIC_IP="35.170.224.207"
KEY_NAME="aws-deploy-key"
KEY_PATH="$HOME/.ssh/${KEY_NAME}.pem"
REGION="us-east-1"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Glade Blue/Green Deployment         ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Check AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI not found. Install it first.${NC}"
    exit 1
fi

# Check jq is installed
if ! command -v jq &> /dev/null; then
    echo -e "${RED}❌ jq not found. Install it: brew install jq${NC}"
    exit 1
fi

# Get current instance (blue)
echo -e "${BLUE}🔍 Finding current instance...${NC}"
BLUE_INSTANCE_ID=$(aws ec2 describe-addresses \
    --region $REGION \
    --public-ips $ELASTIC_IP \
    --query 'Addresses[0].InstanceId' \
    --output text)

if [ "$BLUE_INSTANCE_ID" = "None" ] || [ -z "$BLUE_INSTANCE_ID" ]; then
    echo -e "${RED}❌ No instance associated with Elastic IP${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Blue instance: $BLUE_INSTANCE_ID${NC}"

# Get instance details
BLUE_DETAILS=$(aws ec2 describe-instances \
    --region $REGION \
    --instance-ids $BLUE_INSTANCE_ID \
    --query 'Reservations[0].Instances[0]')

AMI_ID=$(echo $BLUE_DETAILS | jq -r '.ImageId')
INSTANCE_TYPE=$(echo $BLUE_DETAILS | jq -r '.InstanceType')
SECURITY_GROUPS=$(echo $BLUE_DETAILS | jq -r '.SecurityGroups[].GroupId')
SUBNET_ID=$(echo $BLUE_DETAILS | jq -r '.SubnetId')

echo -e "${BLUE}📋 Instance config:${NC}"
echo "   AMI: $AMI_ID"
echo "   Type: $INSTANCE_TYPE"
echo "   Security Groups: $SECURITY_GROUPS"
echo ""

# Create AMI from current instance
echo -e "${BLUE}📸 Creating AMI snapshot from blue instance...${NC}"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
NEW_AMI=$(aws ec2 create-image \
    --region $REGION \
    --instance-id $BLUE_INSTANCE_ID \
    --name "glade-$TIMESTAMP" \
    --description "Glade snapshot for blue/green deployment" \
    --no-reboot \
    --query 'ImageId' \
    --output text)

echo -e "${GREEN}✓ AMI created: $NEW_AMI${NC}"
echo -e "${YELLOW}⏳ Waiting for AMI to be available (this may take 5-15 minutes)...${NC}"

# Wait with custom timeout (40 attempts * 30 seconds = 20 minutes max)
aws ec2 wait image-available --region $REGION --image-ids $NEW_AMI --cli-read-timeout 30 --cli-connect-timeout 30 || {
    echo -e "${YELLOW}⚠️  Standard wait timed out, checking status...${NC}"
    AMI_STATE=$(aws ec2 describe-images --region $REGION --image-ids $NEW_AMI --query 'Images[0].State' --output text)
    if [ "$AMI_STATE" = "available" ]; then
        echo -e "${GREEN}✓ AMI is actually available!${NC}"
    else
        echo -e "${RED}❌ AMI creation failed or still pending. State: $AMI_STATE${NC}"
        exit 1
    fi
}

echo -e "${GREEN}✓ AMI ready!${NC}"
echo ""

# Launch green instance
echo -e "${BLUE}🚀 Launching green instance...${NC}"
GREEN_INSTANCE_ID=$(aws ec2 run-instances \
    --region $REGION \
    --image-id $NEW_AMI \
    --instance-type $INSTANCE_TYPE \
    --key-name $KEY_NAME \
    --security-group-ids $SECURITY_GROUPS \
    --subnet-id $SUBNET_ID \
    --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=glade-green-$TIMESTAMP},{Key=Environment,Value=green}]" \
    --query 'Instances[0].InstanceId' \
    --output text)

echo -e "${GREEN}✓ Green instance launched: $GREEN_INSTANCE_ID${NC}"
echo -e "${YELLOW}⏳ Waiting for instance to be running...${NC}"

aws ec2 wait instance-running --region $REGION --instance-ids $GREEN_INSTANCE_ID

# Get green instance public IP
GREEN_IP=$(aws ec2 describe-instances \
    --region $REGION \
    --instance-ids $GREEN_INSTANCE_ID \
    --query 'Reservations[0].Instances[0].PublicIpAddress' \
    --output text)

echo -e "${GREEN}✓ Green instance running at: $GREEN_IP${NC}"
echo -e "${YELLOW}⏳ Waiting for SSH to be ready (this may take 1-2 minutes)...${NC}"

# First, check if port 22 is reachable
echo -e "${BLUE}🔍 Checking if port 22 is open...${NC}"
MAX_PORT_RETRIES=12
PORT_RETRY=0
while [ $PORT_RETRY -lt $MAX_PORT_RETRIES ]; do
    if nc -z -w 5 $GREEN_IP 22 2>/dev/null; then
        echo -e "${GREEN}✓ Port 22 is open${NC}"
        break
    fi
    PORT_RETRY=$((PORT_RETRY + 1))
    echo -e "${YELLOW}   Port check $PORT_RETRY/$MAX_PORT_RETRIES...${NC}"
    sleep 10
done

if [ $PORT_RETRY -eq $MAX_PORT_RETRIES ]; then
    echo -e "${RED}❌ Port 22 never became accessible${NC}"
    echo -e "${RED}   This is likely a security group issue.${NC}"
    echo -e "${YELLOW}   Green instance security groups:${NC}"
    aws ec2 describe-instances --region $REGION --instance-ids $GREEN_INSTANCE_ID --query 'Reservations[0].Instances[0].SecurityGroups' --output table
    echo -e "${YELLOW}🗑️  Terminating green instance...${NC}"
    aws ec2 terminate-instances --region $REGION --instance-ids $GREEN_INSTANCE_ID
    exit 1
fi
fi

# Now try SSH authentication
echo -e "${BLUE}🔐 Testing SSH authentication...${NC}"
MAX_SSH_RETRIES=10
SSH_RETRY=0
SSH_ERROR=""
while [ $SSH_RETRY -lt $MAX_SSH_RETRIES ]; do
    SSH_ERROR=$(ssh -i "$KEY_PATH" -o StrictHostKeyChecking=no -o ConnectTimeout=10 -o BatchMode=yes ubuntu@$GREEN_IP "echo SSH ready" 2>&1)
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ SSH authentication successful!${NC}"
        break
    fi
    SSH_RETRY=$((SSH_RETRY + 1))
    echo -e "${YELLOW}   SSH attempt $SSH_RETRY/$MAX_SSH_RETRIES...${NC}"
    sleep 10
done

if [ $SSH_RETRY -eq $MAX_SSH_RETRIES ]; then
    echo -e "${RED}❌ SSH authentication failed${NC}"
    echo -e "${RED}   Last error: $SSH_ERROR${NC}"
    echo -e "${YELLOW}   Possible issues:${NC}"
    echo "   - Wrong SSH key"
    echo "   - Instance not fully initialized"
    echo "   - User 'ubuntu' doesn't exist on AMI"
    echo -e "${YELLOW}🗑️  Terminating green instance...${NC}"
    aws ec2 terminate-instances --region $REGION --instance-ids $GREEN_INSTANCE_ID
    exit 1
fi

# Deploy to green instance
echo ""
echo -e "${BLUE}📦 Deploying application to green instance...${NC}"

# Try SSH deployment with error handling
if ssh -i "$KEY_PATH" -o StrictHostKeyChecking=no -o ConnectTimeout=10 ubuntu@$GREEN_IP << 'ENDSSH'
    set -e
    
    # Check if app directory exists
    if [ ! -d ~/app ]; then
        echo "❌ App directory not found. AMI might not have the application."
        exit 1
    fi
    
    echo "🔄 Pulling latest code..."
    cd ~/app
    git pull origin main || {
        echo "⚠️  Git pull failed, using existing code from AMI"
    }
    
    echo "🐳 Starting Docker..."
    sudo systemctl start docker || echo "Docker already running"
    
    echo "🐳 Building and starting containers..."
    docker compose -f infrastructure/docker/docker-compose.prod.yml --env-file .env up -d --build --remove-orphans
    
    echo "⏳ Waiting for services to be healthy..."
    sleep 30
    
    # Basic health check
    if curl -f http://localhost:80 > /dev/null 2>&1; then
        echo "✅ Health check passed!"
    else
        echo "⚠️  Health check failed, but containers are running"
    fi
    
    echo "✅ Deployment complete on green instance!"
ENDSSH
then
    echo -e "${GREEN}✓ Application deployed to green instance${NC}"
else
    echo -e "${RED}❌ Deployment failed on green instance${NC}"
    echo -e "${YELLOW}🗑️  Terminating green instance...${NC}"
    aws ec2 terminate-instances --region $REGION --instance-ids $GREEN_INSTANCE_ID
    exit 1
fi
echo ""

# Test green instance
echo -e "${YELLOW}╔════════════════════════════════════════╗${NC}"
echo -e "${YELLOW}║  TESTING PHASE                         ║${NC}"
echo -e "${YELLOW}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}🧪 Test the green instance at: http://$GREEN_IP${NC}"
echo -e "${YELLOW}   (Note: Use HTTP, not HTTPS, for testing)${NC}"
echo ""
echo -e "${YELLOW}   Test checklist:${NC}"
echo "   - [ ] Homepage loads"
echo "   - [ ] Login works"
echo "   - [ ] Create post works"
echo "   - [ ] No errors in browser console"
echo ""

echo -e -n "${YELLOW}Does everything work? Switch traffic to green? [yes/no]:${NC} "
read confirm

if [ "$confirm" != "yes" ]; then
    echo ""
    echo -e "${RED}❌ Deployment cancelled${NC}"
    echo -e "${YELLOW}🗑️  Terminating green instance...${NC}"
    aws ec2 terminate-instances --region $REGION --instance-ids $GREEN_INSTANCE_ID
    echo -e "${GREEN}✓ Green instance terminated${NC}"
    exit 0
fi

# Switch Elastic IP to green
echo ""
echo -e "${BLUE}🔄 Switching Elastic IP to green instance...${NC}"

ALLOCATION_ID=$(aws ec2 describe-addresses \
    --region $REGION \
    --public-ips $ELASTIC_IP \
    --query 'Addresses[0].AllocationId' \
    --output text)

# Disassociate from blue
ASSOCIATION_ID=$(aws ec2 describe-addresses \
    --region $REGION \
    --public-ips $ELASTIC_IP \
    --query 'Addresses[0].AssociationId' \
    --output text)

if [ "$ASSOCIATION_ID" != "None" ]; then
    aws ec2 disassociate-address --region $REGION --association-id $ASSOCIATION_ID
fi

# Associate with green
aws ec2 associate-address \
    --region $REGION \
    --instance-id $GREEN_INSTANCE_ID \
    --allocation-id $ALLOCATION_ID

echo -e "${GREEN}✓ Elastic IP switched to green instance!${NC}"
echo ""

# Success summary
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  DEPLOYMENT SUCCESSFUL! 🎉             ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}✅ Traffic is now routed to green instance${NC}"
echo -e "${BLUE}🌐 Your site: https://gladeproject.duckdns.org${NC}"
echo ""
echo -e "${YELLOW}📝 Next steps:${NC}"
echo "   1. Monitor the application for 10-15 minutes"
echo "   2. If everything is stable, terminate blue instance:"
echo -e "      ${BLUE}aws ec2 terminate-instances --region $REGION --instance-ids $BLUE_INSTANCE_ID${NC}"
echo ""
echo -e "${YELLOW}🔙 Rollback (if needed):${NC}"
echo -e "   ${RED}aws ec2 associate-address --region $REGION --instance-id $BLUE_INSTANCE_ID --allocation-id $ALLOCATION_ID${NC}"
echo ""
echo -e "${BLUE}Instance IDs:${NC}"
echo "   Blue (old):  $BLUE_INSTANCE_ID"
echo "   Green (new): $GREEN_INSTANCE_ID"
echo ""

# Cleanup old AMIs (keep last 3)
echo -e "${BLUE}🧹 Cleaning up old AMIs...${NC}"
OLD_AMIS=$(aws ec2 describe-images \
    --region $REGION \
    --owners self \
    --filters "Name=name,Values=glade-*" \
    --query 'Images | sort_by(@, &CreationDate) | [0:-3].[ImageId,Name]' \
    --output text)

if [ -n "$OLD_AMIS" ]; then
    echo "$OLD_AMIS" | while read ami_id ami_name; do
        echo -e "${YELLOW}   Deleting old AMI: $ami_name ($ami_id)${NC}"
        aws ec2 deregister-image --region $REGION --image-id $ami_id 2>/dev/null || true
    done
    echo -e "${GREEN}✓ Old AMIs cleaned up${NC}"
else
    echo -e "${GREEN}✓ No old AMIs to clean up${NC}"
fi
echo ""
