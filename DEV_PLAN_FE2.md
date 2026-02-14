# GGRAS Development Plan: Frontend Developer 2 (FE-2)

## Role Overview

| Attribute | Details |
|-----------|---------|
| **Role** | Frontend Developer |
| **ID** | FE-2 |
| **Duration** | 12 Weeks (3 Months) |
| **Primary Focus** | Operations Dashboard, Reporting Module, Operator Self-Service Portal |
| **Secondary Focus** | Data Visualization, Export Functionality, Operator Integration Status |
| **Tech Stack** | Next.js 14, React 18, TypeScript, Recharts/ECharts, Shadcn/UI, TailwindCSS |

---

## Microservices Integration Alignment

**Access Pattern:** UI uses API Gateway/BFF; services are private behind the mesh.

**Primary Service Contracts:** reporting-service, operator-service, audit-service, compliance-service.
**Key UI Dependencies:** OpenAPI contracts, pagination/filters standard, export job lifecycle endpoints.


## Core Responsibilities

1. **Operations Dashboard** - Ingestion health, event volume, system KPIs
2. **Operator Overview** - Operator status, throughput, error rates
3. **Reporting Analytics** - Time-series charts, breakdowns by operator/game type
4. **Reporting Module** - Report generation, export functionality
5. **Operator Portal** - Operator self-service interface
6. **API Key Management** - Operator credentials management
7. **Integration Tools** - Event testing, status checking
8. **Alert Display** - Alert notifications and history

---

## Module Ownership

| Module | Role | Priority |
|--------|------|----------|
| Operations Dashboard | Primary | Critical |
| Ingestion Summary Widget | Primary | Critical |
| Operator Overview | Primary | Critical |
| Event Volume Trends Charts | Primary | High |
| Compliance Status Summary | Primary | High |
| Reporting Module | Primary | High |
| Export Functionality | Primary | High |
| Operator Portal | Primary | High |
| API Key Management | Primary | Medium |
| Event Testing Tool | Primary | Medium |
| Integration Status Checker | Primary | Medium |
| Alert Display | Secondary (AI-2 Primary) | Medium |

---

# Phase 1: Foundation (Weeks 1-4)

## Week 1: Project Setup & Charting Foundation

### Weekly Milestone
- [ ] Next.js Operator Portal scaffolded
- [ ] Charting library integrated and configured
- [ ] Shared component library foundation
- [ ] Dashboard layout framework ready
- [ ] CI/CD integrated

### Daily Breakdown

#### Day 1 (Monday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Initialize Next.js 14 for Operator Portal | Critical | 2h | `apps/operator-portal/` |
| Sync shared configs from FE-1 | Critical | 1h | Shared configs |
| Set up shared component library structure | Critical | 2h | `packages/ui/` |
| Configure path aliases | High | 1h | Path config |
| Set up Storybook for component development | High | 2h | Storybook config |

**Shared Package Structure:**
```
packages/ui/
├── src/
│   ├── components/
│   │   ├── charts/
│   │   │   ├── LineChart.tsx
│   │   │   ├── BarChart.tsx
│   │   │   ├── PieChart.tsx
│   │   │   └── AreaChart.tsx
│   │   ├── widgets/
│   │   │   ├── StatCard.tsx
│   │   │   ├── TrendIndicator.tsx
│   │   │   └── DataCard.tsx
│   │   └── data-display/
│   │       ├── CurrencyDisplay.tsx
│   │       └── PercentageDisplay.tsx
│   └── index.ts
├── stories/
└── package.json
```

#### Day 2 (Tuesday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Research and select charting library (Recharts vs ECharts) | Critical | 1h | Decision |
| Install and configure Recharts | Critical | 2h | Chart config |
| Create base chart wrapper component | Critical | 2h | BaseChart |
| Set up chart theming (colors, typography) | High | 2h | Theme config |
| Create chart documentation | Medium | 1h | Chart docs |

**Chart Theme Configuration:**
```typescript
// packages/ui/src/config/chartTheme.ts
export const chartTheme = {
  colors: {
    primary: ['#3B82F6', '#60A5FA', '#93C5FD'],
    success: '#22C55E',
    warning: '#F59E0B',
    danger: '#EF4444',
    neutral: ['#6B7280', '#9CA3AF', '#D1D5DB']
  },
  fonts: {
    base: 'Inter, system-ui, sans-serif',
  },
  axis: {
    stroke: '#E5E7EB',
    tickStroke: '#9CA3AF',
  }
};
```

#### Day 3 (Wednesday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Create LineChart component | Critical | 2h | LineChart |
| Create BarChart component | Critical | 2h | BarChart |
| Create AreaChart component | High | 2h | AreaChart |
| Create PieChart component | High | 2h | PieChart |

