# Social Games

This is a Next.js application built with Firebase Studio, designed to provide a collection of simple, sensory-friendly games.

## Getting Started

You can run this project locally using either Docker (recommended for consistency) or `npm`.

### Prerequisites

- [Node.js](https://nodejs.org/en/) (version 20 or later)
- [Docker](https://www.docker.com/products/docker-desktop/) (if using the Docker method)

### Option 1: Running with Docker (Recommended)

Using Docker is the easiest way to get the application running, as it handles all dependencies and configuration for you.

1.  **Build the Docker image:**
    Open your terminal in the project's root directory and run:
    ```bash
    docker build -t social-games .
    ```

2.  **Run the Docker container:**
    Once the image is built, start a container with this command:
    ```bash
    docker run -p 3000:3000 social-games
    ```

3.  **Open the app:**
    You can now access the application by navigating to [http://localhost:3000](http://localhost:3000) in your web browser.

### Option 2: Running with `npm`

If you prefer to run the application directly on your machine without Docker, follow these steps.

1.  **Install dependencies:**
    Navigate to the project's root directory in your terminal and install the required packages:
    ```bash
    npm install
    ```

2.  **Build the application:**
    After the dependencies are installed, create a production build of the app:
    ```bash
    npm run build
    ```

3.  **Start the server:**
    Finally, start the Next.js production server:
    ```bash
    npm start
    ```

4.  **Open the app:**
    The application will be available at [http://localhost:3000](http://localhost:3000).

---

_This project was created in Firebase Studio._
