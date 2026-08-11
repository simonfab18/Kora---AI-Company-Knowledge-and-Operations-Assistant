#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 || -z "$1" ]]; then
  echo "Usage: deploy.sh <artifact-registry-image>" >&2
  exit 2
fi

readonly image="$1"
readonly install_dir="/opt/kora"
readonly worker_env_file="/etc/kora/worker.env"

if [[ ! -f "${install_dir}/docker-compose.yml" ]]; then
  echo "${install_dir}/docker-compose.yml is missing." >&2
  exit 1
fi

if [[ ! -f "${worker_env_file}" ]]; then
  echo "${worker_env_file} is missing. Provision it from Secret Manager before deployment." >&2
  exit 1
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is not installed on this VM." >&2
  exit 1
fi

export KORA_BACKEND_IMAGE="${image}"
export KORA_WORKER_ENV_FILE="${worker_env_file}"

cd "${install_dir}"
docker compose -f docker-compose.yml pull
docker compose -f docker-compose.yml up -d --remove-orphans --wait --wait-timeout 120
docker compose -f docker-compose.yml ps
