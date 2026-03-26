# LearnSync AI - AI-Powered Learning Analytics Platform

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![Python](https://img.shields.io/badge/python-3.9%2B-blue.svg)
![React](https://img.shields.io/badge/react-18.2.0-61DAFB.svg)

> **Research-Based Educational Platform** | Published IEEE Research by Janak Raj Joshi,MSc Data Science - London

## 📖 Research Reference

This platform is based on the IEEE published research:
- **Paper**: [AI-Powered Learning Analytics for Educational Enhancement](https://ieeexplore.ieee.org/abstract/document/10860096)
- **Author**: Janak Raj Joshi
- **Degree**: MSc Data Science, London

---

## 🎯 Project Overview

LearnSync AI is a comprehensive, full-stack AI-driven educational platform designed for Class 8-12 students. It integrates cutting-edge machine learning with modern web technologies to deliver personalized learning experiences.

### Key Features

- 🔐 **Secure Digital Identity** - JWT-based authentication with role-based access control
- 🤖 **AI-Powered Learning Analytics** - Real-time performance tracking and predictions
- 📊 **Intelligent Performance Tracking** - Comprehensive dashboards with visualizations
- 🎯 **Adaptive Learning Recommendations** - ML-powered personalized study plans
- 📈 **Completion Monitoring** - Track progress with detailed analytics
- 🧠 **Behavioral Insights** - Student clustering and risk assessment

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        LearnSync AI Platform                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │   Frontend   │    │    Backend   │    │  AI Service  │      │
│  │   (React)    │◄──►│   (Node.js)  │◄──►│   (Python)   │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│         │                   │                   │               │
│         └───────────────────┴───────────────────┘               │
│                             │                                   │
│                    ┌────────┴────────┐                          │
│                    │   MongoDB       │                          │
│                    │   (Database)    │                          │
│                    └─────────────────┘                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Technology Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, Framer Motion, Recharts |
| **Backend** | Node.js, Express.js, MongoDB, Mongoose |
| **AI Service** | Python, FastAPI, Scikit-learn, NumPy, Pandas |
| **Security** | JWT, bcrypt, Helmet, Rate Limiting |
| **Deployment** | Docker-ready, Cloud-native |

---

## 📁 Project Structure

```
learnsync-ai/
├── app/                          # Frontend Application
│   ├── src/
│   │   ├── components/           # Reusable UI components
│   │   │   └── ui/              # shadcn/ui components
│   │   ├── contexts/            # React contexts (Auth, Theme)
│   │   ├── layouts/             # Page layouts
│   │   ├── lib/                 # Utilities and API client
│   │   ├── pages/               # Application pages
│   │   │   ├── dashboard/       # Student dashboard pages
│   │   │   └── admin/           # Admin pages
│   │   └── App.tsx              # Main application
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                      # Backend API
│   ├── src/
│   │   ├── controllers/         # Route controllers
│   │   ├── middleware/          # Auth, validation, error handling
│   │   ├── models/              # MongoDB models
│   │   ├── routes/              # API routes
│   │   └── utils/               # Utilities
│   ├── server.js                # Entry point
│   └── package.json
│
├── ai-service/                   # AI Microservice
│   ├── src/
│   │   └── services/            # ML services
│   │       ├── prediction_service.py
│   │       ├── clustering_service.py
│   │       ├── recommendation_service.py
│   │       └── risk_assessment_service.py
│   ├── main.py                  # FastAPI entry point
│   └── requirements.txt
│
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- Python 3.9+
- MongoDB 5.0+
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/learnsync-ai.git
cd learnsync-ai
```

### 2. Backend Setup

```bash
cd backend
npm install

# Create .env file
cp .env.example .env

# Edit .env with your configuration
# MONGODB_URI=mongodb://localhost:27017/learnsync_ai
# JWT_SECRET=your_secret_key
# AI_SERVICE_URL=http://localhost:8000

# Start the server
npm run dev
```

### 3. AI Service Setup

```bash
cd ../ai-service
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Start the AI service
python main.py
```

### 4. Frontend Setup

```bash
cd ../app
npm install

# Start the development server
npm run dev
```

### 5. Access the Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- AI Service: http://localhost:8000

---

## 👥 User Roles

### 1. Admin (Super Control Panel)

**Capabilities:**
- ✅ Approve/reject student registrations
- ✅ Assign classes (8-12)
- ✅ Create subjects → chapters → modules
- ✅ Upload content (PDF, video, notes)
- ✅ Create quizzes (MCQ, timed)
- ✅ Monitor completion rates and AI risk alerts
- ✅ View performance predictions
- ✅ Export analytics reports (PDF/CSV)
- ✅ Control platform settings

**Admin Dashboard Shows:**
- Total registered students
- Approved/pending students
- Active users today
- Completion percentage
- Average performance
- AI predicted performance trends
- Students at risk

### 2. Student

**Capabilities:**
- ✅ Register account (pending approval)
- ✅ Login securely
- ✅ Access assigned class content
- ✅ Track completion percentage
- ✅ View quiz history
- ✅ Identify strength & weakness areas
- ✅ Get AI recommendations
- ✅ View progress timeline
- ✅ See subject mastery scores
- ✅ View skill radar charts

---

## 🤖 AI Features (Core Differentiator)

### 1. Performance Prediction Model
Predicts next quiz score based on past attempts using:
- Historical score analysis
- Trend detection
- Time-series forecasting

### 2. Weak Topic Detection
Identifies low-scoring chapters using:
- Subject-wise performance aggregation
- Statistical analysis
- Confidence scoring

### 3. Dropout Risk Analysis
Detects low engagement patterns:
- Activity frequency monitoring
- Login pattern analysis
- Quiz completion tracking

### 4. Learning Behavior Clustering
Clusters students into categories:
- **High Performer** - Consistently high scores
- **Consistent Learner** - Steady progress
- **Irregular Learner** - Inconsistent engagement
- **At Risk** - Needs intervention

### 5. Adaptive Recommendation Engine
Recommends:
- Next best module
- Revision modules
- Practice quizzes
- Suggested study hours

### 6. Completion Intelligence
Tracks:
- Time spent per module
- Learning efficiency
- Class average comparison
- Performance heatmaps

---

## 📊 Advanced Analytics Dashboard

### Visualizations Included:
- 📈 Score trend line graphs
- 📊 Subject-wise comparison bar charts
- 🔥 Chapter performance heatmaps
- 📍 Engagement vs performance scatter plots
- 🎯 Completion progress rings
- 🤖 AI insight cards

---

## 🔐 Security Features

- ✅ JWT Authentication with refresh tokens
- ✅ Role-Based Middleware
- ✅ Password Hashing (bcrypt)
- ✅ Rate Limiting
- ✅ Helmet security headers
- ✅ CORS configuration
- ✅ Input validation
- ✅ Audit logging
- ✅ Account lockout protection

---

## 🎨 UI/UX Features

- SaaS-style dashboard layout
- Responsive sidebar navigation
- Modern dark/light theme
- Glassmorphism cards
- Smooth Framer Motion animations
- Animated stats counters
- Fully responsive design
- Professional academic feel

---

## 🧪 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new student |
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/logout` | User logout |
| GET | `/api/auth/me` | Get current user |

### Admin Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/dashboard` | Admin dashboard stats |
| GET | `/api/admin/students` | List all students |
| PATCH | `/api/admin/students/:id/approve` | Approve/reject student |
| GET | `/api/admin/analytics` | Platform analytics |
| GET | `/api/admin/audit-logs` | System audit logs |

### AI Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/recommendations` | Get personalized recommendations |
| GET | `/api/ai/predict-performance` | Predict next quiz score |
| GET | `/api/ai/risk-assessment` | Get dropout risk assessment |
| GET | `/api/ai/learning-cluster` | Get learning cluster |

---

## 🌍 Scalability Considerations

Designed for:
- ✅ 10,000+ concurrent students
- ✅ Horizontal scaling with load balancers
- ✅ Microservice architecture (AI separated)
- ✅ Cloud deployment ready (AWS/GCP/Azure)
- ✅ MongoDB sharding support
- ✅ Redis caching (future enhancement)
- ✅ CDN for static assets

---

## 📝 Environment Variables

### Backend (.env)
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/learnsync_ai
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=your_refresh_token_secret
JWT_REFRESH_EXPIRE=30d
AI_SERVICE_URL=http://localhost:8000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### AI Service (.env)
```env
PORT=8000
HOST=0.0.0.0
DEBUG=false
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
```

---

## 🚢 Deployment

### Docker Deployment (Coming Soon)

```bash
# Build and run with Docker Compose
docker-compose up -d
```

### Manual Deployment

1. **Backend**: Deploy to Render, Railway, or VPS
2. **AI Service**: Deploy to PythonAnywhere, Heroku, or VPS
3. **Frontend**: Deploy to Vercel, Netlify, or AWS S3
4. **Database**: Use MongoDB Atlas for production

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- IEEE Research Publication Support
- MSc Data Science Program, London
- Open Source Community

---

## 📧 Contact

**Janak Raj Joshi**
- Email: janak.rajjoshi@example.com
- LinkedIn: [linkedin.com/in/janakrajjoshi](https://linkedin.com/in/janakrajjoshi)
- GitHub: [github.com/janakrajjoshi](https://github.com/janakrajjoshi)

---

## 🔮 Future Enhancements

- [ ] Real-time notifications with WebSockets
- [ ] Mobile app (React Native)
- [ ] Advanced NLP for AI tutor
- [ ] Gamification features
- [ ] Parent dashboard
- [ ] Multi-language support
- [ ] Video conferencing integration
- [ ] Blockchain certificates

---

<p align="center">
  <strong>Built with ❤️ for the future of education</strong>
</p>
