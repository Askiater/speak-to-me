# AWS Deployment with Terraform

This directory contains Terraform configuration to deploy the Speak-to-Me application to AWS using Free Tier eligible resources.

## Architecture Overview

### AWS Services Used (Free Tier Eligible)

1. **Amazon RDS PostgreSQL** (db.t3.micro, 20GB storage)
   - Relational database for structured data
   - Free tier: 750 hours/month

2. **EC2 for MongoDB** (t2.micro)
   - Self-hosted MongoDB in Docker container
   - Free tier: 750 hours/month

3. **EC2 for COTURN** (t2.micro)
   - TURN/STUN server for WebRTC
   - Free tier: 750 hours/month

4. **Amazon ECS with Fargate** (0.25 vCPU, 0.5GB memory per task)
   - Containerized frontend and backend applications
   - Free tier: Limited free compute hours

5. **Application Load Balancer**
   - Routes traffic to frontend and backend
   - Free tier: 750 hours/month

6. **Amazon ECR** (Elastic Container Registry)
   - Stores Docker images
   - Free tier: 500 MB/month

7. **AWS Secrets Manager**
   - Stores sensitive credentials securely
   - Free tier: 30-day trial, then ~$0.40/secret/month

8. **CloudWatch Logs**
   - Application logging
   - Free tier: 5GB ingestion, 5GB storage

9. **VPC, Subnets, Security Groups**
   - Networking infrastructure (always free)

### Infrastructure Diagram

```
Internet
   |
   v
Application Load Balancer (ALB)
   |
   +--- Frontend (ECS Fargate) :3000
   |
   +--- Backend (ECS Fargate) :3001
           |
           +--- RDS PostgreSQL :5432
           +--- EC2 MongoDB :27017
           +--- EC2 COTURN :3478
```

## Prerequisites

### 1. Install Required Tools