**LineChart Component:**
```typescript
// packages/ui/src/components/charts/LineChart.tsx
interface LineChartProps {
  data: DataPoint[];
  xKey: string;
  yKey: string;
  xLabel?: string;
  yLabel?: string;
  height?: number;
  showGrid?: boolean;
  showTooltip?: boolean;
  showLegend?: boolean;
  formatXAxis?: (value: any) => string;
  formatYAxis?: (value: any) => string;
}

export function LineChart({ data, xKey, yKey, ...props }: LineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={props.height || 300}>
      <RechartsLineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={xKey} tickFormatter={props.formatXAxis} />
        <YAxis tickFormatter={props.formatYAxis} />
        {props.showTooltip && <Tooltip />}
        {props.showLegend && <Legend />}
        <Line type="monotone" dataKey={yKey} stroke="#3B82F6" />
      </RechartsLineChart>
    </ResponsiveContainer>
  );
}
```

#### Day 4 (Thursday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Create StatCard widget component | Critical | 2h | StatCard |
| Create TrendIndicator component | High | 1.5h | TrendIndicator |
| Build DataCard with chart support | High | 2h | DataCard |
| Create CurrencyDisplay component | High | 1.5h | CurrencyDisplay |
| Add Storybook stories | Medium | 1h | Stories |

**StatCard Component:**
```typescript
// packages/ui/src/components/widgets/StatCard.tsx
interface StatCardProps {
  title: string;
  value: number | string;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
    period: string;
  };
  icon?: React.ComponentType;
  formatter?: (value: number) => string;
  loading?: boolean;
}

export function StatCard({ title, value, trend, icon: Icon, formatter, loading }: StatCardProps) {
  return (
    <Card className="p-6">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          {loading ? (
            <Skeleton className="h-8 w-32 mt-1" />
          ) : (
            <p className="text-2xl font-semibold mt-1">
              {formatter ? formatter(value as number) : value}
            </p>
          )}
          {trend && <TrendIndicator {...trend} />}
        </div>
        {Icon && <Icon className="h-5 w-5 text-muted-foreground" />}
      </div>
    </Card>
  );
}
```

#### Day 5 (Friday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Create dashboard layout template | Critical | 2h | Dashboard layout |
| Build grid system for widgets | High | 2h | Grid system |
| Add widget drag-and-drop placeholder | Medium | 2h | DnD foundation |
| Write component unit tests | High | 1.5h | Tests |
| Create PR and documentation | High | 1h | PR submitted |

---

## Week 2: Dashboard Core Infrastructure

### Weekly Milestone
- [ ] Dashboard page structure complete
- [ ] Real-time data fetching implemented
- [ ] Date range filtering working
- [ ] Initial ingestion summary widget functional
- [ ] Data refresh mechanisms in place

### Daily Breakdown

#### Day 1 (Monday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Create dashboard page structure | Critical | 2h | Dashboard page |
| Implement dashboard context/state | Critical | 2h | Dashboard state |
| Build date range picker component | Critical | 2h | DateRangePicker |
| Create period selector (daily/weekly/monthly) | High | 2h | PeriodSelector |

**Dashboard State:**
```typescript
// app/(dashboard)/hooks/useDashboardState.ts
interface DashboardState {
  dateRange: { from: Date; to: Date };
  period: 'daily' | 'weekly' | 'monthly';
  selectedOperator: string | null;
  selectedGameType: string | null;
  refreshInterval: number;
}

export function useDashboardState() {
  const [state, setState] = useState<DashboardState>({
    dateRange: { from: subDays(new Date(), 30), to: new Date() },
    period: 'daily',
    selectedOperator: null,
    selectedGameType: null,
    refreshInterval: 60000 // 1 minute
  });

  // Auto-refresh logic
  useEffect(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries(['dashboard']);
    }, state.refreshInterval);
    return () => clearInterval(interval);
  }, [state.refreshInterval]);

  return { state, setState };
}
```

#### Day 2 (Tuesday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Create reports API hooks | Critical | 3h | API hooks |
| Implement summary report data fetching | Critical | 2h | Summary fetching |
| Build data transformation utilities | High | 2h | Data transforms |
| Add caching with React Query | High | 1h | Caching |

**Reports API Hooks:**
```typescript
// lib/api/hooks/useReports.ts
export function useReportSummary(params: SummaryParams) {
  return useQuery({
    queryKey: ['report-summary', params],
    queryFn: () => api.reports.getSummary(params),
    staleTime: 30000,
    refetchOnWindowFocus: true
  });
}

export function useEventTrends(params: TrendParams) {
  return useQuery({
    queryKey: ['event-trends', params],
    queryFn: () => api.reports.getTrends(params),
    staleTime: 60000
  });
}

export function useOperatorSummary(operatorId: string, params: OperatorParams) {
  return useQuery({
    queryKey: ['operator-summary', operatorId, params],
    queryFn: () => api.reports.getOperators({ operatorId, ...params }),
    enabled: !!operatorId
  });
}
```

