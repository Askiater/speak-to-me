output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.main.dns_name
}

output "frontend_url" {
  description = "Frontend application URL"
  value       = "http://${aws_lb.main.dns_name}"
}

output "backend_url" {
  description = "Backend API URL"
  value       = "http://${aws_lb.main.dns_name}/api"
}

output "ecr_frontend_repository_url" {
  description = "ECR repository URL for frontend"
  value       = aws_ecr_repository.frontend.repository_url
}

output "ecr_backend_repository_url" {
  description = "ECR repository URL for backend"
  value       = aws_ecr_repository.backend.repository_url
}

output "rds_endpoint" {
  description = "RDS PostgreSQL endpoint"
  value       = aws_db_instance.postgres.endpoint
}

output "mongodb_private_ip" {
  description = "Private IP of MongoDB EC2 instance"
  value       = aws_instance.mongodb.private_ip
}

output "mongodb_public_ip" {
  description = "Public IP of MongoDB EC2 instance (for SSH access)"
  value       = aws_instance.mongodb.public_ip
}

output "coturn_public_ip" {
  description = "Public IP of COTURN server"
  value       = aws_instance.coturn.public_ip
}

output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = aws_ecs_cluster.main.name
}

output "ecs_backend_service_name" {
  description = "Name of the backend ECS service"
  value       = aws_ecs_service.backend.name
}

output "ecs_frontend_service_name" {
  description = "Name of the frontend ECS service"
  value       = aws_ecs_service.frontend.name
}
