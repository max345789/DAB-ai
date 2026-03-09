#!/usr/bin/env bash
set -euo pipefail

API_BASE="${1:-https://api.dabcloud.in/api}"
APP_URL="${2:-https://app.dabcloud.in}"
STAMP="$(date +%Y%m%d%H%M%S)"
LEAD_EMAIL="smoke.${STAMP}@example.com"
CAMPAIGN_NAME="Smoke Campaign ${STAMP}"

echo "== DAB AI Production Smoke Test =="
echo "API_BASE=${API_BASE}"
echo "APP_URL=${APP_URL}"
echo

fail() {
  echo "FAIL: $1" >&2
  exit 1
}

pass() {
  echo "PASS: $1"
}

health_json="$(curl -fsS "${API_BASE}/health")" || fail "health endpoint unreachable"
echo "${health_json}" | grep -q '"status":"ok"' || fail "health status not ok"
echo "${health_json}" | grep -q '"db":"connected"' || fail "database not connected"
pass "health"

dashboard_json="$(curl -fsS "${API_BASE}/dashboard/summary")" || fail "dashboard summary unreachable"
echo "${dashboard_json}" | grep -q '"success":true' || fail "dashboard summary failed"
pass "dashboard summary"

campaign_payload=$(cat <<JSON
{"name":"${CAMPAIGN_NAME}","platform":"meta","budget":120,"goal":"Lead Generation"}
JSON
)
campaign_json="$(curl -fsS -X POST "${API_BASE}/campaign" -H 'content-type: application/json' -d "${campaign_payload}")" || fail "campaign create request failed"
echo "${campaign_json}" | grep -q '"success":true' || fail "campaign create did not succeed"
pass "campaign create"

lead_payload=$(cat <<JSON
{"name":"Smoke Lead","email":"${LEAD_EMAIL}","company":"Smoke Co","budget":500,"source":"chat"}
JSON
)
lead_json="$(curl -fsS -X POST "${API_BASE}/lead" -H 'content-type: application/json' -d "${lead_payload}")" || fail "lead create request failed"
echo "${lead_json}" | grep -q '"success":true' || fail "lead create did not succeed"
pass "lead create"

campaigns_json="$(curl -fsS "${API_BASE}/campaigns")" || fail "campaign list request failed"
echo "${campaigns_json}" | grep -q '"success":true' || fail "campaign list did not succeed"
pass "campaign list"

leads_json="$(curl -fsS "${API_BASE}/leads")" || fail "lead list request failed"
echo "${leads_json}" | grep -q '"success":true' || fail "lead list did not succeed"
pass "lead list"

finance_json="$(curl -fsS "${API_BASE}/finance/summary")" || fail "finance summary request failed"
echo "${finance_json}" | grep -q '"success":true' || fail "finance summary did not succeed"
pass "finance summary"

chat_json="$(curl -fsS -X POST "${API_BASE}/chat" -H 'content-type: application/json' -d '{"message":"Analyze campaign performance"}')" || fail "chat request failed"
echo "${chat_json}" | grep -q '"success":true' || fail "chat did not succeed"
pass "chat"

app_html="$(curl -fsS "${APP_URL}")" || fail "frontend root unreachable"
echo "${app_html}" | grep -qi '<!doctype html' || fail "frontend root did not return html"
pass "frontend root"

echo
echo "Smoke test completed successfully."
