# Martial Training Platform — Product & Technical Documentation

## 1. Document Purpose

This document defines the product vision, scope, architecture, domain model, API structure, roadmap, and implementation guidelines for a web-first martial arts training platform.

The platform supports:
- exercise and technique libraries
- workout creation and execution
- filtering by martial style, workout type, body focus, and equipment
- training calendar and planning
- social collaboration
- coach-like workflows without a separate coach role
- future extension to native mobile apps

This document is intended to be used as the foundational specification inside VS Code during product design and implementation.

---

## 2. Core Product Principle

There is **no separate coach role**.

Every authenticated user can:
- create workouts
- create training plans
- schedule workouts in calendars
- share workouts with other users
- invite training partners
- follow other users
- assign plans to themselves or, when accepted, collaborate with other users

This keeps the product flexible and community-driven.

### 2.1 User Capability Model
Instead of role-based product separation, use a **capability model**:

All users can:
- manage their own profile
- create and edit exercises they own, if custom exercises are allowed
- create workouts
- create training plans
- schedule events
- invite partners
- share content
- view their progress

Administrative permissions remain separate for moderation and content governance.

### 2.2 Permission Layers
- **User permissions**: all standard training and social features
- **Admin permissions**: moderation, taxonomy management, content curation, abuse control, featured content

---

## 3. Product Vision

Build a structured martial arts training platform that helps users:
- learn techniques using short videos or GIFs
- create and follow personalized workouts
- organize training in a calendar
- collaborate with partners
- share plans and routines socially
- track progress over time

The product should support multiple combat and training styles such as:
- boxing
- kickboxing
- vovinam
- muay thai
- MMA striking
- conditioning / fight fitness

---

## 4. Product Goals

### 4.1 Primary Goals
- Deliver a strong web application first
- Build reusable API architecture for future native mobile apps
- Support rich filtering and personalization
- Support user-generated training content
- Create a practical social layer around training, planning, and accountability

### 4.2 Secondary Goals
- Enable community-created plans and workouts
- Support calendar collaboration
- Create a foundation for premium subscriptions later
- Enable future media-heavy coaching and progress features

---

## 5. Release Strategy

### Phase 1
Web application first:
- Django + Django REST Framework backend
- server-rendered or SPA frontend web app
- API-first architecture for later native apps

### Phase 2
Native mobile apps:
- iOS: Swift / SwiftUI
- Android: Kotlin / Jetpack Compose

### Phase 3
Advanced social and premium features:
- messaging
- advanced recommendations
- subscriptions
- deeper analytics

---

## 6. Functional Modules

1. Authentication and profiles
2. Taxonomy and metadata
3. Exercise library
4. Media library
5. Workout builder
6. Training plans
7. Calendar and scheduling
8. Social features
9. Progress tracking
10. Notifications
11. Admin and moderation

---

## 7. User Stories

### 7.1 Training Discovery
As a user, I want to browse exercises by style, body focus, and equipment so I can quickly find relevant training content.

### 7.2 Workout Creation
As a user, I want to build my own workouts from exercises so I can tailor my training.

### 7.3 Plan Creation
As a user, I want to build a multi-week training plan so I can follow a structured program.

### 7.4 Calendar Planning
As a user, I want to schedule workouts on a calendar so I can train consistently.

### 7.5 Social Collaboration
As a user, I want to invite a training partner to a session so we can train together.

### 7.6 Sharing
As a user, I want to share workouts and plans with other users so they can reuse them.

### 7.7 Media Guidance
As a user, I want to see a short video or GIF for each exercise so I understand how to execute it correctly.

### 7.8 Progress Tracking
As a user, I want to track completed workouts and streaks so I can monitor consistency.

---

## 8. Technology Stack

## 8.1 Backend
- Python
- Django
- Django REST Framework
- PostgreSQL
- Redis
- Celery
- django-filter
- drf-spectacular
- django-storages
- S3-compatible object storage

## 8.2 Web Frontend
Recommended options:
- **Option A:** Next.js frontend consuming DRF APIs
- **Option B:** React + Vite frontend consuming DRF APIs

