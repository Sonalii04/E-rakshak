# E-Rakshak: Smart CCTV Video Analysis & Search System

E-Rakshak is an advanced smart surveillance and CCTV analytics system. It automates video frame extraction, object detection (YOLO), multi-object tracking (ByteTrack), trajectory analysis, attribute extraction, natural language descriptions (VLM), and vector similarity search (CLIP + FAISS) to empower investigators with cross-camera tracking and semantic search.

---

## 📂 Project Structure

```text
E-Rakshak/
├── AIVision/                  # CCTV Video Processing Pipeline (YOLOv8 + ByteTrack + CLIP + VLM)
│   ├── src/                   # Source files for detector, tracker, embedder, and attributes
│   ├── configs/               # YOLO & camera boundary zone configuration files
│   └── main.py                # Pipeline entry point
├── ai-search (3)/ai-search/   # Vector Indexing & Semantic Search Engine (FAISS + CLIP + API Client)
│   ├── src/search/            # FAISS index builder, ranker, and query expansion
│   └── tests/                 # Test suites for indexing and similarity scoring
├── backend1/backend/          # Node.js + Express API Server (Authentication, Jobs, Case Manager)
│   ├── src/                   # Routes, Controllers, Middleware, Repositories, and Database migrations
│   └── server.js              # Server entry point
├── E-RashakFrontend/          # React + Vite Dashboard Application (UI, Dark/Light Themes, Logs)
│   ├── src/                   # Components, Layouts, Context Providers, Pages, and Services
│   └── vite.config.js         # Frontend compiler config
├── .venv/                     # Shared Python Virtual Environment (Dependencies)
└── Readme.md                  # System setup & installation manual (This file)
```

---

## 🛠️ Prerequisites

Make sure you have the following installed on your machine:
1. **Node.js** (v18.x or higher) & **npm**
2. **Python** (v3.11.x recommended)
3. **PostgreSQL** (v14 or higher)
4. **Git** (for version control)

---

## 🚀 Setup & Installation

Follow these steps to set up the database, Python pipeline, backend, and frontend.

### 1. Database Setup
1. Open your PostgreSQL console or client (e.g. pgAdmin) and create a new database:
   ```sql
   CREATE DATABASE erakshak;
   ```
2. The database schema, seed data, and system configurations are automatically created and migrated on backend server boot. No manual table initialization is required.

---

### 2. Python Virtual Environment Setup (AI Pipeline)
1. Open a terminal in the root directory `E-Rakshak/`.
2. Activate the pre-configured virtual environment:
   * **Windows (PowerShell)**:
     ```powershell
     .venv\Scripts\Activate.ps1
     ```
   * **macOS / Linux**:
     ```bash
     source .venv/bin/activate
     ```
3. Update and install python dependencies if needed:
   ```bash
   pip install -r AIVision/requirements.txt
   ```
   *(This installs PyTorch, torchvision, ultralytics, transformers, opencv-python, faiss-cpu, and other ML libraries).*

---

### 3. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend1/backend
   ```
2. Install Node.js dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in `backend1/backend/.env` (if it does not exist) and configure your database credentials and secret keys:
   ```env
   PORT=3001
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/erakshak
   JWT_SECRET=supersecret_key_change_me
   
   PGUSER=postgres
   PGPASSWORD=postgres
   PGHOST=localhost
   PGPORT=5432
   PGDATABASE=erakshak
   ```

---

### 4. Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd E-RashakFrontend
   ```
2. Install Node.js dependencies:
   ```bash
   npm install
   ```
3. Verify that the API endpoint points to your backend server inside `src/services/api.js` (by default it points to `http://localhost:3001/api`).

---

## 🏃 Running the Application

To run the full E-Rakshak system locally, open two terminal windows:

### Terminal 1: Start the Backend Server
```bash
cd backend1/backend
npm run dev
```
*The server will boot, automatically migrate PostgreSQL database tables, seed mock cameras, cases, and logs, and start listening on port `3001`.*

### Terminal 2: Start the Frontend React App
```bash
cd E-RashakFrontend
npm run dev
```
*The Vite development server will start and host the application dashboard at [http://localhost:5173/](http://localhost:5173/).*

---

## 🔍 How the System Works

```mermaid
graph TD
    A[Investigator Uploads CCTV Video in UI] -->|REST API Request| B(Express Backend Server)
    B -->|Saves Video| C[AIVision/uploads/]
    B -->|Spawns Pipeline Job| D[Python main.py]
    D -->|Frame Extraction & Denoising| E[Preprocessor]
    E -->|Object Detection & ByteTrack| F[YOLOv8 & ByteTrack]
    F -->|Keyframe Feature Vectors| G[CLIP Embeddings]
    G -->|Outputs CSV & JSON Metadata| H[AIVision/output/]
    H -->|Reads & Merges Metadata| B
    B -->|Updates| I[(PostgreSQL Database)]
    B -->|Indexes crop embeddings| J[ai-search Engine]
    J -->|Stores Vectors| K[FAISS Index]
    L[Investigator inputs natural language search] -->|Semantic Search| J
```

1. **Upload & Ingestion**: The investigator drops a CCTV recording in the **Ingest Video** tab.
2. **YOLO & ByteTrack Pipeline**: The backend runs the Python pipeline on the raw frames to detect objects, track trajectories across frames, and extract attributes.
3. **Embeddings & Vector Indexing**: `ClipEmbedder` extracts normalized semantic features from cropped targets, saving them to `AIVision/output/`.
4. **Data Sync**: The backend merges these crops and metadata into `ai-search`, building the FAISS index database (`faiss.index`).
5. **Search**: Investigators can run natural language queries (e.g. *"red car moving fast at main gate"*) which performs a vector similarity search across all tracked CCTV historical frames.

---

## 🔒 Git Policy
All large video assets (`uploads/`), generated pipeline logs (`output/`), vector database files (`.npy`, `.index`), node modules (`node_modules/`), and local environment variables (`.env`) are ignored globally using `.gitignore`. Do not commit large binary files or archives.
