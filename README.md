<p align="center">
  <h1 align="center"> Agent Connect Hub</h1>
  <p align="center">
    <strong>A high-performance, real-time Customer Support Messaging Engine built for concurrency.</strong>
    <br/>
    Built with React, Django REST Framework, and Django Channels (WebSockets).
  </p>
</p>

---

## 🎯 The 60-Second Pitch

Why look at another CRUD app? **Agent Connect Hub** isn't just about reading and writing tickets. It's a demonstration of solving complex, real-time backend problems. 

This project tackles the **"Concurrency Problem"** in customer support: *What happens when 50 agents try to claim the exact same ticket at the exact same millisecond?*

Instead of relying on basic models, this backend engine uses raw database-level locking (`select_for_update(skip_locked=True)`) to guarantee atomic ticket claims. It pairs this with a persistent **WebSocket (ASGI)** connection layer to instantly broadcast ticket states across all connected agent dashboards, and a robust **Threaded Reply Engine** for infinite conversational ping-pong between agents and customers.

### 🔐 Where's the Authentication?
If you're wondering why you don't need a username and password to log in, **that is highly intentional.** 

This project was built as a portfolio showcase to demonstrate complex **Real-Time Data Flow, Concurrency, and State Management**, rather than basic JWT/OAuth flows. To eliminate friction for reviewers and recruiters, the application operates on an "Agent Persona" basis. You simply click an Agent card to immediately adopt their session state and drop directly into the action.

---

## 🧠 What's Going On Behind The Scenes?

- **Real-Time WebSockets (Django Channels & Daphne):** The moment a customer submits a ticket via the Customer Portal, a WebSocket broadcast fires via `AgentConsumer`. The React frontend mathematically evaluates the ticket priority and instantly injects it into every active agent's inbox—no page refreshes required.
- **Race-Condition Proof Ticket Claiming:** When an agent clicks "Claim", the backend initiates a transactional block utilizing PostgreSQL/SQLite Row-Level Locks. If another agent beats them to the Database by 1ms, they get a graceful "Already Claimed" rejection, preventing assignment collisions.
- **Infinite Threaded Architecture:** The database schema completely separated `Messages` from `MessageReplies`, linked via Foreign Keys. This allows an unlimited, chronological back-and-forth chain of interactions between the customer and the agent without overwriting data fields.
- **Pagination & Caching:** Out of the box, the system restricts inbox fetching to 20-items per page to save frontend memory, while the Canned Responses API is heavily memoized using Django's `@cache_page` for immediate delivery.

---

## 🛠 Technology Stack

### Backend
* **Python / Django 5.x:** The core MVC brain.
* **Django REST Framework (DRF):** Service/Selector layered API architecture.
* **Django Channels & Daphne:** ASGI server handling raw WebSocket streams.
* **SQLite / PostgreSQL:** Fully transactional database queries.

### Frontend
* **React 18 & TypeScript:** Strict typing for data-heavy ticket payloads.
* **Vite:** Next-generation, blazing fast bundler.
* **Tailwind CSS & Lucide Icons:** For the sleek, glass-morphism dashboard layout.
* **Zustand:** Global state management for maintaining active Agent/Inbox state.

---

## 🚀 Step-by-Step Setup Guide

You can run this entire high-performance engine locally on your machine in just a few minutes.

### 1. Backend (Django) Setup

1. Open your terminal and navigate to the project root:
   ```bash
   cd cs_messaging
   ```
2. Create and activate a Virtual Environment:
   ```bash
   python -m venv .venv
   # Windows
   .venv\Scripts\activate
   # Mac/Linux
   source .venv/bin/activate
   ```
3. Install the dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. **Environment Variables**:
   Create a `.env` file in the root `cs_messaging` directory (next to `manage.py`) with the following necessary keys:
   ```env
   SECRET_KEY=your_secure_django_secret_key_here
   REDIS_URL=redis://127.0.0.1:6379/1
   DATABASE_URL=mysql://root:root@127.0.0.1:3306/cs_messaging_db
   ```
   *(Update the credentials above based on your local MySQL setup)*

5. Run the database migrations (This creates the core MySQL schema):
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```
6. **Start Redis**:
   Ensure you have Redis installed and running in the background, as it's required for Django Channels (WebSockets) and Celery task queuing.
   ```bash
   redis-server
   ```
7. **Start Celery**:
   In a new terminal window (with the venv activated), start the Celery worker to handle background tasks:
   ```bash
   celery -A cs_messaging worker -l INFO
   ```
8. **Load The Showcase Data!**
   To give you something to look at immediately, I've included Django management scripts that inject your database with Agents, Canned Responses, and mock Customer Tickets:
   ```bash
   python manage.py import_messages
   python manage.py seed_data
   ```
9. Start the ASGI server (Daphne):
   ```bash
   python manage.py runserver
   ```
   *Your backend is now fully running at `http://127.0.0.1:8000/`*

### 2. Frontend (React) Setup

1. Open a **new, second terminal window** and navigate to the frontend directory:
   ```bash
   cd cs_messaging/agent-connect-hub-main
   ```
2. Install the Node packages:
   ```bash
   npm install
   ```
3. Boot the Vite Dev Server:
   ```bash
   npm run dev
   ```
   *Your shiny new frontend is now running at `http://127.0.0.1:5173/`*

---

##  How to Tour the App

Now that both servers are running, here's how to experience the platform:

1. **The Customer View:** Open your browser to `http://localhost:5173/customer`. You'll see the standalone Customer Portal. Fill out a ticket, but don't click submit yet!
2. **The Agent Dashboard:** Open a *second* browser window side-by-side at `http://localhost:5173/`. Click an Agent Avatar to log into their dashboard. 
3. **Witness WebSockets:** Go back to the Customer window and click **Submit**. Watch as the ticket instantly pops into the Agent's Inbox in the other window in real-time.
4. **The Agent Workflow:** In the Agent window, click the new ticket. Notice that the chat interface is disabled until you formally declare ownership using the **Claim Ticket** button. 
5. **Threaded Replies:** Once claimed, type out a custom response or hit one of the "Canned Responses" (featuring a sleek preview modal!) and submit it to see the ticket thread build organically.
