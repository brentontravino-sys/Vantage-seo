import json, urllib.request, websocket, sys, time

# Connect to real Chrome CDP on 9223 (your logged-in-profile session)
BASE = "http://localhost:9223"

def get_targets():
    return json.load(urllib.request.urlopen(f"{BASE}/json"))

# Find the signin tab
targets = get_targets()
signin = next((t for t in targets if "accounts.google.com" in t.get("url","") and t.get("type")=="page"), None)
if not signin:
    # fall back to any page tab
    signin = next((t for t in targets if t.get("type")=="page"), None)
print("TARGET:", signin["url"][:80])
ws_url = signin["webSocketDebuggerUrl"]

ws = websocket.create_connection(ws_url)
def send(method, params=None, wait=True):
    msg = {"id": send.c, "method": method, "params": params or {}}
    send.c += 1
    ws.send(json.dumps(msg))
    if not wait: return
    while True:
        r = json.loads(ws.recv())
        if r.get("id") == msg["id"]:
            return r
send.c = 1

# Enable DOM + Runtime
send("DOM.enable")
send("Runtime.enable")

# Get document root
doc = send("DOM.getDocument")["result"]["root"]["nodeId"]

# Search for input elements
def find_inputs():
    res = send("DOM.querySelectorAll", {"nodeId": doc, "selector": "input"})
    nodes = res["result"]["nodeIds"]
    out = []
    for nid in nodes:
        info = send("DOM.describeNode", {"nodeId": nid})["result"]["node"]
        attrs = {a["name"]: a["value"] for a in info.get("attributes", [])}
        out.append((nid, attrs))
    return out

time.sleep(1)
inputs = find_inputs()
for nid, attrs in inputs:
    print("INPUT", nid, attrs.get("type"), attrs.get("name"), attrs.get("id"), attrs.get("autocomplete"))
ws.close()
