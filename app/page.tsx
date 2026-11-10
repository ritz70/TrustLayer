
"use client";

import { useState } from "react";

type Tab = "client" | "freelancer" | "results";

export default function Home() {
  const [tab, setTab] = useState<Tab>("client");
  const [title, setTitle] = useState("Build a landing page");
  const [description, setDescription] = useState(
    "Create a responsive landing page with a modern design."
  );
  const [budget, setBudget] = useState("5000");
  const [funded, setFunded] = useState(false);
  const [submission, setSubmission] = useState("");
  const [status, setStatus] = useState<"pending" | "passed" | "failed">("pending");
  const [feedback, setFeedback] = useState("");

  function verifySubmission() {
    if (!submission.trim()) {
      setStatus("failed");
      setFeedback("No work was submitted.");
      return;
    }

    if (submission.trim().length < 30) {
      setStatus("failed");
      setFeedback("Submission is too short. Provide a more detailed deliverable.");
      return;
    }

    setStatus("passed");
    setFeedback("Basic demo checks passed. Human review is still required.");
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "client", label: "Client" },
    { id: "freelancer", label: "Freelancer" },
    { id: "results", label: "Results" },
  ];

  return (
    <main className="min-h-screen bg-[#090d18] text-white">
      <header className="border-b border-white/10 bg-[#0d1322]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Trust<span className="text-cyan-400">Layer</span>
            </h1>
            <p className="text-xs text-slate-400">
              Work with trust. Pay with confidence.
            </p>
          </div>
          <div className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs text-cyan-300">
            Prototype
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-10">
          <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-cyan-400">
            Trust-first work platform
          </p>
          <h2 className="text-4xl font-bold tracking-tight md:text-5xl">
            Every task deserves
            <br />
            <span className="text-cyan-400">a fair outcome.</span>
          </h2>
          <p className="mt-4 max-w-xl text-slate-400">
            Create jobs, submit deliverables and verify work through a
            transparent workflow.
          </p>
        </div>

        <div className="mb-8 flex flex-wrap gap-2 rounded-xl border border-white/10 bg-[#111827] p-2">
          {tabs.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`rounded-lg px-6 py-3 text-sm font-semibold transition ${
                tab === item.id
                  ? "bg-cyan-400 text-slate-950"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          <div className="rounded-2xl border border-white/10 bg-[#111827] p-6 md:p-8">
            {tab === "client" && (
              <div>
                <p className="mb-2 text-sm text-cyan-400">01 / CLIENT VIEW</p>
                <h3 className="text-2xl font-bold">Create a new job</h3>
                <p className="mb-7 mt-2 text-sm text-slate-400">
                  Define your task and allocate a budget.
                </p>

                <label className="mb-2 block text-sm text-slate-300">
                  Job title
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mb-5 w-full rounded-lg border border-white/10 bg-[#090d18] p-3 outline-none focus:border-cyan-400"
                  placeholder="Enter job title"
                />

                <label className="mb-2 block text-sm text-slate-300">
                  Job description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="mb-5 w-full rounded-lg border border-white/10 bg-[#090d18] p-3 outline-none focus:border-cyan-400"
                  placeholder="Describe the expected work..."
                />

                <label className="mb-2 block text-sm text-slate-300">
                  Budget (INR)
                </label>
                <input
                  type="number"
                  min="1"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="mb-6 w-full rounded-lg border border-white/10 bg-[#090d18] p-3 outline-none focus:border-cyan-400"
                />

                <button
                  disabled={!title.trim() || !description.trim() || Number(budget) <= 0 || funded}
                  onClick={() => setFunded(true)}
                  className="w-full rounded-lg bg-cyan-400 px-5 py-3 font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {funded ? "Job funded (demo)" : "Create job & fund escrow"}
                </button>

                {funded && (
                  <p className="mt-3 text-sm text-emerald-400">
                    Job created successfully in this prototype.
                  </p>
                )}
              </div>
            )}

            {tab === "freelancer" && (
              <div>
                <p className="mb-2 text-sm text-cyan-400">02 / FREELANCER VIEW</p>
                <h3 className="text-2xl font-bold">Submit your work</h3>
                <p className="mb-6 mt-2 text-sm text-slate-400">
                  Review the client's requirements and submit your deliverable.
                </p>

                <div className="mb-6 rounded-xl border border-white/10 bg-[#090d18] p-5">
                  <p className="text-xs text-slate-500">CURRENT JOB</p>
                  <h4 className="mt-2 text-lg font-semibold">{title || "Untitled job"}</h4>
                  <p className="mt-2 text-sm text-slate-400">{description}</p>
                  <p className="mt-4 font-semibold text-cyan-400">
                    ₹{Number(budget || 0).toLocaleString("en-IN")}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    Escrow status: {funded ? "Funded (demo)" : "Not funded"}
                  </p>
                </div>

                <label className="mb-2 block text-sm text-slate-300">
                  Deliverable / submission details
                </label>
                <textarea
                  value={submission}
                  onChange={(e) => {
                    setSubmission(e.target.value);
                    setStatus("pending");
                    setFeedback("");
                  }}
                  rows={7}
                  className="mb-5 w-full rounded-lg border border-white/10 bg-[#090d18] p-3 outline-none focus:border-cyan-400"
                  placeholder="Describe your completed work or paste a deliverable link..."
                />

                <button
                  onClick={() => setTab("results")}
                  disabled={!submission.trim()}
                  className="w-full rounded-lg bg-cyan-400 px-5 py-3 font-bold text-slate-950 hover:bg-cyan-300 disabled:opacity-40"
                >
                  Submit work
                </button>
              </div>
            )}

            {tab === "results" && (
              <div>
                <p className="mb-2 text-sm text-cyan-400">03 / VERIFICATION</p>
                <h3 className="text-2xl font-bold">Submission results</h3>
                <p className="mb-7 mt-2 text-sm text-slate-400">
                  Run basic checks on the submitted deliverable.
                </p>

                <div className="mb-6 rounded-xl border border-white/10 bg-[#090d18] p-5">
                  <p className="text-xs text-slate-500">JOB</p>
                  <p className="mt-2 font-semibold">{title}</p>
                  <p className="mt-4 text-xs text-slate-500">SUBMISSION</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-slate-300">
                    {submission || "No submission received yet."}
                  </p>
                </div>

                <div className="mb-6 rounded-xl border border-white/10 p-5">
                  <p className="text-sm text-slate-400">Verification status</p>
                  <p className={`mt-3 text-2xl font-bold ${
                    status === "passed"
                      ? "text-emerald-400"
                      : status === "failed"
                      ? "text-red-400"
                      : "text-amber-400"
                  }`}>
                    {status === "passed"
                      ? "PASSED"
                      : status === "failed"
                      ? "FAILED"
                      : "PENDING"}
                  </p>
                  <p className="mt-3 text-sm text-slate-400">
                    {feedback || "Your submission is awaiting verification."}
                  </p>
                </div>

                <button
                  onClick={verifySubmission}
                  disabled={!submission.trim()}
                  className="w-full rounded-lg bg-cyan-400 px-5 py-3 font-bold text-slate-950 hover:bg-cyan-300 disabled:opacity-40"
                >
                  Run verification
                </button>
              </div>
            )}
          </div>

          <aside className="h-fit rounded-2xl border border-white/10 bg-[#111827] p-6">
            <h3 className="font-bold">Job overview</h3>
            <div className="mt-5 space-y-5">
              <div>
                <p className="text-xs text-slate-500">JOB STATUS</p>
                <p className="mt-1 font-semibold">
                  {funded ? "Active (demo)" : "Draft"}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">BUDGET</p>
                <p className="mt-1 text-xl font-bold text-cyan-400">
                  ₹{Number(budget || 0).toLocaleString("en-IN")}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">SUBMISSION</p>
                <p className="mt-1 font-semibold">
                  {submission.trim() ? "Received" : "Awaiting"}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">VERIFICATION</p>
                <p className="mt-1 font-semibold capitalize">{status}</p>
              </div>
            </div>
            <div className="mt-7 border-t border-white/10 pt-5">
              <p className="text-xs leading-6 text-slate-500">
                Prototype only. Escrow funding and verification are simulated.
                No real money is transferred.
              </p>
            </div>
          </aside>
        </div>
      </section>

      <footer className="border-t border-white/10 px-6 py-6 text-center text-xs text-slate-500">
        © 2026 TrustLayer. Built for transparent digital work.
      </footer>
    </main>
  );
}