#### Day 3 (Wednesday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Build Ingestion Summary Widget | Critical | 3h | Summary widget |
| Create total events display | High | 1.5h | Events display |
| Create accepted vs rejected display | High | 1.5h | Acceptance display |
| Create error rate display | High | 2h | Error rate display |

**Ingestion Summary Widget:**
```typescript
// app/(dashboard)/components/IngestionSummaryWidget.tsx
export function IngestionSummaryWidget({ dateRange, period }: Props) {
  const { data, isLoading } = useReportSummary({ dateRange, period });

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Ingestion Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-4">
          <StatCard
            title="Total Events"
            value={data?.totalEvents || 0}
            formatter={formatNumber}
            loading={isLoading}
          />
          <StatCard
            title="Accepted"
            value={data?.acceptedEvents || 0}
            formatter={formatNumber}
            loading={isLoading}
          />
          <StatCard
            title="Rejected"
            value={data?.rejectedEvents || 0}
            formatter={formatNumber}
            loading={isLoading}
          />
          <StatCard
            title="Error Rate"
            value={data?.errorRate || 0}
            formatter={formatPercent}
            trend={data?.errorRateTrend}
            loading={isLoading}
          />
        </div>
      </CardContent>
    </Card>
  );
}
```

#### Day 4 (Thursday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Implement operator filter dropdown | High | 2h | Operator filter |
| Add game type filter | High | 2h | Game type filter |
| Create filter persistence (URL params) | Medium | 2h | Filter persistence |
| Build loading skeleton states | High | 2h | Skeletons |

#### Day 5 (Friday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Write integration tests | High | 2h | Integration tests |
| Cross-team API contract testing | High | 2h | Contract tests |
| Documentation | Medium | 2h | Docs |
| Create PR | High | 2h | PR submitted |

---

## Week 3: Reporting Charts & Operator Overview

### Weekly Milestone
- [ ] Event volume trend charts implemented
- [ ] Operator status table complete
- [ ] Operator/game-type breakdown charts ready
- [ ] Comparison views working
- [ ] Export functionality foundation

### Daily Breakdown

#### Day 1 (Monday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Build Event Volume Trends Widget | Critical | 3h | Trends widget |
| Implement time-series chart | Critical | 2h | Time series |
| Add period aggregation toggle | High | 2h | Aggregation |
| Create hover tooltips | Medium | 1h | Tooltips |

**Event Volume Trends Widget:**
```typescript
// app/(dashboard)/components/EventVolumeTrendsWidget.tsx
export function EventVolumeTrendsWidget({ dateRange, period }: Props) {
  const { data, isLoading } = useEventTrends({ dateRange, period });

  return (
    <Card className="col-span-2">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Event Volume Trends</CardTitle>
        <div className="flex gap-2">
          <ToggleGroup type="single" value={chartType} onValueChange={setChartType}>
            <ToggleGroupItem value="accepted">Accepted</ToggleGroupItem>
            <ToggleGroupItem value="rejected">Rejected</ToggleGroupItem>
            <ToggleGroupItem value="latency">Latency</ToggleGroupItem>
          </ToggleGroup>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <ChartSkeleton height={300} />
        ) : (
          <AreaChart
            data={data?.trends || []}
            xKey="date"
            yKey={chartType}
            formatXAxis={formatDate}
            formatYAxis={chartType === 'latency' ? formatMs : formatNumber}
            showTooltip
          />
        )}
      </CardContent>
    </Card>
  );
}
```

#### Day 2 (Tuesday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Create Operator Overview Widget | Critical | 3h | Operator widget |
| Build operator status table | High | 2h | Status table |
| Add sorting by different metrics | High | 2h | Sorting |
| Implement mini sparkline charts | Medium | 1h | Sparklines |

**Operator Ranking Table:**
```typescript
interface OperatorStatusRow {
  rank: number;
  operatorId: string;
  operatorName: string;
  eventCount: number;
  errorRate: number;
  avgLatencyMs: number;
  lastEventTime: Date;
  status: 'active' | 'warning' | 'inactive';
  integrationHealth: 'ok' | 'degraded' | 'down';
}

const columns: ColumnDef<OperatorStatusRow>[] = [
  { accessorKey: 'rank', header: '#', cell: ({ row }) => row.original.rank },
  { accessorKey: 'operatorName', header: 'Operator' },
  { accessorKey: 'eventCount', header: 'Events', cell: formatNumber },
  { accessorKey: 'errorRate', header: 'Error %', cell: formatPercent },
  { accessorKey: 'avgLatencyMs', header: 'Latency', cell: formatMs },
  { accessorKey: 'status', header: 'Status', cell: StatusBadge }
];
```

#### Day 3 (Wednesday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Build Operator Breakdown Widget | High | 3h | Breakdown widget |
| Create pie chart for distribution | High | 2h | Pie chart |
| Add horizontal bar chart option | Medium | 2h | Bar chart |
| Implement drill-down capability | Medium | 1h | Drill-down |

