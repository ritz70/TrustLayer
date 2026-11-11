import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  ArrowUpRight,
  Bell,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Code2,
  FileCheck2,
  LayoutDashboard,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Wallet,
  MoreHorizontal,
  Zap,
} from "lucide-react";

const navigation = [
  { label: "Overview", icon: LayoutDashboard, active: true },
  { label: "Explore contracts", icon: BriefcaseBusiness },
  { label: "My contracts", icon: FileCheck2 },
  { label: "Workspace", icon: Code2 },
];

const management = [
  { label: "Verification", icon: ShieldCheck },
  { label: "Payments", icon: Wallet },
];

const contracts = [
  {
    title: "Build a tax calculator",
    id: "TL-2026-001",
    freelancer: "Alex Morgan",
    initials: "AM",
    amount: "$450.00",
    status: "In progress",
    statusClass: "progress",
    date: "Nov 12, 2026",
    color: "blue",
  },
  {
    title: "Python data processor",
    id: "TL-2026-002",
    freelancer: "Sarah Chen",
    initials: "SC",
    amount: "$320.00",
    status: "Under review",
    statusClass: "review",
    date: "Nov 11, 2026",
    color: "purple",
  },
  {
    title: "API validation module",
    id: "TL-2026-003",
    freelancer: "James Wilson",
    initials: "JW",
    amount: "$600.00",
    status: "Completed",
    statusClass: "completed",
    date: "Nov 09, 2026",
    color: "green",
  },
];

const activities = [
  {
    title: "Contract created",
    description: "Build a tax calculator",
    time: "2 hours ago",
    icon: Plus,
    color: "blue",
  },
  {
    title: "Code submitted",
    description: "Python data processor",
    time: "5 hours ago",
    icon: Code2,
    color: "purple",
  },
  {
    title: "Verification passed",
    description: "API validation module",
    time: "Yesterday",
    icon: CheckCircle2,
    color: "green",
  },
];

function SidebarLink({
  icon: Icon,
  label,
  active = false,
}: {
  icon: LucideIcon;
  label: string;
  active?: boolean;
}) {
  return (
    <a
      href="#"
      className={`sidebar-link ${active ? "active" : ""}`}
    >
      <Icon size={18} strokeWidth={1.8} />
      <span>{label}</span>
      {active && <span className="active-indicator" />}
    </a>
  );
}

