# Advanced Task Management Application

A full-stack task management application built with Django (Python), React.js, PostgreSQL, and Redis. This application features real-time updates, user role management, advanced filtering, and comprehensive task management capabilities.

## 🚀 Features

### Backend (Django)
- **User Roles & Permissions**: Admin and regular user roles with different permissions
- **Real-time Updates**: WebSocket-based real-time task updates using Django Channels
- **Advanced Filtering**: Filter tasks by due date, priority, assigned user, completion status, and approval status
- **Token-based Authentication**: Django REST Framework token authentication for enhanced security
- **Caching**: Redis-based caching for improved performance
- **Database Optimization**: Proper indexing on frequently queried fields
- **Error Handling**: Comprehensive validation and error handling

### Frontend (React)
- **Real-time UI Updates**: WebSocket integration for instant task updates
- **Advanced Filtering Interface**: Interactive filtering components with multiple criteria
- **State Management**: React Context API for authentication and local state management
- **Responsive Design**: Modern, user-friendly interface
- **Error Handling**: User-friendly error messages and loading states

## 🛠️ Tech Stack

### Backend
- **Django 5.2.4**: Web framework
- **Django REST Framework**: API development
- **Django Channels**: WebSocket support for real-time features
- **PostgreSQL**: Primary database
- **Redis**: Caching and WebSocket channel layer
- **Django Filters**: Advanced filtering capabilities

### Frontend
- **React 18**: UI framework
- **TypeScript**: Type safety
- **Vite**: Build tool
- **Axios**: HTTP client
- **SweetAlert2**: User notifications
- **Tailwind CSS**: Styling

## 📋 Requirements Met

### ✅ Backend Requirements
1. **User Roles & Permissions**: Implemented with Django groups (admin/user) and custom permission logic
2. **Real-time Updates**: WebSocket implementation using Django Channels and Redis
3. **Advanced Filtering**: Django Filter with custom filter methods for due dates, priorities, and status
4. **Token Authentication**: DRF TokenAuthentication with custom WebSocket authentication
5. **Caching**: Redis caching for user lists and task data with cache invalidation

### ✅ Frontend Requirements
1. **Real-time Updates**: WebSocket connection with automatic UI updates
2. **Advanced Filtering**: Interactive filter components with multiple criteria
3. **State Management**: React Context API for authentication and local state
4. **Error Handling**: Comprehensive error handling with user feedback

### ✅ Bonus Features
1. **Error Handling**: Robust validation and error handling across the application
2. **Scalability**: Database indexing, query optimization, and async processing
3. **Performance**: Redis caching and optimized database queries

## 🚀 Quick Start

### Prerequisites
- Python 3.9+
- Node.js 18+
- PostgreSQL
- Redis

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd taskmanager/backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Database setup**
   ```bash
   python manage.py migrate
   python manage.py createsuperuser
   ```

5. **Create user groups**
   ```bash
   python manage.py shell
   ```
   ```python
   from django.contrib.auth.models import Group
   Group.objects.create(name='admin')
   Group.objects.create(name='user')
   ```

6. **Start the backend server**
   ```bash
   daphne core.asgi:application
   ```

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd ../frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

## 🔧 Configuration

### Backend Configuration
- Update `core/settings.py` with your database and Redis configurations
- Configure CORS settings for your frontend domain
- Set up environment variables for production

### Frontend Configuration
- Update API base URL in `src/api/axios.ts`
- Configure WebSocket URL in `src/pages/Dashboard.tsx`

## 📖 API Documentation

### Authentication
- `POST /api/login/`: Login and get token
- `GET /api/me/`: Get current user info

### Tasks
- `GET /api/tasks/`: Get tasks with filtering
- `POST /api/tasks/`: Create new task (admin only)
- `PATCH /api/tasks/{id}/`: Update task (non-admin limited access)
- `DELETE /api/tasks/{id}/`: Delete task (admin only)

### Users
- `GET /api/users/`: Get user list (admin only)
- `GET /api/admins/`: Get admin list

### WebSocket
- `ws://localhost:8000/ws/tasks/?token={token}`: Real-time task updates

## 🔍 Filtering Options

### Task Filters
- **Priority**: Low, Medium, High
- **Status**: In Progress, Completed
- **Due Date**: Today, Tomorrow, This Week, Future, Overdue
- **Approval Status**: Approved, Pending Approval, Exclude Approved
- **Assigned To**: Filter by specific user (admin only)
- **Assigned By**: Filter by task creator

## 👥 User Roles

### Admin Users
- Create, update, and delete tasks
- Assign tasks to any user
- View all tasks in the system
- Approve task completions
- Access advanced filtering options

### Regular Users
- View assigned tasks only
- Update task completion status
- Request approval for completed tasks
- Basic filtering options

## 🔄 Real-time Features

The application provides real-time updates for:
- Task creation
- Task updates (status, assignment, etc.)
- Task deletion
- Approval status changes

All connected users receive instant updates via WebSocket connections.

## 🏗️ Architecture

### Backend Architecture
```
├── core/                # Django settings and configuration
├── tasks/               # Main application
│   ├── models.py        # Task and user models
│   ├── views.py         # API views and business logic
│   ├── serializers.py   # DRF serializers
│   ├── filters.py       # Advanced filtering
│   ├── consumers.py     # WebSocket consumers
│   └── utils.py         # Utility functions
└── requirements.txt     # Python dependencies
```

### Frontend Architecture
```
├── src/
│   ├── components/     # Reusable React components
│   ├── pages/          # Page components
│   ├── auth/           # Authentication context
│   ├── api/            # API client
│   ├── types/          # TypeScript type definitions
│   └── utils/          # Utility functions
└── package.json        # Node.js dependencies
```

## 📄 License

This project is licensed under the MIT License.
---

**Note**: This application demonstrates advanced full-stack development concepts including real-time updates, role-based access control, advanced filtering, and modern web development practices.
