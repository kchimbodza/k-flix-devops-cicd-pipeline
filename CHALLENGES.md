# K-Flix DevOps Pipeline — Challenges & Fixes

Real issues encountered during the build, with root cause analysis and fixes. Each entry is framed for use in technical interviews.

---

## 1. Trivy Supply Chain Attack — Pinning to a Stable Version

**Phase:** CI pipeline setup  
**Tool:** Trivy (container vulnerability scanner)

**What happened:**  
The initial GitHub Actions workflow used `aquasecurity/trivy-action@master` which pulls from the latest commit on the main branch. This caused intermittent pipeline failures when Trivy's upstream dependencies changed, and raised a security concern — referencing `@master` means any compromise of the Trivy repo could inject malicious code into the pipeline.

**Root cause:**  
Unpinned action references (`@master`) are a supply chain vulnerability. Any update to the upstream action — intentional or malicious — immediately affects your pipeline.

**Fix:**  
Pinned the Trivy action to a specific version tag:
```yaml
- name: Run Trivy vulnerability scanner
  uses: aquasecurity/trivy-action@0.28.0
  with:
    image-ref: ${{ env.ECR_REGISTRY }}/${{ env.ECR_REPOSITORY }}:${{ env.IMAGE_TAG }}
    format: 'table'
    exit-code: '1'
    severity: 'CRITICAL,HIGH'
```

**Interview answer:**  
"We pinned all third-party GitHub Actions to specific version tags rather than `@master`. This protects against supply chain attacks where a compromised upstream action could execute arbitrary code in our CI environment. It's the same principle as pinning npm or pip dependencies — you control exactly what version runs."

---

## 2. SonarCloud Automatic Analysis Conflict

**Phase:** CI pipeline — code quality gate  
**Tool:** SonarCloud, GitHub Actions

**What happened:**  
After configuring SonarCloud analysis in GitHub Actions, every pipeline run failed the quality gate with:
```
ERROR: You are running CI analysis while Automatic Analysis is enabled
```
The analysis ran twice — once triggered automatically by SonarCloud's GitHub integration, and once by the GitHub Actions step — causing a conflict.

**Root cause:**  
SonarCloud has an "Automatic Analysis" feature that triggers on every push via a GitHub App. When you also add a manual analysis step in GitHub Actions, both run simultaneously and SonarCloud rejects the duplicate.

**Fix:**  
Disabled Automatic Analysis in SonarCloud:
SonarCloud → Project → Administration → Analysis Method → switch off "Automatic Analysis"

Then the GitHub Actions step became the sole trigger.

**Interview answer:**  
"We hit a conflict where SonarCloud was running analysis twice — once via its automatic GitHub integration and once through our pipeline step. The fix was disabling automatic analysis so our CI pipeline has full control over when and how analysis runs. This also lets us gate the deploy on a passing quality check — the pipeline won't proceed to Docker build if the quality gate fails."

---

## 3. EKS Node Pod Limit — t3.micro Insufficient

**Phase:** Infrastructure sizing  
**Tool:** Terraform, AWS EKS

**What happened:**  
Initial Terraform config used `t3.micro` nodes to minimize cost. After installing ArgoCD, Prometheus, Grafana, Alertmanager, and the K-Flix app, pods started entering `Pending` state with:
```
0/1 nodes are available: 1 Too many pods. preemption: 0/1 nodes are available:
1 No preemption victims found for incoming pod.
```

**Root cause:**  
AWS enforces a maximum pod limit per node based on instance type. `t3.micro` supports a maximum of 4 pods (due to ENI and IP address limits). The full monitoring stack requires 10+ pods.

**Fix:**  
Upgraded node instance type to `t3.medium` in Terraform:
```hcl
instance_types = ["t3.medium"]
```
`t3.medium` supports up to 17 pods, sufficient for the full stack.

**Cost impact:** ~$0.042/hr per node vs ~$0.010/hr for t3.micro — acceptable for a demo/portfolio cluster.

**Interview answer:**  
"We hit AWS's pod-per-node limit on t3.micro instances. Each EC2 instance type has a maximum pod count tied to the number of Elastic Network Interfaces and secondary IP addresses it supports. We upgraded to t3.medium which raised the limit to 17 pods and resolved all pending pod issues."

---

## 4. Node Group Scaling Mismatch — Terraform vs CLI

**Phase:** Infrastructure management  
**Tool:** Terraform, AWS EKS, AWS CLI

**What happened:**  
After scaling the node group via AWS CLI (`aws eks update-nodegroup-config`), a subsequent `terraform apply` attempted to revert the node count back to the Terraform-defined value, causing a plan diff on every apply.

**Root cause:**  
Terraform tracks desired state. Any change made outside Terraform (via CLI or console) creates drift. On the next `terraform apply`, Terraform detects the drift and tries to correct it.

**Fix:**  
Two approaches depending on intent:

Option A — Update Terraform to match the desired state (preferred):
```hcl
resource "aws_eks_node_group" "main" {
  scaling_config {
    desired_size = 2
    min_size     = 1
    max_size     = 3
  }
}
```

Option B — Use `terraform refresh` to import the current state without changing it:
```bash
terraform refresh
```

**Interview answer:**  
"We learned early that mixing Terraform with manual CLI changes causes state drift. Any resource changed outside Terraform creates a conflict on the next apply. Our rule became: Terraform owns all infrastructure — if you need to change something, change it in the Terraform files, not in the console or CLI."

---

## 5. IAM Permission Gap — kflix-cicd User Missing EKS Auth

**Phase:** GitHub Actions CI/CD integration  
**Tool:** AWS EKS, IAM, GitHub Actions

