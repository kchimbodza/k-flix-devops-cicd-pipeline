#!/bin/bash
set -e

echo "=== K-Flix Deploy Script ==="

# Step 1 - Provision EKS cluster
echo "[1/6] Provisioning EKS cluster with Terraform..."
cd terraform
terraform apply -auto-approve
cd ..

# Step 2 - Configure kubectl
echo "[2/6] Configuring kubectl..."
aws eks update-kubeconfig --region us-east-2 --name k-flix-cluster

# Step 3 - Grant IAM access to kflix-cicd user
echo "[3/6] Granting IAM access..."
aws eks create-access-entry \
  --cluster-name k-flix-cluster \
  --principal-arn arn:aws:iam::515310961810:user/kflix-cicd \
  --type STANDARD

aws eks associate-access-policy \
  --cluster-name k-flix-cluster \
  --principal-arn arn:aws:iam::515310961810:user/kflix-cicd \
  --policy-arn arn:aws:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy \
  --access-scope type=cluster

# Step 4 - Install ArgoCD
echo "[4/6] Installing ArgoCD..."
kubectl create namespace argocd --dry-run=client -o yaml | kubectl apply -f -
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

echo "Waiting for ArgoCD pods to be ready..."
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=argocd-server \
  -n argocd --timeout=120s

# Step 5 - Scale nodes
echo "[5/6] Scaling node group..."
NODEGROUP=$(aws eks list-nodegroups --cluster-name k-flix-cluster \
  --region us-east-2 --query 'nodegroups[0]' --output text)

aws eks update-nodegroup-config \
  --cluster-name k-flix-cluster \
  --nodegroup-name $NODEGROUP \
  --scaling-config minSize=1,maxSize=3,desiredSize=2 \
  --region us-east-2

# Step 6 - Create ArgoCD app
echo "[6/6] Creating ArgoCD application..."
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
