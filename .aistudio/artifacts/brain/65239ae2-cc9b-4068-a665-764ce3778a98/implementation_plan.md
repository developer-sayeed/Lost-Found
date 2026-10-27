# Architecture & Modular Refactoring Plan: Single-Hotel Modular Monolith

## 1. Executive Summary & Architecture Strategy

The existing **Warwick Hotels & Resorts Lost & Found Management System** is a feature-rich, enterprise-grade application with robust local and MongoDB data persistence, real-time sync, role-based access control, certificate generation, device sessions, and audit logging. 

However, the codebase currently suffers from severe file bloat:
- **`server.ts`**: **7,157 lines** containing HTTP routes, database controllers, Gemini AI OCR/signature extraction, SSE streams, Google Drive backup, MongoDB failovers, audit dispatch, and Vite integration all in one file.
- **Frontend Views**: Individual components exceed 1,500 to 3,600 lines (`SettingsView.tsx` at 3,640 lines, `StaffManagementView.tsx` at 2,921 lines, `CertificateGeneratorModal.tsx` at 2,905 lines, `AppContext.tsx` at 2,746 lines, `AuditLogsView.tsx` at 2,071 lines).
- **`src/lib/api.ts`**: **2,195 lines** housing every API client call.
- **`src/types.ts`**: **1,354 lines** with dozens of intermixed domain interfaces.

### Core Architecture Goal
Transform the project into a **Single-Hotel Feature-Based Modular Monolith Architecture** adhering strictly to:
1. **100% Feature, Data & API Contract Preservation**: Zero changes to HTTP endpoints, request/response formats, database persistence schemas, permissions, or UI styling.
2. **Backward-Compatible Barrel Re-exports**: All existing import paths (`import { api } from '../lib/api'`, `import { LostItem } from '../types'`, etc.) continue to work without disruption.
3. **Balanced Modularity Target**: Target cohesive subcomponents of 150–300 lines each, avoiding both sprawling monoliths and excessive micro-file fragmentation.
4. **Zero Data Loss Guarantee**: No dropping or resetting MongoDB collections, no automated destructive seeding, and preservation of all 60-day item retention logic.

---

## 2. Codebase Baseline & Dependency Map

### Current Baseline Metrics
| Component / File | Current Lines | Primary Responsibility | Target Modularization |
|---|---|---|---|
| `server.ts` | **7,157** | Monolithic server | `server/` modular structure with thin entrypoint |
| `src/components/SettingsView.tsx` | **3,640** | All settings tabs & forms | `src/features/settings/` tab components (150–280 lines) |
| `src/components/StaffManagementView.tsx` | **2,921** | Staff directory & permission matrix | `src/features/staff/` subcomponents & hooks |
| `src/components/certificates/CertificateGeneratorModal.tsx` | **2,905** | Certificate editor & templates | `src/features/certificates/generator/` subcomponents |
| `src/context/AppContext.tsx` | **2,746** | Mega application state | Core context retained with modular sub-reducers/hooks |
| `src/lib/api.ts` | **2,195** | Monolithic API client | `src/services/api/` domain clients + barrel re-export |
| `src/components/AuditLogsView.tsx` | **2,071** | Audit ledger & filtering | `src/features/audit-logs/` table, filters & stats |
| `src/components/ThemePresetGridSelector.tsx` | **1,940** | Preset grid & color cards | Split into preset cards, color swatches, filter tabs |
| `src/components/LoginPageCustomizer.tsx` | **1,762** | Login page branding editor | Split into preview panel, form controls, media selector |
| `src/components/StaffPerformanceView.tsx` | **1,611** | Leaderboard & KPI analytics | Split into podium, leaderboard table, drilldown modal |
| `src/components/UserProfileView.tsx` | **1,477** | Staff profile & history | Split into profile card, security pane, activity table |
| `src/types.ts` | **1,354** | Monolithic TypeScript types | `src/types/` domain definitions + barrel re-export |
| `src/components/GoogleDriveBackupManager.tsx` | **1,272** | Drive backup & sync | Split into auth status, backup history, schedule modal |
| `src/components/ItemsView.tsx` | **1,221** | Main lost & found inventory | Split into table controls, action toolbar, data table |
| `src/components/PendingDispatchView.tsx` | **1,122** | Dispatch queue & batches | Split into batch modal, deadline filters, dispatch table |
| `src/components/RemovedItemsView.tsx` | **1,043** | Soft-deleted trash items | Split into retention banner, restore modals, trash table |

