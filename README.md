# Learn Deep Learning (LearnDL)

## Video Demo
Link: https://youtu.be/DANUsHIKFvw

## Team Information
| Team member | Student number | Email |
|-------------|----------------|-------|
| I-Hsuan Ho | 1012638022 | easy.ho@mail.utoronto.ca |
| Der-Chien Chang | 1005978596 |  woody.chang@utoronto.ca|
| Kuan-Yu Chang | 1007359760 | grouper.chang@gmail.com |
| Chia-Chun Wu | 1012134101 | chiachun910711@gmail.com |

---
## Motivation
Beginners learning deep learning for NLP often struggle with the fragmented and code-heavy workflow required for even basic text classification tasks. Preparing datasets, preprocessing text, configuring models, training, tracking metrics, and interpreting outputs such as confusion matrices or learning curves typically involve substantial boilerplate code across notebooks and scripts. This setup overhead slows experimentation and shifts focus away from conceptual understanding.

LearnDL addresses this gap by providing a guided, UI-driven platform that makes the full text-classification workflow repeatable and explorable. Users can modify preprocessing steps and hyperparameters and immediately observe changes in performance and interpretability, enabling rapid, feedback-driven learning aligned with course assignments. The primary target users are students in DL/NLP courses and beginners seeking a structured sandbox for tasks such as sentiment analysis, spam detection, and topic classification. Unlike notebooks, which require coding expertise and ad hoc experiment tracking, and AutoML platforms, which prioritize final metrics while obscuring training behavior, LearnDL emphasizes transparency, iteration, and learning efficiency.

## Objectives
The objective of this project is to build a full-stack web application that supports the end-to-end workflow of educational text classification. The system should allow authenticated users to select a default dataset or upload their own text dataset, configure preprocessing and model training settings, and launch training as an asynchronous job with progress updates.

In addition, the application should provide clear visualizations of training results, including metrics and other educational outputs that help users understand model behavior. It should also allow users to use trained models for prediction on new input text and maintain a per-user archive of training sessions, including saved configurations, results, dataset previews, and downloadable model artifacts.

Overall, the goal is not only to provide a working text-classification platform but also to create an interactive learning environment that makes experimentation easier, more transparent, and more accessible to beginners.


## Technical Stack
| Category | Technology |
| :--- | :--- |
| **Framework** | Next.js (App Router) + TypeScript |
| **UI System** | React + shadcn/ui |
| **Styling** | Tailwind CSS (Responsive Design) |
| **Database** | PostgreSQL + Prisma ORM |
| **Auth** | Firebase Authentication & Admin SDK |
| **ML Engine** | Python (Decoupled Backend) |
| **File Store** | DigitalOcean Spaces (S3-Compatible) |

Our system was implemented as a **full-stack web application using Next.js, React, and TypeScript**. 
1. System Framework & Programming Language  -
    - Next.js:
        
        We intentionally adopted a **Next.js full-stack approach** over a traditional decoupled frontend/backend (e.g., React + Express). This decision was driven by the high degree of functional coupling between our core workflows:
        
        - **Integrated Logic:** Operations such as Firebase authentication, dataset management, and training session retrieval require seamless coordination between UI state and server-side processing.
        - **Reduced Overhead:** By consolidating API routes and server-side data access into a single codebase, we eliminated the development overhead of managing two independent applications.
        - **Integration Efficiency:** This unified structure natively bypasses **Cross-Origin Resource Sharing (CORS)** complexities and cross-service integration hurdles, resulting in a more maintainable and resilient project structure.
    - TypeScript :
        
        ensure reliability across the application’s lifecycle, the system is built entirely with **TypeScript**.
        
        - **Strong Type Safety:** Utilizing TypeScript allows for the definition of clear contracts between the client and server. By sharing data models and types across the entire stack, we significantly reduced runtime errors and improved code discoverability.
        - **Maintainability:** In an environment with tightly coupled interactions—such as mapping complex ML training parameters to UI forms—TypeScript ensures that changes in the backend schema are immediately reflected as type errors in the frontend, preventing silent failures during development.
    
    The application utilizes the **Next.js App Router** for sophisticated page routing and API handling. This modern routing paradigm enables efficient server-side rendering (SSR) and optimized data fetching, ensuring the educational dashboard remains responsive even when handling large-scale training archives and dataset metadata.
    
