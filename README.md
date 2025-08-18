# SEEN AI HR Solutions

<div align="center">

![SEEN AI Logo](public/seen-ai-logo.jpg)

**AI-powered smart recruitment platform for talent discovery and CV analysis using advanced technologies**

[![React](https://img.shields.io/badge/React-18.3.1-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6.2-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.0.1-purple.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4.16-38BDF8.svg)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-2.54.0-green.svg)](https://supabase.com/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)

[Features](#features) • [Tech Stack](#tech-stack) • [Quick Start](#quick-start) • [Development](#development) • [Deployment](#deployment) • [Contributing](#contributing)

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

### User Experience

- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Dark Theme**: Modern, professional dark interface
- **Real-time Notifications**: Toast notifications for user feedback
- **Progressive Web App**: PWA capabilities for enhanced mobile experience
- **Accessibility**: WCAG compliant design patterns

## 🛠 Tech Stack

### Frontend

- **React 18.3.1** - Modern React with hooks and concurrent features
- **TypeScript 5.6.2** - Type-safe development
- **Vite 6.0.1** - Fast build tool and development server
- **Tailwind CSS 3.4.16** - Utility-first CSS framework
- **Framer Motion** - Smooth animations and transitions

### Backend & Services

- **Supabase 2.54.0** - Backend-as-a-Service (Database, Auth, Storage)
- **React Query** - Server state management and caching
- **React Router DOM** - Client-side routing

### Development Tools

- **ESLint** - Code linting and formatting
- **TypeScript ESLint** - TypeScript-specific linting rules
- **PostCSS & Autoprefixer** - CSS processing

### Infrastructure

- **Docker** - Containerization for development and production
- **Nginx** - Production web server with optimized configuration
- **Docker Compose** - Multi-service development environment

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** or **pnpm** package manager
- **Docker** and **Docker Compose** (for containerized development)
- **Git** for version control

## 🚀 Quick Start

### Option 1: Local Development (Recommended for Development)

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-username/smart-recruiter-client-final.git
   cd smart-recruiter-client-final
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` and add your Supabase credentials:

   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start the development server**

   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:5173](http://localhost:5173)

### Option 2: Docker Development

1. **Clone and navigate to the project**

   ```bash
   git clone https://github.com/your-username/smart-recruiter-client-final.git
   cd smart-recruiter-client-final
   ```

2. **Set up environment variables**

   ```bash
   cp .env.example .env.local
   # Edit .env.local with your Supabase credentials
   ```

3. **Start development environment**

   ```bash
   docker-compose up app-dev
   ```

4. **Access the application**
   Navigate to [http://localhost:5173](http://localhost:5173)

### Option 3: Production Docker

1. **Build and run production container**

   ```bash
   docker-compose up app-prod
   ```

2. **Access the application**
   Navigate to [http://localhost](http://localhost)

## 🏗 Development

### Project Structure

```
smart-recruiter-client-final/
├── src/
│   ├── components/          # React components
│   │   ├── dashboard/       # Dashboard-specific components
│   │   ├── admin/          # Admin panel components
│   │   ├── auth/           # Authentication components
│   │   ├── layout/         # Layout components
│   │   ├── pages/          # Page components
│   │   └── ui/             # Reusable UI components
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility libraries and configurations
│   ├── locales/            # Internationalization files
│   ├── pages/              # Page components (admin)
│   ├── router/             # Routing configuration
│   ├── services/           # API services
│   └── utils/              # Utility functions
├── public/                 # Static assets
├── supabase/               # Supabase configuration and functions
├── Dockerfile              # Production Docker configuration
├── Dockerfile.dev          # Development Docker configuration
├── docker-compose.yml      # Docker Compose configuration
├── nginx.conf              # Nginx configuration for production
└── README.md               # This file
```

### Available Scripts

```bash
# Development
npm run dev                 # Start development server
npm run build              # Build for production
npm run preview            # Preview production build
npm run lint               # Run ESLint
npm run lint:fix           # Fix ESLint issues

# Docker commands
docker-compose up app-dev  # Start development environment
docker-compose up app-prod # Start production environment
docker-compose down        # Stop all containers
```

### Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: Development overrides
VITE_API_BASE_URL=http://localhost:8000
VITE_ENABLE_DEBUG=true
```

### Code Style and Linting

The project uses ESLint with TypeScript support. Key rules:

- **TypeScript strict mode** enabled
- **React hooks rules** enforced
- **Import/export consistency** required
- **Prettier integration** for formatting

### Internationalization (i18n)

The application supports Arabic and English languages:

- **Translation files**: `src/locales/ar/` and `src/locales/en/`
- **Language switching**: Automatic detection with manual override
- **RTL support**: Full right-to-left layout for Arabic

### Testing

```bash
# Run tests (when implemented)
npm run test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## 🚀 Deployment

### Production Build

1. **Build the application**

   ```bash
   npm run build
   ```

2. **Test the production build locally**
   ```bash
   npm run preview
   ```

### Docker Deployment

1. **Build production image**

   ```bash
   docker build -t seen-ai-hr .
   ```

2. **Run production container**
   ```bash
   docker run -p 80:80 seen-ai-hr
   ```

### Cloud Deployment

#### Vercel

```bash
npm install -g vercel
vercel --prod
```

#### Netlify

```bash
npm install -g netlify-cli
netlify deploy --prod
```

#### AWS S3 + CloudFront

```bash
# Build the application
npm run build

# Deploy to S3
aws s3 sync dist/ s3://your-bucket-name

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```

## 🔧 Configuration

### Vite Configuration

The project uses Vite with the following configuration:

- **React plugin** for JSX support
- **Path aliases** for clean imports (`@/` points to `src/`)
- **Environment variables** prefixed with `VITE_`
- **Build optimization** for production

### Tailwind CSS

Custom Tailwind configuration includes:

- **Custom color palette** matching the brand
- **Responsive breakpoints** for mobile-first design
- **Custom animations** and transitions
- **Dark mode** support

### Supabase Setup

1. **Create a Supabase project** at [supabase.com](https://supabase.com)
2. **Set up database tables** (see `supabase/` directory)
3. **Configure authentication** providers
4. **Set up Row Level Security (RLS)** policies
5. **Deploy Edge Functions** if needed

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
4. **Run tests and linting**
   ```bash
   npm run lint
   npm run test
   ```
5. **Commit your changes**
   ```bash
   git commit -m 'Add amazing feature'
   ```
6. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
7. **Open a Pull Request**

### Development Guidelines

- **TypeScript**: Use strict typing, avoid `any`
- **Components**: Use functional components with hooks
- **Styling**: Use Tailwind CSS classes, avoid custom CSS
- **State Management**: Use React Query for server state, local state for UI
- **Testing**: Write tests for new features
- **Documentation**: Update README for new features

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Getting Help

- **Documentation**: Check this README and inline code comments
- **Issues**: Create an issue on GitHub for bugs or feature requests
- **Discussions**: Use GitHub Discussions for questions and ideas

### Common Issues

#### Build Issues

```bash
# Clear cache and reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

#### Docker Issues

```bash
# Rebuild Docker images
docker-compose build --no-cache
docker-compose up
```

#### Supabase Connection Issues

- Verify environment variables are set correctly
- Check Supabase project status
- Ensure RLS policies are configured

## 🗺 Roadmap

### Upcoming Features

- [ ] **Advanced Analytics Dashboard**
- [ ] **Bulk CV Processing**
- [ ] **Integration with Job Boards**
- [ ] **Advanced Interview Scheduling**
- [ ] **Mobile App (React Native)**
- [ ] **API Documentation**
- [ ] **Performance Monitoring**
- [ ] **Advanced Search Filters**

### Performance Optimizations

- [ ] **Code Splitting** for better loading times
- [ ] **Image Optimization** and lazy loading
- [ ] **Service Worker** for offline support
- [ ] **Database Query Optimization**

---

<div align="center">

**Built with ❤️ by the SEEN AI Team**

[Website](https://seenai.com) • [Documentation](https://docs.seenai.com) • [Support](https://support.seenai.com)

</div>