**What happened:**  
GitHub Actions pipeline successfully built and pushed the Docker image to ECR, but the kubectl deployment step failed with:
```
error: You must be logged in to the server (Unauthorized)
```
Even though the `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` were correctly set as GitHub Secrets.

**Root cause:**  
EKS has two separate auth layers. The first is standard AWS IAM (controls who can call the EKS API). The second is Kubernetes RBAC (controls what authenticated users can do inside the cluster). Creating an IAM user and giving them `AmazonEKSClusterPolicy` handles layer one, but layer two requires an explicit access entry in EKS to map the IAM identity to a Kubernetes role.

**Fix:**  
Created an EKS access entry for the CI/CD user:
```bash
aws eks create-access-entry \
  --cluster-name k-flix-cluster \
  --principal-arn arn:aws:iam::515310961810:user/kflix-cicd \
  --type STANDARD

aws eks associate-access-policy \
  --cluster-name k-flix-cluster \
  --principal-arn arn:aws:iam::515310961810:user/kflix-cicd \
  --policy-arn arn:aws:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy \
  --access-scope type=cluster
```

**Interview answer:**  
"EKS has two separate authentication layers — AWS IAM and Kubernetes RBAC. IAM controls access to the EKS API, but RBAC controls what you can do inside the cluster. We had to explicitly create an access entry to map our CI/CD IAM user to a cluster admin role inside Kubernetes. It's a common gotcha that catches people who assume IAM permissions alone are sufficient."

---

## 6. VPC Deletion Blocked by Kubernetes-Created AWS Resources

**Phase:** Cluster teardown  
**Tool:** Terraform, AWS EC2, Kubernetes

**What happened:**  
`terraform destroy` failed after 20 minutes:
```
Error: deleting EC2 Internet Gateway: DependencyViolation: Network vpc-xxx
has some mapped public address(es). Please unmap those public address(es)
before detaching the gateway.
```

**Root cause:**  
When a Kubernetes Service of type `LoadBalancer` is created (ArgoCD server, K-Flix app), the AWS cloud controller automatically provisions a Classic Load Balancer and allocates Elastic IPs. These resources are created outside Terraform's state — Terraform has no knowledge of them. When Terraform tries to delete the VPC, the IGW can't detach because these resources are still attached to the VPC subnets.

**Fix:**  
The destroy sequence must clean up Kubernetes LoadBalancer services before running `terraform destroy`:
```bash
# 1. Remove K8s LoadBalancer services (triggers AWS LB deprovisioning)
kubectl delete svc k-flix -n k-flix --ignore-not-found
kubectl patch svc argocd-server -n argocd -p '{"spec": {"type": "ClusterIP"}}' || true

# 2. Wait for AWS to release the resources
sleep 90

# 3. Release any orphaned EIPs
aws ec2 describe-addresses --region us-east-2 \
  --query 'Addresses[?AssociationId==null].AllocationId' --output text | \
  xargs -I {} aws ec2 release-address --allocation-id {} --region us-east-2

# 4. Now safe to destroy
terraform destroy -auto-approve
```

**Interview answer:**  
"We learned that Kubernetes and Terraform don't share awareness of each other's resources. When Kubernetes provisions a LoadBalancer service, it creates AWS Load Balancers and Elastic IPs that Terraform doesn't track. Terraform then can't delete the VPC because those resources are still attached. The fix was building a proper teardown sequence that deletes Kubernetes services first, waits for AWS to release the associated resources, then runs Terraform destroy."

---

## 7. Slack Webhook URL Committed to Git

**Phase:** Monitoring setup  
**Tool:** GitHub Push Protection, Alertmanager

**What happened:**  
A `git push` was blocked by GitHub's secret scanning:
```
remote: error: GH013: Repository rule violations found
remote: - Push cannot contain secrets
remote: - Slack Incoming Webhook URL detected at alertmanager-slack.yaml:10
```

**Root cause:**  
The Slack webhook URL was hardcoded directly in `alertmanager-slack.yaml` which was tracked by git. GitHub's push protection automatically detects and blocks pushes containing known secret patterns.

**Fix:**  
1. Removed the file from git history entirely:
```bash
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch alertmanager-slack.yaml" \
  --prune-empty --tag-name-filter cat -- --all
```
2. Added to `.gitignore`:
```bash
echo "alertmanager-slack.yaml" >> .gitignore
```
3. Force-pushed cleaned history:
```bash
git push origin master --force
```

**Long-term fix:** The correct approach is storing the webhook URL as a Kubernetes Secret or in AWS Secrets Manager and injecting it at deploy time — never in a tracked file.

**Interview answer:**  
"GitHub's push protection blocked a commit because our Alertmanager config had a Slack webhook URL hardcoded in it. We cleaned the git history with `git filter-branch` and added the file to `.gitignore`. The lesson was to never store secrets in tracked files — they belong in Kubernetes Secrets, AWS Secrets Manager, or GitHub Actions secrets, injected at runtime."

---

## Summary Table

| # | Challenge | Tool | Root Cause | Interview Keyword |
|---|---|---|---|---|
| 1 | Trivy supply chain risk | GitHub Actions | Unpinned `@master` reference | Supply chain security |
| 2 | SonarCloud analysis conflict | SonarCloud | Dual analysis triggers | CI/CD quality gates |
| 3 | EKS pod limit hit | AWS EKS | t3.micro max 4 pods | Infrastructure sizing |
| 4 | Terraform state drift | Terraform | CLI changes outside IaC | Infrastructure as Code discipline |
| 5 | IAM insufficient for EKS | AWS EKS/IAM | Missing RBAC access entry | EKS dual auth layers |
| 6 | terraform destroy blocked | Terraform/K8s | K8s LB creates untracked AWS resources | Terraform lifecycle management |
| 7 | Secret committed to git | GitHub | Webhook URL in tracked file | Secrets management |
