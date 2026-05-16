## Run Locally

**Prerequisites:** Node.js, Java 17+

### Frontend (dev)

1. Install dependencies:
   `npm install`
2. Run the app:
   `npm run dev`

### Backend (Java HttpServer)

1. Build the frontend assets:
   `npm run build`
2. Compile the server:
   `javac -d server/out server/src/Main.java`
3. Run the server:
   `java -cp server/out Main`

The server runs on `http://localhost:8080` by default and serves both the API and the built frontend.

### Environment Variables

- `GOOGLE_MAPS_PLATFORM_KEY`: Google Maps API key for the map.
- `PORT`: Override the backend port (default 8080).
- `HOST`: Bind the backend to a specific interface (optional).
