---
applyTo: "k8s/**/*.yaml"
---
# Kubernetes manifests

- The pipeline applies `k8s/` with `kubectl apply -k` to a fresh kind cluster and replaces `image: sandbox-app:dev` with the commit tag. Keep that placeholder exactly as it is.
- Every environment variable that `src/config.ts` requires must be present in `configmap.yaml`. Read `src/config.ts` before changing a value here: some variables require others.
- The app answers `GET /health` on container port 3000. If you add probes, they use that path and port.
- Keep resource requests and limits. Do not remove them to make something schedule.
- Changes here are verified only by the pipeline. After pushing, read the job summary: pod status, events, and container logs are printed there.