2. Frontend & User interface -
    
    On the frontend, we use **shadcn/ui** as the component system and **Tailwind CSS** for styling. This combination allowed us to build a clean and consistent interface while still keeping full control over component code and custom styling. 
    
    1. React :  
        
        Serves as the foundational library for building a declarative and state-driven UI. We leveraged React’s component-based architecture to encapsulate complex logic—such as real-time training progress bars and interactive data tables—into reusable units, ensuring a maintainable and scalable codebase.
        
    2. shadcn/ui :
        
        shadcn/ui was especially suitable because it provides accessible and reusable UI primitives without forcing a rigid design system, which made it easier to adapt components to our project’s educational dashboard layout. 
        
    3. Tailwind CSS:
        
        Tailwind CSS helped us rapidly implement spacing, typography, layout, and state-based styling directly in components, making the interface easier to maintain. 
        
    4. Responsive Design:
        
         We also designed the interface with **responsive layouts**, using flexible containers, grids, and breakpoint-based adjustments so the training, prediction, and archive pages remain usable on different screen sizes.  
        
3. Data management
    1. PosgreSQL :
        
        For persistent storage, we used **PostgreSQL** as the main database and **Prisma** as the ORM layer. PostgreSQL was chosen because it provides a reliable relational database structure for managing users, datasets, training sessions, and stored results.
        
    2. Prisma :
        
        Prisma simplified schema definition, database queries, and type-safe access from the Next.js server routes. This was particularly useful for maintaining relationships between uploaded datasets, training runs, archived results, and associated users.
        
        The database serves as the source of truth for the application state, while Prisma helps keep the implementation organized and less error-prone.
        
    3. **DigitalOcean Spaces**  :
        
        For file storage, we used **DigitalOcean Spaces** to store uploaded CSV datasets and generated files through presigned URLs. This made dataset upload and retrieval more scalable than storing raw files directly in the application server.
        
    
    4. Other Services & Infrastructure
        1. **Firebase Authentication & Admin SDK:**
            
            For authentication, the project uses **Firebase Authentication** on the client side together with **Firebase Admin** verification on the server side. This allowed us to support secure user login and signup while ensuring protected backend routes can verify user identity before granting access to datasets or training history. 
            
        2. Python ML Backend
            
            Although the web application follows a full-stack Next.js architecture, the **machine learning training and prediction logic is implemented as a separate Python backend service**. This separation was intentional: model training depends on Python-based ML libraries and a runtime environment that is different from the web stack. Keeping the ML backend separate allowed us to use the most appropriate tools for model development while still letting the Next.js application coordinate the overall workflow. 
            In this design, Next.js handles user interaction, authentication, dataset management, and run tracking, while the ML backend focuses on preprocessing, training, evaluation, and prediction.
    

Overall, this stack was selected to balance **development efficiency, maintainability, usability, and technical suitability**. Next.js unified the application layer, PostgreSQL and Prisma provided structured persistent storage, shadcn/ui and Tailwind CSS enabled a modern responsive interface, and the separate Python ML backend ensured that machine learning functionality could be implemented using the right ecosystem.

## Features
LearnDL provides an end-to-end workflow for **educational text classification model training**. A user can log in, choose a dataset, configure preprocessing and model parameters, launch a training job, monitor its progress, inspect training results, and later reuse a trained model for prediction. This directly supports the project objective of making deep learning workflows more accessible through an integrated web interface rather than a fragmented notebook-based process.

1. Frontend & User interaction Layer
    
    The interface serves as the orchestration hub where users define their experimental parameters and monitor progress.
    
    - **Interactive Dashboard & Dataset Preview:**
        
        Upon login, users access a centralized dashboard to manage their workspace. A **Live Data Inspector** allows users to audit sample rows and headers of CSV     files before training, ensuring data quality and alignment with the model's requirements.
        
    - **Dynamic Configuration Engine:** The UI provides a granular control panel for the ML pipeline. Users can toggle **Preprocessing Suites and** tune               **Hyperparameters** through a responsive, state-driven form :

        | Preprocessing Suites | Hyperparameters |
        | :--- | :--- |
        | Lowercasing | Embedding model choice |
        | Punctuation removal | Batch size |
        | Stopword removal | Learning rate |
        | Lemmatization | Epochs |
        | Train-validation split | Fine-tuning mode |
        | Special text patterns (URLs or emails) | Classifier settings |

   - **Real-Time Progress Tracking:** During long-running training tasks, the frontend provides active status updates (Queued, Processing, or Completed) and live     performance logs, moving away from "black-box" processing to a transparent, user-friendly experience.