Preferred recommendation:
- **React + TypeScript + Vite** for the first version if you want a clean SPA that consumes DRF directly
- **Next.js** if you want SSR/SEO-heavy public content pages later

UI stack:
- TypeScript
- React
- Tailwind CSS
- component library of choice
- React Query / TanStack Query
- React Router
- Zod for validation
- Font Geist
- UI Style similar to mobbin.com

## 8.3 Media
- S3 / Cloudflare R2 / Backblaze B2
- CDN for delivery
- MP4/WebM preferred over GIF for efficiency
- GIF fallback allowed

## 8.4 Mobile Future
- iOS: SwiftUI
- Android: Kotlin + Jetpack Compose

## 8.5 Deployment
- Docker
- Nginx
- Gunicorn / Uvicorn
- PostgreSQL managed instance
- Redis managed instance
- S3-compatible storage
- CI/CD via GitHub Actions

---

## 9. High-Level Architecture

```text
[ Web Frontend ]
        |
        v
[ Django REST API ]
        |
        +--> PostgreSQL
        +--> Redis
        +--> Celery Workers
        +--> Object Storage (media)
        +--> Notification services
```

### 9.1 Architectural Principles
- API-first design
- modular Django apps
- reusable taxonomy model
- media served through CDN
- async tasks for heavy operations
- web frontend independent from backend rendering

---

## 10. Information Architecture

### Main web navigation
- Home
- Discover
- Workouts
- Plans
- Calendar
- Social
- Progress
- Profile

### Admin navigation
- Users
- Exercises
- Media
- Workouts
- Plans
- Taxonomies
- Reports / moderation

---

## 11. Domain Model Overview

### Core entities
- User
- UserProfile
- MartialStyle
- WorkoutType
- BodyPart
- Equipment
- Tag
- Exercise
- ExerciseMedia
- Workout
- WorkoutBlock
- WorkoutExercise
- TrainingPlan
- TrainingPlanWeek
- TrainingPlanDay
- CalendarEvent
- PartnerRelation
- FollowRelation
- WorkoutSession
- SessionExerciseLog
- Notification

---

## 12. Data Model Specification

## 12.1 User
Represents an authenticated platform user.

Fields:
- id
- email
- username
- password_hash
- is_active
- is_staff
- created_at
- updated_at

## 12.2 UserProfile
Stores training-specific profile data.

Fields:
- user (OneToOne)
- display_name
- bio
- avatar_url
- location_text
- experience_level
- preferred_styles
- available_equipment
- body_focus_preferences
- weekly_availability
- visibility
- created_at
- updated_at

## 12.3 MartialStyle
Examples: boxing, kickboxing, vovinam, muay thai.

Fields:
- id
- name
- slug
- description
- is_active

## 12.4 WorkoutType
Examples:
- technique
- cardio
- conditioning
- mobility
- strength
- footwork
- combinations

Fields:
- id
- name
- slug
- description

## 12.5 BodyPart
Examples:
- shoulders
- chest
- arms
- legs
- core
- back
- full body

Fields:
- id
- name
- slug

## 12.6 Equipment
Examples:
- bodyweight
- heavy bag
- jump rope
- mitts
- dumbbells
- kettlebell
- resistance bands
- weights

Fields:
- id
- name
- slug
- description

## 12.7 Tag
Flexible metadata tagging.

Fields:
- id
- name
- slug

## 12.8 Exercise
The core instructional unit.

Fields:
- id
- title
- slug
- short_description
- full_description
- instructions
- common_mistakes
- safety_notes
- difficulty_level
- duration_hint_seconds
- is_public
- created_by
- primary_style
- workout_types
- body_parts
- equipment_required
- tags
- created_at
- updated_at

## 12.9 ExerciseMedia
Attached visual guidance for an exercise.

Fields:
- id
- exercise
- media_type (video, gif, image)
- file_url
- thumbnail_url
- duration_seconds
- width
- height
- sort_order
- created_at

