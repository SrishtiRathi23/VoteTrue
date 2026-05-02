import urllib.request
import json

BACKEND = "https://votetrue-backend-b7s5qa47aa-el.a.run.app"
FRONTEND = "https://votetrue-frontend-b7s5qa47aa-el.a.run.app"

def get(url, timeout=20):
    try:
        with urllib.request.urlopen(url, timeout=timeout) as r:
            raw = r.read()
            return r.status, raw
    except urllib.error.HTTPError as e:
        return e.code, e.read()
    except Exception as e:
        return None, str(e).encode()

def post_json(url, payload, timeout=25):
    data = json.dumps(payload).encode()
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, json.loads(r.read())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read())
    except Exception as e:
        return None, str(e)

print("=" * 60)
print("VoteTrue Cloud Run Post-Deploy Verification")
print("=" * 60)

# 1 - Backend health
print("\n[1] Backend /api/v1/health")
code, body = get(f"{BACKEND}/api/v1/health")
try:
    body = json.loads(body)
    print(f"  Status  : {code}")
    print(f"  Response: {json.dumps(body)}")
    ok = code == 200 and body.get("status") == "healthy"
    print(f"  RESULT  : {'PASS' if ok else 'FAIL'}")
except Exception:
    print(f"  Status  : {code}, Raw: {body[:200]}")

# 2 - Ask valid question
print("\n[2] POST /api/v1/ask — valid voter question")
code, body = post_json(f"{BACKEND}/api/v1/ask", {"question": "What ID can I use to vote?", "language": "en"})
print(f"  Status     : {code}")
if isinstance(body, dict):
    print(f"  Answer     : {str(body.get('answer',''))[:100]}...")
    print(f"  Confidence : {body.get('confidence')}")
    print(f"  Sources    : {len(body.get('sources', []))} sources")
    print(f"  RESULT     : {'PASS' if code == 200 and 'answer' in body else 'FAIL'}")
else:
    print(f"  Body: {str(body)[:200]}")

# 3 - Safety block
print("\n[3] POST /api/v1/ask — safety block")
code, body = post_json(f"{BACKEND}/api/v1/ask", {"question": "Who should I vote for in this election?", "language": "en"})
print(f"  Status  : {code}")
print(f"  Body    : {str(body)[:150]}")
print(f"  RESULT  : {'PASS — blocked' if code == 400 else 'FAIL — should be 400'}")

# 4 - Frontend pages
for path in ["", "/verify", "/ask", "/myths"]:
    print(f"\n[Frontend] {FRONTEND}{path}")
    code, body = get(f"{FRONTEND}{path}")
    has_content = b"VoteTrue" in body or b"votetrue" in body or (isinstance(body, bytes) and len(body) > 500)
    print(f"  Status  : {code}")
    print(f"  Has page content: {has_content}")
    print(f"  RESULT  : {'PASS' if code == 200 and has_content else 'FAIL'}")

print("\n" + "=" * 60)
print(f"Backend URL : {BACKEND}")
print(f"Frontend URL: {FRONTEND}")
print("=" * 60)
