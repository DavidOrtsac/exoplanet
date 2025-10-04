# Session Management Explained

This document provides an overview of how user sessions are managed in the Flask backend to support personalized, user-specific datasets and machine learning models.

## 1. The Goal: User-Specific Context

The primary challenge was to allow multiple users to interact with the application simultaneously without their actions interfering with one another. Specifically, if one user uploads a custom dataset, it should only affect *their* predictions, not the predictions for every other user.

This required moving from a single, global state (one `dataset.csv`, one `vector_store.pkl`) to a system that could manage multiple, isolated user contexts.

## 2. The Mechanism: Flask's Cookie-Based Sessions

We use Flask's built-in session management, which is a secure, cookie-based system.

-   **Secret Key (`app.secret_key`)**: The foundation of this system is the `app.secret_key`. This is a private, random string that Flask uses to cryptographically sign the session cookie. This signature ensures that a user cannot modify the contents of their session cookie (like changing their session ID to impersonate someone else).

-   **`@app.before_request` Hook**: In `app.py`, the `ensure_session` function is decorated with `@app.before_request`. This tells Flask to run this function *before* every single API request it receives.

-   **Assigning a Unique ID**: Inside `ensure_session`, the code checks if the user's session cookie already contains a `'session_id'`.
    -   If it doesn't (meaning this is a new user), it generates a secure, random **UUID** (Universally Unique Identifier) and stores it in the session.
    -   If it does, it does nothing.

The result is that every user is guaranteed to have a unique and persistent `session_id` for as long as their browser session lasts.

## 3. The Implementation: From ID to Files

This `session_id` becomes the key to isolating user data.

-   **Directory Structure**: A dedicated directory, `data/user_sessions/`, was created to store all user-specific files.

-   **File Naming Convention**: When a user's action generates a file, their `session_id` is used in the filename.
    -   Uploaded CSV: `data/user_sessions/{session_id}_data.csv`
    -   Generated Vector Store: `data/user_sessions/{session_id}_vector_store.pkl`

-   **Dynamic File Paths**: In API endpoints like `/data/upload_user_data` and `/predict`, the code retrieves the `session_id` and uses it to construct the correct file path. This ensures that the application is always reading from and writing to the files that belong to the current user.

This approach allows the application to be stateful from the user's perspective (their data is remembered) while the backend itself remains cleanly organized, isolating each user's context based on a secure, unique identifier.
