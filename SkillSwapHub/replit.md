# SkillSwap Platform

## Overview

SkillSwap Platform is a full-stack web application that enables users to exchange skills and knowledge with each other. Built as a single-page application (SPA) using vanilla HTML, CSS, and JavaScript frontend with a Flask backend and PostgreSQL database, it provides a complete skill-sharing platform with persistent data storage.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Single Page Application (SPA)**: Built with vanilla HTML, CSS, and JavaScript
- **Component-based UI**: Modular sections managed through JavaScript navigation
- **Responsive Design**: Mobile-first approach with CSS Grid and Flexbox
- **Client-side Routing**: Section-based navigation without page reloads
- **Progressive Enhancement**: Works without JavaScript for basic functionality

### Data Storage
- **PostgreSQL Database**: Professional database with Flask-SQLAlchemy ORM for reliable data persistence
- **RESTful API**: Full backend API endpoints for users, skills, swap requests, and admin functionality
- **Database Models**: Structured relational models for users, skills, swap requests, feedback, and announcements
- **Local Storage Fallback**: Profile data cached locally for faster access while database remains source of truth

### Styling Framework
- **Custom CSS**: Hand-crafted styles with modern CSS features
- **Font Awesome Icons**: External CDN for iconography (v6.0.0)
- **Google Fonts**: Inter font family for typography
- **CSS Custom Properties**: Modern styling approach with CSS variables
- **Gradient Design**: Linear gradients for visual appeal

## Key Components

### Core Sections
1. **Home Dashboard**: Welcome page with statistics and quick actions
2. **User Profile**: Profile creation and management interface
3. **Browse Skills**: Search and discovery of available skills
4. **Swap Requests**: Management of skill exchange requests
5. **Admin Panel**: Administrative controls and user management

### Data Models
- **User Profile**: Contains personal info, skills offered/wanted, availability, and preferences
- **Swap Requests**: Tracks skill exchange requests between users
- **Feedback System**: User rating and review capabilities
- **Admin Controls**: User moderation and platform management

### UI Components
- **Navigation Bar**: Responsive header with mobile menu support
- **Action Cards**: Interactive cards for quick navigation
- **User Cards**: Display user profiles with skill information
- **Forms**: Profile creation and editing interfaces
- **Statistics Dashboard**: Real-time platform metrics
- **Notification System**: Toast notifications for user feedback

## Data Flow

### User Registration Flow
1. User fills out profile form with skills offered/wanted
2. Profile data stored in localStorage as JSON
3. User added to global user database
4. Statistics updated on home dashboard

### Skill Discovery Flow
1. User searches for specific skills in browse section
2. JavaScript filters user database based on search criteria
3. Results displayed as user cards with contact options
4. Users can initiate swap requests directly

### Swap Request Flow
1. User requests skill swap from another user
2. Request stored in localStorage with status tracking
3. Both parties can view and manage requests in swaps section
4. Admin can moderate and oversee all swap activities

## External Dependencies

### CDN Resources
- **Font Awesome 6.0.0**: Icon library for UI elements
- **Google Fonts (Inter)**: Typography with multiple font weights (300-700)

### Backend Architecture
- **Flask Server** (main.py): Full-featured Flask application with database integration
- **SQLAlchemy Models** (models.py): Database models for users, skills, swaps, feedback, and announcements  
- **RESTful API**: Complete API endpoints for all platform functionality
- **PostgreSQL Integration**: Persistent data storage with proper relational structure

## Deployment Strategy

### Static Hosting
- **No Server Required**: Can be deployed to any static hosting service
- **File Structure**: All assets in root directory for simple deployment
- **CDN Dependencies**: External resources loaded from CDNs
- **Browser Compatibility**: Modern browsers with localStorage support

### Development Environment
- **Local Development**: Multiple server options (Flask or Python HTTP server)
- **Hot Reload**: Development servers support live reloading
- **Security Headers**: Custom HTTP server includes security headers
- **Port Configuration**: Default port 5000 with configurable host binding

### Production Considerations
- **Data Persistence**: Full PostgreSQL database with relational integrity
- **Scalability**: Multi-user platform with centralized data storage
- **Security**: Server-side validation and database constraints
- **Performance**: Optimized with database indexing and efficient API endpoints