# AponKhoj (আপনখোঁজ)
### A Smart Platform for Missing Person Reports, AI-Powered Matching, and Community Reunification

**AponKhoj** aims to solve the problem of fragmented missing person reporting across Bangladesh, which is time-consuming and distressing for families. The platform centralizes reports from families, police stations, hospitals, and NGOs into a single interface, provides **AI-powered face recognition matching**, offers **regional categorization for faster searching**, and delivers **urgent alert systems** for specific regional cases.

---

## Team Members

| Roll Number | Name | Email | Role |
|------------|------|-------|------|
| 20230104068 | Asmita Guha Thakurta | asmitaesha10@gmail.com | Lead and Backend |
| 20230104071 | Zamila Mohammad | jamilamuhammad18052000@gmail.com | Frontend |
| 20230104072 | Moufee Al Doushari | doushari.dipto212@gmail.com | Frontend |
| 20230104075 | Humayra Binte Kazal | humayrabintekazal@gmail.com | Backend |

---

## Objective

AponKhoj aims to bridge the gap in locating missing persons and reuniting found individuals with their families by providing a centralized, AI-powered platform where users can:  

  - Report missing persons with detailed information and photos
  - Register found persons for organizations like police, hospitals, and NGOs
  - Search and match reports using AI-powered face recognition and text matching
  - Receive urgent alerts via SMS/Email for specific regions
  - Access regional categorization for faster local searching

## Target Audience
- Families & relatives reporting missing persons
- Organizations (police, hospitals, NGOs) registering found persons
- Community members helping identify found individuals
- Volunteers & moderators assisting with verification

---

## Tech Stack

### Backend
- **Laravel**(PHP Framework)
- Laravel Sanctum for Authentication
- Laravel Mail (Email notifications)

### Frontend
- **React.js**
- Axios (API calls)
- Tailwind CSS 

### Rendering Method
- **Client-Side Rendering (CSR)**

### AI Integration
- **Face-API.js** – Facial recognition for image matching
- **Google Gemini API** - For text matching and description comparison

---

##  UI Design

Figma Mockup: [https://www.figma.com/proto/xv6jClk4LReVbeMo4XMbS9/Aponkhoj?page-id=0%3A1&node-id=1-20&p=f&viewport=108%2C271%2C0.03&t=Qgc9gsl5Q46A2xWO-1&scaling=contain&content-scaling=fixed&starting-point-node-id=1%3A2 ]

---

##  Key Features

### Core Features
- Missing person report management
- Found person report registration
- Advanced search and filtering by name, age, gender, location
- Regional categorization (division/district level)
- Report status tracking (Missing, Found, Reunited)
- Success stories section

---

### Exclusive Features

- **AI-Powered Matching System**
  - **Facial Recognition:** Compare uploaded images of missing persons with images from sightings or public datasets using Face-API.js (client-side)
  - **Text Matching:** Match textual descriptions of missing people with sighting reports using Google Gemini API (server-side via Laravel)
  - Automated matching of "found" reports with "missing" ones

- **Urgent Alerts System**
  - SMS/Mail notifications for registered users
  
---

### Authentication & Security
- JWT-based authentication using Laravel Sanctum
- Role-based access control (Public, Admin)
- Email/phone verification

---

### CRUD Operations
CRUD functionality is implemented for:    
- Users
- Missing Person Reports
- Found Person Reports
- Matches (Reunited cases)
- Success Stories
- Regional Data
- Alert Subscriptions

---

##  Project Milestones

### Milestone 1 — Foundation & Basic Reports
- Laravel backend and React frontend setup
- Database schema and migrations
- JWT authentication with Laravel Sanctum
- User roles (Public, Organization, Admin)
- Missing and found person report CRUD
- Image upload functionality
- Basic search and filtering

---

### Milestone 2 — Regional System & Alerts
- Regional categorization (Division/District)
- Advanced search functionality
- Urgent alerts and email notifications
- Regional alert to registerd users
- Success stories module
- Report status management

---

### Milestone 3 — AI Matching & Deployment
- Face recognition (Face-API.js) and text matching (Gemini API)
- AI-powered match suggestions
- Admin moderation dashboard
- Security, validation, testing
- Deploy website and database to server
---

## Conclusion

AponKhoj unites families, organizations, and communities through AI-powered matching to reunite missing persons faster. Together, we bring hope to those who search.


