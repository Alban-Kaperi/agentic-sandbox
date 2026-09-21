Log every request as one JSON line with a request id
feature, module:logging
## Goal
Operations cannot correlate log lines with requests. Every request should produce one log line at the end with method, path, status, duration in ms, and a request id.

## Done when
- A request id is taken from the `x-request-id` header if present, otherwise generated (UUID)
- The same id is returned in the `x-request-id` response header
- One JSON log line per request: `{ "level": "info", "msg": "request", "id", "method", "path", "status", "durationMs" }`
- Request bodies are never logged
- Unit test asserts the response header and that a provided id is echoed
