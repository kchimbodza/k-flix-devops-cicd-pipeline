# K-Flix DevOps Pipeline — Challenges & Fixes

Real issues encountered during the build with root cause analysis and fixes applied.

---

## 1. Trivy Supply Chain Risk — Unpinned Action Version

**Tool:** Trivy, GitHub Actions

**Problem:**  
Initial workflow used `aquasecurity/trivy-action@master` which pulls from the latest upstream commit. This creates a supply chain risk — any change to the upstream action immediately affects the pipeline, and a compromised upstream could inject malicious code into CI.

**Fix:**  
Pinned to a specific version tag:
```yaml
- name: Run Trivy vulnerability scanner
  uses: aquasecurity/trivy-action@0.28.0
  with:
    image-ref: ${{ env.ECR_REGISTRY }}/${{ env.ECR_REPOSITORY }}:${{ env.IMAGE_TAG }}
    format: 'table'
    exit-code: '1'
    severity: 'CRITICAL,HIGH'
```

---

## 2. SonarCloud Automatic Analysis Conflict

**Tool:** SonarCloud, GitHub Actions

**Problem:**  
Pipeline failed with:
```
ERROR: You are running CI analysis while Automatic Analysis is enabled
```
SonarCloud's automatic GitHub integration and the GitHub Actions step were both triggering analysis simultaneously, causing a conflict.

**Fix:**  
Disabled Automatic Analysis in SonarCloud:  
SonarCloud → Project → Administration → Analysis Method → toggle off **Automatic Analysis**

The GitHub Actions step then became the sole trigger, resolving the conflict.

---

## 3. EKS Node Pod Limit — Insufficient Instance Type

**Tool:** AWS EKS, Terraform

**Problem:**  
After deploying the full monitoring stack, pods entered `Pending` state:
```
0/1 nodes are available: 1 Too many pods.
```
`t3.micro` nodes hit their maximum pod limit before all required workloads could be scheduled.

**Fix:**  
Upgraded node instance type to `t3.medium` in Terraform:
```hcl
instance_types = ["t3.medium"]
```
`t3.medium` supports up to 17 pods per node, sufficient for the full stack (ArgoCD + Prometheus + Grafana + Alertmanager + K-Flix).

---

## 4. Terraform State Drift — CLI Changes Outside IaC

**Tool:** Terraform, AWS EKS

**Problem:**  
After scaling the node group via AWS CLI, subsequent `terraform apply` runs detected drift and attempted to revert the change, creating a persistent plan diff.

**Fix:**  
Updated the Terraform config to match the desired state rather than making changes via CLI:
```hcl
scaling_config {
  desired_size = 2
  min_size     = 1
  max_size     = 3
}
```
Rule established: all infrastructure changes go through Terraform, never through the console or CLI directly.

---

## 5. IAM Insufficient for EKS Access

**Tool:** AWS EKS, IAM

**Problem:**  
GitHub Actions pipeline failed at the kubectl deployment step with:
```
error: You must be logged in to the server (Unauthorized)
```
Despite correct AWS credentials being set, the CI/CD user could not interact with the cluster.

**Fix:**  
Created an EKS access entry to map the IAM user to a Kubernetes RBAC role:
```bash
aws eks create-access-entry \
  --cluster-name k-flix-cluster \
  --principal-arn arn:aws:iam::<AWS_ACCOUNT_ID>:user/kflix-cicd \
  --type STANDARD

aws eks associate-access-policy \
  --cluster-name k-flix-cluster \
  --principal-arn arn:aws:iam::<AWS_ACCOUNT_ID>:user/kflix-cicd \
  --policy-arn arn:aws:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy \
  --access-scope type=cluster
```
EKS requires both IAM authentication and a Kubernetes RBAC access entry — IAM alone is not sufficient.

---

## 6. terraform destroy Blocked by Kubernetes-Created AWS Resources

**Tool:** Terraform, AWS EC2, Kubernetes

**Problem:**  
`terraform destroy` failed after 20 minutes:
```
Error: deleting EC2 Internet Gateway: DependencyViolation: Network has some
mapped public address(es). Please unmap those before detaching the gateway.
```
Kubernetes LoadBalancer services had provisioned AWS Classic Load Balancers and Elastic IPs outside of Terraform's state, blocking VPC deletion.

**Fix:**  
Updated `destroy.sh` to clean up Kubernetes services before running Terraform:
```bash
# Remove K8s LoadBalancer services first
kubectl delete svc k-flix -n k-flix --ignore-not-found
kubectl patch svc argocd-server -n argocd \
  -p '{"spec": {"type": "ClusterIP"}}' || true

# Wait for AWS to release Load Balancers and EIPs
sleep 90

# Release orphaned Elastic IPs
aws ec2 describe-addresses --region us-east-2 \
  --query 'Addresses[?AssociationId==null].AllocationId' \
  --output text | xargs -I {} aws ec2 release-address \
  --allocation-id {} --region us-east-2

# Now safe to destroy
terraform destroy -auto-approve
```

---

## 7. Slack Webhook URL Committed to Git

**Tool:** GitHub Push Protection, Alertmanager

**Problem:**  
A `git push` was blocked:
```
remote: error: GH013: Repository rule violations found
remote: - Push cannot contain secrets
remote: - Slack Incoming Webhook URL detected at alertmanager-slack.yaml:10
```

**Fix:**  
Removed the file from git history and added it to `.gitignore`:
```bash
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch alertmanager-slack.yaml" \
  --prune-empty --tag-name-filter cat -- --all

echo "alertmanager-slack.yaml" >> .gitignore
git push origin master --force
```
The correct approach is storing secrets in Kubernetes Secrets or AWS Secrets Manager and injecting at deploy time — never in tracked files.

---

## Summary

| # | Challenge | Tool | Root Cause |
|---|---|---|---|
| 1 | Trivy supply chain risk | GitHub Actions | Unpinned `@master` reference |
| 2 | SonarCloud analysis conflict | SonarCloud | Dual analysis triggers |
| 3 | EKS pod limit hit | AWS EKS | t3.micro max 4 pods |
| 4 | Terraform state drift | Terraform | CLI changes outside IaC |
| 5 | IAM insufficient for EKS | AWS EKS/IAM | Missing RBAC access entry |
| 6 | terraform destroy blocked | Terraform/K8s | K8s LB creates untracked AWS resources |
| 7 | Secret committed to git | GitHub | Webhook URL in tracked file |
