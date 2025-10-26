
in dev container

- `aws ecr get-login-password | docker login --username AWS --password-stdin 892797891149.dkr.ecr.ap-southeast-2.amazonaws.com`

on host

```bash
DOCKER_HOST=ssh://into docker compose \
--env-file prod/.env \
--project-name lms \
--project-directory . \
up -d \
--remove-orphans \
--pull
```
