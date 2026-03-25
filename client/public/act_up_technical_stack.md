# Act Up - Technical Stack Summary

## Overall Application Architecture

Act Up is a sophisticated legislative bill tracking platform that enables citizens to monitor, interact with, and mobilize around Texas state legislation. The application employs a modern full-stack architecture built to handle real-time legislative data, provide interactive visualizations, and support community organizing around policy issues.

## Technical Stack

### Frontend
- **Framework**: React 18 with TypeScript for type safety and improved developer experience
- **State Management**: TanStack Query (React Query v5) for server state management with efficient caching
- **Routing**: Wouter for lightweight client-side routing
- **Styling**: 
  - Tailwind CSS with custom theme configuration
  - ShadCN UI component library (built on Radix UI primitives)
  - Custom component system with responsive design
- **Data Visualization**: Recharts library for interactive timeline charts and legislative process visualization
- **Forms**: React Hook Form with Zod schema validation

### Backend
- **Server**: Node.js with Express.js
- **Language**: TypeScript for end-to-end type safety
- **API**: RESTful API architecture with JSON responses
- **Authentication**: Session-based authentication with express-session
- **Security**:
  - CORS configuration for secure cross-origin requests
  - Password hashing with bcrypt
  - Rate limiting for API endpoints

### Database
- **RDBMS**: PostgreSQL through Replit's managed database service
- **ORM**: Drizzle ORM for type-safe database operations
- **Migrations**: Drizzle Kit for schema migrations
- **Schema Validation**: Zod for runtime type validation with Drizzle integration

### DevOps & Deployment
- **Hosting**: Replit-based cloud deployment
- **Build Tool**: Vite for fast development and optimized production builds
- **Bundling**: ESBuild for TypeScript/JavaScript transpilation
- **Environment**: Containerized Node.js runtime
- **CI/CD**: Replit's integrated workflow system
- **Cloud Services**: Planned migration to AWS (ECS Fargate, Aurora PostgreSQL, API Gateway, Lambda, etc.)

## Application Features

### Legislative Data Management
1. **Bill Tracking Engine**:
   - Real-time synchronization with Texas Legislature Online
   - Comprehensive bill metadata capture (sponsors, committees, text versions)
   - Full-text search capabilities across legislative content

2. **Committee Meeting Integration**:
   - House and Senate committee meeting data aggregation
   - Association of bills with specific committee meetings
   - Committee hearing schedule tracking

3. **User-Specific Bill Tracking**:
   - Personalized bill watchlists with notification preferences
   - Custom organization and categorization of tracked legislation
   - Impact assessment tools for legislation

### Interactive Visualization
1. **Legislative Timeline Storyteller**:
   - Dynamic visualization of bill journeys through the legislative process
   - Interactive tooltips showing detailed action information
   - Dual-view system with chart visualization and chronological list view
   - Event-based timeline with chamber differentiation (House/Senate actions)

2. **Committee Meeting Visualizations**:
   - Calendar view of upcoming committee meetings
   - Integration of meeting data with bill tracking system
   - Visual indicators for meetings discussing tracked bills

### AI-Powered Features
1. **Committee Video Analysis**:
   - Automated processing of committee meeting recordings
   - Transcription of hearing content with speaker recognition
   - Bill reference extraction and correlation with the bill database
   - Summarization of key points and arguments presented

2. **Legislative Impact Assessment**:
   - AI-driven analysis of potential bill impacts
   - Personalized impact assessments based on user profiles
   - Community impact aggregation for broader insights

### Community Engagement Tools
1. **Action Circles**:
   - Creation and management of advocacy groups around specific bills
   - Member coordination for committee meetings and other events
   - Progress tracking for advocacy actions
   - Action assignment and completion tracking

2. **War Room**:
   - Collaborative strategic planning around high-priority legislation
   - Resource sharing and coordination for advocacy efforts
   - Real-time updates on legislative developments

## Database Schema Architecture

The database schema follows a normalized relational design with clear separation of concerns:

1. **User Management**:
   - User accounts with authentication data
   - Profile customization and preferences

2. **Legislation Tracking**:
   - Bills with complete metadata (title, sponsor, status, etc.)
   - Bill history events tracking the legislative journey
   - User-bill relationships for personalized tracking

3. **Committee System**:
   - Committee definitions and membership
   - Meeting records with agenda items
   - Video processing records and transcripts
   - Relationship mapping between bills and committee hearings

4. **Community Organization**:
   - Action circle definitions and membership
   - Advocacy action planning and tracking
   - Member participation metrics

## API Structure

The API follows RESTful principles with endpoints organized by domain:

1. **Authentication API**: User login, registration, and session management
2. **Legislation API**: Bill search, filtering, and detailed information retrieval
3. **Tracking API**: User-specific bill tracking operations
4. **Committee API**: Committee data, meeting schedules, and video content
5. **Impact API**: Assessment and analysis of legislative impact
6. **Community API**: Action circle management and advocacy coordination

## Development Roadmap

Current development focus is on:

1. Expanding the Interactive Legislative Timeline feature
2. Enhancing committee meeting integration
3. Improving AI processing of committee videos
4. Optimizing performance across the application
5. Preparing for AWS infrastructure migration

The application is built with scalability in mind, configured to handle thousands of concurrent users tracking hundreds of bills through the Texas legislative session.