## 12.10 Workout
A user-created reusable workout.

Fields:
- id
- title
- slug
- description
- created_by
- visibility
- difficulty_level
- estimated_duration_minutes
- primary_style
- workout_types
- body_parts
- equipment_used
- tags
- is_template
- created_at
- updated_at

## 12.11 WorkoutBlock
Logical sections of a workout.

Examples:
- warmup
- technique
- rounds
- conditioning
- cooldown

Fields:
- id
- workout
- block_type
- title
- notes
- sort_order

## 12.12 WorkoutExercise
Exercise instance inside a workout block.

Fields:
- id
- workout_block
- exercise
- sort_order
- reps
- sets
- rounds
- work_seconds
- rest_seconds
- distance_meters
- notes

## 12.13 TrainingPlan
Multi-day or multi-week program.

Fields:
- id
- title
- description
- created_by
- visibility
- primary_style
- difficulty_level
- duration_weeks
- tags
- created_at
- updated_at

## 12.14 TrainingPlanWeek
Fields:
- id
- training_plan
- week_number
- title
- notes

## 12.15 TrainingPlanDay
Fields:
- id
- training_plan_week
- day_number
- title
- workout
- notes

## 12.16 CalendarEvent
Calendar event for scheduled training.

Fields:
- id
- owner
- title
- description
- event_type
- workout
- training_plan_day
- starts_at
- ends_at
- timezone
- status
- visibility
- location_text
- invited_users
- created_by
- created_at
- updated_at

## 12.17 PartnerRelation
Represents a bilateral training partner connection.

Fields:
- id
- requester
- addressee
- status
- created_at
- updated_at

## 12.18 FollowRelation
Represents a follow connection for social discovery.

Fields:
- id
- follower
- followed_user
- created_at

## 12.19 WorkoutSession
Represents the execution of a workout.

Fields:
- id
- user
- workout
- started_at
- completed_at
- duration_seconds
- perceived_intensity
- notes
- rating
- status

## 12.20 SessionExerciseLog
Per-exercise progress log inside a workout session.

Fields:
- id
- workout_session
- exercise
- completed_sets
- completed_reps
- completed_rounds
- work_seconds
- rest_seconds
- notes

## 12.21 Notification
Fields:
- id
- user
- type
- title
- body
- payload_json
- read_at
- created_at

---

## 13. Relationships

- User 1:1 UserProfile
- User 1:N Exercise (created_by)
- User 1:N Workout (created_by)
- User 1:N TrainingPlan (created_by)
- Workout 1:N WorkoutBlock
- WorkoutBlock 1:N WorkoutExercise
- Exercise 1:N ExerciseMedia
- TrainingPlan 1:N TrainingPlanWeek
- TrainingPlanWeek 1:N TrainingPlanDay
- CalendarEvent M:N invited users
- User M:N MartialStyle through profile preferences
- Exercise M:N BodyPart
- Exercise M:N Equipment
- Exercise M:N WorkoutType
- Workout M:N BodyPart
- Workout M:N Equipment
- Workout M:N WorkoutType

---

## 14. Django App Structure

Recommended backend structure:

```text
backend/
  config/
  apps/
    users/
    profiles/
    taxonomy/
    exercises/
    media_library/
    workouts/
    plans/
    calendar_app/
    social/
    tracking/
    notifications/
    moderation/
```

### App responsibilities

#### users
- custom user model
- authentication
- account lifecycle

#### profiles
- user profile and preferences

#### taxonomy
- martial styles
- workout types
- body parts
- equipment
- tags

#### exercises
- exercise definitions
- exercise search and filtering

#### media_library
- exercise media assets
- upload management
- processing state

#### workouts
- workouts
- workout blocks
- workout exercises

#### plans
- training plans
- weeks and days

#### calendar_app
- calendar events
- scheduling logic
- invites

#### social
- partner relations
- follows
- activity feed in future

#### tracking
- workout sessions
- logs
- streaks and stats

#### notifications
- in-app notifications
- push/email integration later

#### moderation
- reports
- abuse handling
- curated content

