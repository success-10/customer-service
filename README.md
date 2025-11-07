# Customer Support Messaging System (Django + WebSockets)
## Overview

This project is a Customer Support Messaging Platform built with Django and Django Channels.
It allows customers to send messages and support agents to manage them collaboratively with real-time updates, automatic prioritization, and concurrency-safe task distribution.

It demonstrates:

1. REST API endpoints for managing messages, canned responses, and agents.

2. WebSocket integration using Django Channels for real-time updates (e.g. message claimed or closed).

3. Concurrency-safe message claiming logic.

4. CSV import of existing customer messages.

5. Smart task division among multiple agents

6. Efficient backend communication between agents and customers.

## Features Implemented
### Core Messaging Features
1. Message Management: Customers send messages via a REST API. When a message arrives, it’s stored in the database as **unassigned**, waiting for an agent. Agents can then view and filter messages by status **(unassigned, in progress, or closed)**.

2. Work Division (Claiming System): When an agent clicks a message or reply button, they **claim** it. Behind the scenes, a safe database transaction ensures that only one agent can successfully assign themselves to that message or claim that message. If multiple agents attempt to claim it simultaneously, the first succeeds and others receive a **Message already claimed by another agent** response which also include the name of the agent. With this multiple agent can't be responding to the same message at the same time.

3. Message Reply System: Once an agent claims a message, they can respond to the customer. Replying automatically **closes** the message and records the timestamp, agent ID, and response body. The system prevents other agents from replying to messages they are not assigned to. 

4. Canned Message Reply:Agents can respond using pre-written templates (**canned responses**) for common inquiries. The chosen canned response is inserted into the reply automatically, closing the message and notifying all agents in real time.

5. Real-Time Updates via WebSockets: Django Channels and Redis power live updates. When a new message is **created**, **claimed**, or **closed**, all connected agents receive an instant update via WebSockets — no page refresh required.

6. CSV Message Import: A management command (import_messages.py) can bulk-import messages from CSV. Each message’s urgency and priority are calculated during import.

7. Error Handling & Validation: The system checks for missing fields, invalid agent IDs, empty replies, or missing canned responses and returns clear, structured error messages.

### Advanced Features
1. Smart Work Division:	Prevents multiple agents from working on the same message using atomic transactions and select_for_update-style locking logic. Only one agent can claim a message at a time.

2. Urgency Detection: Each incoming message’s text is analyzed for keywords like **loan**, **urgent**, **disbursement**, e.t.c. Messages are automatically prioritized higher if they relate to critical financial actions or time-sensitive issues.

3. Search Functionality: Agents can search messages or status of meassage (**closed**, **unassigned** and **inprogress**) using query parameters. For instance, searching for a text snippet in the message body.

4. Customer Context Enrichment:	Each message is linked to a Customer profile. This allows agents to view more details of the customer directly alongside the message.

5. Canned Messages (Predefined Replies): Agents can save time by using stock responses stored in the CannedResponse model. Each canned message can be selected and used instantly.

6. Real-Time Interactivity:	Through WebSockets, all agent dashboards receive live notifications when: a new message is sent, a message is claimed by someone else, or a message is closed.

7. Robust Error & Status Feedback: Every API endpoint provides detailed feedback — such as **agent not found**, **message already closed**, or **empty reply text not allowed*8.

## Tech Stack
1. Backend: Django 5 + Django REST Framework

2. Real-Time: Django Channels + Redis

3. Database: MySQL

4. Data Processing: Pandas (for CSV imports)

5. Testing & Simulation: Python requests + threading for concurrency tests

6. Deployment Ready: Works with Render, Docker, or any ASGI-compatible platform

## Setup & Installation Guide
### Step 1. Clone Repository

```bash
git clone https://github.com/success-10/cs_messaging.git
cd cs_messaging

```

### Step 2. Virtual Environment
```bash
python -m venv .venv
.venv\Scripts\activate      # Windows
# or
source .venv/bin/activate   # macOS/Linux
```

### Step 3. Install Dependencies
```bash
pip install -r requirements.txt
```
If missing, install manually:
```bash
pip install django djangorestframework channels channels-redis mysqlclient pandas
```