#### Day 4 (Thursday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Create Compliance Status Summary Widget | Critical | 3h | Compliance widget |
| Build open cases summary | High | 2h | Cases summary |
| Add notice status tracking | High | 2h | Notice status |
| Create SLA breach placeholder | Medium | 1h | SLA UI |

**Compliance Status Widget:**
```typescript
// app/(dashboard)/components/ComplianceStatusWidget.tsx
export function ComplianceStatusWidget({ dateRange }: Props) {
  const { data, isLoading } = useReportSummary({ dateRange });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Compliance Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-sm text-muted-foreground">Open Cases</p>
              <p className="text-3xl font-bold">{formatNumber(data?.openCases)}</p>
            </div>
            <Badge variant={data?.slaStatus === 'breach' ? 'destructive' : 'default'}>
              {data?.slaStatus}
            </Badge>
          </div>
          <Progress value={data?.caseClosureRate} className="h-2" />
          <p className="text-sm text-muted-foreground">
            {data?.caseClosureRate}% cases closed on time
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
```

#### Day 5 (Friday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Write widget tests | High | 2h | Widget tests |
| Create Storybook stories | Medium | 2h | Stories |
| Documentation | Medium | 2h | Docs |
| Create PR | High | 2h | PR submitted |

---

## Week 4: Export Functionality & Phase 1 Completion

### Weekly Milestone
- [ ] CSV/Excel export working
- [ ] PDF report generation
- [ ] Dashboard polish complete
- [ ] Phase 1 demo ready
- [ ] Responsive design verified

### Daily Breakdown

#### Day 1 (Monday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Implement CSV export utility | Critical | 2h | CSV export |
| Create Excel export (xlsx) | High | 2h | Excel export |
| Build export button component | High | 2h | Export button |
| Add export progress indicator | Medium | 2h | Progress UI |

**Export Utilities:**
```typescript
// lib/export/csv.ts
export function exportToCSV<T>(data: T[], columns: ExportColumn<T>[], filename: string) {
  const headers = columns.map(col => col.header).join(',');
  const rows = data.map(row =>
    columns.map(col => {
      const value = col.accessor(row);
      return col.formatter ? col.formatter(value) : value;
    }).join(',')
  ).join('\n');

  const csv = `${headers}\n${rows}`;
  downloadFile(csv, `${filename}.csv`, 'text/csv');
}

// lib/export/excel.ts
export async function exportToExcel<T>(data: T[], columns: ExportColumn<T>[], filename: string) {
  const XLSX = await import('xlsx');
  const worksheet = XLSX.utils.json_to_sheet(
    data.map(row =>
      Object.fromEntries(columns.map(col => [col.header, col.accessor(row)]))
    )
  );
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}
```

#### Day 2 (Tuesday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Implement PDF report generation | High | 3h | PDF export |
| Create report template | High | 2h | Template |
| Add chart image export | Medium | 2h | Chart images |
| Build report configuration modal | Medium | 1h | Config modal |

**PDF Report Generation:**
```typescript
// lib/export/pdf.ts
export async function generatePDFReport(config: ReportConfig): Promise<Blob> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF();

  // Header
  doc.setFontSize(20);
  doc.text('GGRAS Operations Report', 20, 20);

  // Date range
  doc.setFontSize(12);
  doc.text(`Period: ${config.dateRange.from} - ${config.dateRange.to}`, 20, 30);

  // Summary section
  doc.setFontSize(14);
  doc.text('Summary', 20, 45);
  // ... add summary data

  // Charts (as images)
  if (config.includeCharts) {
    const chartImage = await captureChartAsImage('event-volume-chart');
    doc.addImage(chartImage, 'PNG', 20, 60, 170, 80);
  }

  // Tables
  // ... add table data

  return doc.output('blob');
}
```

#### Day 3 (Wednesday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Mobile responsive dashboard | High | 3h | Mobile UI |
| Tablet layout optimization | High | 2h | Tablet UI |
| Touch-friendly interactions | Medium | 2h | Touch UX |
| Widget collapse/expand on mobile | Medium | 1h | Collapsible |

#### Day 4 (Thursday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Integration testing | Critical | 3h | Integration tests |
| Fix integration bugs | High | 2h | Bug fixes |
| Performance optimization | High | 2h | Performance |
| Prepare demo | High | 1h | Demo prep |

#### Day 5 (Friday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Phase 1 demo participation | Critical | 2h | Demo delivered |
| Phase 1 retrospective | High | 1h | Lessons learned |
| Document Phase 1 features | High | 2h | Documentation |
| Phase 2 planning | High | 2h | Phase 2 planned |
| PR cleanup and merge | High | 1h | Code merged |

---

# Phase 2: Integration & Features (Weeks 5-8)

## Week 5: Operator Self-Service Portal Foundation

### Weekly Milestone
- [ ] Operator portal authentication
- [ ] Operator dashboard home page
- [ ] Basic operator profile management
- [ ] Portal navigation structure

### Daily Breakdown

