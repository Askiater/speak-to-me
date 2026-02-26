variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
  default     = "speak-to-me"
}

variable "postgres_db_name" {
  description = "PostgreSQL database name"
  type        = string
  default     = "speak_to_me"
}

variable "postgres_username" {
  description = "PostgreSQL username"
  type        = string
  default     = "postgres"
  sensitive   = true
}

variable "postgres_password" {
  description = "PostgreSQL password"
  type        = string
  sensitive   = true
}

variable "jwt_secret" {
  description = "JWT secret key"
  type        = string
  sensitive   = true
}

variable "admin_username" {
  description = "Admin username"
  type        = string
  default     = "admin"
  sensitive   = true
}

variable "admin_password" {
  description = "Admin password"
  type        = string
  sensitive   = true
}

variable "turn_username" {
  description = "TURN server username"
  type        = string
  default     = "turn_user"
  sensitive   = true
}

variable "turn_password" {
  description = "TURN server password"
  type        = string
  sensitive   = true
}

variable "ec2_key_name" {
  description = "EC2 key pair name for SSH access"
  type        = string
}
