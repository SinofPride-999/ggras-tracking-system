# GGRAS Development Plan: Frontend Developer 1 (FE-1)

## Role Overview

| Attribute | Details |
|-----------|---------|
| **Role** | Frontend Developer |
| **ID** | FE-1 |
| **Duration** | 12 Weeks (3 Months) |
| **Primary Focus** | Admin Portal, Rules Configuration, User Management, Compliance Workflow |
| **Secondary Focus** | Audit Logs, System Configuration, Alert Management |
| **Tech Stack** | Next.js 14, React 18, TypeScript, Shadcn/UI, TailwindCSS, React Query |

---

## Microservices Integration Alignment

**Access Pattern:** UI uses API Gateway/BFF; services are private behind the mesh.

**Primary Service Contracts:** rules-service, compliance-service, operator-service, audit-service.
**Key UI Dependencies:** OpenAPI contracts, RBAC scopes, and consistent error formats across services.


## Core Responsibilities

1. **Admin Portal Foundation** - Core layout, navigation, authentication
2. **Rules Configuration** - Tax rules, game mappings, exemptions UI (integrates with BE-1 Rules API)
3. **Rules Approval Workflow** - Multi-step approval process with version history
4. **User Management** - RBAC, user CRUD, role assignments
5. **Audit Log Viewer** - Searchable audit trail interface
6. **System Configuration** - Application settings management
7. **Compliance Cases** - Case management and notice creation (integrates with BE-1 Compliance API)
8. **Alert Management** - Alert configuration and notification settings

---

## Module Ownership

| Module | Role | Priority |
|--------|------|----------|
| Admin Portal Layout & Auth | Primary | Critical |
| Rules Configuration UI | Primary | Critical |
| Rules Approval Workflow | Primary | High |
| User Management | Primary | High |
| RBAC Implementation | Primary | High |
| Audit Log Viewer | Primary | Medium |
| System Configuration | Primary | Medium |
| Compliance Cases List/Detail | Primary | Medium |
| Notice Creation | Primary | Medium |
| Alert Management | Secondary (AI-2 Primary) | Low |

---

# Phase 1: Foundation (Weeks 1-4)

## Week 1: Project Setup & Core Layout

### Weekly Milestone
- [ ] Next.js 14 project scaffolded with App Router
- [ ] Authentication flow with NextAuth.js implemented
- [ ] Core admin layout with navigation
- [ ] Design system initialized with Shadcn/UI
- [ ] CI/CD integrated for frontend

### Daily Breakdown

#### Day 1 (Monday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Initialize Next.js 14 with App Router | Critical | 2h | `apps/admin/` scaffold |
| Configure TypeScript strict mode | Critical | 30m | `tsconfig.json` |
| Set up TailwindCSS | Critical | 1h | Tailwind config |
| Initialize Shadcn/UI | Critical | 1.5h | Component library |
| Configure ESLint and Prettier | High | 1h | Linting config |
| Create project README | Medium | 30m | Documentation |

**Project Structure:**
```
apps/admin/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── (auth)/
│   │   ├── login/
│   │   └── logout/
│   └── (dashboard)/
│       ├── layout.tsx
│       ├── rules/
│       ├── users/
│       ├── compliance/
│       └── settings/
├── components/
│   ├── ui/           # Shadcn components
│   ├── layout/       # Layout components
│   └── features/     # Feature-specific
├── lib/
│   ├── api/          # API client
│   ├── auth/         # Auth utilities
│   └── utils/        # Helpers
└── styles/
```

#### Day 2 (Tuesday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Set up NextAuth.js with credentials provider | Critical | 3h | Auth configuration |
| Create login page UI | Critical | 2h | Login page |
| Implement JWT token handling | Critical | 2h | Token management |
| Add session persistence | High | 1h | Session handling |

**Auth Configuration:**
```typescript
// lib/auth/options.ts
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'GGRAS Admin',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      authorize: async (credentials) => {
        // Validate with backend API
        const user = await api.auth.login(credentials);
        return user;
      }
    })
  ],
  callbacks: {
    jwt: async ({ token, user }) => { /* ... */ },
    session: async ({ session, token }) => { /* ... */ }
  },
  pages: {
    signIn: '/login',
    error: '/login'
  }
};
```