2. Backend Logic & Execution Layer

    The backend architecture is split between application orchestration and high-performance computation.
    
    - **Asynchronous Training Workflow:** The **Next.js** backend manages user requests and session state, while a decoupled **Python ML Service** handles the     heavy lifting. This allows users to continue navigating the platform while the model trains in the background.
    - **Result Analytics & Visualization:** Once training concludes, the platform show the **result visualization module** :
        - performance metrics
            - accuracy
            - precision
            - recall
            - F1-score
        - confusion matrices
        - learning curves
        - attention-based
        - embedding-based
        
        These visualizations  support the educational objective of helping users interpret model behavior rather than only observing a final number, providing deep insights into model behavior beyond simple accuracy.
        
    - **Live Inference (Prediction) Service:** The platform includes a dedicated inference endpoint that allows users to input custom text strings and receive real-time classifications from their specifically trained models, bridging the gap between experimentation and application.

3. Data Storage & Cloud Infrastructure
    
    This layer ensures that every experiment is persistent, secure, and scalable.
    
    - **Relational Schema & Experiment Tracking:** Every training run is recorded in **PostgreSQL via Prisma**. This "Stateful History" maps the exact intersection of hyperparameters, dataset versions, and progress states to their respective results; this architecture ensures that users can seamlessly navigate between diverse historical sessions for targeted model inference.
        - The **Training Archive page:**
            
            Comparing past iterations, instead of losing results after each run, the user can compare training attempts over time, review stored metrics, and access associated artifacts later. 
            
        - The **Prediction** page:
            
            Allowing users to reuse previously trained models on new input text. This demonstrates that the system is not limited to one-time training experiments but also supports downstream inference. 
            
    - **Cloud-Native File Handling:** LearnDL system support multiple datasets and allow experimentation with both provided and custom data. Users can either choose from built-in default datasets or upload their own CSV files. For Large assets, such as uploaded CSVs and generated model weights, are stored in **DigitalOcean Spaces**. The system uses **Presigned URLs** to facilitate secure, direct uploads from the browser, ensuring the application server remains performant and unburdened by large file transfers.
    - **Authenticated User Isolation:** Integrated with **Firebase Auth**, the storage and database schemas are strictly partitioned by User ID. This ensures that a user’s datasets, custom models, and training history remain private and securely associated with their account.

## User Guide
The application is organized around three main user workflows: **training**, **prediction**, and **archive review**. After logging in, the user can train a text classification model, use a previously trained model to classify new text, and review or download artifacts from past runs. The interface is designed so that each workflow is separated into a dedicated page, making the system easier to learn and use.

### 1. Account Registration and Login
When the application is opened, the user first sees the welcome page. New users can create an account by entering a username, email, and password. Existing users can log in using their email and password. Authentication is required before accessing the dashboard pages, so each user only sees their own uploaded datasets, training sessions, and saved results.

<p align="center">
  <img src="project_delivery_images/login.png?raw=true" alt="Login Page" width="48%" />
  <img src="project_delivery_images/register.png?raw=true" alt="Register Page" width="48%" />
</p>

### 2. Training a Model
The Training page is the main entry point for creating a model. The user begins by entering a model name, which is used to identify the run later in prediction and archive views. The user then selects a dataset. The system supports both built-in default datasets and user-uploaded CSV files. If the user uploads a CSV file, the dataset is stored and can be reused later. A dataset preview is displayed so the user can confirm the format and content before training begins.

The page also provides preprocessing controls. These allow the user to choose whether to lowercase text, remove punctuation, remove stopwords, apply lemmatization, enable stratified splitting, and decide how URLs or email addresses should be handled. These options help the user understand how different preprocessing choices may affect model performance.

Below the preprocessing section, the user configures the model and training parameters. These include the embedding model type, classifier type, hidden layer size, dropout rate, learning rate, batch size, number of epochs, evaluation frequency, and fine-tuning mode. Once all settings are chosen, the user starts training. During training, the interface shows progress and current status so the user can monitor long-running jobs. Training can also be cancelled if needed.

<p align="center">
  <img src="project_delivery_images/training_page_1.png?raw=true" alt="Training page 1" width="48%" />
  <img src="project_delivery_images/training_page_2.png?raw=true" alt="Training page 2" width="48%" />
</p>
<p align="center">
  <img src="project_delivery_images/training_cancel.png?raw=true" alt="Cancel training" width="24%" />
</p>

### 3. Viewing Training Results

