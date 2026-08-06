# FindIt AI - Master Project Specification & Bootstrap Prompt

Use this document as your "Master Prompt" when starting the project from scratch. You can paste this directly to your AI assistant to rebuild the platform cleanly and without errors.

---

## 🎯 Project Overview
**Name:** FindIt AI
**Description:** A modern, AI-powered lost and found platform that reunites people with their lost belongings through visual image matching and secure real-time communication.
**Goal:** Create a robust, production-ready full-stack web application with a stunning, premium UI, zero server crashes, and clean architecture.

## 🛠 Tech Stack
* **Frontend:** React 19, Vite, Tailwind CSS v4 (with strict `@theme` configuration), Framer Motion (for premium micro-animations), React Router DOM, Socket.io-client.
* **Backend:** Node.js, Express.js, PostgreSQL (using `pg` pool).
* **Real-time:** Socket.io (for live chat and notifications).
* **Storage:** Cloudinary (for robust image hosting).
* **Authentication:** JWT (JSON Web Tokens) with secure HTTP-only cookies or Bearer tokens.
* **Deployment target:** Render (Single Web Service for backend serving frontend statically).

---

## 🌟 Core Features to Implement

### 1. Authentication & User System
- Secure user registration and login.
- JWT-based authentication.
- User profiles with avatar and contact info.
- Roles: `user` and `admin`.

### 2. Item Management (Lost & Found)
- Upload found items with images (uploaded to Cloudinary).
- Categorization (Phone, Wallet, Keys, Bag, Laptop, etc.).
- Infinite scrolling for item feeds.
- Details page for each item showing location, time found, and AI tags.

### 3. AI Visual Search (The Magic Feature)
- Users can upload an image of their lost item.
- The system uses AI (e.g., Cloudinary AI auto-tagging or a vector embedding integration) to scan the database and return visually similar found items.
- Accuracy scores/percentages displayed on matches.

### 4. Claim & Verification System
- Users can submit a "Claim" on an item.
- They must provide a description or proof of ownership (e.g., IMEI number, lock screen wallpaper).
- Finders can review claims and approve/reject them.

### 5. Real-Time Chat (Socket.io)
- Secure, private messaging between the finder and the claimant.
- Live typing indicators and instant message delivery.
- Unread message counters.

### 6. Notifications
- Real-time bell notifications for: new claims, claim updates, and new messages.

---

## 🎨 Design & UI/UX Guidelines
* **Vibe:** Premium, modern, trustworthy, and heavily glassmorphic.
* **Colors:** Deep Indigo/Violet (`primary`), Teal/Emerald (`accent`) for success, Rose for actions.
* **Typography:** `Inter` for body text, `Outfit` for display headings.
* **Components:** 
  - Glassmorphic cards with subtle animated gradient borders.
  - Smooth page transitions using Framer Motion.
  - Hover ripple effects on buttons.
  - Fully responsive design (Mobile-first).

---

## 🚀 Step-by-Step Implementation Prompt (Copy & Paste this to start!)

> **"I want to build FindIt AI from scratch. It is a full-stack MERN-style app but using PostgreSQL instead of MongoDB. Please follow this exact step-by-step roadmap and do not move to the next step until I confirm the current step works perfectly without errors."**
> 
> **Step 1: Database Setup**
> - Create a `schema.sql` file for PostgreSQL with tables: `users`, `items`, `claims`, `messages`, `notifications`.
> - Write a robust database connection file that safely falls back to local variables and handles production `DATABASE_URL` gracefully.
> 
> **Step 2: Backend Foundation**
> - Initialize Node.js/Express. Set up security middleware (Helmet, CORS, Rate Limiting).
> - Implement JWT Authentication routes (Register, Login, GetMe).
> - Implement Multer + Cloudinary for robust image uploads.
> 
> **Step 3: Frontend Foundation**
> - Initialize React with Vite. Install Tailwind CSS v4.
> - Configure `index.css` with the complete Tailwind `@theme` variables (Inter/Outfit fonts, custom colors).
> - Set up standard UI components: Button, Input, Modal, GlassCard.
> 
> **Step 4: Core Features API**
> - Build CRUD routes for `items`. 
> - Implement the AI Search route (matching image tags or vector embeddings).
> - Build routes for submitting and reviewing `claims`.
> 
> **Step 5: Real-Time WebSockets**
> - Integrate Socket.io on the backend.
> - Build the Chat interface on the frontend. Ensure messages persist to PostgreSQL.
> 
> **Step 6: Production Polish**
> - Configure `server.js` to serve the React `dist` folder.
> - Ensure all native modules (like `sharp` or `bcrypt`) are handled correctly for Linux deployments on Render.

---

## ⚠️ Hard Lessons & Pitfalls to Avoid in the Rewrite
1. **Tailwind CSS v4 Configuration:** Do not use `tailwind.config.js`. You must use `@import "tailwindcss";` and `@theme` blocks inside `index.css`. Ensure the Vite plugin `@tailwindcss/vite` is correctly configured.
2. **Database Connection:** Do not hardcode localhost. Always use `process.env.DATABASE_URL` and ensure it handles SSL correctly in production (`ssl: { rejectUnauthorized: false }`).
3. **Missing Imports:** Use a linter! Ensure simple React hooks like `useEffect` are actually imported before deploying.
4. **Proxy Headers:** If deploying to Render, always add `app.set('trust proxy', 1)` in Express so that Rate Limiting doesn't crash the server.
5. **Static Serving:** Ensure the wildcard route `app.get('*')` strictly checks `req.accepts('html')` to prevent the server from accidentally sending the `index.html` file in place of a missing CSS or JS file.
