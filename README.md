# Learn Deep Learning (LearnDL)
---
## ECE1724H Advance Web Development: React Ecosystem and Modern Frameworks Project
- I-Hsuan Ho 1012638022
- Der-Chien Chang 1005978596
- Kuan-Yu Chang 1007359760
- Chia-Chun Wu 1012134101

---
## Motivation
Beginners learning deep learning for NLP often struggle with the fragmented and code-heavy workflow required for even basic text classification tasks. Preparing datasets, preprocessing text, configuring models, training, tracking metrics, and interpreting outputs such as confusion matrices or learning curves typically involve substantial boilerplate code across notebooks and scripts. This setup overhead slows experimentation and shifts focus away from conceptual understanding.

LearnDL addresses this gap by providing a guided, UI-driven platform that makes the full text-classification workflow repeatable and explorable. Users can modify preprocessing steps and hyperparameters and immediately observe changes in performance and interpretability, enabling rapid, feedback-driven learning aligned with course assignments. The primary target users are students in DL/NLP courses and beginners seeking a structured sandbox for tasks such as sentiment analysis, spam detection, and topic classification. Unlike notebooks, which require coding expertise and ad hoc experiment tracking, and AutoML platforms, which prioritize final metrics while obscuring training behavior, LearnDL emphasizes transparency, iteration, and learning efficiency.

---
## Objective and Key Features

### Objectives
Build a full-stack web application where authenticated users can upload/select a text dataset, configure preprocessing and training settings, run model training as a job with progress updates, view educational visualizations, and store each run in a per-user training archive with downloadable model artifacts.


### Core Technical Compnents

#### 1. Technical Implementation
We will use Next.js backend (TypeScript) + React (TypeScript) frontend:

- **Prototype Design:** Figma
- **Frontend:** React + TypeScript + TailwindCSS
- **Backend:** Next.js + TypeScript + REST API + Prisma ORM
- **Database:** PostgreSQL
- **Authenticatrion** Firebase
- **Reason:** clean separation of concerns and easier async job orchestration (training pipeline) without mixing server actions into the UI layer.


#### 2. Database Schema and Relationship
We will use PostgreSQL (relational database) with the following schema design, aligned with the application workflow:

1. **Users**
Stores authenticated user accounts.

```
  users
  - userId (PK)
  - name
  - email (unique)
  - firebaseUid
  - created_at
  - updated_at
  - datasets
  - trainingSessions TrainingSession[]
```

2. **Training Sessions**
Represents one complete training run (shown in Archive sidebar).

```
  training_sessions
  - sessionId (PK)
  - user_id (FK → users.id)
  - datasetId
  - model_name
  - hyper_params (JSON)
  - metrics (JSON)
  - created_at
  - user       
  - dataset
```

3. **Dataset Storage (S3 – CSV files)**
Datasets are stored in S3 as .csv.

```
  datasets
  - datasetId (PK)
  - user_id (FK)
  - training_session_id (FK)
  - csv_name
  - preview (JSON)
  - isDefault (BOOL)
  - createdAt
  - user 
  - trainingSessions  
```


#### 3. File Storage Requirements

Use **S3-compatible object storage** for large files:

- Uploaded CSV datasets (raw + processed)
- Model artifacts packaged as `.zip`

DB stores only **metadata**, not raw binary blobs.


