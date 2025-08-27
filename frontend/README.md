# Real-Time Document Editor Frontend

This is the frontend application for the Real-Time Collaborative Document Editor, built with React, TypeScript, and modern web technologies.

## Features

- **Authentication System**: User registration and login with JWT tokens
- **Document Management**: Create, read, update, and delete documents
- **Real-time Collaboration**: Live document editing with WebSocket support
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Modern UI/UX**: Clean, intuitive interface with smooth animations

## Tech Stack

- **Framework**: React 18 with TypeScript
- **State Management**: Zustand
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Real-time**: Socket.io-client
- **Build Tool**: Vite
- **UI Components**: Headless UI + Heroicons

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Backend server running on port 3000

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open your browser and navigate to `http://localhost:3001`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run test` - Run tests
- `npm run lint` - Run ESLint

## Project Structure

```
src/
├── components/          # React components
│   ├── auth/           # Authentication components
│   ├── documents/      # Document-related components
│   ├── editor/         # Editor components
│   ├── layout/         # Layout components
│   └── common/         # Shared components
├── hooks/              # Custom React hooks
├── stores/             # Zustand state stores
├── services/           # API services
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
└── App.tsx            # Main application component
```

## API Integration

The frontend communicates with the backend through RESTful APIs and WebSocket connections:

- **Base URL**: `/api` (proxied to `http://localhost:3000`)
- **Authentication**: JWT-based with automatic token refresh
- **Real-time Updates**: WebSocket connection for live collaboration

## Development

### Adding New Components

1. Create the component file in the appropriate directory
2. Export the component as default
3. Import and use in other components as needed

### State Management

- Use Zustand stores for global state
- Keep component state local when possible
- Follow the established patterns in existing stores

### Styling

- Use Tailwind CSS utility classes
- Create custom components in `src/index.css` when needed
- Follow the established design system

## Contributing

1. Follow the existing code style and patterns
2. Add TypeScript types for all new features
3. Test your changes thoroughly
4. Update documentation as needed

## License

This project is licensed under the ISC License.
