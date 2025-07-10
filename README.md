# Web-Crawler

This project is a full-stack web application using:

* **Go** `v1.24.4`
* **Node** `v22.15.0`
* **React** `^19.1.0` (bundled with **Vite** `^7.0.3`)
* **Docker** & `docker-compose` for containerized development

---

## 📦 Requirements

* [Docker](https://www.docker.com/) installed and running
* [Docker Compose](https://docs.docker.com/compose/) installed (usually included with Docker Desktop)

---

## 🚀 Getting Started

1️⃣ **Clone this repository**

```bash
git clone https://github.com/ilhamuh97/Web-Crawler.git
cd Web-Crawler
```

or download it as a ZIP and extract it.

---

2️⃣ **Build and start all services**

In the project root, run:

```bash
docker-compose up --build -d db backend frontend
```

This will:

* Build the Docker images for your database, backend, and frontend.
* Start all containers in detached mode.

---

3️⃣ **Run migrations**

To apply database migrations, run:

```bash
docker-compose run migrate
```

---

## ⏹️ Stopping the Application

To stop and remove all running containers, run:

```bash
docker-compose down
```

---

## ⚙️ Useful Commands

* **Rebuild containers** (if you changed Dockerfiles or dependencies):

  ```bash
  docker-compose up --build -d
  ```

* **View logs**:

  ```bash
  docker-compose logs -f
  ```

* **Stop only the containers without removing volumes**:

  ```bash
  docker-compose stop
  ```

---

## 🗂️ Project Structure

```plaintext
/
├── backend/       # Go backend source code
├── frontend/      # React frontend (Vite)
├── docker-compose.yml
└── README.md
```

---

## ✅ Versions

* **Go:** `go1.24.4 windows/amd64`
* **Node:** `v22.15.0`
* **React:** `^19.1.0`
* **Vite:** `^7.0.3`
