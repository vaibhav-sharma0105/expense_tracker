# FinTrack India - Full Stack Expense Manager

A robust, full-stack expense tracking application designed for personal finance management. It allows users to track expenses, manage credit cards, and visualize spending habits.

## Features

*   **Authentication:** Secure Login and Registration (JWT based).
*   **Transactions:** Log expenses with granular details (Category, Mode, Tag, Date).
*   **Manage Cards:** Add Credit Cards with Statement and Due dates to track cycles.
*   **Dashboard:** Real-time overview of Total Spent, Savings, and Credit Card Dues.
*   **Credit Card Watch:** Smart logic to calculate pending dues for the current billing cycle.
*   **Reports:** Visual charts (Pie & Bar) for Category and Philosophy (Need/Want/Savings) analysis.
*   **Filtering & Export:** Filter transactions by Day/Week/Month/Year and export to CSV.

## Tech Stack

*   **Backend:** Python (FastAPI), SQLAlchemy (SQLite), Pydantic.
*   **Frontend:** React (Vite), Tailwind CSS, Recharts, Axios.
*   **State Management:** React Context API (Auth).

## Setup Instructions

### Prerequisites
*   Node.js (v18+)
*   Python (v3.10+)

### 1. Backend Setup

1.  Open a terminal in the **root directory** of the project.
2.  Install dependencies:
    ```bash
    pip install -r backend/requirements.txt
    ```
3.  Run the server (must be run from the root directory):
    ```bash
    python -m uvicorn backend.main:app --reloads
    ```
    The API will run at `http://127.0.0.1:8000`.

### 2. Frontend Setup

1.  Open a new terminal and navigate to the `frontend` directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Run the development server:
    ```bash
    npm run dev
    ```
    The App will run at `http://localhost:5173`.

## Upgrading to v2 (Product Feedback Update)

If you are upgrading from a previous version and want to keep your existing data (database), follow these steps:

1.  **Switch to the new branch**:
    ```bash
    git checkout product-feedbacks
    ```

2.  **Update Dependencies**:
    *   Backend:
        ```bash
        pip install -r backend/requirements.txt
        # Ensure python-multipart is installed for new forms
        pip install python-multipart
        ```
    *   Frontend:
        ```bash
        cd frontend
        npm install
        ```

3.  **Migrate Database**:
    We have added a new `comment` field to transactions. Run this script to safely update your existing database without data loss:
    ```bash
    # From the root directory
    python backend/migrate_db.py
    ```
    *This script checks if the 'comment' column exists and adds it if missing.*

4.  **Restart Servers**:
    Restart both your backend (Uvicorn) and frontend (Vite) servers to see the changes.

## Usage Guide

1.  **Register:** Create a new account.
2.  **Add Cards:** Go to "Manage Cards" and add your Credit Cards.
3.  **Log Transactions:** Use the Dashboard or Transactions page.
    *   If you select "Credit Card" as mode, you *must* select a card.
4.  **View Reports:** Check the "Reports" tab for visual insights.

## Project Structure

```
/
├── backend/
│   ├── routers/       # API Endpoints (Auth, Cards, Transactions)
│   ├── auth.py        # JWT Logic
│   ├── database.py    # DB Connection
│   ├── models.py      # SQLAlchemy Models
│   ├── schemas.py     # Pydantic Models
│   └── main.py        # Entry Point
├── frontend/
│   ├── src/
│   │   ├── components/# Layout, etc.
│   │   ├── context/   # Auth Context
│   │   ├── pages/     # Feature Pages (Dashboard, Cards, etc.)
│   │   └── App.jsx    # Routing
│   └── tailwind.config.js
```