---

## 3. Phase-by-Phase Modularization Plan

### Phase 2: Backend Modularization (`server/`)
The backend will be refactored into clean feature modules while keeping the root `server.ts` as a 40-line bootstrap script that boots `server/app.ts` (preserving `"dev": "tsx server.ts"` and `"build"` commands in `package.json`).

#### Target Backend Structure:
```text
server/
├── app.ts                          # Express setup, middleware, module routers, Vite SSR/static
├── config/
│   ├── env.config.ts               # Port, JWT/Session secrets, environment constants
│   └── database.config.ts          # File paths (db.json, backups), MongoDB URI configs
├── database/
│   ├── json-db.ts                  # Local database store, atomic file writes, auto-save
│   ├── mongodb.ts                  # MongoDB connection management & collections
│   └── connection-manager.ts       # Failover and health check orchestrator
├── middleware/
│   ├── auth.middleware.ts          # authenticateUser, requireAdmin, actorHasPermission
│   ├── permission.middleware.ts    # Granular permission check utilities
│   ├── validation.middleware.ts    # Request payload sanitizers
│   └── error.middleware.ts         # Centralized error handler & status codes
├── modules/
│   ├── auth/                       # Login, logout, session check, account lockout, Google OAuth
│   │   ├── auth.routes.ts
│   │   ├── auth.controller.ts
│   │   └── auth.service.ts
│   ├── items/                      # Registration, updates, approval, rejection, handover, return
│   │   ├── items.routes.ts
│   │   ├── items.controller.ts
│   │   ├── items.service.ts
│   │   └── items.repository.ts
│   ├── dispatch/                   # Dispatch, batch dispatch, courier tracking
│   │   ├── dispatch.routes.ts
│   │   └── dispatch.controller.ts
│   ├── staff/                      # Staff CRUD, duplicate checks, password reset
│   │   ├── staff.routes.ts
│   │   ├── staff.controller.ts
│   │   └── staff.service.ts
│   ├── certificates/               # Templates, generator, signature extraction (Gemini API)
│   │   ├── certificates.routes.ts
│   │   ├── certificates.controller.ts
│   │   └── certificates.service.ts
│   ├── notifications/              # In-app notifications, broadcasts, read/unread status
│   │   ├── notifications.routes.ts
│   │   └── notifications.controller.ts
│   ├── audit-logs/                 # Ledger recording, stats, log queries
│   │   ├── audit.routes.ts
│   │   ├── audit.controller.ts
│   │   └── audit.service.ts
│   ├── backup/                     # Full backup export, JSON restore, Google Drive backup logging
│   │   ├── backup.routes.ts
│   │   └── backup.controller.ts
│   ├── security/                   # Device sessions, blocked IP/devices, security activity logs
│   │   ├── security.routes.ts
│   │   └── security.controller.ts
│   ├── guest-inquiries/            # Public guest lost item inquiries & status tracking
│   │   ├── inquiries.routes.ts
│   │   └── inquiries.controller.ts
│   ├── settings/                   # Hotel branding, themes, validation messages, cache clearing
│   │   ├── settings.routes.ts
│   │   └── settings.controller.ts
│   └── realtime/                   # Server-Sent Events (SSE) & inter-tab sync broadcaster
│       ├── realtime.routes.ts
│       └── realtime.service.ts
└── utils/
    ├── audit-helper.ts             # addAudit utility function
    ├── sound-helper.ts             # Sound chime triggers
    └── response-helper.ts          # Unified JSON API responses
```

