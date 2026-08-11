#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 2 ]]; then
  echo "Usage: provision-env.sh <gcp-project-id> <production-site-url>" >&2
  exit 2
fi

readonly project_id="$1"
readonly production_site_url="$2"
readonly target_dir="/etc/kora"
readonly target_file="${target_dir}/worker.env"
readonly temporary_file="$(mktemp)"

cleanup() {
  rm -f "${temporary_file}"
}
trap cleanup EXIT

read_secret() {
  gcloud secrets versions access latest --project="${project_id}" --secret="$1"
}

umask 077
{
  printf 'DATABASE_URL=%s\n' "$(read_secret kora-database-url)"
  printf 'NEXT_INTERNAL_BASE_URL=%s\n' "${production_site_url}"
  printf 'KORA_INTERNAL_WORKER_SECRET=%s\n' "$(read_secret kora-internal-worker-secret)"
  printf 'REDIS_PASSWORD=%s\n' "$(read_secret kora-redis-password)"
  printf 'LOG_LEVEL=INFO\n'
} > "${temporary_file}"

install -d -m 0700 "${target_dir}"
install -m 0600 "${temporary_file}" "${target_file}"
echo "Worker environment installed at ${target_file}."
