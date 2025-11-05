import requests
from threading import Thread

URL = "http://127.0.0.1:8000/api/messages/12/claim"

def try_claim(agent_id):
    r = requests.post(URL, json={"agent_id": agent_id})
    print(f"Agent {agent_id}: {r.status_code} - {r.text}")

threads = [Thread(target=try_claim, args=(i,)) for i in range(1, 11)]
for t in threads: t.start()
for t in threads: t.join()
