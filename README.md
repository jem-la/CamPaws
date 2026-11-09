# CamPaws 🐾

Find, like and share the dogs of Santa Clara University.

- **App:** Expo / React Native (`src/`), runs on web, iOS and Android
- **Backend:** Spring Boot REST API (`backend/`) on port 8080
- **Database:** PostgreSQL 17 + PostGIS (dog locations), run with Docker

## 1. Install these once

| Tool | Version | Get it |
|---|---|---|
| Git | any | https://git-scm.com |
| Node.js | current LTS (22 or 24) | https://nodejs.org |
| JDK | **17** (exactly; the build asks for Java 17) | https://adoptium.net (Temurin 17), or `brew install --cask temurin@17` |
| Docker Desktop | any recent | https://www.docker.com/products/docker-desktop |

You don't need to install Gradle, Expo, PostgreSQL or PostGIS yourself. The Gradle wrapper,
`npm install` and Docker handle them.

## 2. Get the code

```bash
git clone https://github.com/jem-la/CamPaws.git
cd CamPaws
npm install
```

## 3. Run it (two terminals)

Make sure **Docker Desktop is running** first.

**Terminal 1: backend + database**

```bash
cd backend
./gradlew bootRun          # Windows: gradlew.bat bootRun
```

This starts the PostGIS database from `backend/compose.yaml` automatically, creates the tables,
and adds 11 sample dogs the first time. The first run downloads a lot, so give it a few minutes.
It's ready when http://localhost:8080/api/dogs shows a list of dogs.

**Terminal 2: app**

```bash
npx expo start
```

- Press **`w`** to open the website (http://localhost:8081).
- Or scan the QR code with the **Expo Go** app on your phone (phone and computer on the same Wi-Fi).

To stop, press `Ctrl+C` in both terminals. The database container keeps running in the background
so the next start is quick; stop it with `cd backend && docker compose down`.

## Data

- Dogs, their photo URLs and likes are stored in PostgreSQL in the Docker volume `backend_campaws-db`,
  so they survive restarts.
- Each dog's last-seen spot is stored as latitude/longitude plus a PostGIS `geography` point
  (`last_seen_point`) used for "dogs near me" searches.
- Schema: `backend/src/main/resources/db/migration/` (Flyway, applied automatically on startup).
- Sample dogs: `backend/src/main/java/edu/scu/campaws/service/SampleDogSeeder.java`
  (only added when the database is empty).
- Uploaded photo files: `backend/uploads/` (not committed to git).
- **Reset everything** to the sample data: `cd backend && docker compose down -v`, then run the backend again.

Look inside the database:

```bash
cd backend
docker compose exec db psql -U campaws -d campaws -c "select dog_id, name, like_count from dogs;"
```

## API quick reference

| Method | Path | What it does |
|---|---|---|
| GET | `/api/dogs?q=&canBePetted=` | list / search dogs |
| GET | `/api/dogs/{id}` | one dog |
| GET | `/api/dogs/leaderboard` | most liked first |
| GET | `/api/dogs/nearby?lat=&lng=&radiusMeters=1000` | dogs near a point, closest first (max 50 km) |
| POST | `/api/dogs` | create (`name`, `photoUrls` required; `latitude`/`longitude` optional) |
| PUT | `/api/dogs/{id}` | update (omit `latitude`/`longitude` to keep the saved location) |
| POST | `/api/dogs/{id}/likes` | add a like |
| POST | `/api/photos` | upload a photo (multipart `file`) |

## Checks

```bash
cd backend && ./gradlew test     # backend tests; database tests are skipped if Docker isn't running
npx tsc --noEmit                 # app typecheck
npx expo lint                    # app lint
```

## Troubleshooting

- **`Cannot connect to the Docker daemon`**: start Docker Desktop and try again.
- **Port 55432 already in use**: pick another port, e.g. `CAMPAWS_DB_PORT=55433 ./gradlew bootRun`.
- **Port 8080 already in use**: `PORT=8090 ./gradlew bootRun`, and start the app with
  `EXPO_PUBLIC_API_URL=http://localhost:8090 npx expo start`.
- **`Toolchain ... languageVersion=17` not found**: install JDK 17 (see step 1).
- **App says "Can't reach the CamPaws server" on a phone**: start Expo with your computer's IP,
  e.g. `EXPO_PUBLIC_API_URL=http://192.168.1.20:8080 npx expo start`.
- **Using your own Postgres instead of Docker**: it needs the PostGIS extension. Set
  `DATABASE_URL=jdbc:postgresql://host:port/db`, `DATABASE_USERNAME` and `DATABASE_PASSWORD`.