#### Day 3 (Wednesday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Create admin layout shell | Critical | 2h | Layout component |
| Build sidebar navigation | Critical | 2h | Sidebar component |
| Implement header with user menu | High | 2h | Header component |
| Add responsive behavior | High | 2h | Mobile responsive |

**Layout Components:**
```typescript
// components/layout/admin-layout.tsx
export function AdminLayout({ children }: Props) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
```

#### Day 4 (Thursday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Create navigation menu items | High | 1.5h | Nav items |
| Implement active state handling | High | 1h | Active states |
| Add breadcrumb component | Medium | 1.5h | Breadcrumbs |
| Create page header component | Medium | 1.5h | Page header |
| Build loading states | High | 1.5h | Loading skeletons |
| Add error boundary | High | 1h | Error handling |

#### Day 5 (Friday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Set up React Query for data fetching | Critical | 2h | Query config |
| Create API client wrapper | Critical | 2h | API client |
| Write component unit tests | High | 2h | Test coverage |
| Create PR and request review | High | 1h | PR submitted |
| Document component usage | Medium | 1h | Component docs |

---

## Week 2: Authentication & Protected Routes

### Weekly Milestone
- [ ] Complete authentication flow
- [ ] Protected route middleware working
- [ ] Role-based access control foundation
- [ ] User session management complete
- [ ] Password reset flow implemented

### Daily Breakdown

#### Day 1 (Monday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Implement protected route middleware | Critical | 3h | Route protection |
| Create auth context provider | Critical | 2h | Auth context |
| Add unauthorized redirect | High | 1h | Redirect logic |
| Implement session timeout | High | 2h | Session timeout |

**Protected Route:**
```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  const session = await getToken({ req: request });
  const isAuthPage = request.nextUrl.pathname.startsWith('/login');

  if (!session && !isAuthPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (session && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}
```

#### Day 2 (Tuesday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Define role hierarchy and permissions | Critical | 2h | Role definitions |
| Create permission checking hooks | Critical | 2h | usePermission hook |
| Implement role-based component rendering | High | 2h | RBAC components |
| Add permission-based menu filtering | High | 2h | Menu filtering |

**Roles & Permissions:**
```typescript
export enum Role {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  COMPLIANCE_OFFICER = 'compliance_officer',
  ANALYST = 'analyst',
  VIEWER = 'viewer'
}

export const permissions = {
  RULES_READ: 'rules:read',
  RULES_WRITE: 'rules:write',
  RULES_APPROVE: 'rules:approve',
  USERS_READ: 'users:read',
  USERS_WRITE: 'users:write',
  COMPLIANCE_READ: 'compliance:read',
  COMPLIANCE_WRITE: 'compliance:write',
  AUDIT_READ: 'audit:read',
  SETTINGS_WRITE: 'settings:write'
};
```

#### Day 3 (Wednesday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Create forgot password page | High | 2h | Forgot password |
| Implement password reset flow | High | 2h | Reset flow |
| Build email verification UI | Medium | 2h | Email verification |
| Add MFA setup placeholder | Medium | 2h | MFA foundation |

#### Day 4 (Thursday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Create user profile page | High | 2h | Profile page |
| Implement password change | High | 2h | Password change |
| Add profile update form | Medium | 2h | Profile form |
| Create activity log component | Medium | 2h | Activity log |

#### Day 5 (Friday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Write authentication tests | High | 2h | Auth tests |
| Write RBAC tests | High | 2h | RBAC tests |
| Security review with Lead | Critical | 2h | Security review |
| Documentation and PR | High | 2h | PR submitted |

---

## Week 3: Rules Configuration UI

### Weekly Milestone
- [ ] Rules list view with filtering
- [ ] Rule creation form with validation
- [ ] Rule editing interface
- [ ] Rule version history view
- [ ] Rule approval workflow UI

### Daily Breakdown

