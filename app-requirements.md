# Community Space Sharing Platform

## Goal
Create a community-based app where users can discover, share, and temporarily access underused spaces.

The app has two account types:
- User Account: people looking for spaces
- Space Owner Account: people offering spaces

## Style
The app should have a young, friendly, contemporary aesthetic.
The tone should be informal, positive, and welcoming.

## Core Features

### 1. Authentication
Users can log in with:
- username
- password

If credentials are valid:
- show "You're successfully logged in!"
- redirect to dashboard

If credentials are invalid:
- redirect to registration
- show "Looks like you're new here. Let's create your account!"

### 2. Space Search
Users can browse spaces and filter them by:
- space type
- size
- indoor/outdoor
- availability
- location

Results should be ordered by proximity.

Each space card shows:
- name
- image
- location
- indoor/outdoor
- dimensions
- availability

If no results:
- show "No spaces found. Try adjusting your filters."

**Backend (partial):** `GET /api/spaces` returns all spaces with full metadata (including description and rules). Search UI, filters, proximity ordering, and space cards are not yet built.

### 3. Space Details
Each space page shows:
- photo gallery
- location
- dimensions
- indoor/outdoor
- availability calendar
- description
- rules
- Book Now button

**Listing creation (implemented):** Space owners can create listings via the **List a Space** form (`/spaces/new`). The form captures name, location, dimensions (area_m2), indoor/outdoor, availability (text), description, rules, space type (category), and deposit. Photos are not yet supported in the create flow.

**Space detail page:** Not yet implemented — public `GET /api/spaces/{id}` returns full space data including description and rules.

### 4. Booking Request
Users can submit a booking form with:
- first name
- last name
- start date
- end date
- intended use

They must accept:
- terms and conditions
- safety agreements
- privacy policy

After submission, booking status is:
- Pending Approval

### 5. Owner Approval
Space owners receive booking requests.

They can:
- accept
- reject

If accepted:
- user receives "Fantastic! You've got the keys!"
- booking status becomes Confirmed
- private chat opens

If rejected:
- user receives "Sorry, maybe next time."
- booking status becomes Rejected

### 6. Chat
After acceptance, user and owner can chat.

Chat features:
- real-time messages
- image sharing
- booking reference
- notifications

### 7. User Dashboard
Users can view:
- upcoming bookings
- pending requests
- previous bookings
- saved favorite spaces
- messages

### 8. Owner Dashboard
Owners can manage:
- their spaces
- availability calendars
- booking requests
- accepted bookings
- messages
- profile information

**Implemented (partial):**
- **List a Space** — header button and `/spaces/new` form to create a listing (`POST /api/spaces`)
- **Your Listings** — dashboard section showing each owned space's **name** and **location** (`GET /api/spaces/mine`)

**Not yet implemented:** availability calendars, booking requests, accepted bookings, messages, profile editing, listing edit/delete, photos on create.

## Implementation Status (summary)

| Area | Status |
|------|--------|
| Authentication | Done |
| Create space listing | Done (`/spaces/new`, `POST /api/spaces`) |
| Owner listings on dashboard | Done (name + location via `GET /api/spaces/mine`) |
| Space search & cards | Not started |
| Space detail page | API only (`GET /api/spaces/{id}`) |
| Booking, chat, calendars | Not started |