After training completes, the system displays a result section containing evaluation metrics and visualizations. This includes accuracy, precision, recall, and F1 Score, along with additional visual outputs such as confusion matrices, learning curves, attention visualizations, and embedding visualizations where available. These outputs are intended to help users not only see final performance numbers but also better understand model behavior and learning progress.

<table align="center">
  <tr>
    <td valign="top" width="48%">
      <img src="project_delivery_images/metrics.png?raw=true" alt="Training metrics" width="100%" />
      <br /><br />
      <img src="project_delivery_images/confusion_matrix.png?raw=true" alt="Confusion matrix" width="100%" />
      <br /><br />
      <img src="project_delivery_images/attention.png?raw=true" alt="Attention visualization" width="100%" />
    </td>
    <td valign="top" width="48%">
      <img src="project_delivery_images/learning_curve.png?raw=true" alt="Learning curves" width="100%" />
      <br /><br />
      <img src="project_delivery_images/embedding.png?raw=true" alt="Embedding visualization" width="100%" />
    </td>
  </tr>
</table>

### 4. Running Prediction

The Prediction page allows the user to reuse a previously trained model. The user first selects a completed training session from the available models list. Only completed runs with saved hyperparameters can be used for prediction. The user then enters a piece of input text and clicks the Predict button. The system returns the predicted label, confidence scores, and an attention-based explanation showing which words had the strongest influence on the prediction. This feature demonstrates how a trained model can be applied interactively after training is finished.

<table align="center">
  <tr>
    <td valign="top" width="48%">
      <img src="project_delivery_images/predict_1.png?raw=true" alt="Select model and input text" width="100%" />
      <br /><br />
      <img src="project_delivery_images/predict_2.png?raw=true" alt="Prediction result" width="100%" />
    </td>
    <td valign="top" width="48%">
      <img src="project_delivery_images/predict_3.png?raw=true" alt="Attention result" width="100%" />
    </td>
  </tr>
</table>

### 5. Reviewing the Archive

The Archive page stores previous training runs and allows the user to inspect them later. The left side of the page shows the run history, including model name, date, status, progress, and accuracy. Selecting a run opens its detailed view. The user can review the dataset summary, preprocessing configuration, hyperparameters, stored dataset preview, and training visualizations. If the run completed successfully, the user can also download the saved model artifacts. This page is useful for comparing experiments and keeping a persistent record of past model training sessions.

<p align="center">
  <img src="project_delivery_images/archive_1.png?raw=true" alt="Archive Page 1" width="48%" />
  <img src="project_delivery_images/archive_2.png?raw=true" alt="Archive Page 2" width="48%" />
</p>

### 6. Dataset and Session Management

Users can manage their own resources directly from the interface. Uploaded datasets can be deleted, and training sessions can also be removed when they are no longer needed. This helps keep the workspace organized and ensures that the platform supports repeated experimentation without unnecessary clutter.

<p align="center">
  <img src="project_delivery_images/delete_dataset.gif?raw=true" alt="Delete dataset" width="48%" />
  <img src="project_delivery_images/delete_session.gif?raw=true" alt="Delete session" width="48%" />
</p>

## Development Guide
### 1. Environment setup and configuration

The repo has two services: **`learn-dl/`** (Next.js full stack) and **`ml_backend/`** (FastAPI). Install **Docker Desktop**. For non-Docker ML runs, use **Python 3.11+** and **Node.js** (LTS).

Add **`learn-dl/.env.local`** (also used by `docker compose`):

```
# Browser — Firebase Auth
NEXT_PUBLIC_FIREBASE_API_KEY=<your-firebase-web-api-key>
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=<your-project>.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=<your-project-id>
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=<your-project>.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<your-sender-id>
NEXT_PUBLIC_FIREBASE_APP_ID=<your-app-id>

# Server — Firebase Admin
FIREBASE_PROJECT_ID=<your-project-id>
FIREBASE_CLIENT_EMAIL=<service-account>@<project>.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n<key-lines>\\n-----END PRIVATE KEY-----\\n"

AUTH_SECRET=<random-secret-string>

# Local Postgres on host (e.g. hybrid dev); compose overrides this inside containers
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/learndl_db?schema=public

# DigitalOcean Spaces (S3-compatible) — web app uploads / URLs
SPACES_KEY=<spaces-access-key>
SPACES_SECRET=<spaces-secret-key>
SPACES_BUCKET=<bucket-name>

# Client calls /model_api on the Next origin; Next proxies to ML_API_URL (server-only, see next.config.ts)
NEXT_PUBLIC_ML_API_URL=/model_api
ML_API_URL=http://localhost:8000/model_api
```

