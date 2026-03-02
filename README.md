# ECE1724H_Advanced_Web
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
- **Backend:** Next.js + TypeScript REST API
- **Database:** PostgreSQL
- **Reason:** clean separation of concerns and easier async job orchestration (training pipeline) without mixing server actions into the UI layer.


#### 2. Database Schema and Relationship
We will use PostgreSQL (relational database) with the following schema design, aligned with the application workflow:

1. **Users**
Stores authenticated user accounts.

```
  users
  - id (PK)
  - name
  - email (unique)
  - hashed_pwd
  - created_at
  - updated_at
```

2. **Training Sessions**
Represents one complete training run (shown in Archive sidebar).

```
  training_sessions
  - id (PK)
  - user_id (FK → users.id)
  - model_name
  - chosen_model
  - hyper_params (JSON)
  - csv_url (S3 path)
  - model_url (S3 path)
  - figures_url (S3 base path)
  - created_at
```

3. **Dataset Storage (S3 – CSV files)**
Datasets are stored in S3 as .csv.

```
  datasets
  - user_id (FK)
  - training_session_id (FK)
  - csv_url (S3 path)
```

4. **Model Artifacts (S3 – .pt / .pth)**
Trained models are packaged and stored in S3.
```
  models
  - user_id (FK)
  - training_session_id (FK)
  - model_name
  - hyper_params (JSON)
  - model_url (S3 path)
  - metrics (JSON)
```

5. **Figures (S3 – .png or generated plots)**
Visualization outputs (Ex. confusion matrix, learning curve) are generated after training and stored in S3.
```
  figures
  - user_id (FK)
  - training_session_id (FK)
  - conf_matrix_url (S3 path)
  - learning_curve_url (S3 path)
```

#### 3. File Storage Requirements

Use **S3-compatible object storage** for large files:

- Uploaded CSV datasets (raw + processed)
- Model artifacts packaged as `.zip`
- Visualization figures

DB stores only **metadata and file paths/URLs**, not raw binary blobs.


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


## Tentative Plan


## Initial Independent Reasoning (Before using AI)


## AI Assistance Disclosure
