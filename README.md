# Contact Management System

A full-stack, responsive Contact Management System (CMS) designed to help individuals and teams securely store, organize, search, and manage personal and professional connections. Built using the MERN stack (MongoDB, Express.js, React, Node.js), this application features user authentication, instant live search, tag/group filtering, birthday countdown reminders, CSV import/export, profile photo uploads, bulk actions, and duplicate detection wrapped in a custom editorial aesthetic.

---

## Project Overview

The Contact Management System was developed as a collaborative group project to solve contact sprawl and keep communication details organized in one accessible, secure platform. The system enforces strict user isolation—guaranteeing each registered user can only access, modify, and manage their own contacts. 

With performance and usability in mind, the system includes client-side image compression for profile pictures, real-time search without page reloads, bulk operations for batch contact management, and upcoming birthday notifications displayed directly on the dashboard.

---

## Features

### 1. Authentication & Security
- **User Accounts**: User registration, login, and secure logout.
- **Password Encryption**: Sensitive passwords hashed using `bcrypt` (12 salt rounds).
- **JWT Authentication**: Protected REST API endpoints authenticated via JSON Web Tokens.
- **User Data Isolation**: Contacts are strictly scoped to the logged-in user (`postedBy`).

### 2. Contact Management (CRUD)
- **Comprehensive Fields**: Store Name, Phone Number, Email, Address, Company, Tag/Group, Birthday, Profile Photo, and Notes.
- **Frontend & Backend Validation**: Form-level validation and backend schema validation via `Joi` ensure phone numbers, emails, and required fields are correctly formatted.
- **Inline Editing & Viewing**: Inspect full details (including notes and photo) in an interactive modal, or navigate to a dedicated edit screen.
- **Safe Deletion**: Deletion prompts with confirmation modals to prevent accidental removal.

### 3. Organization & Productivity
- **Tags & Groups**: Label contacts as *Work*, *Family*, *Friends*, *Other*, or define custom tags (e.g., *Clients*, *VIP*). Filter instantly using tag pills.
- **Favorites (Pinned to Top)**: Star important contacts with 1-click toggling; starred contacts automatically float to the top of the contacts table.
- **Search As You Type**: Instant real-time filtering across name, phone, email, company, and tags without page reloads.
- **Sorting & Pagination**: Sort contacts by Name (A–Z / Z–A) or Date Created (Newest / Oldest) with customizable page sizes (10 or 20 per page).

### 4. Advanced Capabilities
- **Duplicate Detection**: Warns the user when adding or updating a contact with an email or phone number that already exists, offering options to review or save anyway.
- **Import & Export (CSV)**:
  - **Export**: One-click download of all user contacts into formatted `.csv` files.
  - **Import**: Bulk upload contacts from a `.csv` file with optional duplicate skipping and a downloadable sample template.
- **Profile Photo Uploads**: Upload avatar images with automatic client-side canvas compression (~30–50 KB) to ensure optimal storage and fast loading.
- **Birthday Reminders**: An automated dashboard widget highlighting birthdays occurring within the next 30 days, complete with age indicators, countdown badges (*Today!*, *Tomorrow*, *In X days*), and quick email wish links.
- **Bulk Actions**: Select multiple contacts using checkboxes to batch-delete or batch-assign tags in a single operation.

---

## Tech Stack

### Frontend
- **React.js** (v19)
- **React Router DOM** (v7) – Client-side routing and protected navigation
- **Bootstrap 5** & **React-Bootstrap** – Modal dialogs and responsive grid
- **Bootswatch (Lux)** – Typography and base styling foundation
- **Custom CSS Design System** – Custom Canva-inspired dusty rose and espresso palette (`Montserrat` & `Playfair Display` fonts)
- **React Toastify** – User feedback notifications

### Backend
- **Node.js** & **Express.js** – RESTful API server
- **MongoDB** & **Mongoose** (v6) – NoSQL document database and schema modeling
- **JSON Web Token (JWT)** – Stateless authorization headers
- **bcrypt** – Password hashing
- **Joi** – Object schema validation for API payloads
- **Morgan** & **CORS** – Request logging and cross-origin resource sharing
- **Dotenv** – Environment configuration management

