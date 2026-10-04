# Runner image for untrusted submissions. Build with:  npm run sandbox:build
# (Needs roughly 400 MB of disk. If that is too much, use EXEC_MODE=judge0 instead: no local install at all.)
#
# The executor starts it with: --network none --read-only --cap-drop ALL
# --memory/--pids-limit/--cpus caps, and an unprivileged user (see executionService.js).
# Contains Node.js (JavaScript), Python 3, and g++ (C++ is compiled inside the sandbox too).
FROM node:22-slim

RUN apt-get update \
 && apt-get install -y --no-install-recommends python3 g++ \
 && rm -rf /var/lib/apt/lists/*

USER 65534:65534
WORKDIR /tmp
