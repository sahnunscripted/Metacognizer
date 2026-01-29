# Metacognizer

An ADHD-friendly productivity app based on GTD (Getting Things Done) principles. Built with the MERN stack and designed for maximum dopamine through gamification.

## Features

- **Next Actions**: Manage actionable tasks with contexts (@phone, @computer, etc.)
- **Projects**: Multi-step outcomes with progress tracking
- **Brain Dump**: Quick capture of thoughts with guided processing
- **In-Basket**: Process incoming items with GTD workflow
- **Someday/Maybe**: Park ideas for future consideration
- **Gamification**: Points, streaks, and celebrations to boost motivation

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Framer Motion
- **Backend**: Node.js, Express, MongoDB/Mongoose
- **PWA**: Installable on mobile devices with offline support

## Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)

## Quick Start

1. **Install dependencies**
   ```bash
   npm run install-all
   ```

2. **Configure environment**
   ```bash
   cp server/.env.example server/.env
   # Edit server/.env with your MongoDB URI
   ```

3. **Start development servers**
   ```bash
   npm run dev
   ```

4. **Open the app**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## Project Structure

```
metacognizer/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/    # Reusable components (Button, Card, Modal, etc.)
│   │   │   ├── actions/   # Action-related components
│   │   │   ├── layout/    # Layout components
│   │   │   └── rewards/   # Gamification components
│   │   ├── pages/         # Page components
│   │   ├── context/       # React context providers
│   │   └── services/      # API services
│   └── public/            # Static assets
│
├── server/                # Express backend
│   ├── models/           # Mongoose schemas
│   ├── routes/           # API routes
│   └── config/           # Database config
│
└── package.json          # Root scripts
```

## GTD Workflow

1. **Capture**: Add everything to Brain Dump or In-Basket
2. **Process**: Work through each item asking "Is it actionable?"
3. **Organize**: Route items to Actions, Projects, or Someday/Maybe
4. **Review**: Weekly review of projects and someday items
5. **Do**: Work from context-filtered action lists

## API Endpoints

### Actions
- `GET /api/actions` - List actions (with filters)
- `POST /api/actions` - Create action
- `PUT /api/actions/:id` - Update action
- `POST /api/actions/:id/complete` - Complete action

### Projects
- `GET /api/projects` - List projects
- `POST /api/projects` - Create project
- `PUT /api/projects/:id` - Update project
- `POST /api/projects/:id/actions` - Add action to project

### Brain Dump
- `GET /api/braindump` - List items
- `POST /api/braindump` - Quick capture
- `POST /api/braindump/:id/process` - Process item

### In-Basket
- `GET /api/inbasket` - List items
- `POST /api/inbasket` - Add item
- `POST /api/inbasket/:id/process` - Process item

### Someday
- `GET /api/someday` - List items
- `POST /api/someday/:id/activate` - Activate to project/action

### Stats
- `GET /api/stats` - Get user stats
- `POST /api/stats/checkin` - Daily check-in for streaks

## Mobile Installation (PWA)

1. Open the app in your mobile browser
2. Tap "Add to Home Screen" or the install prompt
3. The app will work offline and feel native

## Design Principles

- **Distraction-free**: Clean, minimal interface
- **Mobile-first**: Optimized for phone use
- **Dopamine-boosting**: Celebrations, points, and streaks
- **ADHD-friendly**: Simple, clear workflows
- **GTD-based**: Trusted system principles

## Future AI Integration

The MERN stack was chosen for easy AI model integration. Potential additions:
- Auto-categorization of brain dump items
- Smart action suggestions
- Natural language processing for quick capture
- Focus time recommendations

## License

This is free and open source software, forever.

Licensed under the [GNU Affero General Public License v3 (AGPL-3.0)](LICENSE).