---

### Phase 3: Frontend Feature-Based Modularization (`src/features/`)
Large view components will be organized into feature directories. Each feature directory will contain the main view component along with focused subcomponents (150–300 lines each):

```text
src/
├── features/
│   ├── dashboard/
│   │   ├── DashboardView.tsx
│   │   └── components/
│   │       ├── WelcomeGreetingBanner.tsx
│   │       ├── MetricSummaryCards.tsx
│   │       ├── CategoryDonutChart.tsx
│   │       ├── InventoryStatusBar.tsx
│   │       └── RecentActivitiesTable.tsx
│   ├── lost-found/
│   │   ├── ItemsView.tsx
│   │   ├── PendingDispatchView.tsx
│   │   ├── RemovedItemsView.tsx
│   │   └── components/
│   │       ├── ItemsTableToolbar.tsx
│   │       ├── ItemsDataTable.tsx
│   │       ├── BatchDispatchModal.tsx
│   │       ├── BatchDeleteModal.tsx
│   │       └── TrashRetentionBanner.tsx
│   ├── staff/
│   │   ├── StaffManagementView.tsx
│   │   ├── StaffPerformanceView.tsx
│   │   └── components/
│   │       ├── StaffMetricsCards.tsx
│   │       ├── StaffDirectoryGrid.tsx
│   │       ├── StaffPermissionsMatrix.tsx
│   │       ├── StaffActionMenu.tsx
│   │       ├── PerformanceLeaderboard.tsx
│   │       └── PerformanceDrilldownModal.tsx
│   ├── certificates/
│   │   ├── CertificatesView.tsx
│   │   └── components/
│   │       ├── CertificateGalleryHeader.tsx
│   │       ├── CertificateCardsGrid.tsx
│   │       └── generator/
│   │           ├── GeneratorFormPanel.tsx
│   │           ├── GeneratorLivePreview.tsx
│   │           └── GeneratorSignatorySection.tsx
│   ├── audit-logs/
│   │   ├── AuditLogsView.tsx
│   │   └── components/
│   │       ├── AuditMetricsRow.tsx
│   │       ├── AuditFilterToolbar.tsx
│   │       └── AuditLedgerTable.tsx
│   ├── settings/
│   │   ├── SettingsView.tsx
│   │   └── tabs/
│   │       ├── HotelInfoTab.tsx
│   │       ├── ThemeCustomizerTab.tsx
│   │       ├── SecurityTab.tsx
│   │       ├── DatabaseSyncTab.tsx
│   │       └── ConnectedDevicesTab.tsx
│   └── user-profile/
│       ├── UserProfileView.tsx
│       └── components/
│           ├── ProfileOverviewCard.tsx
│           ├── ProfileEditModal.tsx
│           └── UserActivityHistoryTable.tsx
```

---

### Phase 4: API Client & Types Modularization

#### API Service Split (`src/services/api/`):
```text
src/services/api/
├── client.ts              # Base HTTP client with request headers, auth token, and error parsing
├── auth.api.ts            # login, logout, me, changePassword, validateSession
├── items.api.ts           # getItems, createItem, updateItem, approve, reject, handover, dispatch
├── staff.api.ts           # getStaff, createStaff, updateStaff, deleteStaff, checkDuplicate
├── certificates.api.ts    # getCertificates, createCertificate, updateCertificate, extractSignature
├── notifications.api.ts   # getNotifications, broadcast, markRead, markUnread, delete
├── audit.api.ts           # getAuditLogs, getAuditStats, addAuditLog
├── settings.api.ts        # getSettings, updateSettings, clearCache, triggerSync
├── security.api.ts        # getSessions, deleteSession, getBlockedDevices, blockDevice, unblock
├── backup.api.ts          # getFullBackup, restoreBackup, recordDriveBackup
├── database.api.ts        # getMongoStatus, connectMongo, disconnectMongo, testMongo, seedMongo
└── index.ts               # Unified API export object maintaining 100% compatibility with src/lib/api.ts
```

