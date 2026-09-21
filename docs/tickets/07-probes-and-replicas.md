Add readiness and liveness probes, run two replicas
ops, module:k8s
## Goal
The deployment has no probes and one replica. A rolling update can route traffic to a pod that is not ready yet.

## Done when
- `k8s/deployment.yaml` has a readiness probe and a liveness probe on the health endpoint
- `replicas: 2`
- The pipeline is green: rollout completes, both pods are Ready, smoke and browser checks pass