export default function Home() {
  return (
    <main className="app-shell">
      <aside className="sidebar">
        <a href="/" className="brand">
          <div className="brand-icon">
            <ShieldCheck size={23} />
          </div>
          <span>trust<span className="brand-light">layer</span></span>
        </a>

        <div className="workspace-switcher">
          <div className="workspace-avatar">T</div>
          <div className="workspace-info">
            <span className="workspace-label">WORKSPACE</span>
            <span className="workspace-name">Personal workspace</span>
          </div>
          <ChevronDown size={15} />
        </div>

        <div className="nav-section">
          <p className="nav-heading">WORKSPACE</p>
          {navigation.map((item) => (
            <SidebarLink key={item.label} {...item} />
          ))}
        </div>

        <div className="nav-section">
          <p className="nav-heading">TRUST & FINANCE</p>
          {management.map((item) => (
            <SidebarLink key={item.label} {...item} />
          ))}
        </div>

        <div className="sidebar-bottom">
          <div className="trust-card">
            <div className="trust-card-icon">
              <Sparkles size={17} />
            </div>
            <p className="trust-card-title">Built on trust.</p>
            <p className="trust-card-text">
              Work verified. Payments protected.
            </p>
            <div className="trust-card-line" />
            <span className="trust-card-caption">
              TRUSTLAYER PLATFORM
            </span>
          </div>

          <a href="#" className="profile-row">
            <div className="profile-avatar">R</div>
            <div className="profile-info">
              <span className="profile-name">Your account</span>
              <span className="profile-role">Workspace member</span>
            </div>
            <MoreHorizontal size={19} />
          </a>
        </div>
      </aside>

      <section className="main-area">
        <header className="topbar">
          <div className="breadcrumb">
            <span>Workspace</span>
            <span className="breadcrumb-slash">/</span>
            <strong>Overview</strong>
          </div>

          <div className="topbar-actions">
            <div className="search-box">
              <Search size={16} />
              <span>Search anything...</span>
              <kbd>⌘ K</kbd>
            </div>
            <button className="icon-button" aria-label="Notifications">
              <Bell size={18} />
              <span className="notification-dot" />
            </button>
            <div className="topbar-avatar">R</div>
          </div>
        </header>

        <div className="dashboard-content">
          <section className="welcome-row">
            <div>
              <div className="eyebrow">
                <span className="eyebrow-dot" />
                YOUR TRUSTLAYER WORKSPACE
              </div>
              <h1>Good evening<span className="heading-period">.</span></h1>
              <p className="welcome-description">
                Here's what's happening with your contracts today.
              </p>
            </div>

            <Link href="/create-contract" className="primary-button">
              <Plus size={17} />
              Create contract
            </Link>
          </section>

          <section className="stats-grid">
            <article className="stat-card">
              <div className="stat-top">
                <span className="stat-label">Active contracts</span>
                <div className="stat-icon blue"><BriefcaseBusiness size={18} /></div>
              </div>
              <div className="stat-value">08</div>
              <div className="stat-footer">
                <span className="stat-muted">Currently in progress</span>
                <span className="stat-trend positive">
                  <ArrowUpRight size={14} /> 2 this week
                </span>
              </div>
            </article>

            <article className="stat-card">
              <div className="stat-top">
                <span className="stat-label">Funds authorized</span>
                <div className="stat-icon purple"><Wallet size={18} /></div>
              </div>
              <div className="stat-value">$2,840<span className="stat-decimal">.00</span></div>
              <div className="stat-footer">
                <span className="stat-muted">Sandbox payment data</span>
                <span className="stat-trend neutral">PayPal Sandbox</span>
              </div>
            </article>

            <article className="stat-card">
              <div className="stat-top">
                <span className="stat-label">Awaiting verification</span>
                <div className="stat-icon amber"><Clock3 size={18} /></div>
              </div>
              <div className="stat-value">03</div>
              <div className="stat-footer">
                <span className="stat-muted">Submissions pending</span>
                <span className="stat-trend warning">Needs attention</span>
              </div>
            </article>

            <article className="stat-card">
              <div className="stat-top">
                <span className="stat-label">Successfully completed</span>
                <div className="stat-icon green"><CheckCircle2 size={18} /></div>
              </div>
              <div className="stat-value">24</div>
              <div className="stat-footer">
                <span className="stat-muted">Contracts completed</span>
                <span className="stat-trend positive">
                  <ArrowUpRight size={14} /> 12% this month
                </span>
              </div>
            </article>
          </section>

          <section className="content-grid">
            <div className="panel contracts-panel">
              <div className="panel-header">
                <div>
                  <h2>Recent contracts</h2>
                  <p>Your latest contract activity</p>
                </div>
                <button className="text-button">View all <ArrowUpRight size={14} /></button>
              </div>

              <div className="contract-table">
                <div className="table-heading">
                  <span>CONTRACT</span>
                  <span>FREELANCER</span>
                  <span>AMOUNT</span>
                  <span>STATUS</span>
                  <span />
                </div>

                {contracts.map((contract) => (
                  <div className="contract-row" key={contract.id}>
                    <div className="contract-name">
                      <div className={`contract-icon ${contract.color}`}>
                        <Code2 size={17} />
                      </div>
                      <div>
                        <strong>{contract.title}</strong>
                        <span>{contract.id}</span>
                      </div>
                    </div>

                    <div className="freelancer-cell">
                      <div className="mini-avatar">{contract.initials}</div>
                      <span>{contract.freelancer}</span>
                    </div>

                    <strong className="amount-cell">{contract.amount}</strong>

                    <div>
                      <span className={`status-pill ${contract.statusClass}`}>
                        <span className="status-dot" />
                        {contract.status}
                      </span>
                    </div>

                    <button className="row-menu" aria-label="Contract options">
                      <MoreHorizontal size={18} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="panel-footer">
                <span>Showing 3 of 8 contracts</span>
                <button className="pagination-button">View contracts <ArrowUpRight size={14} /></button>
              </div>
            </div>

            <div className="panel activity-panel">
              <div className="panel-header">
                <div>
                  <h2>Recent activity</h2>
                  <p>Latest workspace updates</p>
                </div>
                <button className="icon-button subtle" aria-label="Activity options">
                  <MoreHorizontal size={18} />
                </button>
              </div>

              <div className="activity-list">
                {activities.map((activity) => {
                  const Icon = activity.icon;
                  return (
                    <div className="activity-item" key={activity.title}>
                      <div className={`activity-icon ${activity.color}`}>
                        <Icon size={16} />
                      </div>
                      <div className="activity-copy">
                        <strong>{activity.title}</strong>
                        <span>{activity.description}</span>
                        <small>{activity.time}</small>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="activity-summary">
                <div className="summary-icon"><Activity size={17} /></div>
                <div>
                  <strong>Everything in one place.</strong>
                  <span>Track work, verification and payments.</span>
                </div>
              </div>
            </div>
          </section>

          <section className="bottom-banner">
            <div className="banner-icon"><Zap size={20} /></div>
            <div className="banner-copy">
              <strong>Trust is built into every transaction.</strong>
              <span>Code is tested. Deliverables are reviewed. Payments follow the outcome.</span>
            </div>
            <div className="banner-badge">
              <ShieldCheck size={15} /> TRUSTLAYER
            </div>
          </section>

          <footer className="dashboard-footer">
            <span>© 2026 TrustLayer</span>
            <span className="demo-disclaimer">
              <span className="demo-dot" /> Prototype data · Not live transactions
            </span>
            <span>Built for work you can trust.</span>
          </footer>
        </div>
      </section>
    </main>
  );
}
