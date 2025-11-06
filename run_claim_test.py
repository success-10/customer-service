import requests
from threading import Thread
import time, random

URL = "http://127.0.0.1:8000/api/messages/10/claim"

def try_claim(agent_id):
    time.sleep(random.uniform(0, 0.5))  # random delay between 0–0.5 s
    r = requests.post(URL, json={"agent_id": agent_id})
    print(f"Agent {agent_id}: {r.status_code} - {r.text}")

threads = [Thread(target=try_claim, args=(i,)) for i in range(1, 8)]
for t in threads: t.start()
for t in threads: t.join()