### Step 4. Configure MySQL Database
Update settings.py
```bash
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'cs_messaging',
        'USER': 'root',
        'PASSWORD': 'yourpassword',
        'HOST': '127.0.0.1',
        'PORT': '3306',
    }
}
```
Then run migrations:
```bash
python manage.py makemigrations
python manage.py migrate
```

### Step 5. Start Redis (WebSocket Backend)
### Option 1: Docker
```bash
docker run -d -p 6379:6379 redis
```
### Option 2: Local Installation
Install Redis locally and run:
```bash
redis-server
```

### Step 6. Import Messages agents and canned responses
```bash
python manage.py import_messages
python manage.py seed_data
```
Note:
The import_messages command loads customer messages from the CSV file in the /data folder.
The seed_data command creates sample agents and canned messages so you can test assignment, replies, and the message workflow.

### Step 7. Run Server
For WebSocket Support
```bash
daphne -p 8000 cs_messaging.asgi:application
```

For REST API Testing Only
```bash
python manage.py runserver
```
For Render or deployment:
Set your Render Start Command as:
```bash
python manage.py migrate && python manage.py import_messages && python manage.
```
This ensures your production database is also preloaded with demo data for testing.

## API Endpoints
```bash
GET     /api/messages/		        List all messages (supports filtering by ?status= and search query)
POST    /api/messages/		        Create new customer message
POST    /api/messages/<id>/claim	Agent claims message for handling
POST    /api/messages/<id>/reply	Agent sends a custom reply (closes message)
POST    /api/messages/<id>/canned	Agent replies using canned message
GET     /api/canned/		        List all canned messages
POST    /api/canned/		        create new canned message
```
## Example Workflows
### 1. customer Sends a Message
```bash
curl -X POST http://127.0.0.1:8000/api/messages/ \
     -H "Content-Type: application/json" \
     -d '{"user_id": "U001", "body": "When will my loan be disbursed?"}'
```

→ Stored in DB as unassigned. Urgency score increases because of “loan” keyword.

### 2. Agent Claims Message
```bash
curl -X POST http://127.0.0.1:8000/api/messages/12/claim \
     -H "Content-Type: application/json" \
     -d '{"agent_id": 1}'
```

→ System assigns the message to agent 1.
→ If another agent tries, they’ll get:
```bash
{"status": "already_claimed", "by": "Agent 1"}
```
### 3. Agent Replies
```bash
curl -X POST http://127.0.0.1:8000/api/messages/12/reply \
     -H "Content-Type: application/json" \
     -d '{"agent_id": 1, "text": "Your loan will be processed in 24 hours."}'
```

→ Message marked as “closed” and broadcasted to all agents via WebSocket.

### 4. Agent Uses a Canned Message
```bash
curl -X POST http://127.0.0.1:8000/api/messages/12/canned \
     -H "Content-Type: application/json" \
     -d '{"agent_id": 1, "canned_id": 2}'
```

→ Canned message inserted as reply and status changed to closed.

## WebSocket Notifications

Agents connected to:
```bash
ws://127.0.0.1:8000/ws/agents/
```

will receive updates like:
```bash
{"type": "message_update", "message_id": 12, "status": "closed", "assigned_to": 1}
```

or when new messages arrive:
```bash
{"type": "message_new", "message_id": 18, "status": "unassigned", "body": "Need help with my card"}
```
## Concurrency Test
Make sure before running it:
Your Django server is already running 
```bash
python manage.py runserver
```
To test message-claim race conditions:
```bash
python run_claim_test.py
```

Seven agents will attempt to claim the same message — only one will succeed, proving the locking system works.

## Deployment Notes
**Live Demo** : [customer-service-lt53.onrender.com](customer-service-lt53.onrender.com) 

Note: there's no home page so hitting the base endpoint can lead to page not found error. so when testing, test with the available endpoint

1.Ensure Redis and MySQL services are running.

2.For Render or cloud deployment, store secrets in environment variables.

3. Run import_messages after deployment to preload sample data if needed.