#### Day 1 (Monday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Set up operator portal authentication | Critical | 3h | Operator auth |
| Create operator login page | Critical | 2h | Login page |
| Implement operator session management | High | 2h | Session mgmt |
| Configure route protection | High | 1h | Protected routes |

**Operator Portal Structure:**
```
apps/operator-portal/
├── app/
│   ├── layout.tsx
│   ├── page.tsx              # Redirect to dashboard
│   ├── (auth)/
│   │   └── login/
│   └── (portal)/
│       ├── layout.tsx
│       ├── dashboard/
│       ├── api-keys/
│       ├── certificates/
│       ├── testing/
│       └── settings/
```

#### Day 2 (Tuesday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Create operator portal layout | Critical | 2h | Portal layout |
| Build operator sidebar navigation | High | 2h | Sidebar |
| Implement operator header | High | 2h | Header |
| Add organization switcher (multi-org) | Medium | 2h | Org switcher |

#### Day 3 (Wednesday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Build operator dashboard home | Critical | 3h | Dashboard home |
| Create connection status widget | High | 2h | Status widget |
| Add recent events summary | High | 2h | Events summary |
| Implement quick actions | Medium | 1h | Quick actions |

**Operator Dashboard Home:**
```typescript
// apps/operator-portal/app/(portal)/dashboard/page.tsx
export default function OperatorDashboard() {
  const { data: status } = useOperatorStatus();
  const { data: recentEvents } = useRecentEvents();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Connection Status */}
      <ConnectionStatusCard status={status?.connectionStatus} />

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard title="Events Today" value={status?.eventsToday} />
        <StatCard title="Events This Month" value={status?.eventsThisMonth} />
        <StatCard title="Avg Response Time" value={status?.avgResponseTime} />
      </div>

      {/* Recent Events */}
      <RecentEventsTable events={recentEvents} />

      {/* Quick Actions */}
      <QuickActions />
    </div>
  );
}
```

#### Day 4 (Thursday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Create operator profile page | High | 2h | Profile page |
| Build organization settings | High | 2h | Org settings |
| Add contact management | Medium | 2h | Contacts |
| Implement notification preferences | Medium | 2h | Notifications |

#### Day 5 (Friday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Write portal tests | High | 2h | Tests |
| Documentation | Medium | 2h | Docs |
| Cross-team sync | High | 2h | Team sync |
| Create PR | High | 2h | PR submitted |

---

## Week 6: API Key & Certificate Management

### Weekly Milestone
- [ ] API key generation UI
- [ ] API key management (view, revoke)
- [ ] Certificate download functionality
- [ ] Certificate rotation alerts

### Daily Breakdown

#### Day 1 (Monday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Create API keys list page | Critical | 2h | Keys list |
| Build API key generation flow | Critical | 3h | Key generation |
| Implement key reveal (one-time) | Critical | 2h | Key reveal |
| Add copy-to-clipboard | Medium | 1h | Copy function |

**API Key Management UI:**
```typescript
// apps/operator-portal/app/(portal)/api-keys/page.tsx
export default function APIKeysPage() {
  const { data: keys, isLoading } = useAPIKeys();
  const [showNewKey, setShowNewKey] = useState(false);
  const [newKeyValue, setNewKeyValue] = useState<string | null>(null);

  const createKey = useMutation({
    mutationFn: api.operator.createAPIKey,
    onSuccess: (data) => {
      setNewKeyValue(data.key);
      setShowNewKey(true);
      queryClient.invalidateQueries(['api-keys']);
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">API Keys</h1>
        <Button onClick={() => createKey.mutate()}>
          Generate New Key
        </Button>
      </div>

      {/* New Key Display (one-time) */}
      {showNewKey && newKeyValue && (
        <NewKeyAlert
          keyValue={newKeyValue}
          onDismiss={() => setShowNewKey(false)}
        />
      )}

      {/* Keys Table */}
      <APIKeysTable keys={keys} onRevoke={handleRevoke} />
    </div>
  );
}
```

#### Day 2 (Tuesday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Add key usage statistics | High | 2h | Usage stats |
| Implement key expiration display | High | 2h | Expiration |
| Create key permissions display | Medium | 2h | Permissions |
| Build key revocation confirmation | High | 2h | Revocation |

#### Day 3 (Wednesday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Create certificates page | Critical | 2h | Certs page |
| Build certificate download UI | Critical | 2h | Download UI |
| Implement certificate chain display | High | 2h | Chain display |
| Add certificate expiry tracking | High | 2h | Expiry tracking |

**Certificate Management:**
```typescript
// apps/operator-portal/app/(portal)/certificates/page.tsx
export default function CertificatesPage() {
  const { data: certs } = useCertificates();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Certificates</h1>

      <Card>
        <CardHeader>
          <CardTitle>mTLS Certificate</CardTitle>
          <CardDescription>
            Required for secure communication with GGRAS
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <CertificateInfo cert={certs?.mtls} />
            <div className="flex gap-2">
              <Button onClick={() => downloadCert('mtls')}>
                Download Certificate
              </Button>
              <Button variant="outline" onClick={() => downloadCert('chain')}>
                Download CA Chain
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Certificate Expiry Alert */}
      {certs?.mtls?.daysUntilExpiry < 30 && (
        <Alert variant="warning">
          Certificate expires in {certs.mtls.daysUntilExpiry} days
        </Alert>
      )}
    </div>
  );
}
```