#### Day 1 (Monday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Create rules list page layout | Critical | 2h | Rules list page |
| Build data table component | Critical | 2h | DataTable |
| Implement sorting and pagination | High | 2h | Table features |
| Add filtering controls | High | 2h | Filter UI |

**Rules List View:**
```typescript
// app/(dashboard)/rules/page.tsx
export default function RulesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['rules'],
    queryFn: () => api.rules.list()
  });

  return (
    <PageLayout title="Tax Rules" action={<CreateRuleButton />}>
      <RulesFilters />
      <DataTable
        columns={rulesColumns}
        data={data?.rules || []}
        isLoading={isLoading}
      />
    </PageLayout>
  );
}
```

#### Day 2 (Tuesday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Create rule creation modal/page | Critical | 2h | Create rule UI |
| Build tax rate input with validation | Critical | 2h | Tax rate input |
| Implement date range picker | High | 2h | Date picker |
| Add game type selector | High | 2h | Game type select |

**Rule Form Fields:**
```typescript
interface RuleFormData {
  name: string;
  description: string;
  gameType: string | '*';
  taxRate: number;
  effectiveFrom: Date;
  effectiveTo?: Date;
  exemptions: Exemption[];
  status: 'draft' | 'pending_approval';
}
```

#### Day 3 (Wednesday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Implement exemptions configuration | High | 3h | Exemptions UI |
| Create exemption add/remove | High | 2h | Exemption CRUD |
| Build rule preview component | Medium | 2h | Rule preview |
| Add form validation | Critical | 1h | Validation rules |

**Exemption Types:**
```typescript
interface Exemption {
  type: 'operator' | 'game_type' | 'amount_threshold' | 'time_period';
  operatorId?: string;
  gameType?: string;
  threshold?: number;
  startDate?: Date;
  endDate?: Date;
  description: string;
}
```

#### Day 4 (Thursday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Create rule detail/edit page | Critical | 3h | Rule detail page |
| Implement inline editing | High | 2h | Inline edit |
| Add version history view | High | 2h | Version history |
| Create diff viewer for versions | Medium | 1h | Version diff |

#### Day 5 (Friday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Build approval workflow UI | Critical | 3h | Approval UI |
| Implement approval actions | High | 2h | Approve/Reject |
| Add approval comments | Medium | 1.5h | Comments |
| Write tests and create PR | High | 1.5h | PR submitted |

---

## Week 4: User Management & Phase 1 Completion

### Weekly Milestone
- [ ] User list with search and filters
- [ ] User creation/editing forms
- [ ] Role assignment interface
- [ ] User activity tracking
- [ ] Phase 1 demo ready

### Daily Breakdown

#### Day 1 (Monday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Create users list page | Critical | 2h | Users list |
| Build user search component | High | 2h | User search |
| Implement user status filters | High | 2h | Status filters |
| Add role-based filtering | Medium | 2h | Role filters |

#### Day 2 (Tuesday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Create user creation form | Critical | 2h | User form |
| Implement role selection | Critical | 2h | Role select |
| Add department/team assignment | Medium | 2h | Team assignment |
| Build user invite flow | High | 2h | Invite flow |

**User Form:**
```typescript
interface UserFormData {
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  department?: string;
  isActive: boolean;
  permissions: string[];
}
```

#### Day 3 (Wednesday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Create user detail page | High | 2h | User detail |
| Implement user editing | High | 2h | User edit |
| Add permission management | High | 3h | Permission UI |
| Build deactivation flow | Medium | 1h | Deactivate user |

#### Day 4 (Thursday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Integration testing with backend | Critical | 3h | Integration tests |
| Fix integration issues | High | 2h | Bug fixes |
| Polish UI and UX | High | 2h | UI polish |
| Prepare demo scenarios | High | 1h | Demo prep |

#### Day 5 (Friday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Phase 1 demo participation | Critical | 2h | Demo delivered |
| Phase 1 retrospective | High | 1h | Lessons learned |
| Document Phase 1 features | High | 2h | Documentation |
| Phase 2 planning participation | High | 2h | Phase 2 planned |
| Code cleanup and PR merge | High | 1h | Code merged |

---

