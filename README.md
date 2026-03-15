# CloudBox: Scalable Multi-Cloud File Management

## Project Overview

CloudBox is a scalable cloud-based file management system that allows users to securely manage and access files across multiple cloud platforms. The system provides authentication, secure APIs, and a user-friendly interface for managing accounts and future cloud storage integrations.

This repository contains the **Week 1 implementation**, which focuses on setting up the development environment, building the authentication system, and creating the basic frontend interface.

---

## Technologies Used

### Backend

* Java
* Spring Boot
* Spring Security
* JWT Authentication
* Spring Data JPA
* MySQL

### Frontend

* React.js
* Axios
* React Router
* CSS Styling

### Tools

* IntelliJ IDEA
* VS Code
* MySQL Workbench
* Postman
* GitHub

---

## Project Structure

```
CloudBox
│
├── cloudbox-backend
│   └── src/main/java/com/cloudbox
│       ├── config
│       ├── controller
│       ├── service
│       ├── repository
│       ├── model
│       ├── dto
│       ├── security
│       └── util
│
└── cloudbox-frontend
    └── src
        ├── pages
        ├── components
        ├── services
        └── styles
```

---

## Week 1 Features

### Backend

* Spring Boot project setup
* MySQL database integration
* User entity and repository
* User registration API
* User login API
* JWT token generation
* Reset password API
* Basic security configuration

### Frontend

* React project setup
* Login page
* Register page
* Reset password page
* Admin dashboard page
* Axios API integration
* Basic CSS styling
* Routing using React Router

---

## Authentication APIs

### Register User

```
POST /api/auth/register
```

Example Request:

```json
{
  "name": "David",
  "email": "david@gmail.com",
  "password": "123456"
}
```

---

### Login User

```
POST /api/auth/login
```

Example Request:

```json
{
  "email": "david@gmail.com",
  "password": "123456"
}
```

Response:

```
JWT Token
```

---

### Reset Password

```
POST /api/auth/reset-password
```

Example Request:

```json
{
  "email": "david@gmail.com",
  "newPassword": "newpassword123"
}
```

---

## Running the Backend

1. Open the backend project in IntelliJ
2. Configure MySQL database in `application.properties`
3. Run the Spring Boot application

Server runs on:

```
http://localhost:8081
```

---

## Running the Frontend

Navigate to the frontend folder:

```
cd cloudbox-frontend
```

Install dependencies:

```
npm install
```

Start the React app:

```
npm start
```

Frontend runs on:

```
http://localhost:3000
```

---

## User Flow

1. User registers using the registration page
2. User logs in using email and password
3. Backend returns a JWT authentication token
4. User can reset password if needed
5. Admin dashboard is accessible without login (as per project requirement)

---

## Future Enhancements (Next Weeks)

* File upload and management
* Multi-cloud integration (AWS, Google Drive, etc.)
* Role-based access control
* Secure file sharing
* Advanced dashboard
* Storage analytics

---

## Contributors

* Team CloudBox Development Team

---

## License

This project is developed for academic and learning purposes as part of the internship program.