If **Next and ML both run in Docker** on the same machine, the Next container must reach ML on the host; use **`ML_API_URL=http://host.docker.internal:8000/model_api`** and **rebuild** the `learn-dl` image. For a **remote** ML host (e.g. Runpod), set **`ML_API_URL=https://<your-ml-host>/model_api`**.

Add **`ml_backend/.env`**:

```
REDIS_HOST=localhost
DO_REGION=<region>
DO_ENDPOINT=https://<region>.digitaloceanspaces.com
DO_ACCESS_KEY=<spaces-access-key>
DO_SECRET_KEY=<spaces-secret-key>
DO_BUCKET_NAME=<bucket-name>
```

Redis backs training status; **`DO_*`** is required for checkpoint upload/download. Hugging Face weights download on first use.

---

### 2. Database initialization

**Docker workflow (default):** from **`learn-dl/`**:

```bash
docker compose up --build
```

This starts PostgreSQL, runs the **`migrate`** container once (**Prisma migrations + seed**), then starts the Next.js app when migrate succeeds. **No separate Prisma commands are required** for this path.

---

### 3. Cloud storage configuration

- **`learn-dl`:** `SPACES_KEY`, `SPACES_SECRET`, `SPACES_BUCKET` — presigned uploads and dataset handling via the S3-compatible Spaces API.
- **`ml_backend`:** `DO_*` — same style of object storage for model checkpoints; training and prediction need a working bucket configuration.

---

### 4. Local development and testing

**Minimal replication (two terminals):**

