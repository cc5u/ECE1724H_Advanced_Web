# Learn Deep Learning (LearnDL)

## Video Demo
Link: 

## Team Information
| Team member | Student number | Email |
|-------------|----------------|-------|
| I-Hsuan Ho | 1012638022 | easy.ho@mail.utoronto.ca |
| Der-Chien Chang | 1005978596 |  |
| Kuan-Yu Chang | 1007359760 | grouper.chang@gmail.com |
| Chia-Chun Wu | 1012134101 | chiachun910711@gmail.com |

---
## Motivation
Beginners learning deep learning for NLP often struggle with the fragmented and code-heavy workflow required for even basic text classification tasks. Preparing datasets, preprocessing text, configuring models, training, tracking metrics, and interpreting outputs such as confusion matrices or learning curves typically involve substantial boilerplate code across notebooks and scripts. This setup overhead slows experimentation and shifts focus away from conceptual understanding.

LearnDL addresses this gap by providing a guided, UI-driven platform that makes the full text-classification workflow repeatable and explorable. Users can modify preprocessing steps and hyperparameters and immediately observe changes in performance and interpretability, enabling rapid, feedback-driven learning aligned with course assignments. The primary target users are students in DL/NLP courses and beginners seeking a structured sandbox for tasks such as sentiment analysis, spam detection, and topic classification. Unlike notebooks, which require coding expertise and ad hoc experiment tracking, and AutoML platforms, which prioritize final metrics while obscuring training behavior, LearnDL emphasizes transparency, iteration, and learning efficiency.

## Objectives


## Technical Stack
### Frontend
- Next.js
- Tailwind CSS
- shadcn/ui
- Radix UI
- Lucide Icons
- Recharts

### Backend
- Next.js (RESTful API)

### Database
- PostgreSQL
- Prisma ORM

### Machine Learning Backend
- FastAPI
- Uvicorn

### Dev & Deployment
- Docker
- Docker Compose

### Supporting Services
- Redis
- DigitalOcean Spaces
- AWS S3

## Features


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
  <img src="project_delivery_images/training_page_1.png?raw=true" alt="Training Page 1" width="48%" />
  <img src="project_delivery_images/training_page_2.png?raw=true" alt="Training Page 2" width="48%" />
</p>

## Development Guide


## AI Assistance & Verification


## Individual Contribution
| Team member | Contributions |
|-------------|---------------|
| I-Hsuan Ho |  |
| Der-Chien Chang |  |
| Kuan-Yu Chang |  |
| Chia-Chun Wu | • Contributed primarily on the `web_application_frontend`, `feature_csv_upload`, and `main` branches.<br>• Built the frontend interface using Vite, React, and TypeScript.<br>• Tested and validated API endpoints for both the ML backend and the LearnDL backend.<br>• Implemented the frontend logic for API integration.<br>• Developed the CSV upload and file handling workflow.<br>• Adapted the interface to use `shadcn/ui` components.<br>• Contributed to the project proposal and final deliverables. |


## Lessons Learned and Conclusion