# Phase 2: Integration & Features (Weeks 5-8)

## Week 5: Audit Log Viewer & System Configuration

### Weekly Milestone
- [ ] Audit log list with advanced filtering
- [ ] Log detail view with context
- [ ] System configuration interface
- [ ] Configuration change tracking

### Daily Breakdown

#### Day 1 (Monday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Create audit log list page | Critical | 3h | Audit log page |
| Build advanced filter panel | High | 2h | Filter panel |
| Implement date range filter | High | 1.5h | Date filter |
| Add action type filter | High | 1.5h | Action filter |

**Audit Log Filters:**
```typescript
interface AuditLogFilters {
  dateRange: { from: Date; to: Date };
  actionType?: 'create' | 'update' | 'delete' | 'login' | 'approve';
  userId?: string;
  resourceType?: 'rule' | 'user' | 'operator' | 'compliance_case';
  resourceId?: string;
  searchTerm?: string;
}
```

#### Day 2 (Tuesday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Implement log entry detail view | High | 2h | Detail view |
| Create before/after diff display | High | 3h | Diff display |
| Add user context information | Medium | 2h | User context |
| Build export functionality | Medium | 1h | Export |

#### Day 3 (Wednesday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Create system settings page | High | 2h | Settings page |
| Build settings sections (tabs) | High | 2h | Settings tabs |
| Implement general settings form | High | 2h | General settings |
| Add notification settings | Medium | 2h | Notifications |

**Settings Sections:**
```typescript
const settingsSections = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'integrations', label: 'Integrations', icon: Link },
  { id: 'maintenance', label: 'Maintenance', icon: Wrench }
];
```

#### Day 4 (Thursday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Implement security settings | High | 2h | Security settings |
| Create password policy config | High | 2h | Password policy |
| Add session timeout config | Medium | 2h | Session config |
| Build MFA settings | Medium | 2h | MFA config |

#### Day 5 (Friday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Write audit log tests | High | 2h | Audit tests |
| Write settings tests | High | 2h | Settings tests |
| Documentation | Medium | 2h | Docs |
| Create PR | High | 2h | PR submitted |

---

## Week 6: Compliance Case Management

### Weekly Milestone
- [ ] Compliance cases list with status filters
- [ ] Case detail view with full context
- [ ] Case creation workflow
- [ ] Case status management

### Daily Breakdown

#### Day 1 (Monday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Create compliance cases list page | Critical | 3h | Cases list |
| Build status filter tabs | High | 2h | Status tabs |
| Implement operator filter | High | 1.5h | Operator filter |
| Add priority sorting | Medium | 1.5h | Sorting |

**Case Status Tabs:**
```typescript
const caseStatusTabs = [
  { status: 'all', label: 'All Cases' },
  { status: 'open', label: 'Open' },
  { status: 'investigating', label: 'Investigating' },
  { status: 'pending_response', label: 'Pending Response' },
  { status: 'escalated', label: 'Escalated' },
  { status: 'resolved', label: 'Resolved' }
];
```

#### Day 2 (Tuesday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Create case detail page | Critical | 3h | Case detail |
| Build case timeline component | High | 2h | Timeline |
| Implement related events view | High | 2h | Related events |
| Add case notes section | Medium | 1h | Notes |

#### Day 3 (Wednesday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Create case creation modal | High | 2h | Create case |
| Implement case type selection | High | 2h | Case types |
| Add operator/event linking | High | 2h | Linking |
| Build priority assignment | Medium | 2h | Priority |

**Case Types:**
```typescript
enum CaseType {
  SIGNATURE_VERIFICATION_FAILED = 'signature_verification_failed',
  SEQUENCE_GAP_DETECTED = 'sequence_gap_detected',
  SUSPICIOUS_PATTERN = 'suspicious_pattern',
  UNDER_REPORTING_SUSPECTED = 'under_reporting_suspected',
  FEED_DROP = 'feed_drop',
  MANUAL_REVIEW = 'manual_review'
}
```

#### Day 4 (Thursday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Implement case status transitions | Critical | 3h | Status flow |
| Add case assignment | High | 2h | Assignment |
| Build case actions menu | High | 2h | Actions |
| Create escalation workflow | Medium | 1h | Escalation |