---

## 15. API Design Principles

- REST-first API
- consistent resource naming
- versioned APIs from the beginning
- cursor or page-based pagination
- filtering via query params
- search endpoints where needed
- JWT-based authentication

Base path:

```text
/api/v1/
```

---

## 16. API Resource Map

## 16.1 Auth
```text
POST   /api/v1/auth/register/
POST   /api/v1/auth/login/
POST   /api/v1/auth/refresh/
POST   /api/v1/auth/logout/
GET    /api/v1/auth/me/
PATCH  /api/v1/auth/me/
```

## 16.2 Profiles
```text
GET    /api/v1/profiles/me/
PATCH  /api/v1/profiles/me/
GET    /api/v1/profiles/{user_id}/
```

## 16.3 Taxonomy
```text
GET    /api/v1/taxonomy/styles/
GET    /api/v1/taxonomy/workout-types/
GET    /api/v1/taxonomy/body-parts/
GET    /api/v1/taxonomy/equipment/
GET    /api/v1/taxonomy/tags/
```

## 16.4 Exercises
```text
GET    /api/v1/exercises/
POST   /api/v1/exercises/
GET    /api/v1/exercises/{id}/
PATCH  /api/v1/exercises/{id}/
DELETE /api/v1/exercises/{id}/
GET    /api/v1/exercises/{id}/media/
POST   /api/v1/exercises/{id}/media/
```

Suggested filters:
- style
- workout_type
- body_part
- equipment
- difficulty
- duration_max
- search
- created_by

## 16.5 Workouts
```text
GET    /api/v1/workouts/
POST   /api/v1/workouts/
GET    /api/v1/workouts/{id}/
PATCH  /api/v1/workouts/{id}/
DELETE /api/v1/workouts/{id}/
POST   /api/v1/workouts/{id}/duplicate/
POST   /api/v1/workouts/{id}/bookmark/
DELETE /api/v1/workouts/{id}/bookmark/
```

## 16.6 Plans
```text
GET    /api/v1/plans/
POST   /api/v1/plans/
GET    /api/v1/plans/{id}/
PATCH  /api/v1/plans/{id}/
DELETE /api/v1/plans/{id}/
POST   /api/v1/plans/{id}/duplicate/
```

## 16.7 Calendar
```text
GET    /api/v1/calendar/events/
POST   /api/v1/calendar/events/
GET    /api/v1/calendar/events/{id}/
PATCH  /api/v1/calendar/events/{id}/
DELETE /api/v1/calendar/events/{id}/
POST   /api/v1/calendar/events/{id}/invite/
POST   /api/v1/calendar/events/{id}/respond/
```

## 16.8 Social
```text
GET    /api/v1/social/partners/
POST   /api/v1/social/partners/invite/
POST   /api/v1/social/partners/{id}/accept/
POST   /api/v1/social/partners/{id}/decline/
GET    /api/v1/social/follows/
POST   /api/v1/social/follow/{user_id}/
DELETE /api/v1/social/follow/{user_id}/
```

## 16.9 Tracking
```text
GET    /api/v1/tracking/sessions/
POST   /api/v1/tracking/sessions/
GET    /api/v1/tracking/sessions/{id}/
PATCH  /api/v1/tracking/sessions/{id}/
POST   /api/v1/tracking/sessions/{id}/complete/
GET    /api/v1/tracking/stats/
```

## 16.10 Notifications
```text
GET    /api/v1/notifications/
POST   /api/v1/notifications/{id}/mark-read/
POST   /api/v1/notifications/mark-all-read/
```

---

## 17. Filtering Strategy

Filtering is a core product feature and should be designed early.

### 17.1 Global filter dimensions
- martial style
- workout type
- body part
- equipment
- difficulty
- duration
- creator
- visibility
- tags

### 17.2 Example filter case
User selects:
- style: kickboxing
- workout type: conditioning
- body part: legs
- equipment: heavy bag
- duration <= 30 min

The backend should return workouts and exercises matching the full filter set.