- **Terraform** (v1.0+): [Download](https://www.terraform.io/downloads.html)
- **AWS CLI**: [Installation Guide](https://aws.amazon.com/cli/)
- **Git**: [Download](https://git-scm.com/downloads)

### 2. AWS Account Setup

1. Create an AWS account (if you don't have one)
2. Create an IAM user with programmatic access
3. Attach the following AWS managed policies:
   - `AmazonEC2FullAccess`
   - `AmazonRDSFullAccess`
   - `AmazonECS_FullAccess`
   - `AmazonEC2ContainerRegistryFullAccess`
   - `ElasticLoadBalancingFullAccess`
   - `SecretsManagerReadWrite`
   - `CloudWatchLogsFullAccess`
   - `IAMFullAccess` (for creating ECS task execution role)

4. Save the Access Key ID and Secret Access Key

### 3. Configure AWS CLI

```bash
aws configure
```

Enter your credentials:
- AWS Access Key ID
- AWS Secret Access Key
- Default region: `us-east-1`
- Default output format: `json`

### 4. Create EC2 Key Pair

Create an SSH key pair for EC2 instances (MongoDB and COTURN):

```bash
aws ec2 create-key-pair \
  --key-name speak-to-me-key \
  --query 'KeyMaterial' \
  --output text > speak-to-me-key.pem

# Set proper permissions (Linux/Mac)
chmod 400 speak-to-me-key.pem

# Windows (PowerShell)
icacls speak-to-me-key.pem /inheritance:r
icacls speak-to-me-key.pem /grant:r "%USERNAME%:R"
```

## Deployment Steps

### Step 1: Configure Variables

1. Copy the example variables file:
   ```bash
   cd terraform
   cp terraform.tfvars.example terraform.tfvars
   ```

2. Edit `terraform.tfvars` and update all values:
   ```hcl
   aws_region   = "us-east-1"
   project_name = "speak-to-me"

   # Use strong, random passwords
   postgres_password = "your-secure-postgres-password-123"
   jwt_secret        = "your-long-random-jwt-secret-key-here"
   admin_password    = "your-secure-admin-password"
   admin_username    = "admin"
   turn_username     = "turn_user"
   turn_password     = "your-secure-turn-password"

   # EC2 key name (created in prerequisites)
   ec2_key_name = "speak-to-me-key"
   ```

### Step 2: Initialize Terraform

```bash
cd terraform
terraform init
```

This downloads the AWS provider and prepares your workspace.

### Step 3: Review the Plan

```bash
terraform plan
```

Review the resources that will be created. You should see:
- VPC, subnets, security groups
- RDS PostgreSQL instance
- 2 EC2 instances (MongoDB, COTURN)
- 2 ECR repositories
- ECS cluster, task definitions, services
- Application Load Balancer
- CloudWatch log groups
- Secrets Manager secrets

### Step 4: Apply the Configuration

```bash
terraform apply
```

Type `yes` when prompted. This will take **10-15 minutes** to complete.

**Note:** The ECS services will initially fail because there are no Docker images in ECR yet. This is expected.

### Step 5: Note the Outputs

After `terraform apply` completes, save these outputs:

```bash
terraform output
```

Important outputs:
- `alb_dns_name`: Your application URL
- `ecr_frontend_repository_url`: Frontend Docker registry URL
- `ecr_backend_repository_url`: Backend Docker registry URL
- `ecs_cluster_name`: ECS cluster name
- `coturn_public_ip`: COTURN server IP

### Step 6: Configure GitHub Secrets

Add the following secrets to your GitHub repository:

**Settings → Secrets and variables → Actions → New repository secret**

Required secrets:
- `AWS_ACCESS_KEY_ID`: Your AWS access key
- `AWS_SECRET_ACCESS_KEY`: Your AWS secret key

### Step 7: Deploy Application via GitHub Actions

1. Push your code to the `main` branch:
   ```bash
   git add .
   git commit -m "Add AWS deployment configuration"
   git push origin main
   ```

2. GitHub Actions will automatically:
   - Build Docker images for frontend and backend
   - Push images to ECR
   - Deploy to ECS

3. Monitor the deployment in **GitHub Actions** tab

### Step 8: Access Your Application

After deployment completes, access your application:

```bash
# Get the ALB DNS name
terraform output alb_dns_name
```

Open in browser:
- **Frontend**: `http://<alb-dns-name>`
- **Backend API**: `http://<alb-dns-name>/api`

**Note:** The first request may take 30-60 seconds as ECS tasks start.

## Post-Deployment Configuration

### Set Up Custom Domain (Optional)

1. **Register a domain** (e.g., via Route 53)

2. **Create SSL certificate** in AWS Certificate Manager:
   ```bash
   aws acm request-certificate \
     --domain-name yourdomain.com \
     --validation-method DNS \
     --region us-east-1
   ```

3. **Add HTTPS listener** to ALB and update Terraform

### Monitor Resources

- **ECS Console**: Monitor running tasks
- **CloudWatch Logs**: View application logs
- **RDS Console**: Monitor database performance
- **EC2 Console**: Check MongoDB and COTURN instances

## Cost Estimation

### Free Tier (First 12 Months)

With Free Tier, your costs should be **$0-5/month**:

- RDS db.t3.micro: Free (750 hours/month)
- EC2 t2.micro × 2: Free (750 hours/month each)
- ECS Fargate: Limited free hours
- ALB: Free (750 hours/month)
- ECR: Free (500 MB)
- Data transfer: Free (15 GB/month)
- CloudWatch Logs: Free (5 GB)
- **Secrets Manager**: ~$0.80/month (6 secrets × $0.40)

### After Free Tier Expires

Estimated monthly cost: **$15-30/month**

- RDS db.t3.micro: ~$14/month
- EC2 t2.micro × 2: ~$8/month
- ECS Fargate: ~$5/month (minimal usage)
- ALB: ~$16/month
- Data transfer: ~$1/month
- CloudWatch: ~$1/month
- Secrets Manager: ~$2.40/month

**Total: ~$47/month** for test deployment

### Cost Optimization Tips

1. **Stop services when not in use**:
   ```bash
   # Scale ECS services to 0
   aws ecs update-service --cluster speak-to-me-cluster \
     --service speak-to-me-frontend-service --desired-count 0
   aws ecs update-service --cluster speak-to-me-cluster \
     --service speak-to-me-backend-service --desired-count 0

   # Stop EC2 instances
   aws ec2 stop-instances --instance-ids <mongodb-instance-id> <coturn-instance-id>
   ```

2. **Use RDS automated snapshots** and delete the instance when not needed

3. **Set up billing alerts** in AWS Console

## Maintenance

### SSH into EC2 Instances

**MongoDB:**
```bash
ssh -i speak-to-me-key.pem ec2-user@<mongodb-public-ip>

# Check MongoDB status
docker ps
docker logs mongodb
```

**COTURN:**
```bash
ssh -i speak-to-me-key.pem ec2-user@<coturn-public-ip>

# Check COTURN status
docker ps
docker logs coturn
```

### View Application Logs

```bash
# Backend logs
aws logs tail /ecs/speak-to-me/backend --follow

# Frontend logs
aws logs tail /ecs/speak-to-me/frontend --follow
```

### Update Environment Variables

Update secrets in AWS Secrets Manager:
```bash
aws secretsmanager update-secret \
  --secret-id speak-to-me-jwt-secret \
  --secret-string "new-jwt-secret"
```

Then restart ECS services:
```bash
aws ecs update-service \
  --cluster speak-to-me-cluster \
  --service speak-to-me-backend-service \
  --force-new-deployment
```

### Database Backups

**RDS PostgreSQL**: Automated daily backups (7-day retention by default)

**MongoDB**:
```bash
# SSH to MongoDB instance
ssh -i speak-to-me-key.pem ec2-user@<mongodb-public-ip>

# Create backup
docker exec mongodb mongodump --out /data/backup

# Copy backup locally
scp -i speak-to-me-key.pem -r ec2-user@<mongodb-public-ip>:/data/backup ./mongodb-backup
```

## Troubleshooting

### ECS Tasks Failing

1. Check CloudWatch logs for errors
2. Verify environment variables in task definition
3. Ensure security groups allow traffic

### Database Connection Issues

1. Check security group rules
2. Verify RDS endpoint and credentials
3. Ensure ECS tasks are in the same VPC

### TURN Server Not Working

1. SSH to COTURN instance and check Docker logs
2. Verify UDP ports are open in security group
3. Test with TURN test tools

### High Costs

1. Review CloudWatch billing dashboard
2. Check for unused resources (stopped instances still incur EBS costs)
3. Ensure ECS services aren't scaling unexpectedly

## Cleanup (Destroy Infrastructure)

**Warning:** This will delete all resources and data!

```bash
cd terraform
terraform destroy
```

Type `yes` when prompted.

**Note:** Some resources may take time to delete (especially RDS and ALB).

### Manual Cleanup

If `terraform destroy` fails, manually delete:
1. ECR images (empty repositories first)
2. CloudWatch log groups
3. Secrets Manager secrets (after 7-day recovery window)

## Security Best Practices

1. **Never commit `terraform.tfvars`** (already in `.gitignore`)
2. **Use strong passwords** for all services
3. **Restrict SSH access** by IP in security groups
4. **Enable MFA** on AWS root account
5. **Use HTTPS** in production (add SSL certificate to ALB)
6. **Rotate credentials** regularly
7. **Enable AWS CloudTrail** for audit logging
8. **Set up AWS Budgets** to avoid unexpected charges

## Next Steps

1. **Add Custom Domain**: Configure Route 53 and SSL
2. **Set Up CI/CD**: Already configured with GitHub Actions
3. **Enable Monitoring**: Set up CloudWatch alarms
4. **Implement Backups**: Automate database backups
5. **Scale**: Adjust ECS task count based on load
6. **Production Ready**: Use DocumentDB instead of self-hosted MongoDB

## Support

For issues:
1. Check CloudWatch logs
2. Review Terraform plan output
3. Open a GitHub issue with error details