1. **`ml_backend/`:** `docker compose up --build` → ML API at [**http://localhost:8000**](http://localhost:8000/) (Redis runs inside the container). Smoke test: **http://localhost:8000/model_api/health_check**.
2. **`learn-dl/`:** `docker compose up --build` → app at [**http://localhost:3000**](http://localhost:3000/) (database initialized in docker container).

Align **`ML_API_URL`** with where the **Next server** can reach the ML API (localhost, `host.docker.internal`, or a public ML URL). Sign in with Firebase, then exercise training and prediction.

---

### 5. GPU Deployment information

**GPU cost:** Training is intended to run on **GPU** (e.g. **Runpod**), which is **paid by usage**. Our team does **not** keep a GPU instance running all the time. If a TA needs GPU to exercise the full stack, they can follow the deployment options below (e.g. request a URL from us or deploy the image on Runpod). **The same system can still be run entirely on a local machine using the development instructions above** (Docker Compose for `learn-dl` and `ml_backend`); training and inference will work on **CPU** but will be **much slower** than on GPU.

**Option A:** Ask the team for a running instance; we provide a public **`model_api`** base URL. In **`learn-dl/.env.local`**, set **`ML_API_URL`** to that URL. Keep **`NEXT_PUBLIC_ML_API_URL=/model_api`** so the browser uses Next as a proxy (`next.config.ts`).

**Option B (Runpod):**

<p align="center">
  <img src="project_delivery_images/GPU.gif?raw=true" alt="GPU Deployment" width="80%" />
</p>

1. Open [LearnDL ML backend](https://console.runpod.io/deploy?template=94m5p4yn0e&ref=flxjw28f) and choose a GPU (e.g. **RTX 4090**), **1 GPU**, and **On-Demand** (or your preferred pricing).  
2. Click **Edit** on the pod template (or **Change template**, then edit).  
3. Set **`DO_ACCESS_KEY`** and **`DO_SECRET_KEY`** to your **DigitalOcean Spaces** credentials—paste the values **without** double quotes (`"`).  
4. Save your changes and **deploy** the pod.  
5. When the pod is running, copy the **public URL** for **port 8000**. In **`learn-dl/.env.local`**, set **`ML_API_URL=<that-url>/model_api`** (e.g. `https://xxxxx-8000.proxy.runpod.net/model_api`). Then run **`docker compose up --build`** in **`learn-dl/`**.

## AI Assistance & Verification
1. **Functional Scopes of AI Integration**
    
    AI tools were strategically deployed to assist with high-velocity development tasks:
    
    - **Architectural Trade-off Analysis:** Evaluating the systemic implications of a **unified Next.js full-stack design** versus a decoupled microservice architecture.
    - **Refactoring & UI Implementation:** Streamlining the migration of legacy components to the **shadcn/ui** framework and optimizing **Tailwind CSS** for responsive design.
    - **Debugging & Documentation:** Identifying edge cases in integration logic and drafting technical documentation templates to improve project transparency.
2. **Critical Evaluation & Representative Limitation**
    
    The team maintained a **critical posture** toward AI-generated outputs, recognizing that syntactic validity does not equal functional correctness. Detailed examples of this and other interactions are documented in **`ai-session.md`**.
    
3.  **Verification & Validation (V&V) Protocol**
    
    Technical correctness was established through a rigorous verification protocol rather than relying on the confidence of the AI model. Our workflow included:
    
    - **Manual Code Review:** Detailed diff inspections of all AI-suggested refactors to ensure alignment with our **PostgreSQL** schema and TypeScript interfaces.
    - **Dynamic Analysis:** Continuous inspection of runtime logs, **Prisma** artifact generation, and **Docker** build outputs.
    - **End-to-End (E2E) Testing:** Comprehensive manual validation of critical user flows, specifically:
        - **Identity Management:** Firebase token verification and user-data isolation.
        - **Data Pipeline:** CSV ingestion via **DigitalOcean Presigned URLs**.
        - **Stateful Tracking:** Real-time training progress monitoring and result persistence.
    
    Ultimately, while AI contributed significantly to development velocity, the **technical integrity** of the final system was established solely through developer review, local builds, and systematic manual testing.


## Individual Contribution
| Team member | Contributions |
|-------------|---------------|
| I-Hsuan Ho | • Contributed primarily on the `web_application_backend`, `seed-default-data` and `main` branches.<br>• Engineered Data Storage including schema design, Prisma migrations, and database seeding for training metadata.<br>• Developed Backend APIs for file handling, integrating **DigitalOcean Spaces** for scalable asset management and Presigned URL generation logic.<br>• Authored the system's technical documentation and architectural breakdown. |
| Der-Chien Chang | • Contributed primarily on the `ml_backend`, `plot`, and `training_page-backend-api` branches.<br>• Connected **Next.js** to **`ml_backend`** by implementing **`ml_client`** (**axios**) against the **`/model_api`** endpoints (train, status, and error handling).<br>• Implemented **`ml_backend`** training workflow logic and exposed it through FastAPI routes consumed by the web app.<br>• Built frontend **plotting and visualization** (confusion matrix, learning curves, training-result charts) to present model outputs.<br>• **Tested end-to-end integration** among **Next.js**, the **`ml_backend` API**, and **DigitalOcean** (e.g. Spaces / cloud-backed data and artifacts).|
| Kuan-Yu Chang | • Contributed primarily on the `web_application_backend`, and `main` branches.<br>• Built the backend and database using Next.js, React, TypeScript, CURL, Docker, Prisma and PostgreSQL.<br>• Authentications using RESTful API, JWT token, Firebase and Firebase Admin token verification.<br>• Tested and validated API endpoints for LearnDL backend and database.<br>• Contributed README.md file for each folder.<br>• Contributed to the project proposal and final deliverables.<br>• Configured Docker Compose to standardize backend development across the team. |
| Chia-Chun Wu | • Contributed primarily on the `web_application_frontend`, `feature_csv_upload`, and `main` branches.<br>• Built the frontend interface using Vite, React, and TypeScript.<br>• Tested and validated API endpoints for both the ML backend and the LearnDL backend.<br>• Implemented the frontend logic for API integration.<br>• Developed the CSV upload and file handling workflow.<br>• Adapted the interface to use `shadcn/ui` components.<br>• Contributed to the project proposal and final deliverables. |


## Lessons Learned and Conclusion
Throughout the development of LearnDL, our team gained valuable experience in building a full-stack machine learning application that integrates modern web technologies with backend services and model training workflows. We improved our understanding of system design, particularly in structuring a scalable architecture that connects a Full stack Next.js, a FastAPI ML service, and a PostgreSQL database through well-defined APIs. This project also strengthened our skills in containerization using Docker and Docker Compose, enabling consistent development environments across team members.

One key challenge we encountered was team communication and alignment on the technical stack. Initially, parts of the frontend were developed using Vite with React, while the original intention was to build a unified full-stack application using Next.js. This misalignment led to integration complexity and additional refactoring effort later in the project. From this experience, we learned the importance of clearly defining architectural decisions early and maintaining consistent communication throughout development.

Despite these challenges, the team successfully collaborated to integrate all components into a functional system. We also learned how to debug cross-service issues, manage API contracts, and coordinate work across frontend, backend, and ML pipelines. Overall, this project provided practical insight into real-world software engineering workflows, emphasizing not only technical implementation but also teamwork, planning, and adaptability.