### 17.3 Implementation
Use:
- `django-filter`
- normalized many-to-many relations
- indexed slugs and foreign keys
- explicit filter classes per resource

---

## 18. Media Strategy

### 18.1 Media rules
Each exercise should support:
- one primary video or GIF
- optional secondary media items
- optional thumbnail

### 18.2 Preferred media format
Preferred order:
1. MP4/WebM short loop
2. GIF fallback
3. still image fallback

### 18.3 Upload pipeline
Upload flow:
1. user uploads media
2. backend stores original file in object storage
3. async task validates and processes media
4. preview and thumbnail are generated if needed
5. metadata is saved in `ExerciseMedia`

### 18.4 Media constraints
- enforce max size
- validate file type
- virus or content scanning if possible
- moderation queue for public content if community uploads are enabled

---

## 19. Social Design

The social layer should be useful, not noisy.

### 19.1 First social features
- follow users
- add training partners
- invite users to calendar sessions
- share workouts
- share training plans

### 19.2 Later social features
- activity feed
- comments
- messaging
- group challenges

### 19.3 Social privacy
Every shareable object should support visibility such as:
- private
- followers
- invited only
- public

---

## 20. Calendar Design

### 20.1 Calendar capabilities
Users can:
- add a workout to a date
- add a plan day to a date
- create a custom training event
- invite another user
- accept or reject participation
- mark the event completed or skipped

### 20.2 Event types
- workout
- plan_day
- custom_training
- partner_session
- rest_day

### 20.3 Status values
- planned
- completed
- skipped
- canceled
- rescheduled

---

## 21. Web Frontend Structure

Suggested frontend structure:

```text
frontend/
  src/
    app/
    api/
    components/
    features/
      auth/
      profile/
      taxonomy/
      exercises/
      workouts/
      plans/
      calendar/
      social/
      tracking/
    hooks/
    lib/
    pages/
    routes/
    styles/
    types/
```

### 21.1 Core frontend pages
- Landing page
- Login / Register
- Dashboard
- Discover Exercises
- Exercise Detail
- Discover Workouts
- Workout Builder
- Workout Detail
- Plans List
- Plan Builder
- Plan Detail
- Calendar
- Social / Partners
- Progress
- Profile
- Settings

---

## 22. Core Screens Specification

## 22.1 Dashboard
Shows:
- today’s scheduled workouts
- upcoming events
- recent sessions
- suggested workouts
- quick links

## 22.2 Exercise List
Shows:
- filters sidebar or modal
- search bar
- exercise cards
- preview media thumbnail

## 22.3 Exercise Detail
Shows:
- title
- media player / GIF
- instructions
- mistakes
- style tags
- body part tags
- equipment tags
- related exercises

## 22.4 Workout Builder
Allows user to:
- create workout metadata
- add blocks
- add exercises to each block
- set reps / rounds / rest / seconds
- preview total duration

## 22.5 Plan Builder
Allows user to:
- create multi-week plan
- assign workouts per week/day
- add notes

## 22.6 Calendar
Shows:
- month / week view
- scheduled events
- invite states
- quick add action

## 22.7 Social Page
Shows:
- partners
- incoming invites
- following
- shared workouts/plans

## 22.8 Progress Page
Shows:
- completed workouts
- streaks
- weekly volume
- style breakdown
- time trained

---

## 23. Authentication and Security

### 23.1 Auth approach
Use JWT or session + CSRF depending on frontend architecture.

Recommended for SPA/mobile compatibility:
- JWT access token
- refresh token

### 23.2 Security requirements
- custom user model from day one
- secure password hashing
- object ownership checks
- permission classes in DRF
- rate limiting
- input validation
- upload validation
- audit logging for sensitive actions

### 23.3 Ownership rules
Users can edit:
- their own profile
- workouts they created
- plans they created
- exercises they created, if allowed
- calendar events they created or own

Admins can moderate public content.

---

## 24. Recommendation Logic

Recommendation should start simple.

### Inputs
- preferred styles
- available equipment
- body focus preferences
- training history
- duration preference

