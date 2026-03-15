# CloudBox – Week 1 Implementation

## User Authentication and Access Control

Week 1 focuses on implementing a secure authentication system and establishing the foundation for user management and authorization in the CloudBox platform.

---

## Objectives

* Implement secure authentication using **JWT**
* Create APIs for **user registration, login, and password reset**
* Implement **authentication middleware**
* Implement **Role-Based Access Control (RBAC)**

---

## Features Implemented

### 1. User Registration

Users can create an account using the registration API.

**Endpoint**

```
POST /api/auth/register
```

**Request Body**

```json
{
  "username": "user",
  "email": "user@example.com",
  "password": "password123"
}
```

**Response**

```
User registered successfully
```

---

### 2. User Login

Authenticates users and generates a **JWT token**.

**Endpoint**

```
POST /api/auth/login
```

**Request Body**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response**

```json
{
  "token": "JWT_TOKEN"
}
```

---

### 3. Password Reset

Allows users to reset their password securely.

**Endpoint**

```
POST /api/auth/reset-password
```

---

### 4. Authentication Middleware

A middleware layer verifies the **JWT token** before allowing access to protected routes.

Protected endpoints require:

```
Authorization: Bearer <JWT_TOKEN>
```

---

### 5. Role-Based Access Control (RBAC)

RBAC is implemented to manage permissions.

Supported roles:

* **USER**
* **ADMIN**

Example:

| Role  | Permissions                  | 
| ----- | ---------------------------- | 
| USER  | Upload files, download files | 
| ADMIN | Manage users, manage storage | 

---

## Tech Stack

Backend:

* Java
* Spring Boot
* Spring Security
* JWT Authentication
* Maven

Frontend:

* React
* Axios
* Vite

Database:

* MySQL

---

## Project Structure

```
cloudbox 
│ 
├── backend 
│   ├── controller 
│   ├── service 
│   ├── repository 
│   ├── security 
│   └── model 
│
├── frontend 
│   ├── pages 
│   ├── components 
│   └── styles 
```

---

## Security Measures

* Password hashing using **BCrypt**
* JWT token authentication
* Role-based authorization
* Input validation and sanitization

---