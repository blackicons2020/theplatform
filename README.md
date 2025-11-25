
# The People's Platform - Backend Setup

This is the Node.js + PostgreSQL backend for The People's Platform.

## Prerequisites
1. **Node.js** installed on your computer.
2. **PostgreSQL** installed and running.

## Installation

1. Create a folder and copy `backend_server.js` (rename to `server.js`), `package.json`, and `.env` into it.
2. Open your terminal/command prompt in that folder.
3. Run the following command to install dependencies:
   ```bash
   npm install
   ```

## Database Setup

1. Open your PostgreSQL tool (pgAdmin or psql).
2. Create a new database named `peoples_platform`.
3. The server will automatically try to create tables when it starts. Alternatively, run the SQL commands in `database.sql`.

## Configuration

1. Open `.env` file.
2. Update `DATABASE_URL` with your actual Postgres credentials:
   `postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5432/peoples_platform`

## Running the Server

Run:
```bash
node server.js
```

The server will start on `http://localhost:5000`.