#### Day 5 (Friday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Write compliance tests | High | 2h | Tests |
| Cross-team integration testing | High | 2h | Integration |
| Documentation | Medium | 2h | Docs |
| Create PR | High | 2h | PR submitted |

---

## Week 7: Notice Generation & Penalty Assessment

### Weekly Milestone
- [ ] Notice creation wizard
- [ ] Notice template management
- [ ] Penalty assessment interface
- [ ] Notice delivery tracking

### Daily Breakdown

#### Day 1 (Monday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Create notice creation wizard | Critical | 3h | Notice wizard |
| Build notice type selection | High | 2h | Type selection |
| Implement recipient configuration | High | 2h | Recipients |
| Add template selection | Medium | 1h | Template select |

**Notice Wizard Steps:**
```typescript
const noticeWizardSteps = [
  { id: 'type', title: 'Notice Type' },
  { id: 'recipient', title: 'Recipient' },
  { id: 'content', title: 'Content' },
  { id: 'attachments', title: 'Attachments' },
  { id: 'review', title: 'Review & Send' }
];
```

#### Day 2 (Tuesday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Build notice content editor | High | 3h | Content editor |
| Implement template variables | High | 2h | Variables |
| Add attachment upload | Medium | 2h | Attachments |
| Create preview component | Medium | 1h | Preview |

#### Day 3 (Wednesday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Create penalty assessment form | High | 3h | Penalty form |
| Implement penalty calculation | High | 2h | Calculation |
| Add penalty justification | Medium | 2h | Justification |
| Build penalty approval flow | Medium | 1h | Approval |

**Penalty Form:**
```typescript
interface PenaltyAssessment {
  caseId: string;
  operatorId: string;
  violationType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  baseAmount: number;
  adjustments: PenaltyAdjustment[];
  finalAmount: number;
  justification: string;
  dueDate: Date;
}
```

#### Day 4 (Thursday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Create notice list view | High | 2h | Notice list |
| Implement delivery status tracking | High | 2h | Delivery status |
| Add notice history | Medium | 2h | History |
| Build resend functionality | Medium | 2h | Resend |

#### Day 5 (Friday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Write notice tests | High | 2h | Tests |
| Write penalty tests | High | 2h | Tests |
| Documentation | Medium | 2h | Docs |
| Create PR | High | 2h | PR submitted |

---

## Week 8: Integration Testing & Bug Fixes

### Weekly Milestone
- [ ] Full integration testing completed
- [ ] All critical bugs fixed
- [ ] Performance optimized
- [ ] Phase 2 demo delivered

### Daily Breakdown

#### Day 1 (Monday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| End-to-end integration testing | Critical | 4h | E2E tests |
| Document discovered bugs | High | 2h | Bug list |
| Prioritize bug fixes | High | 1h | Priority list |
| Start critical fixes | Critical | 1h | Fixes started |

#### Day 2 (Tuesday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Fix critical UI bugs | Critical | 4h | Bugs fixed |
| Fix high priority bugs | High | 3h | Bugs fixed |
| Update component tests | High | 1h | Tests updated |

#### Day 3 (Wednesday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Performance optimization | High | 3h | Performance |
| Bundle size optimization | High | 2h | Bundle size |
| Lazy loading implementation | High | 2h | Lazy loading |
| Image optimization | Medium | 1h | Images |

#### Day 4 (Thursday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Fix remaining bugs | High | 3h | Bugs fixed |
| Final integration verification | Critical | 2h | Verified |
| Accessibility audit | High | 2h | A11y fixes |
| Prepare demo | High | 1h | Demo ready |

#### Day 5 (Friday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Phase 2 Demo participation | Critical | 2h | Demo delivered |
| Phase 2 retrospective | High | 1h | Lessons learned |
| Phase 3 planning participation | High | 2h | Phase 3 planned |
| PR cleanup and merge | High | 2h | Code merged |

---

# Phase 3: Production Readiness (Weeks 9-12)