---

## Project Structure

```text
Contact-management/
│
├── client/                     # Frontend React application
│   ├── public/
│   │   ├── index.html          # HTML entry point with Google Fonts & Bootstrap
│   │   └── manifest.json
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.js       # App layout wrapper
│   │   │   ├── Navbar.js       # Top navigation bar
│   │   │   └── Spinner.js      # Loading indicator
│   │   ├── context/
│   │   │   ├── AuthContext.js  # Global authentication state and handlers
│   │   │   └── ToastContext.js # Toast notifications provider
│   │   ├── pages/
│   │   │   ├── Home.js         # Dashboard with stats and birthday reminders
│   │   │   ├── Login.js        # User sign-in page
│   │   │   ├── Register.js     # User registration page
│   │   │   ├── AllContact.js   # Main contact list, search, bulk actions, modals
│   │   │   ├── CreateContact.js# New contact creation form
│   │   │   └── EditContact.js  # Contact update form
│   │   ├── utils/
│   │   │   ├── csvHelper.js    # CSV parsing, generation, and template generator
│   │   │   └── imageHelper.js  # Canvas image resize, compression, and initials generator
│   │   ├── App.js              # Route configurations
│   │   ├── index.css           # Global custom theme styles and CSS variables
│   │   └── index.js            # React DOM root entry
│   └── package.json
│
├── server/                     # Backend Express server
│   ├── config/
│   │   ├── config.env          # Environment variables (Mongo URI, JWT Secret, Port)
│   │   └── db.js               # MongoDB connection handler
│   ├── middlewares/
│   │   └── auth.js             # JWT verification middleware
│   ├── models/
│   │   ├── User.js             # Mongoose User schema
│   │   └── Contact.js          # Mongoose Contact schema and Joi validator
│   ├── routes/
│   │   ├── auth.js             # Register, Login, and Me routes
│   │   └── contact.js          # CRUD, Bulk actions, Import/Export, Duplicate check
│   ├── app.js                  # Express app configuration and server entry
│   └── package.json
│
└── README.md
```

---

## Prerequisites

Before running the application locally, ensure you have the following installed on your machine:

