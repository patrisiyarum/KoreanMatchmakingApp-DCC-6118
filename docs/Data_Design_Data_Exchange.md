# Data Design — Data Exchange Subsection

*This subsection describes how data is transferred between the client and server in the AI-Enhanced Language Exchange Matchmaker. It is intended for inclusion in the larger Detailed Design Document.*

---

## Data Exchange

### Format and Protocols

**Data format.** All API request and response payloads use **JSON (JavaScript Object Notation)**. JSON is the standard interchange format for the REST API: request bodies are sent as `Content-Type: application/json`, and responses are returned as JSON. The frontend uses the Axios HTTP client, which serializes/deserializes JSON by default.

**Protocols.** Communication between the browser (client) and the backend is over **HTTP/HTTPS**:

- **Development:** The frontend typically calls the backend using the base URL configured in `REACT_APP_BACKEND_URL` (e.g., `http://localhost:8080`). Data is sent over HTTP unless the backend is explicitly served over HTTPS.
- **Production:** The application is deployed at **https://languagematchmaker.modlangs.gatech.edu**. In production, all traffic between the user’s device and the server should use **HTTPS** so that the data exchange channel is encrypted in transit.

**API style.** The backend exposes a **REST-style API** under the base path `/api/v1/` (and some legacy routes at the root, e.g. `/api/login`, `/Register`). Typical usage:

- **GET** — Retrieve resources (e.g., user profile, transcripts, meetings, interests, availability).
- **POST** — Create resources or perform actions (e.g., login, registration, create meeting, upload recording, AI assistant chat).
- **PUT** — Update resources (e.g., user profile, chat privacy, availability).
- **DELETE** — Remove resources (e.g., delete user, remove friend, delete meeting).

**File transfer.** Audio (and optionally video) from the language exchange features are sent as **multipart/form-data** uploads:

- **Recording uploads:** Audio is sent as a file (e.g., **WebM**). The backend accepts `audio/webm` or `video/webm` (and for in-memory processing, any `audio/*` or `video/*`). A 100 MB size limit is applied per upload.
- **AI assistant:** The `/api/v1/ai-assistant/chat` endpoint accepts an audio file via `memoryUpload.single('audioFile')` for in-memory processing.

**Cross-origin.** The server uses **CORS** so that the React frontend (on a different origin in production) can call the API. Allowed origins are configured via `CORS_ORIGIN` (e.g., production: `https://languagematchmaker.modlangs.gatech.edu`; development: `http://localhost:3000`). Credentials are supported (`credentials: true`) for cookie/session-based flows if used.

**Summary for implementers:**

| Aspect            | Choice / implementation                                      |
|------------------|--------------------------------------------------------------|
| Payload format   | JSON for all REST request/response bodies                    |
| Transport        | HTTP (dev), HTTPS (production)                              |
| API style        | REST under `/api/v1/` and selected root routes              |
| Client library   | Axios (frontend)                                             |
| File uploads     | Multipart form-data; WebM audio/video; 100 MB limit          |
| Cross-origin     | CORS with configurable allowed origins and credentials       |

---

### Security Considerations

The following security aspects are relevant to data exchange and storage. Discuss with the client or deployment owner to confirm and, where needed, harden (e.g., HTTPS everywhere, token lifetime, PII handling).

**1. Data encryption**

- **In transit:** Use **HTTPS** for all client–server traffic in production so that data (including login credentials and PII) is encrypted over the network. The deployment target (e.g., Georgia Tech Plesk) should provide TLS/SSL for the public URL.
- **At rest:** Database and file storage encryption depend on the hosting environment (e.g., MySQL and filesystem encryption at the provider). Document the actual encryption at rest in the deployment or operations documentation.

**2. Secured data exchange channel (HTTPS vs HTTP)**

- **Production:** All user-facing access should be over **HTTPS** (https://languagematchmaker.modlangs.gatech.edu). Ensure the frontend’s `REACT_APP_BACKEND_URL` (or equivalent) points to an HTTPS API URL in production so that no API calls are made over plain HTTP.
- **Development:** Local use of HTTP (e.g., `http://localhost:8080`) is acceptable only in non-production environments; avoid sending real user data over HTTP.

**3. User login and authentication**

- **Login required:** The application is **login-based**. Users must sign in (email and password) to access the dashboard, profile, matching, meetings, chat, and AI assistant features.
- **How users log in:** Login is implemented with **email and password** submitted to `/api/login`. The backend does **not** store plain-text passwords; see item 4 below. There is no integration with an external identity provider (e.g., OAuth) in the current codebase; authentication is handled internally.

**4. Password storage (not plain text)**

- Passwords are **hashed** before storage using **bcrypt** (e.g., `bcryptjs` with a salt round of 10). On registration, the plain password is hashed and only the hash is stored in the database. On login, the submitted password is compared to the stored hash via `bcrypt.compareSync`. Plain-text passwords are never stored.

**5. Financial data**

- The system does **not** process payment or other financial data. No special handling for financial data transfer or storage is required for the current scope.

**6. Personally Identifiable Information (PII)**

- The application **does** collect and store PII, including:
  - **UserAccount:** email, firstName, lastName (and possibly address in some flows).
  - **UserProfile:** age, gender, profession, time zone, and language preferences.
  - **Conversations and transcripts:** chat content and speech/transcript data tied to users.
- **Protection measures (current and recommended):**
  - Passwords are hashed (see above).
  - Access to data is constrained by application logic (e.g., users see their own profile and authorized chats). Sensitive API endpoints should validate the authenticated user and restrict access by user ID.
  - In production, use HTTPS for all traffic to protect PII in transit.
  - Follow institutional and legal requirements (e.g., FERPA, GDPR if applicable) for retention, access control, and disclosure. Consider a short privacy notice or terms of use that describe what PII is collected and how it is used and protected.

**7. Additional privacy considerations**

- **Client-side storage:** The frontend stores a “profile” object in **localStorage** after login (e.g., user id and related data). This data is not encrypted in localStorage; avoid storing highly sensitive fields there, and clear it on logout (the current flow clears localStorage on LOG_OUT).
- **Transcripts and AI:** Transcript and AI conversation data may contain personal or sensitive content. Ensure that only the owning user (or explicitly authorized parties) can access them, and that retention and deletion policies are defined.
- **Visibility and sharing:** User profile visibility and what is shared with other users (e.g., in matching) should be clearly defined and enforced in the API and UI.

---

*End of Data Exchange subsection.*