## Week 9: Security & Performance Hardening

### Weekly Milestone
- [ ] Security audit completed
- [ ] CSP configured
- [ ] Performance optimized
- [ ] Production build verified

### Daily Breakdown

#### Day 1 (Monday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Frontend security audit | Critical | 3h | Audit report |
| XSS prevention verification | Critical | 2h | XSS verified |
| CSRF protection verification | Critical | 2h | CSRF verified |
| Secure headers configuration | High | 1h | Headers |

#### Day 2 (Tuesday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Configure Content Security Policy | Critical | 3h | CSP config |
| Implement subresource integrity | High | 2h | SRI |
| Add HTTPS enforcement | Critical | 1h | HTTPS |
| Configure secure cookies | High | 2h | Cookies |

#### Day 3 (Wednesday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Performance profiling | High | 3h | Profile results |
| React rendering optimization | High | 2h | React optimization |
| Implement code splitting | High | 2h | Code splitting |
| Cache optimization | Medium | 1h | Caching |

#### Day 4 (Thursday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Production build configuration | Critical | 2h | Build config |
| Environment variable management | Critical | 2h | Env vars |
| Error boundary finalization | High | 2h | Error handling |
| Monitoring integration (Sentry) | High | 2h | Monitoring |

#### Day 5 (Friday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Security checklist completion | Critical | 2h | Checklist |
| Production readiness review | Critical | 2h | PRR |
| Documentation updates | High | 2h | Docs |
| Weekly review | High | 2h | Review |

---

## Week 10: Pilot Support & User Feedback

### Weekly Milestone
- [ ] Production deployment support
- [ ] User training materials created
- [ ] Pilot user feedback collected
- [ ] Quick fixes deployed

### Daily Breakdown

#### Day 1 (Monday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Production deployment support | Critical | 3h | Deployment |
| Post-deployment verification | Critical | 2h | Verification |
| User guide creation | High | 3h | User guide |

#### Day 2 (Tuesday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Pilot user onboarding support | High | 4h | Onboarding |
| Create video tutorials (screen recordings) | Medium | 2h | Tutorials |
| FAQ documentation | Medium | 2h | FAQ |

#### Day 3 (Wednesday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Collect pilot user feedback | High | 3h | Feedback |
| Analyze feedback and prioritize | High | 2h | Analysis |
| Implement quick UX fixes | High | 3h | UX fixes |

#### Day 4 (Thursday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Deploy UX improvements | High | 2h | Improvements |
| Additional user support | High | 3h | Support |
| Documentation updates | Medium | 2h | Docs |

#### Day 5 (Friday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Week 1 pilot review | High | 2h | Review |
| Plan iteration priorities | High | 2h | Priorities |
| Weekly demo | High | 2h | Demo |
| Update stakeholders | High | 2h | Status update |

---

## Week 11: Pilot Iteration & Polish

### Weekly Milestone
- [ ] All pilot feedback addressed
- [ ] UI polish completed
- [ ] Additional features added
- [ ] System ready for expansion

### Daily Breakdown

#### Day 1 (Monday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Address pilot feedback (priority items) | Critical | 4h | Feedback addressed |
| UI polish and refinement | High | 2h | UI polish |
| Deploy improvements | High | 2h | Improvements live |

#### Day 2 (Tuesday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Implement requested enhancements | High | 4h | Enhancements |
| User experience improvements | High | 2h | UX improvements |
| Accessibility improvements | Medium | 2h | A11y |

#### Day 3 (Wednesday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Cross-browser testing | High | 3h | Browser testing |
| Mobile responsiveness fixes | High | 2h | Mobile fixes |
| Performance fine-tuning | Medium | 2h | Performance |

#### Day 4 (Thursday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Final feature polish | High | 3h | Polish |
| User acceptance testing support | High | 2h | UAT support |
| Documentation finalization | High | 2h | Final docs |

#### Day 5 (Friday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Pilot status review | High | 2h | Status |
| Prepare final release | High | 2h | Release prep |
| Weekly demo | High | 2h | Demo |
| Knowledge transfer prep | High | 2h | KT prep |

---