- **Node.js**: `v18.0.0` or higher (tested on Node v20/v24)
- **npm**: `v9.0.0` or higher
- **MongoDB**: A running local MongoDB instance OR a free cloud cluster on [MongoDB Atlas](https://www.mongodb.com/atlas)
- **Git**

---

## Installation and Setup

### 1. Clone the Repository

```bash
git clone https://github.com/sana20062/Contact-management.git
cd Contact-management
```

### 2. Install Dependencies

You will need to install dependencies for both the `server` and `client` directories.

#### Backend Dependencies:
```bash
cd server
npm install
cd ..
```

#### Frontend Dependencies:
```bash
cd client
npm install
cd ..
```

### 3. Environment Configuration

Create or update the configuration file in `server/config/config.env`:

```env
PORT=8000
JWT_SECRET=your_jwt_secret_key_here
MONGO_URI=your_mongodb_connection_string_here
```

> **Note on MongoDB Atlas:** If using MongoDB Atlas, make sure your IP address is whitelisted under **Security > Network Access** (or add `0.0.0.0/0` for development access).

### 4. Run the Application

Open two separate terminal windows:

#### Terminal 1: Start Backend Server
```bash
cd server
npm run dev
```
*The backend server will run on `http://localhost:8000`.*

#### Terminal 2: Start Frontend Client
```bash
cd client
npm start
```
*The React development server will start and automatically open `http://localhost:3000` in your default browser.*

---


## Usage

1. **Register**: Navigate to `/register` and create an account with your name, email, and password.
2. **Login**: Sign in at `/login` to receive your JWT session token.
3. **Dashboard (`/`)**: View your total contacts, favorites count, and automated countdowns for upcoming birthdays in the next 30 days.
4. **Add Contact (`/create`)**: Fill in contact information, choose or type a tag/group, pick an optional birthday, and upload an avatar photo.
5. **View & Search (`/mycontacts`)**:
   - Filter contacts dynamically as you type in the search bar.
   - Click group tags (*Work*, *Family*, etc.) to narrow down contacts.
   - Click the star icon on any contact to toggle favorite status and pin it to the top.
   - Select multiple checkboxes to trigger the **Bulk Actions Bar** (bulk tagging or bulk deletion).
   - Click **Export CSV** to download a spreadsheet copy of your contacts, or **Import CSV** to batch upload.
6. **Edit / Delete**: Click on any contact row to inspect details in the modal, or click **Edit** to modify details and **Delete** to remove.
7. **Logout**: Click **LOGOUT** in the top navigation bar to terminate the session.

---

## API Endpoints

### Authentication Routes (`/api`)

| Method | Endpoint | Description | Protected |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/register` | Register a new user account | No |
| `POST` | `/api/login` | Authenticate user and return JWT token | No |
| `GET` | `/api/me` | Retrieve currently authenticated user profile | Yes (JWT) |

### Contact Routes (`/api`)

| Method | Endpoint | Description | Protected |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/mycontacts` | Fetch all contacts for the logged-in user | Yes (JWT) |
| `GET` | `/api/contact/:id` | Fetch details of a single contact by ID | Yes (JWT) |
| `POST` | `/api/contact` | Create a new contact (with duplicate validation) | Yes (JWT) |
| `PUT` | `/api/contact` | Update an existing contact's details | Yes (JWT) |
| `PUT` | `/api/contact/favorite/:id` | Toggle favorite status for a contact | Yes (JWT) |
| `DELETE` | `/api/delete/:id` | Delete a contact by ID | Yes (JWT) |
| `POST` | `/api/contact/check-duplicate` | Live verification of matching email or phone | Yes (JWT) |
| `POST` | `/api/contact/bulk-delete` | Batch delete an array of contact IDs | Yes (JWT) |
| `POST` | `/api/contact/bulk-tag` | Batch assign a tag/group to an array of contact IDs | Yes (JWT) |
| `POST` | `/api/contact/import` | Bulk import contacts from parsed CSV payload | Yes (JWT) |

---

## Screenshots

<!-- Note: Place your screenshot image files inside a docs/ or client/public/assets folder and update the paths below -->

| Screen | Preview |
| :--- | :--- |
| **Login Page** | *[Insert Screenshot: docs/login.png]* |
| **Registration Page** | *[Insert Screenshot: docs/register.png]* |
| **Dashboard & Birthday Reminders** | *[Insert Screenshot: docs/dashboard.png]* |
| **Contacts Table & Search** | *[Insert Screenshot: docs/contacts_list.png]* |
| **Add / Edit Contact Form** | *[Insert Screenshot: docs/contact_form.png]* |
| **Bulk Actions & Tagging** | *[Insert Screenshot: docs/bulk_actions.png]* |
| **CSV Import & Duplicate Warning** | *[Insert Screenshot: docs/modals.png]* |

---

## Future Improvements

- [ ] **vCard (.vcf) Support**: Add export and import support for mobile address book formats (`.vcf`).
- [ ] **Dark Mode Toggle**: Option to switch between the custom dusty rose palette and a dark mode theme.
- [ ] **Email Notifications**: Automated email notifications sent on the morning of a contact's birthday.
- [ ] **Social Media Links**: Dedicated fields for LinkedIn, GitHub, Twitter/X, and website links.
- [ ] **Contact Merge Utility**: Interactive merge tool to consolidate details when duplicates are detected.
- [ ] **Two-Factor Authentication (2FA)**: Additional security layer using TOTP authenticator apps.

---

## Contributing

Contributions, bug reports, and feature suggestions are welcome! To contribute:

1. Fork the Project.
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`).
3. Commit your Changes (`git commit -m "Add some AmazingFeature"`).
4. Push to the Branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

## License

Distributed under the **MIT License**. See `LICENSE` for more information.
