#!/bin/bash
set -e

echo "=== K-Flix Deploy Script ==="

# Node group size (min 1, max 3, desired 2) and the kflix-cicd access entry are set in
# terraform/main.tf. Change them there, not with the AWS CLI, so Terraform state doesn't drift.

# Step 1 - Provision EKS cluster
echo "[1/4] Provisioning EKS cluster with Terraform..."
cd terraform
terraform apply -auto-approve
cd ..

# Step 2 - Configure kubectl
echo "[2/4] Configuring kubectl..."
aws eks update-kubeconfig --region us-east-2 --name k-flix-cluster

# Step 3 - Install ArgoCD
echo "[3/4] Installing ArgoCD..."
kubectl create namespace argocd --dry-run=client -o yaml | kubectl apply -f -
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

echo "Waiting for ArgoCD pods to be ready..."
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=argocd-server \
  -n argocd --timeout=120s

# Step 4 - Create ArgoCD app
echo "[4/4] Creating ArgoCD application..."
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

echo ""
echo "=== Deploy Complete ==="
echo "Run the following to get the K-Flix public URL:"
echo "  kubectl get svc k-flix -n k-flix"
echo ""
echo "To open ArgoCD UI:"
echo "  kubectl port-forward svc/argocd-server -n argocd 8080:443"
echo "  Then open https://localhost:8080"
