# Wardrop - Wedding Dress Rental & Sales Dashboard

A beautiful, bilingual (French/Arabic) admin dashboard for managing wedding dress rentals and clothing sales.

## Features

- **Dashboard** - Overview of business metrics, revenue, and alerts
- **Clients Management** - Track customers with phone/WhatsApp contacts
- **Dresses** - Manage wedding dress inventory with images
- **Clothing** - Track clothing items for sale with stock management
- **Bookings** - Rental booking system with deposit tracking
- **Sales** - Record and track clothing sales
- **Calendar** - Visual calendar view of all bookings
- **Reports** - Revenue analytics and charts
- **Excel Import/Export** - Bulk data management
- **SMS/WhatsApp Notifications** - Via Twilio integration
- **Bilingual** - French and Arabic with RTL support
- **Currency** - Algerian Dinars (DZD)
- **Timezone** - Africa/Algiers

## Tech Stack

- **Backend**: FastAPI + PostgreSQL + SQLAlchemy
- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **State Management**: TanStack Query + Zustand
- **Charts**: Recharts
- **Calendar**: FullCalendar
- **i18n**: react-i18next

---

## Local Development Setup

### Prerequisites

- Python 3.11+
- Node.js 20+
- Docker (for PostgreSQL)

### 1. Start PostgreSQL

```bash
docker-compose up -d
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
.\venv\Scripts\activate

# Activate (Linux/Mac)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
alembic upgrade head

# Start server
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

### 4. Access the Dashboard

- Frontend: http://localhost:5173
- API Docs: http://localhost:8000/docs

---

## Production Deployment (VPS with Docker)

### Step 1: Push to GitHub (on your local machine)

```bash
cd C:\Users\Saber\Desktop\wardrop

# Initialize git repo
git init
git add .
git commit -m "Initial commit - Wardrop Dashboard"

# Create repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/wardrop.git
git branch -M main
git push -u origin main
```

### Step 2: Clone on VPS

```bash
ssh root@YOUR_VPS_IP

# Clone the repo
cd /root
git clone https://github.com/YOUR_USERNAME/wardrop.git
cd wardrop
```

### Step 3: Create Environment File

```bash
# Copy example and edit
cp env.example .env
nano .env
```

Update these values in `.env`:

```
POSTGRES_PASSWORD=your_secure_password_here
SECRET_KEY=generate_with_openssl_rand_-hex_32
```

### Step 4: Build and Deploy

```bash
# Build Docker images
docker-compose -f docker-compose.prod.yml build

# Start containers
docker-compose -f docker-compose.prod.yml up -d

# Wait for postgres to be ready, then run migrations
sleep 15
docker-compose -f docker-compose.prod.yml exec wardrop-backend alembic upgrade head
```

### Step 5: Configure Your Existing Nginx

```bash
# First, edit the nginx config to set your domain
nano nginx/wardrop.conf
# Replace "wardrop.yourdomain.com" with your actual domain

# Copy config to your nginx container
docker cp nginx/wardrop.conf carrent-nginx:/etc/nginx/conf.d/wardrop.conf

# Test nginx configuration
docker exec carrent-nginx nginx -t

# If test passes, reload nginx
docker exec carrent-nginx nginx -s reload
```

### Step 6: Get SSL Certificate

```bash
# Get certificate from Let's Encrypt
docker exec carrent-certbot certbot certonly \
  --webroot \
  -w /var/www/certbot \
  -d wardrop.yourdomain.com

# Reload nginx to use the certificate
docker exec carrent-nginx nginx -s reload
```

### Step 7: Access Your Dashboard

Visit `https://wardrop.yourdomain.com`

- Click "Première utilisation? Créer un compte" to create your admin account

---

## Updating the Application

When you make changes and push to GitHub:

```bash
# On your VPS
cd /root/wardrop

# Pull latest changes
git pull

# Rebuild and restart
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# Run migrations if database changed
docker-compose -f docker-compose.prod.yml exec wardrop-backend alembic upgrade head
```

---

## Useful Commands

```bash
# View all logs
docker-compose -f docker-compose.prod.yml logs -f

# View specific service logs
docker-compose -f docker-compose.prod.yml logs -f wardrop-backend

# Restart all services
docker-compose -f docker-compose.prod.yml restart

# Stop all services
docker-compose -f docker-compose.prod.yml down

# Check running containers
docker-compose -f docker-compose.prod.yml ps

# Access backend shell
docker-compose -f docker-compose.prod.yml exec wardrop-backend bash

# Access postgres
docker-compose -f docker-compose.prod.yml exec wardrop-postgres psql -U wardrop -d wardrop
```

---

## Project Structure

```
wardrop/
├── backend/
│   ├── app/
│   │   ├── main.py           # FastAPI entry
│   │   ├── config.py         # Settings
│   │   ├── database.py       # DB connection
│   │   ├── models/           # SQLAlchemy models
│   │   ├── schemas/          # Pydantic schemas
│   │   ├── routers/          # API routes
│   │   └── services/         # Business logic
│   ├── alembic/              # Migrations
│   ├── Dockerfile            # Backend container
│   └── uploads/              # Image storage
├── frontend/
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── pages/            # Page components
│   │   ├── i18n/             # Translations
│   │   ├── services/         # API calls
│   │   └── hooks/            # Custom hooks
│   ├── Dockerfile            # Frontend container
│   └── nginx.conf            # Frontend nginx
├── nginx/
│   └── wardrop.conf          # Main nginx config
├── docker-compose.yml        # Local development
├── docker-compose.prod.yml   # Production deployment
└── env.example               # Environment template
```

---

## License

Private - For personal use only
