# Social Games

This is a Next.js application built with Firebase Studio, designed to provide a collection of simple, sensory-friendly games.

## Getting Started

To run this project on your local machine, you'll first need to clone the repository from Git. Then, you can choose to run it either directly with `npm` (the standard method) or with Docker.

### Prerequisites

*   [Git](https://git-scm.com/)
*   [Node.js](https://nodejs.org/en/) (version 20 or later)
*   [Docker](https://www.docker.com/products/docker-desktop/) (if you choose the Docker method)

---

### Step 1: Clone the Repository

First, open your terminal and clone the repository to your local machine:

```bash
git clone https://github.com/ajaysuseel/Social_Games.git
cd social-games
```

---

### Step 2: Choose Your Setup Method

#### Option A: Run with `npm` (Standard Method)

This is the recommended approach if you have Node.js installed on your system.

1.  **Install Dependencies:**
    In the project's root directory (`social-games`), run this command to install all the necessary packages:
    ```bash
    npm install
    ```

2.  **Build the Application:**
    After installation, create a production build of the app:
    ```bash
    npm run build
    ```

3.  **Start the Server:**
    Finally, start the Next.js production server:
    ```bash
    npm start
    ```

4.  **Open the App:**
    The application will now be running at [http://localhost:3000](http://localhost:3000).

#### Option B: Run with Docker

This method is great for a consistent setup, as it bundles the application and its dependencies into a container.

1.  **Build the Docker Image:**
    In the project's root directory, run the following command. This might take a few minutes the first time.
    ```bash
    docker build -t social-games .
    ```

2.  **Run the Docker Container:**
    Once the image is built, start a container with this command:
    ```bash
    docker run -p 3000:3000 social-games
    ```

3.  **Open the App:**
    You can now access the application by navigating to [http://localhost:3000](http://localhost:3000) in your web browser.

---

_This project was created in Firebase Studio._
