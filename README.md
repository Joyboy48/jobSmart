# jobSmart

jobSmart is a full-stack job search and career management platform designed to help users find jobs, analyze resumes, identify skill gaps, and prepare for interviews. The project consists of a Node.js/Express backend and a Flutter frontend, providing a modern, scalable, and user-friendly experience.

## Table of Contents
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Backend Setup](#backend-setup)
- [Frontend Setup](#frontend-setup)
- [API Endpoints](#api-endpoints)
- [Environment Variables](#environment-variables)
- [Contributing](#contributing)
- [License](#license)

---

## Features
- User registration, login, and authentication (JWT-based)
- Profile image upload (Cloudinary integration)
- Resume analysis and skill gap detection
- Job recommendations (Remotive API integration)
- Career chat and interview preparation modules
- Secure password management and token refresh
- Role-based access control

## Tech Stack
- **Backend:** Node.js, Express, TypeScript, MongoDB (Mongoose)
- **Frontend:** Flutter (Dart)
- **Cloud Storage:** Cloudinary
- **APIs:** Remotive (job search)
- **Authentication:** JWT, HTTP-only cookies

## Project Structure

```
backend/
  src/
    controllers/      # Route controllers (auth, user, resume, etc.)
    db/               # Database connection
    middlewares/      # Express middlewares (auth, multer, etc.)
    models/           # Mongoose models
    routes/           # API route definitions
    utils/            # Utility functions (API error/response, cloudinary, etc.)
    app.ts            # Express app setup
    index.ts          # Server entry point
frontend/
  lib/                # Flutter Dart code
  assets/             # Images, icons, logos
  android/ios/web/    # Platform-specific code
  pubspec.yaml        # Flutter dependencies
```

## Backend Setup

1. **Install dependencies:**
   ```sh
   cd backend
   npm install
   ```
2. **Configure environment variables:**
   - Create a `.env` file in `backend/` with the following variables:
     ```env
     MONGODB_URI=your_mongodb_connection_string
     JWT_SECRET=your_jwt_secret
     REFRESH_TOKEN_SECRET=your_refresh_token_secret
     CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
     CLOUDINARY_API_KEY=your_cloudinary_api_key
     CLOUDINARY_API_SECRET=your_cloudinary_api_secret
     ```
3. **Run the server:**
   ```sh
   npm run dev
   ```

## Frontend Setup

1. **Install Flutter dependencies:**
   ```sh
   cd frontend
   flutter pub get
   ```
2. **Run the app:**
   ```sh
   flutter run
   ```

## API Endpoints

### Auth
- `POST /api/auth/register` — Register a new user (with profile image upload)
- `POST /api/auth/login` — Login with email or username
- `POST /api/auth/logout` — Logout and clear tokens
- `POST /api/auth/refresh-token` — Refresh access token
- `POST /api/auth/change-password` — Change current password

### User
- `GET /api/user/profile` — Get user profile
- `PUT /api/user/profile` — Update user profile

### Resume Analysis
- `POST /api/resume/analyze` — Analyze uploaded resume

### Skill Gap
- `POST /api/skill-gap` — Identify skill gaps

### Job Recommendation
- `GET /api/jobs/recommend` — Get job recommendations

### Career Chat & Interview
- `POST /api/career-chat` — Career advice chat
- `POST /api/interview/prepare` — Interview preparation

> **Note:** See `backend/src/routes/` for detailed route definitions.

## Environment Variables
See [Backend Setup](#backend-setup) for required environment variables.

## Contributing
1. Fork the repository
2. Create a new branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

## License
This project is licensed under the MIT License.