#### Day 4 (Thursday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Create certificate renewal request | High | 2h | Renewal request |
| Add certificate upload (for rotation) | Medium | 2h | Upload |
| Implement certificate validation | High | 2h | Validation |
| Build expiry notification settings | Medium | 2h | Notifications |

#### Day 5 (Friday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Write API key tests | High | 2h | Tests |
| Write certificate tests | High | 2h | Tests |
| Documentation | Medium | 2h | Docs |
| Create PR | High | 2h | PR submitted |

---

## Week 7: Event Testing & Integration Tools

### Weekly Milestone
- [ ] Event testing tool functional
- [ ] Integration status checker working
- [ ] Test event submission UI
- [ ] Response validation display

### Daily Breakdown

#### Day 1 (Monday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Create event testing page | Critical | 2h | Testing page |
| Build event form builder | Critical | 3h | Event form |
| Implement JSON editor mode | High | 2h | JSON editor |
| Add form/JSON toggle | Medium | 1h | Toggle |

**Event Testing Tool:**
```typescript
// apps/operator-portal/app/(portal)/testing/page.tsx
export default function EventTestingPage() {
  const [eventType, setEventType] = useState<'stake' | 'payout' | 'refund'>('stake');
  const [mode, setMode] = useState<'form' | 'json'>('form');
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  const testEvent = useMutation({
    mutationFn: api.operator.testEvent,
    onSuccess: (result) => setTestResult(result)
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Event Testing</h1>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Submit Test Event</CardTitle>
            <ToggleGroup value={mode} onValueChange={setMode}>
              <ToggleGroupItem value="form">Form</ToggleGroupItem>
              <ToggleGroupItem value="json">JSON</ToggleGroupItem>
            </ToggleGroup>
          </div>
        </CardHeader>
        <CardContent>
          {mode === 'form' ? (
            <EventForm eventType={eventType} onSubmit={testEvent.mutate} />
          ) : (
            <JSONEditor onSubmit={testEvent.mutate} />
          )}
        </CardContent>
      </Card>

      {/* Test Result */}
      {testResult && <TestResultDisplay result={testResult} />}
    </div>
  );
}
```

#### Day 2 (Tuesday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Build test result display | Critical | 2h | Result display |
| Implement validation error display | High | 2h | Error display |
| Create signature verification status | High | 2h | Sig status |
| Add processing timeline | Medium | 2h | Timeline |

#### Day 3 (Wednesday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Create integration status page | Critical | 2h | Status page |
| Build health check dashboard | Critical | 2h | Health checks |
| Implement connectivity test | High | 2h | Connectivity |
| Add latency monitoring display | Medium | 2h | Latency |

**Integration Status Checker:**
```typescript
// apps/operator-portal/app/(portal)/testing/status/page.tsx
export default function IntegrationStatusPage() {
  const { data: status, refetch } = useIntegrationStatus();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Integration Status</h1>
        <Button onClick={() => refetch()}>
          Run Health Check
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <HealthCheckCard
          title="API Connectivity"
          status={status?.api}
          latency={status?.apiLatency}
        />
        <HealthCheckCard
          title="mTLS Connection"
          status={status?.mtls}
          certificate={status?.certificateInfo}
        />
        <HealthCheckCard
          title="Event Submission"
          status={status?.eventSubmission}
          lastEvent={status?.lastEventTime}
        />
        <HealthCheckCard
          title="Signature Verification"
          status={status?.signature}
        />
      </div>

      {/* Recent Test Results */}
      <RecentTestResults tests={status?.recentTests} />
    </div>
  );
}
```

#### Day 4 (Thursday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Create batch testing tool | High | 2h | Batch testing |
| Implement test scenarios | High | 3h | Test scenarios |
| Add test history | Medium | 2h | Test history |
| Build export test results | Medium | 1h | Export |

#### Day 5 (Friday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Write testing tool tests | High | 2h | Tests |
| End-to-end integration testing | High | 2h | E2E tests |
| Documentation | Medium | 2h | Docs |
| Create PR | High | 2h | PR submitted |

---

## Week 8: Reporting Module & Phase 2 Completion

### Weekly Milestone
- [ ] Report builder interface complete
- [ ] Scheduled reports configuration
- [ ] Full integration testing done
- [ ] Phase 2 demo ready

### Daily Breakdown

#### Day 1 (Monday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Create reports list page | Critical | 2h | Reports list |
| Build report builder interface | Critical | 3h | Report builder |
| Implement report type selection | High | 2h | Type selection |
| Add parameter configuration | High | 1h | Parameters |

