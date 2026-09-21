Enable the metrics endpoint in the deployment
ops, module:k8s
## Goal
Operations wants to scrape runtime metrics from the deployed app. The application already supports a metrics listener; it is switched off in the deployment.

## Done when
- The deployed pod exposes metrics on a second container port named `metrics`
- The pipeline is green, including rollout and smoke test
- README documents how to reach the metrics endpoint