## Week 12: Final Release & Handover

### Weekly Milestone
- [ ] Final release deployed
- [ ] All documentation complete
- [ ] Knowledge transfer completed
- [ ] Project handover done

### Daily Breakdown

#### Day 1 (Monday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Final release preparation | Critical | 3h | Release ready |
| Final testing | Critical | 2h | Tests pass |
| Release notes preparation | High | 2h | Release notes |
| Pre-release verification | High | 1h | Verified |

#### Day 2 (Tuesday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Final release deployment | Critical | 3h | Deployed |
| Post-release verification | Critical | 2h | Verified |
| Knowledge transfer: Admin UI architecture | High | 3h | KT session 1 |

#### Day 3 (Wednesday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Knowledge transfer: Component library | High | 3h | KT session 2 |
| Knowledge transfer: State management | High | 2h | KT session 3 |
| Documentation completion | High | 2h | Docs complete |

#### Day 4 (Thursday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Final documentation review | High | 2h | Docs reviewed |
| Style guide finalization | Medium | 2h | Style guide |
| Support handover | High | 2h | Handover |
| Project retrospective participation | High | 2h | Retrospective |

#### Day 5 (Friday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Final stakeholder presentation support | High | 2h | Presentation |
| Project sign-off | Critical | 1h | Sign-off |
| Archive and cleanup | Medium | 2h | Cleanup |
| Team celebration! | High | 3h | Celebrate! |

---

## Component Library

### Core Components to Build

| Component | Description | Week |
|-----------|-------------|------|
| DataTable | Sortable, filterable data table | Week 1 |
| PageLayout | Standard page layout wrapper | Week 1 |
| FilterPanel | Reusable filter component | Week 1 |
| StatusBadge | Colored status indicators | Week 1 |
| FormField | Consistent form field wrapper | Week 2 |
| PermissionGate | RBAC component wrapper | Week 2 |
| ConfirmDialog | Confirmation modal | Week 2 |
| Tabs | Tab navigation component | Week 3 |
| VersionHistory | Version diff viewer | Week 3 |
| Timeline | Activity timeline | Week 6 |
| Wizard | Multi-step form wizard | Week 7 |
| RichTextEditor | Notice content editor | Week 7 |

---

## Page Routes

| Route | Description | Auth Required | Permissions |
|-------|-------------|---------------|-------------|
| `/login` | Login page | No | - |
| `/dashboard` | Dashboard home | Yes | Any |
| `/rules` | Rules list | Yes | rules:read |
| `/rules/new` | Create rule | Yes | rules:write |
| `/rules/[id]` | Rule detail | Yes | rules:read |
| `/users` | Users list | Yes | users:read |
| `/users/new` | Create user | Yes | users:write |
| `/users/[id]` | User detail | Yes | users:read |
| `/compliance` | Compliance cases | Yes | compliance:read |
| `/compliance/[id]` | Case detail | Yes | compliance:read |
| `/audit` | Audit logs | Yes | audit:read |
| `/settings` | System settings | Yes | settings:write |
| `/profile` | User profile | Yes | Any |

---

## Definition of Done

### For Each Task:
- [ ] Component renders correctly
- [ ] Responsive on all breakpoints (mobile, tablet, desktop)
- [ ] Accessibility audit passes (keyboard nav, screen reader)
- [ ] Unit tests written
- [ ] Integration with API verified
- [ ] Loading/error states implemented
- [ ] Code reviewed and approved
- [ ] PR merged

---

## Notes

- Coordinate with FE-2 on shared components
- Coordinate with BE-1 on API contracts
- Follow established design system
- Ensure consistent error handling
- Implement proper loading states
- Use React Query for all data fetching
- Implement optimistic updates where appropriate

## Service Catalog Appendix (FE-1)

| Service | UI Areas | Key Endpoints |
|---------|----------|---------------|
| rules-service | Rules config + approvals | /rules, /rules/:id/approve |
| compliance-service | Cases + notices | /compliance/cases, /compliance/notices |
| operator-service | Operator admin | /operators, /operators/:id |
| audit-service | Audit viewer | /audit/logs |

