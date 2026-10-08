#  Hospitality industry Lost & Found Management Portal & Guest Claim Hub

A modern, enterprise-grade Lost and Found Management Platform and Public Guest Claim Tracking System built for luxury hospitality, resorts, and modern facility operations.

---

## 🎯 Target Audience — Who Is This For? 
This system is tailored for five distinct user groups involved in hotel operations and guest services:

1. **Hotel Guests & Visitors (Hotel Guests & Customers)**:
   - Guests who misplaced or forgot belongings during their stay in guestrooms, restaurants, poolside, spa, lobby, or conference halls.
   - Allows guests to safely search public listings of found items without revealing sensitive personal information.
   - Allows guests to submit a detailed Lost Item Claim report with photos and description.
   - Provides live online tracking for claims using unique claim tracking codes (`WHB-XXXXX`).

2. **Housekeeping & Cleaning Crews (Room Attendants & Public Area Cleaners)**:
   - Staff who discover forgotten articles while cleaning checkout rooms and public amenities.
   - Enables quick logging with mobile camera photo uploads, room numbers, date/time, and category tagging.
   - Generates physical QR code labels for shelf/cabinet storage tracking.

3. **Front Desk & Receptionists (Front Office & Concierge)**:
   - Handles guest inquiries at reception or via phone/email.
   - Searches item catalog instantly by keyword, room number, date, or category.
   - Executes authorized handover with guest ID verification and digital signature capture.

4. **Security & Loss Prevention Officers**:
   - Oversees high-value items (jewels, electronics, passports, cash, luxury accessories).
   - Manages secure item lockers, dual-custody verification, and dispute resolution.
   - Enforces disposal, donation, or police handover protocols for items exceeding legal retention periods.

5. **Supervisors & General Management (Admins & Managers)**:
   - Monitors operational KPIs, return rates, staff recovery efficiency, and pending courier dispatches.
   - Rewards honest employees through the **Staff Recognition & Official Certificate Generation Studio**.
   - Oversees full audit logs for compliance, security integrity, and multi-database replication.

---

## 🌟 Key Features & Modules — What's Inside? 

### 1. 🏨 Public Guest Portal & Claim Tracking
- **Public Found Catalog**: Browse categorized, non-sensitive descriptions of recovered items.
- **Lost Item Inquiry Form**: Guests report lost belongings with item type, estimated lost location, date, brand, color, and contact details.
- **Real-Time Claim Tracking**: Instant status checking (`Under Review`, `Approved`, `Dispatched`, `Ready for Pickup`) via tracking reference code.

### 2. 📦 Lost & Found Inventory Management
- **Detailed Item Cataloging**: Name, category, room number, finder identity, storage shelf/bin, photos, and current status (`Stored`, `Pending Claim`, `Handed Over`, `Dispatched`, `Donated`, `Disposed`).
- **Advanced Filtering & Search**: Instant full-text search, category pills, date range filters, and status toggles.
- **Retention Policy Management**: Automatic calculation of retention expiry dates based on item categories (e.g., 30 days for clothing, 90 days for electronics, 180 days for valuables).

### 3. 📷 Instant QR Code Labeling & Camera Scanner
- **QR Code Generation**: Automatically creates a scannable QR label for each registered item.
- **Physical Label Printing**: Quick print labels with hotel emblem, item code, date, and storage location.
- **Integrated Camera Scanner**: Scan QR codes using mobile or desktop webcams for instant item lookup without typing.

### 4. 🤝 Secure Handover Workflow
- **Identity Verification**: Record claimant's government ID, passport, or driver's license number.
- **Digital Signature Capture**: Interactive touch/finger or mouse signature pad with auto-cropping and transparent background isolation.
- **Handover Receipts**: Generates printable official handover receipts signed by both guest and attending staff member.

### 5. 🚚 Pending Dispatch & Courier Shipping
- **Worldwide Guest Shipping**: For overseas guests who left items behind, log courier tracking numbers (DHL, FedEx, Aramex, etc.).
- **Shipping Status Lifecycle**: Track items from packaging to dispatch and final delivery confirmation.

### 6. 🏆 Staff Performance & Gamification
- **Employee Honesty Score**: Automatic recognition points when staff honestly report and return found belongings.
- **Leaderboards & Milestones**: Monthly and all-time top performers in the housekeeping and guest service departments.
- **Integrity Badges**: Departmental awards celebrating high standards of hospitality ethics.

