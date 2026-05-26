# K-Flix DevOps Pipeline — Runbook

A step-by-step operational guide for spinning up, managing, and tearing down the K-Flix DevOps pipeline. Usable as a template for any new project using the same stack.

**Stack:** GitHub Actions · Terraform · AWS EKS · ArgoCD · Prometheus · Grafana · Alertmanager · Slack · Docker · ECR · SonarCloud · Trivy · Vitest

---

## Prerequisites

Ensure the following are installed and configured on your local machine before starting:

| Tool | Version | Install |
|---|---|---|
| AWS CLI | v2+ | `curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" && unzip awscliv2.zip && sudo ./aws/install` |
| Terraform | v1.5+ | `sudo dnf install terraform` or Hashicorp repo |
| kubectl | latest | `curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl" && sudo install kubectl /usr/local/bin/` |
| Helm | v3+ | `curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash` |
| Docker | latest | `sudo dnf install docker && sudo systemctl enable --now docker` |
| git | latest | pre-installed on most systems |

AWS credentials must be configured:
```bash
aws configure
# Enter: Access Key ID, Secret Access Key, Region (us-east-2), Output (json)
```

---

## Part 1 — One-Time Setup (Do Once Per Project)

### 1.1 Create ECR Repository
```bash
aws ecr create-repository --repository-name k-flix --region us-east-2
```

### 1.2 Create IAM User for CI/CD
```bash
# Create the user
aws iam create-user --user-name kflix-cicd

# Attach policies
aws iam attach-user-policy \
  --user-name kflix-cicd \
  --policy-arn arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryFullAccess

aws iam attach-user-policy \
  --user-name kflix-cicd \
  --policy-arn arn:aws:iam::aws:policy/AmazonEKSClusterPolicy

# Create access keys (save these — you'll need them for GitHub Secrets)
aws iam create-access-key --user-name kflix-cicd
```

### 1.3 Configure GitHub Secrets
In your GitHub repo → Settings → Secrets and Variables → Actions, add:

| Secret Name | Value |
|---|---|
| `AWS_ACCESS_KEY_ID` | From step 1.2 |
| `AWS_SECRET_ACCESS_KEY` | From step 1.2 |
| `AWS_REGION` | `us-east-2` |
| `ECR_REPOSITORY` | `k-flix` |
| `SONAR_TOKEN` | From sonarcloud.io |

### 1.4 Configure SonarCloud
1. Go to sonarcloud.io → log in with GitHub
2. Create new project → link your repo
3. Set Analysis Method to **GitHub Actions** (not Automatic)
4. Copy the `SONAR_TOKEN` and add to GitHub Secrets

> **Important:** Disable automatic analysis in SonarCloud settings. If both automatic analysis and GitHub Actions analysis run simultaneously, the quality gate will fail with a conflict error.

---

## Part 2 — Deploy (Run Each Session)

### 2.1 Provision the EKS Cluster
```bash
cd terraform
terraform init    # first time only
terraform apply -auto-approve
```

Expected output: `Apply complete! Resources: 52 added, 0 changed, 0 destroyed.`  
Takes approximately **12-15 minutes**.

### 2.2 Configure kubectl
```bash
aws eks update-kubeconfig --region us-east-2 --name k-flix-cluster
```

Verify:
```bash
kubectl get nodes
# Should show 2 nodes in Ready state
```

### 2.3 Grant IAM Access to CI/CD User
```bash
aws eks create-access-entry \
  --cluster-name k-flix-cluster \
  --principal-arn arn:aws:iam::515310961810:user/kflix-cicd \
  --type STANDARD || true

aws eks associate-access-policy \
  --cluster-name k-flix-cluster \
  --principal-arn arn:aws:iam::515310961810:user/kflix-cicd \
  --policy-arn arn:aws:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy \
  --access-scope type=cluster || true
```

> The `|| true` prevents the script from failing if the entry already exists from a previous session.

### 2.4 Install ArgoCD
```bash
kubectl create namespace argocd --dry-run=client -o yaml | kubectl apply -f -
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
```

Wait for pods to be ready (~60-90 seconds):
```bash
kubectl get pods -n argocd
```

### 2.5 Create ArgoCD Application
```bash
kubectl apply -f - <<EOF
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: k-flix
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/kchimbodza/k-flix-react-app
    targetRevision: master
    path: k8s
  destination:
    server: https://kubernetes.default.svc
    namespace: k-flix
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - CreateNamespace=true
EOF
```

### 2.6 Verify K-Flix is Running
```bash
kubectl get pods -n k-flix
# Should show: k-flix-xxxxx   2/2   Running
```