### Outputs
- suggested exercises
- suggested workouts
- suggested plans
- suggested training partners in later versions

### Phase 1 logic
Use rules-based recommendations, not AI.

---

## 25. Non-Functional Requirements

### Performance
- exercise list should load fast with pagination
- media should stream via CDN
- filtering must remain responsive

### Scalability
- async processing for media tasks
- modular services for future mobile usage
- avoid tight frontend-backend coupling

### Reliability
- idempotent background tasks where possible
- retryable media processing
- backup strategy for DB and storage

### Maintainability
- modular Django apps
- strong typing in frontend
- serializer and view separation
- testable business logic

---

## 26. Suggested Development Roadmap

## Milestone 1 — Platform Foundation
- Django project setup
- custom user model
- auth endpoints
- user profile
- taxonomy models
- admin setup
- frontend scaffold

## Milestone 2 — Exercise Library
- exercise CRUD
- media upload flow
- exercise filters
- exercise detail pages

## Milestone 3 — Workouts
- workout CRUD
- workout blocks
- workout builder UI
- bookmark / duplicate

## Milestone 4 — Plans
- plan CRUD
- week/day structure
- plan builder UI

## Milestone 5 — Calendar
- event CRUD
- weekly/monthly calendar UI
- add workout to calendar
- invite partner

## Milestone 6 — Tracking
- session start/complete
- progress pages
- streaks and stats

## Milestone 7 — Social
- follow users
- partner invites
- shared workouts/plans

## Milestone 8 — Production Hardening
- notifications
- moderation
- storage/CDN optimization
- analytics and observability

---

## 27. MVP Scope

### In scope
- authentication
- profiles
- taxonomy
- exercise library
- media per exercise
- workout builder
- plan builder
- personal calendar
- partner invites
- workout session tracking
- basic progress dashboard

### Out of scope for MVP
- chat
- live sessions
- payments
- AI recommendations
- advanced moderation workflow
- deep coach marketplace behavior

---

## 28. Suggested Repository Structure

```text
project-root/
  backend/
    manage.py
    requirements/
    config/
    apps/
    tests/
    docker/
  frontend/
    src/
    public/
    tests/
  docs/
    product/
    architecture/
    api/
    ux/
  infra/
    docker/
    nginx/
    ci/
  .github/
```

---

## 29. Suggested Docs Folder Structure

```text
docs/
  00-overview.md
  01-product-vision.md
  02-user-flows.md
  03-domain-model.md
  04-api-spec.md
  05-backend-architecture.md
  06-frontend-architecture.md
  07-roadmap.md
  08-mvp-scope.md
```

## 30. Implementation Package to Generate in VS Code

The initial implementation package should contain:

```text
project-root/
  README.md
  docs/
    00-overview.md
    01-product-vision.md
    02-user-flows.md
    03-domain-model.md
    04-api-spec.md
    05-backend-architecture.md
    06-frontend-architecture.md
    07-roadmap.md
    08-mvp-scope.md
  backend/
    manage.py
    requirements/
      base.txt
      dev.txt
    config/
      __init__.py
      settings/
        __init__.py
        base.py
        dev.py
      urls.py
      wsgi.py
      asgi.py
      celery.py
    apps/
      users/
      profiles/
      taxonomy/
      exercises/
      media_library/
      workouts/
      plans/
      calendar_app/
      social/
      tracking/
      notifications/
      moderation/
    common/
      permissions/
      pagination/
      utils/
    tests/
  frontend/
    package.json
    tsconfig.json
    vite.config.ts
    index.html
    src/
      main.tsx
      App.tsx
      app/
      api/
      components/
      features/
      hooks/
      lib/
      pages/
      routes/
      styles/
      types/
```

## 31. Final Recommendation

Build the product in this order:
1. backend foundation
2. exercise library and taxonomy
3. workout builder
4. plans
5. calendar
6. tracking
7. social collaboration
8. mobile apps later

Do not start with advanced social features.
Start with strong solo user value and structured training creation.

That ensures the platform is useful even before network effects appear.

