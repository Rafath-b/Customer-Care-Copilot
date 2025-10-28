# Ride Help Assistant (Frontend/Backend Architecture)

This application has been structured into a dedicated frontend (the user interface) and a backend (the AI logic server).

## How to Run

You must run both the backend server and the frontend client.

### 1. Backend Setup

The backend is a Node.js server that handles all the AI processing.

1.  **Install Dependencies:**
    Open a terminal in the project's root directory and run:
    ```bash
    npm install
    ```

2.  **Set API Key:**
    Ensure your `API_KEY` is set as an environment variable.

3.  **Start the Server:**
    In the same terminal, run:
    ```bash
    npm start
    ```
    You should see a message indicating `Server is running at http://localhost:3001`. Keep this terminal window open.

### 2. Frontend Setup

The frontend is a static web application.

1.  **Open the Client:**
    Open the `index.html` file in your web browser.

The web application will now be running and will communicate with your local backend server to process requests.