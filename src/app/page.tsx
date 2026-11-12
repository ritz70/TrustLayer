
import Link from "next/link";
import {
  ShieldCheck,
  ArrowUpRight,
  ArrowRight,
  Check,
  LockKeyhole,
  Code2,
  Zap,
  Eye,
  CircleCheck,
  Fingerprint,
  Layers3,
} from "lucide-react";
import "./landing.css";

const features = [
  {
    icon: Code2,
    title: "Code that proves itself",
    description:
      "Deliverables are checked against defined acceptance criteria and automated tests before release.",
  },
  {
    icon: ShieldCheck,
    title: "Payments follow verification",
    description:
      "Explore a simulated payment workflow tied to verification outcomes.",
  },
  {
    icon: Eye,
    title: "Evidence, not assumptions",
    description:
      "Every verification produces evidence. Uncertain outcomes can be sent for human review.",
  },
];

export default function Home() {
  return (
    <main className="landing">
      <nav className="landing-nav">
        <Link href="/" className="landing-brand">
          <span className="landing-brand-icon">
            <ShieldCheck size={22} />
          </span>
          trust<span>layer</span>
        </Link>

        <div className="landing-nav-links">
          <a href="#how-it-works">How it works</a>
          <a href="#features">Features</a>
        </div>

        <div className="landing-nav-actions">
          <Link href="/dashboard" className="nav-login">
            Open dashboard
          </Link>
          <Link href="/create-contract" className="nav-cta">
            Get started <ArrowUpRight size={16} />
          </Link>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-copy">
          <div className="hero-eyebrow">
            <span className="live-dot" />
            TRUST-FIRST FREELANCE PAYMENTS
          </div>

          <h1>
            Work delivered.
            <br />
            Payments <span>verified.</span>
          </h1>

          <p className="hero-description">
            A smarter way to work together. Define milestones, verify code
            submissions, and release payments when agreed conditions are met.
          </p>

          <div className="hero-actions">
            <Link href="/create-contract" className="hero-primary">
              Create a contract <ArrowRight size={17} />
            </Link>
            <Link href="/dashboard" className="hero-secondary">
              Explore dashboard
            </Link>
          </div>

          <div className="hero-trust">
            <div className="trust-avatars">
              <span>C</span>
              <span>F</span>
              <span><ShieldCheck size={13} /></span>
            </div>
            <p>Built around transparency, verification and accountability.</p>
          </div>
        </div>

        <div className="hero-visual">
          <div className="visual-glow" />

          <div className="floating-label label-top">
            <span className="label-icon"><LockKeyhole size={15} /></span>
            Sandbox preview
          </div>

          <div className="escrow-card">
            <div className="escrow-card-header">
              <div>
                <span className="visual-overline">CONTRACT OVERVIEW</span>
                <h3>Website development</h3>
              </div>
              <span className="secure-badge">
                <ShieldCheck size={13} /> Protected
              </span>
            </div>

            <div className="escrow-amount">
              <span>Milestone value</span>
              <strong>$1,200.00</strong>
              <small><LockKeyhole size={12} /> Sandbox authorization preview</small>
            </div>

            <div className="escrow-divider" />

            <div className="milestone-heading">
              <span>Verification progress</span>
              <span>Step 2 of 3</span>
            </div>

            <div className="milestone-track">
              <span className="track-done" />
              <span className="track-active" />
              <span />
            </div>

            <div className="verification-list">
              <div>
                <span className="verification-icon done"><Check size={13} /></span>
                <div>
                  <strong>Contract agreed</strong>
                  <small>Acceptance criteria established</small>
                </div>
                <span className="verification-status">Complete</span>
              </div>

              <div>
                <span className="verification-icon active"><Code2 size={13} /></span>
                <div>
                  <strong>Code verification</strong>
                  <small>Automated tests and evidence</small>
                </div>
                <span className="verification-status pending">In review</span>
              </div>

              <div>
                <span className="verification-icon waiting"><LockKeyhole size={13} /></span>
                <div>
                  <strong>Payment release</strong>
                  <small>After verification passes</small>
                </div>
                <span className="verification-status waiting-text">Pending</span>
              </div>
            </div>

            <div className="escrow-footer">
              <Fingerprint size={16} />
              <span>Verification-led release workflow</span>
              <CircleCheck size={16} />
            </div>
          </div>

          <div className="floating-label label-bottom">
            <span className="label-success"><Check size={14} /></span>
            Evidence-based verification
          </div>
        </div>
      </section>

      <section className="principles">
        <div><ShieldCheck size={17} /> Defined acceptance criteria</div>
        <div><Zap size={17} /> Automated code testing</div>
        <div><Eye size={17} /> Human review when needed</div>
        <div><LockKeyhole size={17} /> Conditional release</div>
      </section>

      <section className="how-section" id="how-it-works">
        <div className="section-heading">
          <span className="section-eyebrow">THE WORKFLOW</span>
          <h2>Trust isn't assumed. It's verified.</h2>
          <p>One transparent process from agreement to payment release.</p>
        </div>

        <div className="steps-grid">
          <article className="step-card">
            <span className="step-number">01</span>
            <div className="step-icon"><Layers3 size={22} /></div>
            <h3>Agree on the work</h3>
            <p>Set the contract, milestone value and measurable acceptance criteria.</p>
          </article>

          <article className="step-card">
            <span className="step-number">02</span>
            <div className="step-icon"><Code2 size={22} /></div>
            <h3>Submit and verify</h3>
            <p>Submit code for automated testing and additional structural review.</p>
          </article>

          <article className="step-card">
            <span className="step-number">03</span>
            <div className="step-icon"><CircleCheck size={22} /></div>
            <h3>Review and release</h3>
            <p>Release follows successful verification. Uncertain cases can be reviewed by a human.</p>
          </article>
        </div>
      </section>

      <section className="features-section" id="features">
        <div className="features-intro">
          <span className="section-eyebrow">WHY TRUSTLAYER</span>
          <h2>Built for work you can trust.</h2>
          <p>
            Clear expectations. Verifiable submissions. A more accountable
            way to manage freelance software projects.
          </p>
          <Link href="/create-contract" className="feature-link">
            Start a contract <ArrowUpRight size={16} />
          </Link>
        </div>

        <div className="feature-list">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <article className="feature-card" key={feature.title}>
                <div className="feature-icon"><Icon size={21} /></div>
                <div>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </div>
                <ArrowUpRight className="feature-arrow" size={18} />
              </article>
            );
          })}
        </div>
      </section>

      <section className="final-cta">
        <div className="cta-glow" />
        <span className="section-eyebrow">A BETTER WAY TO COLLABORATE</span>
        <h2>Make every milestone count.</h2>
        <p>Start with clear expectations. Let verification guide the outcome.</p>
        <Link href="/create-contract" className="hero-primary">
          Create your first contract <ArrowRight size={17} />
        </Link>
      </section>

      <footer className="landing-footer">
        <Link href="/" className="landing-brand">
          <span className="landing-brand-icon"><ShieldCheck size={20} /></span>
          trust<span>layer</span>
        </Link>
        <span>Built for work you can trust.</span>
        <Link href="/dashboard">Open dashboard <ArrowUpRight size={14} /></Link>
        <span>© 2026 TrustLayer · Prototype</span>
      </footer>
    </main>
  );
}
