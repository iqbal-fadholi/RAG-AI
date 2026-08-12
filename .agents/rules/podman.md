---
trigger: always_on
---

# Container Orchestration

- **Use Podman**: This workspace uses Podman instead of Docker.
- **Compose Commands**: Always use `podman compose` instead of `docker-compose` when managing multi-container applications.
- **Container Updates**: When modifying source code and rebuilding a container, always use `podman compose build --no-cache` to ensure the new code is compiled. T
- **CLI Commands**: Always use `podman` CLI instead of `docker` CLI.
