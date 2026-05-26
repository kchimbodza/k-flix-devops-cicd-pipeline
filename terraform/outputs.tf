output "cluster_name" {
  description = "EKS cluster name"
  value       = module.eks.cluster_name
}

output "cluster_endpoint" {
  description = "EKS cluster endpoint"
  value       = module.eks.cluster_endpoint
}

output "cluster_region" {
  description = "AWS region"
  value       = var.aws_region
}

output "ecr_repository_url" {
  description = "ECR repository URL"
  value       = "515310961810.dkr.ecr.us-east-2.amazonaws.com/k-flix"
}