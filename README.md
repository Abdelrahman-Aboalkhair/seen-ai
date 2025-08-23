# Smart Recruiter AI - Monorepo

<div align="center">

**AI-powered smart recruitment platform for talent discovery and CV analysis using advanced technologies**

[![React](https://img.shields.io/badge/React-18.3.1-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6.2-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.18.2-blue.svg)](https://expressjs.com/)
[![Supabase](https://img.shields.io/badge/Supabase-2.54.0-green.svg)](https://supabase.com/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)

[Features](#features) • [Architecture](#architecture) • [Quick Start](#quick-start) • [Development](#development) • [API Endpoints](#api-endpoints)

</div>

## 🚀 Features

### Core Functionality
- **AI-Powered CV Analysis**: Comprehensive analysis of resumes using advanced AI algorithms
- **Smart Talent Search**: Intelligent candidate matching with customizable search criteria
- **Interview Management**: Schedule and manage candidate interviews with integrated calendar
- **Credit System**: Flexible credit-based pricing model for different service tiers
- **Multi-language Support**: Full Arabic and English internationalization

### Dashboard Features
- **Real-time Analytics**: Live statistics and performance metrics
- **Search History**: Complete audit trail of all search operations
- **CV Analysis History**: Track and review previous analyses
- **Credit Management**: Monitor usage and purchase additional credits
- **Admin Panel**: Advanced management tools for administrators

## 🏗 Architecture

This project follows a **monorepo architecture** with clear service separation:

```
smart-recruiter-refactored/
├── services/
│   ├── frontend/          # React + TypeScript + Vite frontend
│   ├── backend/           # Node.js + Express + TypeScript backend
│   ├── docs/              # Documentation and guides
│   └── scripts/           # Utility scripts and CI/CD
├── docker-compose.yml     # Multi-service orchestration
├── Dockerfile             # Production container
├── Dockerfile.dev         # Development container
├── nginx.conf            # Production web server config
├── Makefile              # Build and deployment commands
└── package.json          # Monorepo root configuration
```

### Service Details

#### Frontend Service (`services/frontend/`)
- **React 18.3.1** with TypeScript
- **Vite 6.0.1** for fast development and building
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **React Query** for state management
- **React Router** for navigation

#### Backend Service (`services/backend/`)
- **Node.js** with TypeScript
- **Express.js** web framework
- **Supabase** for database and authentication
- **Redis** for caching
- **OpenAI** integration for AI features
- **Stripe** for payment processing
- **JWT** for authentication
- **Winston** for logging

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v18 or higher)
- **npm** or **pnpm** package manager
- **Docker** and **Docker Compose** (for containerized development)
- **Git** for version control

### Local Development

1. **Clone and setup**
   ```bash
   git clone <repository-url>
   cd smart-recruiter-refactored
   npm run install:all
   ```

2. **Environment setup**
   ```bash
   cp env.example .env
   cp services/backend/.env.example services/backend/.env
   # Edit .env files with your configuration
   ```

3. **Start development servers**
   ```bash
   # Start both frontend and backend
   npm run dev
   
   # Or start individually
   npm run dev:frontend    # Frontend on http://localhost:5173
   npm run dev:backend     # Backend on http://localhost:3000
   ```

### Docker Development

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 🔧 Development

### Available Scripts

#### Root Level (Monorepo)
```bash
npm run dev              # Start both frontend and backend
npm run build            # Build all services
npm run lint             # Lint all services
npm run type-check       # Type check all services
npm run install:all      # Install dependencies for all services
```

#### Frontend Service
```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run preview          # Preview production build
npm run lint             # Lint code
npm run type-check       # Type check
```

#### Backend Service
```bash
npm run dev              # Start development server with hot reload
npm run build            # Build TypeScript
npm run start            # Start production server
npm run lint             # Lint code
npm run test             # Run tests
```

### Project Structure

```
services/
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── features/       # Feature-specific modules
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utility libraries
│   │   ├── router/         # Routing configuration
│   │   ├── services/       # API service layer
│   │   ├── utils/          # Helper functions
│   │   └── locales/        # Internationalization
│   ├── public/             # Static assets
│   └── dist/               # Build output
├── backend/
│   ├── src/
│   │   ├── config/         # Configuration files
│   │   ├── middleware/     # Express middleware
│   │   ├── routes/         # API route handlers
│   │   ├── services/       # Business logic services
│   │   ├── types/          # TypeScript type definitions
│   │   └── lib/            # Utility libraries
│   ├── dist/               # Build output
│   └── logs/               # Application logs
├── docs/                   # Documentation and guides
└── scripts/                # Utility scripts and CI/CD
```

## 🌐 API Endpoints

### Health Check
- **GET** `/api/test/health` - Server health status
- **GET** `/api/test/ping` - Simple ping endpoint
- **GET** `/api/test/config` - Configuration status

### AI Services
- **POST** `/api/ai/analyze-cv` - CV analysis
- **POST** `/api/ai/generate-questions` - Interview questions
- **POST** `/api/ai/search-talent` - Talent search

### Payment
- **POST** `/api/payment/create-session` - Create payment session
- **POST** `/api/payment/webhook` - Stripe webhook handler

### Talent Management
- **GET** `/api/talent/search` - Search candidates
- **POST** `/api/talent/analyze` - Analyze candidate profile

## 🚀 Deployment

### Production Build
```bash
# Build all services
npm run build

# Start production backend
npm run start:backend
```

### Docker Production
```bash
# Build production image
docker build -t smart-recruiter .

# Run production container
docker run -p 3000:3000 smart-recruiter
```

### Environment Variables

#### Frontend
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
- `VITE_API_BASE_URL` - Backend API base URL

#### Backend
- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port (default: 3000)
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_KEY` - Supabase service key
- `OPENAI_API_KEY` - OpenAI API key
- `STRIPE_SECRET_KEY` - Stripe secret key
- `REDIS_URL` - Redis connection URL

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation in `services/docs/`
- Review the development guides

---

**Built with ❤️ by the Smart Recruiter Team**