### 2.7 Open ArgoCD UI (optional)
```bash
# Get password
kubectl -n argocd get secret argocd-initial-admin-secret \
  -o jsonpath="{.data.password}" | base64 -d && echo

# Open UI
kubectl port-forward svc/argocd-server -n argocd 8080:443
# Visit https://localhost:8080 — login: admin / <password above>
```

---

## Part 3 — Install Monitoring Stack

### 3.1 Add Helm Repo
```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update
```

### 3.2 Install kube-prometheus-stack
```bash
kubectl create namespace monitoring

helm install kube-prometheus-stack prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --set grafana.adminPassword=kflix-admin123 \
  --set prometheus.prometheusSpec.retention=12h
```

Wait 2-3 minutes, then verify:
```bash
kubectl get pods -n monitoring
# All 7 pods should show Running
```

### 3.3 Configure Slack Alertmanager

Create `alertmanager-slack.yaml` (do NOT commit this file — add to .gitignore):
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: alertmanager-kube-prometheus-stack-alertmanager
  namespace: monitoring
stringData:
  alertmanager.yaml: |
    global:
      resolve_timeout: 5m
      slack_api_url: 'YOUR_SLACK_WEBHOOK_URL'
    route:
      group_by: ['alertname', 'namespace']
      group_wait: 30s
      group_interval: 5m
      repeat_interval: 12h
      receiver: 'slack-notifications'
    receivers:
      - name: 'slack-notifications'
        slack_configs:
          - channel: '#k-flix-alerts'
            send_resolved: true
            title: '{{ .GroupLabels.alertname }}'
            text: >-
              *Severity:* {{ .CommonLabels.severity }}
              *Namespace:* {{ .CommonLabels.namespace }}
              *Description:* {{ range .Alerts }}{{ .Annotations.description }}{{ end }}
```

Apply and restart:
```bash
kubectl apply -f alertmanager-slack.yaml
kubectl rollout restart statefulset -n monitoring alertmanager-kube-prometheus-stack-alertmanager
```

### 3.4 Open Grafana UI
```bash
kubectl port-forward svc/kube-prometheus-stack-grafana -n monitoring 3000:80
# Visit http://localhost:3000 — login: admin / kflix-admin123
```

Import Kubernetes dashboard: Dashboards → Import → ID `15760` → Load → Select Prometheus → Import.

---

## Part 4 — Teardown (Run at End of Every Session)

**Always destroy at the end of every session to avoid unnecessary AWS charges (~$0.20-0.25/hr).**

### 4.1 Run destroy.sh
```bash
chmod +x destroy.sh
./destroy.sh
```

The script handles (in order):
1. Delete K-Flix LoadBalancer service
2. Patch ArgoCD back to ClusterIP
3. Delete ArgoCD application
4. Wait 90 seconds for AWS to release Load Balancers and EIPs
5. Delete orphaned Classic Load Balancers
6. Release orphaned Elastic IPs
7. `terraform destroy -auto-approve`

### 4.2 Verify Clean Teardown
```bash
# Should return empty
aws ec2 describe-vpcs \
  --filters "Name=tag:Project,Values=k-flix" \
  --region us-east-2 \
  --query 'Vpcs[*].VpcId' \
  --output text

# Should show: No changes. Destroy complete! Resources: 0 destroyed.
cd terraform && terraform destroy -auto-approve
```

---

## Part 5 — Cost Management

| Resource | Cost |
|---|---|
| EKS Control Plane | ~$0.10/hr |
| 2x t3.medium nodes | ~$0.084/hr each |
| ECR storage | ~$0.10/GB/month |
| **Total while running** | **~$0.28/hr** |

**Rules:**
- Always destroy after every session
- Check cluster age before adding new features: `aws eks describe-cluster --name k-flix-cluster --region us-east-2 --query 'cluster.createdAt' --output text`
- If cluster has been running > 4 hours unexpectedly, destroy immediately

---

## Part 6 — Generalizing This Runbook for a New Project

To reuse this runbook for a new project, change the following:

| Item | Location | What to change |
|---|---|---|
| Cluster name | `terraform/variables.tf`, all AWS CLI commands | Replace `k-flix-cluster` |
| ECR repo name | `terraform/ecr.tf`, GitHub Secrets | Replace `k-flix` |
| ArgoCD repoURL | Part 2.5 | Point to new GitHub repo |
| ArgoCD path | Part 2.5 | Point to new `k8s/` folder |
| Grafana password | Part 3.2 | Change `kflix-admin123` |
| Slack channel | Part 3.3 | Change `#k-flix-alerts` |
| Namespace | All kubectl commands | Replace `k-flix` |
| AWS region | All commands | Change `us-east-2` if needed |
| IAM user | Part 1.2 | Replace `kflix-cicd` |

The Terraform files, ArgoCD install command, Helm chart, and GitHub Actions workflow structure remain identical across projects.
