#!/bin/bash
set -e

echo "=== K-Flix Teardown Script ==="

# Step 1 - Delete K-Flix LoadBalancer service
echo "[1/7] Deleting K-Flix LoadBalancer service..."
kubectl delete svc k-flix -n k-flix --ignore-not-found

# Step 2 - Delete ArgoCD server LoadBalancer (if exposed as LB)
echo "[2/7] Deleting ArgoCD server service LoadBalancer..."
kubectl patch svc argocd-server -n argocd \
  -p '{"spec": {"type": "ClusterIP"}}' --ignore-not-found || true

# Step 3 - Delete ArgoCD application
echo "[3/7] Deleting ArgoCD application..."
kubectl delete application k-flix -n argocd --ignore-not-found

# Step 4 - Wait for AWS to release the Load Balancers and EIPs
echo "[4/7] Waiting 90s for AWS to release Load Balancers and Elastic IPs..."
sleep 90

# Step 5 - Find and delete any orphaned classic load balancers
echo "[5/7] Checking for orphaned classic load balancers..."
LB_NAMES=$(aws elb describe-load-balancers \
  --region us-east-2 \
  --query 'LoadBalancerDescriptions[*].LoadBalancerName' \
  --output text)
if [ -n "$LB_NAMES" ]; then
  for LB in $LB_NAMES; do
    echo "Deleting load balancer: $LB"
    aws elb delete-load-balancer --load-balancer-name $LB --region us-east-2
  done
  echo "Waiting 30s for LBs to fully release..."
  sleep 30
else
  echo "No orphaned load balancers found."
fi

# Step 6 - Release any orphaned Elastic IPs
echo "[6/7] Releasing orphaned Elastic IPs..."
EIP_ALLOCS=$(aws ec2 describe-addresses \
  --region us-east-2 \
  --query 'Addresses[?AssociationId==null].AllocationId' \
  --output text)
if [ -n "$EIP_ALLOCS" ]; then
  for EIP in $EIP_ALLOCS; do
    echo "Releasing EIP: $EIP"
    aws ec2 release-address --allocation-id $EIP --region us-east-2
  done
else
  echo "No orphaned EIPs found."
fi

# Step 7 - Run terraform destroy
echo "[7/7] Running terraform destroy..."
cd terraform && terraform destroy -auto-approve

echo ""
echo "=== Teardown Complete ==="