**Report Builder:**
```typescript
// app/(dashboard)/reports/new/page.tsx
export default function NewReportPage() {
  const [reportConfig, setReportConfig] = useState<ReportConfig>({
    type: 'operations_summary',
    dateRange: { from: subDays(new Date(), 30), to: new Date() },
    groupBy: 'operator',
    includeCharts: true,
    format: 'pdf'
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Create Report</h1>

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-6">
            <ReportTypeSelect
              value={reportConfig.type}
              onChange={(type) => setReportConfig({ ...reportConfig, type })}
            />
            <DateRangePicker
              value={reportConfig.dateRange}
              onChange={(dateRange) => setReportConfig({ ...reportConfig, dateRange })}
            />
            <GroupBySelect
              value={reportConfig.groupBy}
              options={getGroupByOptions(reportConfig.type)}
              onChange={(groupBy) => setReportConfig({ ...reportConfig, groupBy })}
            />
            <FormatSelect
              value={reportConfig.format}
              onChange={(format) => setReportConfig({ ...reportConfig, format })}
            />
          </div>

          <ReportPreview config={reportConfig} />

          <div className="flex gap-2 mt-6">
            <Button onClick={() => generateReport(reportConfig)}>
              Generate Report
            </Button>
            <Button variant="outline" onClick={() => scheduleReport(reportConfig)}>
              Schedule Report
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

#### Day 2 (Tuesday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Implement report generation | Critical | 3h | Report gen |
| Add report download | High | 2h | Download |
| Create report preview | High | 2h | Preview |
| Implement report sharing | Medium | 1h | Sharing |

#### Day 3 (Wednesday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Build scheduled reports UI | High | 3h | Scheduled UI |
| Implement schedule configuration | High | 2h | Schedule config |
| Add recipient management | Medium | 2h | Recipients |
| Create schedule history | Medium | 1h | History |

#### Day 4 (Thursday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Full integration testing | Critical | 4h | Integration |
| Fix critical bugs | Critical | 2h | Bug fixes |
| Prepare demo | High | 1.5h | Demo prep |
| Performance optimization | High | 0.5h | Performance |

#### Day 5 (Friday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Phase 2 Demo participation | Critical | 2h | Demo delivered |
| Phase 2 retrospective | High | 1h | Lessons learned |
| Phase 3 planning | High | 2h | Phase 3 planned |
| PR cleanup and merge | High | 2h | Code merged |

---

# Phase 3: Production Readiness (Weeks 9-12)

## Week 9: Performance & Security Hardening

### Weekly Milestone
- [ ] Performance optimization complete
- [ ] Security hardening done
- [ ] Production builds verified
- [ ] Error monitoring configured

### Daily Breakdown

#### Day 1 (Monday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Performance profiling | Critical | 3h | Profile results |
| Chart rendering optimization | High | 2h | Chart perf |
| Data fetching optimization | High | 2h | Fetch perf |
| Bundle analysis | Medium | 1h | Bundle analysis |

#### Day 2 (Tuesday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Implement virtual scrolling | High | 3h | Virtual scroll |
| Add pagination optimization | High | 2h | Pagination |
| Memory leak detection | High | 2h | Memory fixes |
| Image optimization | Medium | 1h | Image opt |

#### Day 3 (Wednesday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Security audit | Critical | 3h | Audit |
| XSS prevention verification | Critical | 2h | XSS checks |
| Input sanitization review | Critical | 2h | Sanitization |
| CSP configuration | High | 1h | CSP |

#### Day 4 (Thursday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Production build configuration | Critical | 2h | Build config |
| Environment configuration | Critical | 2h | Env config |
| Error monitoring setup (Sentry) | High | 2h | Sentry |
| Analytics integration | Medium | 2h | Analytics |

#### Day 5 (Friday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Production readiness review | Critical | 2h | PRR |
| Security checklist completion | Critical | 2h | Checklist |
| Documentation updates | High | 2h | Docs |
| Weekly review | High | 2h | Review |

---

## Week 10: Pilot Deployment Support

### Weekly Milestone
- [ ] Production deployment supported
- [ ] User documentation complete
- [ ] Pilot feedback collected
- [ ] Quick fixes deployed

### Daily Breakdown

#### Day 1 (Monday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Production deployment support | Critical | 4h | Deployment |
| Post-deployment verification | Critical | 2h | Verification |
| User guide finalization | High | 2h | User guide |

#### Day 2 (Tuesday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Operator portal training materials | High | 4h | Training |
| Video walkthrough creation | Medium | 2h | Videos |
| FAQ updates | Medium | 2h | FAQ |

#### Day 3 (Wednesday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Pilot user feedback collection | High | 3h | Feedback |
| Dashboard UX improvements | High | 3h | UX fixes |
| Operator portal UX improvements | High | 2h | UX fixes |

#### Day 4 (Thursday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Deploy improvements | High | 2h | Deploy |
| Monitor user sessions | High | 2h | Monitoring |
| Documentation updates | Medium | 2h | Docs |
| Support pilotusers | High | 2h | Support |

#### Day 5 (Friday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Week 1 pilot review | High | 2h | Review |
| Plan iteration priorities | High | 2h | Priorities |
| Weekly demo | High | 2h | Demo |
| Status update | High | 2h | Status |

---

## Week 11: Pilot Iteration & Polish

### Weekly Milestone
- [ ] All pilot feedback addressed
- [ ] UI polish complete
- [ ] Additional features added
- [ ] Production stability verified

### Daily Breakdown

#### Day 1 (Monday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Address dashboard feedback | Critical | 4h | Dashboard fixes |
| Address operator portal feedback | High | 2h | Portal fixes |
| Deploy improvements | High | 2h | Deployed |

#### Day 2 (Tuesday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Chart enhancements | High | 3h | Charts |
| Export improvements | High | 2h | Exports |
| Report template refinements | Medium | 3h | Reports |

#### Day 3 (Wednesday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Cross-browser final testing | High | 3h | Browser tests |
| Mobile final testing | High | 3h | Mobile tests |
| Accessibility final pass | High | 2h | A11y |

#### Day 4 (Thursday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Final UI polish | High | 4h | UI polish |
| Animation refinements | Medium | 2h | Animations |
| Loading state refinements | Medium | 2h | Loading |

#### Day 5 (Friday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Pilot status review | High | 2h | Status |
| Prepare final release | High | 2h | Release prep |
| Weekly demo | High | 2h | Demo |
| KT preparation | High | 2h | KT prep |

---

## Week 12: Final Release & Handover

### Weekly Milestone
- [ ] Final release deployed
- [ ] All documentation complete
- [ ] Knowledge transfer done
- [ ] Project handover complete

### Daily Breakdown

#### Day 1 (Monday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Final release preparation | Critical | 3h | Release ready |
| Final testing | Critical | 2h | Tests pass |
| Release notes | High | 2h | Release notes |
| Pre-release verification | High | 1h | Verified |

#### Day 2 (Tuesday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Final release deployment | Critical | 3h | Deployed |
| Post-release verification | Critical | 2h | Verified |
| KT: Dashboard architecture | High | 3h | KT session 1 |

#### Day 3 (Wednesday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| KT: Operator portal | High | 3h | KT session 2 |
| KT: Charting & exports | High | 2h | KT session 3 |
| Documentation completion | High | 2h | Docs |

#### Day 4 (Thursday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Final documentation review | High | 2h | Docs reviewed |
| Component library docs | Medium | 2h | Component docs |
| Support handover | High | 2h | Handover |
| Project retrospective | High | 2h | Retrospective |

#### Day 5 (Friday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Final stakeholder presentation | High | 2h | Presentation |
| Project sign-off | Critical | 1h | Sign-off |
| Archive and cleanup | Medium | 2h | Cleanup |
| Team celebration! | High | 3h | Celebrate! |

---

## Chart Components Library

| Component | Description | Use Case |
|-----------|-------------|----------|
| LineChart | Time-series trends | Event volume trends |
| AreaChart | Filled trend charts | Cumulative values |
| BarChart | Category comparison | Operator comparison |
| PieChart | Distribution | Game type breakdown |
| Sparkline | Inline mini charts | Table cells |
| GaugeChart | Single metric | Error or SLA rate |
| HeatMap | Time/category matrix | Activity patterns |

---

## Widgets Library

| Widget | Description |
|--------|-------------|
| StatCard | Single metric with trend |
| IngestionSummaryWidget | Ingestion summary |
| EventVolumeTrendsWidget | Time-series volume |
| OperatorOverviewWidget | Operator status |
| ComplianceStatusWidget | Compliance status |
| OperatorBreakdownWidget | Distribution by operator |
| ConnectionStatusCard | API health status |
| RecentEventsTable | Latest events list |

---

## Definition of Done

### For Each Task:
- [ ] Component renders correctly
- [ ] Charts display data accurately
- [ ] Responsive on all breakpoints
- [ ] Accessibility passes
- [ ] Unit tests written
- [ ] Integration verified
- [ ] Performance acceptable (<100ms render)
- [ ] Code reviewed and approved
- [ ] PR merged

---

## Notes

- Coordinate with FE-1 on shared components
- Coordinate with AI team on alert integrations
- Follow established chart theme
- Ensure export data matches display data
- Test with realistic data volumes
- Optimize for large datasets (virtual scrolling)
- Use React Query for all data fetching

## Service Catalog Appendix (FE-2)

| Service | UI Areas | Key Endpoints |
|---------|----------|---------------|
| reporting-service | Ops dashboards + exports | /reports/summary, /reports/export |
| operator-service | Operator status | /operators, /operators/:id |
| compliance-service | Compliance status | /compliance/cases |
| audit-service | Audit viewer | /audit/logs |