### 7. 📜 Professional Certificate & Award Studio
- **Full Visual Certificate Builder**: Create official hospitality awards (Employee of the Month, Honesty & Integrity Award, Outstanding Service).
- **Customizable Layouts & Themes**: Gold, Royal Blue, Emerald, Burgundy, and Platinum borders with authentic luxury hotel crests.
- **Digital Signatures & Seals**: Multi-signatory support (General Manager, HR Director, Security Chief) with transparent signature stamps and embossed wax seals.
- **High-Resolution Export**: One-click Direct Print and vector PDF export.

### 8. 🛡️ Role-Based Access Control (RBAC) & Staff Management
- **8 Granular Roles**:
  - `Super Admin`: Complete administrative authority and database control.
  - `Admin`: Full operations, staff management, and reporting access.
  - `Manager`: Departmental oversight, approvals, and performance metrics.
  - `Supervisor`: Daily item logs, dispatches, handovers, and team certificates.
  - `Employee` / `Receptionist`: Item creation, searching, and customer handovers.
  - `Housekeeping`: Fast item logging and room attribution.
  - `Security`: High-value safe custody and disposal compliance.

### 9. 📜 Enterprise Audit Trail & Activity Logs
- Comprehensive chronological timeline logging every action:
  - User login/logout and session details.
  - Item registrations, status changes, and handovers.
  - Staff edits and role modifications.
  - Export audit reports for compliance and loss-prevention audits.

### 10. 🗄️ Multi-Database Replication Engine
- Synchronize hotel records across multiple storage backends:
  - **IndexedDB & LocalStorage**: Instant client-side offline operation.
  - **MongoDB / PostgreSQL / Firestore / Redis**: Pluggable backend persistence.
  - **Google Drive Backup**: Export and sync database snapshots to cloud storage.
  - **Database Health Monitor**: Real-time heartbeat and connection latency indicator.

### 11. 🎨 Theme Studio & Brand Customization
- **Theme Modes**: Full Light Mode, Dark Mode, and High-Contrast Accessibility.
- **Color Palette Studio**: Custom primary, secondary, button, and accent colors with real-time CSS variable injection.
- **Font Selection**: Switch between elegant serif and clean modern sans-serif typography.

### 12. ⚡ Offline PWA & Real-Time Sync
- **Progressive Web App (PWA)**: Installable on Android, iOS, Windows, and macOS devices.
- **Service Worker Offline Caching**: Continue logging items even when Wi-Fi is unavailable in hotel basements or elevators; changes sync automatically when reconnected.
- **Server-Sent Events (SSE)**: Instant real-time updates across multiple terminals without manual page refreshes.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, TypeScript, Tailwind CSS, Lucide Icons, Canvas API |
| **Backend** | Node.js, Express (`server.ts`), Server-Sent Events (SSE) |
| **Storage & Sync** | IndexedDB, MongoDB, PostgreSQL, Firebase Firestore, Redis |
| **Build Tooling** | Vite, PostCSS, ESLint, TypeScript Compiler |
| **Offline / PWA** | Service Worker, Cache API, Web App Manifest |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18.0.0 or higher)
- **npm** (v9.0.0 or higher)

### Installation
```bash
# Clone the repository or navigate to app directory
cd /app/applet

# Install dependencies
npm install
```

### Running in Development
```bash
# Starts both the Express backend and Vite frontend
npm run dev
```
The app will run at `http://localhost:3000`.

### Building for Production
```bash
npm run build
npm start
```

---

## ⌨️ Desktop Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl + K` / `Cmd + K` | Open Quick Command Palette |
| `Ctrl + I` / `Cmd + I` | Register New Found Item |
| `Ctrl + S` / `Cmd + S` | Open QR Scanner |
| `Ctrl + P` / `Cmd + P` | Print Current View or Report |
| `Ctrl + D` / `Cmd + D` | Jump to Dashboard |
| `Ctrl + ?` | View Keyboard Shortcuts Reference |

---

## 📄 License & Ownership
Copyright © Warwick Hotel Baha. All rights reserved. Designed for hospitality operations, loss-prevention departments, and hotel guest services.