#### TypeScript Types Split (`src/types/`):
```text
src/types/
├── auth.types.ts          # User, UserRole, PermissionKey, LoginCredentials, DeviceSession
├── items.types.ts         # LostItem, ItemStatus, ItemCategory, FilterState, HandoverDetails
├── staff.types.ts         # StaffMember, DepartmentOption, PermissionCategory
├── certificates.types.ts  # Certificate, CustomCertificateTemplate, CertificatePreset
├── settings.types.ts      # HotelSettings, ThemePreset, ToastConfig, ValidationMessagesConfig
├── audit.types.ts         # AuditLog, AuditLogAction, SecurityActivityLog
├── notifications.types.ts # AppNotification, NotificationType, BroadcastPayload
└── index.ts               # Barrel export of all types matching src/types.ts 1:1
```

---

## 5. Preservation Rules & Risk Management

| Risk Area | Mitigation Strategy |
|---|---|
| **API Route Breakage** | Every route endpoint URL (e.g. `/api/items/:id/handover`, `/api/auth/login`) is strictly preserved byte-for-byte. |
| **Database Corruption** | `db.json` and MongoDB collection schemas remain completely untouched. No schema changes or automated reset scripts. |
| **Import Invalidation** | `src/lib/api.ts` and `src/types.ts` will re-export from the new modular structure, ensuring existing imports continue to compile. |
| **UI/UX Alteration** | Purely structural refactoring: component templates, Tailwind CSS utility classes, animations, and color tokens remain identical. |
| **Vite Dev Server Integration** | `server.ts` will remain the dev entry point invoked by `tsx server.ts`, delegating to `server/app.ts`. |

---

## 6. Implementation Status & Final Verification Results

- [x] **Phase 1: Project Analysis & Skeleton**: Complete. Single-hotel architecture strictly preserved; zero multi-tenant or multi-hotel code introduced.
- [x] **Phase 2: Backend Modularization (`server/`)**: Complete. `server.ts` reduced to a 6-line entrypoint bootstrapping `server/app.ts`. All 11 domain modules isolated with dedicated routes, controllers, and services in `server/modules/`.
- [x] **Phase 3: Frontend Feature Modularization (`src/features/`)**: Complete.
  - `src/features/audit-logs/` (Header, Toolbar, StatsGrid, Table, DetailModal)
  - `src/features/staff/` (Header, FilterBar, Table, DeleteModal)
  - `src/features/staff/profile/` (Header, EditForm, InfoGrid, Metrics, ItemsHistory)
  - `src/features/staff/performance/` (Toolbar, KPIs, Charts, Leaderboard, DrilldownModal)
  - `src/features/backup/` (DriveAuthCard, ScheduleCard, ActionToolbar, InstantCard, FilesTable, Modals)
  - `src/features/settings/` (Header, NavTabs, Modals, HotelInformationTab, SecurityTab, ConnectedDevicesTab)
  - `src/features/lost-found/` (ItemsView, PendingDispatchView, RemovedItemsView, Table, Toolbar, Metrics, Modals, Pagination)
- [x] **Phase 4: API & Types Modularization**: Complete. `src/services/api/*` and `src/types/*` with 100% backward-compatible barrel re-exports in `src/lib/api.ts`, `src/types.ts`, and `src/components/*`.
- [x] **Phase 5: Data & Schema Integrity**: Complete. `data/db.json` and MongoDB collection structures preserved without alteration or destructive operations.
- [x] **Phase 6: Type Safety & Compilation**: Complete. `npm run lint` (`tsc --noEmit`) passes with 0 errors. `npm run build` compiles successfully.

