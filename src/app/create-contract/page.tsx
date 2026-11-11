
"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Plus,
  ShieldCheck,
  Trash2,
} from "lucide-react";

export default function CreateContractPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [freelancerEmail, setFreelancerEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [milestone, setMilestone] = useState("70");
  const [criteria, setCriteria] = useState(["", ""]);
  const [showPreview, setShowPreview] = useState(false);

  function updateCriterion(index: number, value: string) {
    setCriteria((current) =>
      current.map((item, i) => (i === index ? value : item))
    );
  }

  function addCriterion() {
    setCriteria((current) => [...current, ""]);
  }

  function removeCriterion(index: number) {
    setCriteria((current) =>
      current.filter((_, i) => i !== index)
    );
  }

  function handlePreview(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (criteria.some((item) => !item.trim())) {
      alert("Please complete or remove all empty acceptance criteria.");
      return;
    }

    setShowPreview(true);
  }

  const validCriteria = criteria.filter((item) => item.trim());

  return (
    <main className="create-contract-page">
      <header className="create-topbar">
        <Link href="/" className="back-link">
          <ArrowLeft size={17} />
          Back to dashboard
        </Link>

        <div className="create-brand">
          <ShieldCheck size={19} />
          TRUSTLAYER
        </div>

        <span className="draft-label">NEW CONTRACT</span>
      </header>

      <div className="create-container">
        <div className="create-heading">
          <div className="eyebrow">
            <span className="eyebrow-dot" />
            CONTRACT SETUP
          </div>

          <h1>Create a contract<span>.</span></h1>

          <p>
            Define the work, agree on measurable outcomes, and
            establish payment terms before work begins.
          </p>
        </div>

        <div className="create-progress">
          <div className="progress-step active">
            <span>1</span>
            Contract details
          </div>
          <div className="progress-line" />
          <div className="progress-step">
            <span>2</span>
            Review agreement
          </div>
        </div>

        <form onSubmit={handlePreview}>
          <div className="create-layout">
            <div className="create-form-column">
              <section className="form-panel">
                <div className="form-section-heading">
                  <div>
                    <span className="section-number">01</span>
                    <h2>Project details</h2>
                    <p>Describe the work being commissioned.</p>
                  </div>
                </div>

                <div className="field-group">
                  <label htmlFor="title">Contract title</label>
                  <input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Build a Python tax calculator"
                    required
                    maxLength={100}
                  />
                </div>

                <div className="field-group">
                  <label htmlFor="description">Project description</label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the deliverable, requirements and expected outcome..."
                    rows={5}
                    required
                    maxLength={2000}
                  />
                  <span className="field-hint">
                    Be specific. Ambiguous requirements create disputes.
                  </span>
                </div>
              </section>

              <section className="form-panel">
                <div className="form-section-heading">
                  <div>
                    <span className="section-number">02</span>
                    <h2>Freelancer information</h2>
                    <p>Specify who will complete the work.</p>
                  </div>
                </div>

                <div className="field-group">
                  <label htmlFor="email">Freelancer email</label>
                  <input
                    id="email"
                    type="email"
                    value={freelancerEmail}
                    onChange={(e) => setFreelancerEmail(e.target.value)}
                    placeholder="freelancer@example.com"
                    required
                  />
                </div>
              </section>

              <section className="form-panel">
                <div className="form-section-heading">
                  <div>
                    <span className="section-number">03</span>
                    <h2>Payment terms</h2>
                    <p>Set the contract value and milestone split.</p>
                  </div>
                </div>

                <div className="form-two-columns">
                  <div className="field-group">
                    <label htmlFor="currency">Currency</label>
                    <select
                      id="currency"
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                    >
                      <option value="USD">USD ($)</option>
                      <option value="INR">INR (₹)</option>
                    </select>
                  </div>

                  <div className="field-group">
                    <label htmlFor="amount">Total contract value</label>
                    <input
                      id="amount"
                      type="number"
                      min="1"
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="450.00"
                      required
                    />
                  </div>
                </div>

                <div className="field-group">
                  <label htmlFor="milestone">
                    First milestone capture (%)
                  </label>
                  <input
                    id="milestone"
                    type="number"
                    min="1"
                    max="99"
                    value={milestone}
                    onChange={(e) => setMilestone(e.target.value)}
                    required
                  />
                  <span className="field-hint">
                    Remaining amount: {100 - Number(milestone || 0)}%.
                    This is a proposed split, not a payment.
                  </span>
                </div>
              </section>

              <section className="form-panel">
                <div className="form-section-heading">
                  <div>
                    <span className="section-number">04</span>
                    <h2>Acceptance criteria</h2>
                    <p>
                      Define objective conditions that determine
                      whether the submitted work passes.
                    </p>
                  </div>
                </div>

                <div className="criteria-list">
                  {criteria.map((criterion, index) => (
                    <div className="criteria-row" key={index}>
                      <span className="criteria-index">
                        {String(index + 1).padStart(2, "0")}
                      </span>

                      <input
                        value={criterion}
                        onChange={(e) =>
                          updateCriterion(index, e.target.value)
                        }
                        placeholder="e.g. Function must return correct tax for all 5 test cases"
                        required
                      />

                      <button
                        type="button"
                        className="criteria-remove"
                        onClick={() => removeCriterion(index)}
                        disabled={criteria.length <= 1}
                        aria-label="Remove criterion"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  className="add-criteria-button"
                  onClick={addCriterion}
                >
                  <Plus size={16} />
                  Add acceptance criterion
                </button>

                <div className="criteria-notice">
                  <ShieldCheck size={18} />
                  <p>
                    TrustLayer focuses on checkable code deliverables
                    with automated tests. Subjective work is outside
                    this prototype's verification scope.
                  </p>
                </div>
              </section>
            </div>

            <aside className="create-summary">
              <div className="summary-header">
                <ShieldCheck size={19} />
                <span>CONTRACT SUMMARY</span>
              </div>

              <div className="summary-body">
                <span className="summary-label">PROJECT</span>
                <strong className="summary-project">
                  {title || "Your project title"}
                </strong>

                <div className="summary-divider" />

                <span className="summary-label">CONTRACT VALUE</span>
                <div className="summary-amount">
                  {currency === "USD" ? "$" : "₹"}
                  {Number(amount || 0).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>

                <div className="summary-divider" />

                <div className="summary-detail">
                  <span>First milestone</span>
                  <strong>{milestone || 0}%</strong>
                </div>

                <div className="summary-detail">
                  <span>Remaining milestone</span>
                  <strong>{100 - Number(milestone || 0)}%</strong>
                </div>

                <div className="summary-divider" />

                <div className="summary-detail">
                  <span>Acceptance criteria</span>
                  <strong>{validCriteria.length} defined</strong>
                </div>

                <div className="summary-detail">
                  <span>Freelancer</span>
                  <strong>
                    {freelancerEmail ? "Added" : "Not added"}
                  </strong>
                </div>
              </div>

              <div className="summary-security">
                <ShieldCheck size={17} />
                <div>
                  <strong>Agree before funding</strong>
                  <span>
                    Both parties should agree on acceptance criteria
                    before payment authorization.
                  </span>
                </div>
              </div>

              <button type="submit" className="primary-button create-submit">
                Review contract
                <ArrowRight size={17} />
              </button>

              <p className="summary-disclaimer">
                Draft only. No contract is saved and no funds are moved.
              </p>
            </aside>
          </div>
        </form>

        {showPreview && (
          <div className="preview-overlay">
            <section className="preview-modal">
              <div className="preview-modal-header">
                <div>
                  <span className="section-number">REVIEW</span>
                  <h2>Review your contract</h2>
                  <p>Check the details before backend integration.</p>
                </div>

                <button
                  type="button"
                  className="criteria-remove"
                  onClick={() => setShowPreview(false)}
                  aria-label="Close preview"
                >
                  ×
                </button>
              </div>

              <div className="preview-details">
                <div>
                  <span>PROJECT</span>
                  <strong>{title}</strong>
                </div>
                <div>
                  <span>FREELANCER</span>
                  <strong>{freelancerEmail}</strong>
                </div>
                <div>
                  <span>CONTRACT VALUE</span>
                  <strong>
                    {currency === "USD" ? "$" : "₹"}{amount}
                  </strong>
                </div>
                <div>
                  <span>FIRST MILESTONE</span>
                  <strong>{milestone}%</strong>
                </div>
              </div>

              <h3>Acceptance criteria</h3>
              <ul className="preview-criteria">
                {validCriteria.map((item, index) => (
                  <li key={index}>
                    <Check size={16} />
                    {item}
                  </li>
                ))}
              </ul>

              <div className="preview-warning">
                This is a local preview only. Backend contract creation,
                freelancer acceptance and payment authorization are not
                connected yet.
              </div>

              <button
                type="button"
                className="primary-button"
                onClick={() => setShowPreview(false)}
              >
                <ArrowLeft size={16} />
                Back to editing
              </button>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
