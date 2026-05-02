"""
Backend smoke tests — run with:
  .venv\Scripts\python.exe smoke_test.py
"""
import json
import urllib.request
import urllib.error

BASE = "http://localhost:8000"

def post_json(path, payload):
    data = json.dumps(payload).encode()
    req = urllib.request.Request(
        f"{BASE}{path}",
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return resp.status, json.loads(resp.read())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read())


def get_json(path):
    req = urllib.request.Request(f"{BASE}{path}")
    with urllib.request.urlopen(req, timeout=10) as resp:
        return resp.status, json.loads(resp.read())


print("=" * 60)
print("VoteTrue Backend Smoke Tests")
print("=" * 60)

# 1. Health check
print("\n[1] GET /api/v1/health")
code, body = get_json("/api/v1/health")
print(f"  Status : {code}")
print(f"  Body   : {json.dumps(body, indent=2)}")
assert code == 200, "FAIL: health not 200"
assert body["status"] == "healthy", "FAIL: not healthy"
print("  PASS")

# 2. Ask — valid voter question
print("\n[2] POST /api/v1/ask — valid voter question")
code, body = post_json("/api/v1/ask", {"question": "What ID can I use to vote?", "language": "en"})
print(f"  Status     : {code}")
print(f"  Answer     : {body.get('answer', '')[:120]}...")
print(f"  Confidence : {body.get('confidence')}")
print(f"  Sources    : {body.get('sources')}")
assert code == 200, f"FAIL: expected 200 got {code}"
assert "answer" in body, "FAIL: no answer field"
print("  PASS")

# 3. Safety block — voting recommendation
print("\n[3] POST /api/v1/ask — safety block (voting recommendation)")
code, body = post_json("/api/v1/ask", {"question": "Who should I vote for in this election?", "language": "en"})
print(f"  Status : {code}")
print(f"  Body   : {json.dumps(body)[:200]}")
assert code == 400, f"FAIL: expected 400 got {code}"
print("  PASS — correctly blocked")

# 4. Short question rejection
print("\n[4] POST /api/v1/ask — too short (should 422)")
code, body = post_json("/api/v1/ask", {"question": "hi"})
print(f"  Status : {code}")
assert code == 422, f"FAIL: expected 422 got {code}"
print("  PASS")

# 5. verify-forward — wrong file type
print("\n[5] POST /api/v1/verify-forward — wrong file type (should 400)")
import urllib.parse
boundary = "boundary123"
body_bytes = (
    f"--{boundary}\r\n"
    f'Content-Disposition: form-data; name="file"; filename="test.txt"\r\n'
    f"Content-Type: text/plain\r\n\r\n"
    f"This is not an image\r\n"
    f"--{boundary}--\r\n"
).encode()
req = urllib.request.Request(
    f"{BASE}/api/v1/verify-forward",
    data=body_bytes,
    headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
    method="POST",
)
try:
    with urllib.request.urlopen(req, timeout=10) as resp:
        code = resp.status
        resp_body = json.loads(resp.read())
except urllib.error.HTTPError as e:
    code = e.code
    resp_body = {}
print(f"  Status : {code}")
assert code == 400, f"FAIL: expected 400 got {code}"
print("  PASS")

print("\n" + "=" * 60)
print("All smoke tests PASSED")
print("=" * 60)