#### 4. UI and Experience Design
![Main Page](https://github.com/cc5u/ECE1724H_Advanced_Web/blob/main/proposal_images/main_page.png)

- **Training Page**
    - Dataset dropdown (built-in + upload)
    - Preprocessing toggles (lowercase, punctuation, stopwords, lemmatization optional)
    - Model selection (BiLSTM+GloVe, DistilBERT, RoBERTa)
    - Hyperparameters (epochs, batch size, learning rate, fine-tune toggle)
    - “Start Training” button + training progress status
 
![Main Page](https://github.com/cc5u/ECE1724H_Advanced_Web/blob/main/proposal_images/prediction.png)
 
- **Prediction Page**
    - Model dropdown (user’s completed runs)
    - Text input area + Predict button
    - Output label + confidence (optionally token highlights)
 
![Main Page](https://github.com/cc5u/ECE1724H_Advanced_Web/blob/main/proposal_images/archive_details.png)
![Main Page](https://github.com/cc5u/ECE1724H_Advanced_Web/blob/main/proposal_images/training_result.png)
![Main Page](https://github.com/cc5u/ECE1724H_Advanced_Web/blob/main/proposal_images/training_result2.png)

- **Archive Page**
    - **Left sidebar**: per-user run history cards (model/dataset/date/accuracy)
    - **Run detail** shows:
        - Dataset summary
        - First 10 samples table
        - Hyperparameter configuration
        - Training results (metrics cards + confusion matrix + learning curve)
        - Download model zip


#### 5. Planned Advanced Feature(At Least Two)
We will implement **at least two** (we plan 4 to be safe):

1. **Authentication & authorization**
- Register/login/logout
- Protected API routes
- Per-user isolation (users can only see their own runs and files)
1. **Real-time progress updates**
- Training is asynchronous
- Frontend receives live status updates via **SSE** (simpler than WebSocket) showing:
    - current epoch, loss/accuracy, status
1. **Non-trivial file handling**
- CSV upload + server-side validation and column mapping
- Derived artifacts generation (processed preview + model.zip)
1. **AI Chatbot Result Explanation**
- Floating AI chatbot (bottom-right corner) available across Training, Archive, and Prediction pages
- Context-aware: when viewing a specific training run, the chatbot can explain:
    - metrics (accuracy, precision, recall, F1)
    - confusion matrix interpretation
    - learning curves (overfitting/underfitting)
    - hyperparameter effects
    - prediction confidence and token importance
- Backend retrieves run data (metrics, hyperparameters, confusion matrix, curves) and sends structured context to the LLM
- Strict per-user isolation: chatbot can only access the authenticated user’s training sessions


## Tentative Plan
| Week | I-Hsuan Ho | Der-Chien Chang | Kuan-Yu Chang | Chia-Chun Wu |
|------|------------|-----------------|---------------|--------------|
| **Week 1 (March 2, 2026)** | • Cloud setup + S3 connection test<br>• Signed URL upload + validation | • Design Prototype<br>• Prediction API<br>• Model training pipeline | • DB schema + authentication<br>• Dataset API + ownership checks | • Implement UI skeleton (3 pages)<br>• Auth UI for login/register |
| **Week 2 (March 9, 2026)** | • Artifact storage structure<br>• Zip packaging pipeline | • Model training pipeline<br>• Model Result Visualization components Pipeline (model, cloud, render frontend) | • Dataset API + ownership checks<br>• Secure artifact endpoints | • Dataset upload UI components and dropdown<br>• History sidebar UI<br>• Prediction page |
| **Week 3 (March 16, 2026)** | • Presentation Slides and Rehearsal<br>• Artifact download URLs | • Presentation Slides and Rehearsal | • Presentation Slides and Rehearsal | • Presentation Slides and Rehearsal |
| **Week 4 (March 23, 2026)** | • Testing/Debugging<br>• Performance sanity checks<br>• Edge case validation | • Testing/Debugging<br>• Performance sanity checks<br>• Edge case validation | • Testing/Debugging<br>• Performance sanity checks<br>• Edge case validation | • Testing/Debugging<br>• Performance sanity checks<br>• Edge case validation |


## Initial Independent Reasoning (Before using AI)
### 1) Application structure and architecture

We initially debated **Next.js full-stack vs separate frontend/backend**. We chose **separate React frontend + Express backend** because:

- training jobs are long-running and benefit from a dedicated API + worker design
- clearer separation for team parallel work (UI vs API vs training worker)

### 2) Data and state design

We planned:

- PostgreSQL as the source of truth for users, datasets, runs, and results
- Client state kept minimal (form state + selected run); everything else fetched via APIs
- Archive view driven by `training_runs` list + `run_detail` endpoint
- Files stored in S3 with DB storing only metadata + URLs

### 3) Feature selection and scope decisions

Core features decided first: Training → Results → Archive → Prediction.

Advanced features chosen for learning value and feasibility:

- auth (essential for per-user archive)
- real-time progress (improves UX)
- file processing (CSV validation + artifacts)

We intentionally limited ML scope to avoid turning this into an ML research project.

### 4) Anticipated challenges

- Secure auth + ownership enforcement (prevent cross-user access)
- Reliable job execution + progress streaming without UI freezing
- Handling file uploads + large artifacts cleanly (storage + metadata consistency)
- Integrating visualization data formats into reusable UI components

### 5) Early collaboration plan

We planned to divide by system boundaries (frontend/backend/worker) with weekly integration checkpoints:

- API contracts defined early (request/response schemas)
- backend provides mock responses while training pipeline is built
- frontend builds UI against mock data, then switches to real endpoints

## AI Assistance Disclosure
### Brief reflection on how AI contributed

AI was used to accelerate proposal drafting and to sanity-check the architecture and schema completeness against the feature requirements.

### 1) Which parts were developed without AI?

- Original product idea (LearnDL), UI concept (Training/Prediction/Archive), and the archive sidebar requirement
- Initial decision to prioritize educational visualizations (learning curve/confusion matrix/attention)

### 2) If AI was used, what tasks did it help with?

- Draft organization using the course-required headings
- Concrete database schema mapping from UI requirements
- Suggesting feasible real-time mechanisms (SSE vs WebSocket)
- Risk/scoping suggestions (implement one model end-to-end first)

### 3) One idea influenced by AI + team tradeoff discussion

- **AI suggestion:** Use **SSE** for real-time training updates instead of full WebSockets.
- **Team tradeoff decision:** We chose SSE because it is simpler to implement/debug and sufficient for one-way progress updates. If time permits, we can extend to WebSockets later, but SSE reduces risk within the course timeline.
