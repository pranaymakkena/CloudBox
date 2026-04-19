# CloudBox — Scalable Multi-Cloud File Management

A full-stack cloud file management platform built with Spring Boot and React.

---

## Features

- JWT authentication with role-based access (User / Admin)
- File upload, download, preview, rename, trash & restore
- DOCX viewing and editing in-browser
- File sharing with View / Download / Edit permissions
- Bulk share to multiple users
- Public link sharing with optional expiry
- Real-time collaboration with chat-style comments
- Shared-edit sync — changes reflect for all collaborators
- Razorpay payment integration (Free / Pro / Enterprise plans)
- Email notifications via Gmail SMTP (welcome, share, payment, password reset)
- Admin dashboard — user management, logs, file control, settings
- Storage quota per user (15 GB free, upgradeable)
- Starred files, category filters, sort controls
- Responsive UI with collapsible sidebar

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, React Router, Axios |
| Backend | Spring Boot 3, Spring Security, JPA |
| Database | TiDB Cloud (MySQL-compatible) |
| Storage | Local filesystem (`uploads/`) |
| Auth | JWT |
| Email | Gmail SMTP (Spring Mail) |
| Payments | Razorpay |

---

## Prerequisites

- Java 17+
- Node.js 18+
- Maven
- MySQL or TiDB Cloud account

---

## Setup

### 1. Clone the repo

```bash
git clone https://github.com/your-username/cloudbox.git
cd cloudbox
```

### 2. Configure the backend

Edit `backend/src/main/resources/application.properties`:

```properties
# Database (TiDB Cloud or local MySQL)
spring.datasource.url=jdbc:mysql://your-host:4000/test?sslMode=VERIFY_IDENTITY
spring.datasource.username=your-username
spring.datasource.password=your-password

# Local file storage
storage.upload-dir=uploads/

# Gmail SMTP
spring.mail.username=your@gmail.com
spring.mail.password=your-app-password

# Razorpay (get keys from razorpay.com)
razorpay.key.id=rzp_test_xxxx
razorpay.key.secret=your-secret
```

### 3. Run the backend

```bash
cd backend
mvn spring-boot:run
```

Backend starts at `http://localhost:8080`

### 4. Run the frontend

```bash
cd frontend
npm install
npm start
```

Frontend starts at `http://localhost:3000`

---

## Default Admin

Register normally, then update the `role` column in the database to `ADMIN` for your account.

---

## Project Structure

```
cloudbox/
├── backend/          Spring Boot API
│   ├── src/main/java/com/cloudbox/
│   │   ├── controller/
│   │   ├── service/
│   │   ├── model/
│   │   ├── repository/
│   │   └── config/
│   └── uploads/      Uploaded files (auto-created)
└── frontend/         React app
    └── src/
        ├── pages/
        ├── components/
        ├── styles/
        └── hooks/
```
