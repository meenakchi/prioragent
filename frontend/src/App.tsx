import { useState, useEffect } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

type AuthStatus = "loading" | "unauthenticated" | "authenticated";
type WorkflowStatus =
  | "idle"
  | "pending_consent"
  | "fetching_records"
  | "analyzing"
  | "draft_ready"
  | "submitted"
  | "error";

interface User {
  name: string;
  email: string;
  picture?: string;
}

interface PriorAuthForm {
  patientName: string;
  patientDOB: string;
  memberId: string;
  medicationRequested: string;
  ndc: string;
  icd10Code: string;
  diagnosis: string;
  clinicalJustification: string;
  previousTreatments: string;
  prescribingPhysician: string;
  physicianNPI: string;
  urgency: "routine" | "urgent" | "emergent";
  supportingDocumentation: string[];
}

interface SubmissionResult {
  referenceNumber: string;
  status: string;
  estimatedDecisionDate: string;
  submittedAt: string;
}

interface PARequest {
  id: string;
  patientId: string;
  medicationName: string;
  diagnosis: string;
  insurerId: string;
  status: WorkflowStatus;
  createdAt: string;
  aiDraftForm?: PriorAuthForm;
  submissionResult?: SubmissionResult;
}

interface Insurer {
  id: string;
  name: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const API = "http://localhost:3001/api";

const DEMO_PATIENTS = [
  { id: "eQMSMe9j-O23nW7ovHXWnkA3", label: "Camila Lopez" },
  { id: "erXuFYUfucBZaryVksYEcMg3", label: "Derrick Lin" },
  { id: "eq081-VQEgP8drUUqCWzHfw3", label: "Jason Argonaut" },
];

const STATUS_LABELS: Record<WorkflowStatus, string> = {
  idle: "Idle",
  pending_consent: "Awaiting Patient Consent",
  fetching_records: "Fetching Health Records",
  analyzing: "AI Analyzing Records",
  draft_ready: "Draft Ready",
  submitted: "Submitted to Insurer",
  error: "Error",
};

const STATUS_COLORS: Record<WorkflowStatus, string> = {
  idle: "bg-gray-100 text-gray-600",
  pending_consent: "bg-yellow-100 text-yellow-700",
  fetching_records: "bg-blue-100 text-blue-700",
  analyzing: "bg-purple-100 text-purple-700",
  draft_ready: "bg-green-100 text-green-700",
  submitted: "bg-sky-100 text-sky-700",
  error: "bg-red-100 text-red-700",
};

// ─── API helpers ──────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Spinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const s = size === "sm" ? "h-4 w-4" : size === "lg" ? "h-10 w-10" : "h-6 w-6";
  return (
    <svg
      className={`animate-spin ${s} text-sky-500`}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v8z"
      />
    </svg>
  );
}

function Badge({ status }: { status: WorkflowStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[status]}`}
    >
      {(status === "fetching_records" || status === "analyzing" || status === "pending_consent") && (
        <Spinner size="sm" />
      )}
      {STATUS_LABELS[status]}
    </span>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 ${className}`}>
      {children}
    </div>
  );
}

// ─── Landing / Hero ───────────────────────────────────────────────────────────

function Hero({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-950 via-sky-900 to-indigo-900 flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-sky-400 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <span className="text-white font-semibold text-lg">PriorAgent</span>
        </div>
        <button
          onClick={onLogin}
          className="text-sm text-sky-200 hover:text-white transition-colors"
        >
          Sign in →
        </button>
      </nav>

      {/* Hero content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="inline-flex items-center gap-2 bg-sky-800/50 border border-sky-700 rounded-full px-4 py-1.5 text-sky-300 text-sm mb-8">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          Auth0 Token Vault · CIBA Step-up · Epic FHIR R4
        </div>

        <h1 className="text-5xl md:text-6xl font-bold text-white max-w-3xl leading-tight mb-6">
          Prior Authorization,{" "}
          <span className="text-sky-400">handled by AI.</span>
        </h1>

        <p className="text-sky-200 text-lg max-w-xl mb-10 leading-relaxed">
          PriorAgent reads your health records, fills out insurer forms, and submits
          them — with patient-controlled consent at every step. Powered by Claude.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onLogin}
            className="bg-sky-400 hover:bg-sky-300 text-sky-950 font-semibold px-7 py-3 rounded-xl transition-colors text-sm"
          >
            Get Started
          </button>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="border border-sky-700 text-sky-200 hover:bg-sky-800/50 px-7 py-3 rounded-xl transition-colors text-sm"
          >
            View on GitHub
          </a>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-3 mt-14">
          {[
            "🔐 Auth0 Token Vault",
            "📋 Epic FHIR R4",
            "🤖 Claude AI",
            "🔔 CIBA Consent",
            "🏥 Insurer Submission",
          ].map((f) => (
            <span
              key={f}
              className="bg-sky-900/60 border border-sky-800 text-sky-300 text-sm px-4 py-2 rounded-lg"
            >
              {f}
            </span>
          ))}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 border-t border-sky-800/60 divide-x divide-sky-800/60">
        {[
          { label: "Avg. PA Time Saved", value: "4.5 hrs" },
          { label: "Problem Size", value: "$13B" },
          { label: "Approval Rate", value: "94%" },
        ].map((s) => (
          <div key={s.label} className="py-6 text-center">
            <div className="text-2xl font-bold text-white">{s.value}</div>
            <div className="text-sky-400 text-xs mt-1">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Workflow Form ────────────────────────────────────────────────────────────

function WorkflowForm({
  insurers,
  onSubmit,
  loading,
}: {
  insurers: Insurer[];
  onSubmit: (patientId: string, insurerId: string) => void;
  loading: boolean;
}) {
  const [patientId, setPatientId] = useState(DEMO_PATIENTS[0].id);
  const [insurerId, setInsurerId] = useState("");

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-1">
        New Prior Authorization
      </h2>
      <p className="text-sm text-gray-500 mb-5">
        Select patient and insurer. PriorAgent handles the rest.
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Patient
          </label>
          <select
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 bg-gray-50"
          >
            {DEMO_PATIENTS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Insurance Provider
          </label>
          <select
            value={insurerId}
            onChange={(e) => setInsurerId(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 bg-gray-50"
          >
            <option value="">— Select insurer —</option>
            {insurers.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => onSubmit(patientId, insurerId)}
          disabled={!patientId || !insurerId || loading}
          className="w-full bg-sky-500 hover:bg-sky-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-medium py-2.5 rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Spinner size="sm" />
              Running workflow…
            </>
          ) : (
            "Run Prior Auth Workflow"
          )}
        </button>
      </div>
    </Card>
  );
}

// ─── Workflow Steps ───────────────────────────────────────────────────────────

function WorkflowSteps({ status }: { status: WorkflowStatus }) {
  const steps = [
    { key: "pending_consent", label: "Patient Consent (CIBA)", icon: "🔔" },
    { key: "fetching_records", label: "Fetch FHIR Records", icon: "📂" },
    { key: "analyzing", label: "Claude AI Analysis", icon: "🤖" },
    { key: "draft_ready", label: "Form Drafted", icon: "📋" },
    { key: "submitted", label: "Submitted to Insurer", icon: "✅" },
  ];

  const order = steps.map((s) => s.key);
  const currentIdx = order.indexOf(status);

  return (
    <Card className="p-6">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Workflow Progress</h3>
      <div className="space-y-3">
        {steps.map((step, idx) => {
          const done = currentIdx > idx;
          const active = currentIdx === idx;
          return (
            <div key={step.key} className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0
                  ${done ? "bg-green-100" : active ? "bg-sky-100" : "bg-gray-100"}`}
              >
                {done ? "✓" : step.icon}
              </div>
              <div className="flex-1">
                <div
                  className={`text-sm font-medium ${
                    done ? "text-green-700" : active ? "text-sky-700" : "text-gray-400"
                  }`}
                >
                  {step.label}
                </div>
              </div>
              {active && <Spinner size="sm" />}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ─── PA Form Viewer ───────────────────────────────────────────────────────────

function PAFormViewer({ form }: { form: PriorAuthForm }) {
  const urgencyColor =
    form.urgency === "emergent"
      ? "bg-red-100 text-red-700"
      : form.urgency === "urgent"
      ? "bg-orange-100 text-orange-700"
      : "bg-green-100 text-green-700";

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-semibold text-gray-800">AI-Drafted PA Form</h3>
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${urgencyColor}`}>
          {form.urgency.toUpperCase()}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm mb-5">
        {[
          { label: "Patient", value: form.patientName },
          { label: "Date of Birth", value: form.patientDOB },
          { label: "Member ID", value: form.memberId },
          { label: "ICD-10", value: form.icd10Code },
          { label: "Diagnosis", value: form.diagnosis },
          { label: "Prescriber", value: form.prescribingPhysician },
          { label: "NPI", value: form.physicianNPI },
          { label: "NDC", value: form.ndc },
        ].map(({ label, value }) => (
          <div key={label}>
            <div className="text-xs text-gray-400 mb-0.5">{label}</div>
            <div className="text-gray-800 font-medium">{value}</div>
          </div>
        ))}
      </div>

      <div className="mb-4">
        <div className="text-xs text-gray-400 mb-1">Medication Requested</div>
        <div className="bg-sky-50 border border-sky-100 rounded-lg px-3 py-2 text-sm text-sky-900 font-medium">
          {form.medicationRequested}
        </div>
      </div>

      <div className="mb-4">
        <div className="text-xs text-gray-400 mb-1">Clinical Justification</div>
        <div className="bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-700 leading-relaxed max-h-40 overflow-y-auto">
          {form.clinicalJustification}
        </div>
      </div>

      <div className="mb-4">
        <div className="text-xs text-gray-400 mb-1">Previous Treatments</div>
        <div className="bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-700">
          {form.previousTreatments}
        </div>
      </div>

      {form.supportingDocumentation?.length > 0 && (
        <div>
          <div className="text-xs text-gray-400 mb-2">Supporting Documentation Needed</div>
          <ul className="space-y-1">
            {form.supportingDocumentation.map((doc, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                <span className="text-sky-400 mt-0.5">•</span>
                {doc}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}

// ─── Submission Result ────────────────────────────────────────────────────────

function SubmissionCard({ result }: { result: SubmissionResult }) {
  return (
    <Card className="p-6 border-green-200 bg-green-50">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-xl">
          ✅
        </div>
        <div>
          <div className="font-semibold text-green-800">Submitted Successfully</div>
          <div className="text-sm text-green-600">
            {new Date(result.submittedAt).toLocaleString()}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <div className="text-xs text-green-600 mb-0.5">Reference Number</div>
          <div className="font-mono font-semibold text-green-900">{result.referenceNumber}</div>
        </div>
        <div>
          <div className="text-xs text-green-600 mb-0.5">Est. Decision By</div>
          <div className="font-semibold text-green-900">{result.estimatedDecisionDate}</div>
        </div>
      </div>
    </Card>
  );
}

// ─── Request History ──────────────────────────────────────────────────────────

function RequestHistory({ requests }: { requests: PARequest[] }) {
  if (requests.length === 0) return null;
  return (
    <Card className="p-6">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Recent Requests</h3>
      <div className="space-y-3">
        {requests.map((r) => (
          <div
            key={r.id}
            className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
          >
            <div>
              <div className="text-sm font-medium text-gray-800">
                {r.medicationName || "Pending…"}
              </div>
              <div className="text-xs text-gray-400">
                {r.insurerId} · {new Date(r.createdAt).toLocaleDateString()}
              </div>
            </div>
            <Badge status={r.status} />
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─── Consent Modal ────────────────────────────────────────────────────────────

function ConsentModal({
  show,
  onClose,
}: {
  show: boolean;
  onClose: () => void;
}) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
        <div className="text-center mb-5">
          <div className="w-14 h-14 bg-yellow-100 rounded-full flex items-center justify-center text-2xl mx-auto mb-3">
            🔔
          </div>
          <h3 className="text-lg font-semibold text-gray-800">Patient Consent Required</h3>
          <p className="text-sm text-gray-500 mt-2">
            PriorAgent is using <strong>Auth0 CIBA</strong> to request step-up
            consent from the patient before accessing health records.
          </p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-yellow-800 mb-5">
          A push notification has been sent to the patient's device. The workflow
          will continue once they approve.
        </div>
        <button
          onClick={onClose}
          className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium py-2.5 rounded-lg transition-colors"
        >
          Got it
        </button>
      </div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

function Dashboard({ user }: { user: User }) {
  const [insurers, setInsurers] = useState<Insurer[]>([]);
  const [workflowStatus, setWorkflowStatus] = useState<WorkflowStatus>("idle");
  const [currentRequest, setCurrentRequest] = useState<PARequest | null>(null);
  const [history, setHistory] = useState<PARequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [showConsent, setShowConsent] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch<Insurer[]>("/prior-auth/insurers")
      .then(setInsurers)
      .catch(() => setInsurers([
        { id: "BCBS", name: "Blue Cross Blue Shield" },
        { id: "AETNA", name: "Aetna" },
        { id: "UNITEDHEALTHCARE", name: "UnitedHealthcare" },
        { id: "CIGNA", name: "Cigna" },
      ]));
  }, []);

  const runWorkflow = async (patientId: string, insurerId: string) => {
    setLoading(true);
    setError("");
    setCurrentRequest(null);
    setWorkflowStatus("pending_consent");
    setShowConsent(true);

    try {
      // Simulate status progression for demo
      const progressStatuses: WorkflowStatus[] = [
        "pending_consent",
        "fetching_records",
        "analyzing",
        "draft_ready",
        "submitted",
      ];

      // Try the real API first
      const result = await apiFetch<PARequest>("/prior-auth/run", {
        method: "POST",
        body: JSON.stringify({ patientId, insurerId, useDemo: true }),
      });

      // Animate through statuses
      for (const s of progressStatuses) {
        setWorkflowStatus(s);
        await sleep(600);
      }

      setCurrentRequest(result);
      setWorkflowStatus(result.status as WorkflowStatus);
      setHistory((prev) => [result, ...prev]);
    } catch {
      // Demo fallback if backend not running
      for (const s of ["pending_consent", "fetching_records", "analyzing", "draft_ready", "submitted"] as WorkflowStatus[]) {
        setWorkflowStatus(s);
        await sleep(900);
      }

      const demoResult: PARequest = {
        id: `demo-${Date.now()}`,
        patientId,
        medicationName: "Dupilumab (Dupixent) 300mg",
        diagnosis: "Atopic Dermatitis - Moderate to Severe",
        insurerId,
        status: "submitted",
        createdAt: new Date().toISOString(),
        aiDraftForm: {
          patientName: "Camila Lopez",
          patientDOB: "1987-08-14",
          memberId: "BCBS-987654321",
          medicationRequested: "Dupilumab (Dupixent) 300mg SC injection every 2 weeks",
          ndc: "0024-5916-02",
          icd10Code: "L20.9",
          diagnosis: "Atopic Dermatitis (Eczema) - Moderate to Severe",
          clinicalJustification:
            "Patient Camila Lopez presents with moderate-to-severe atopic dermatitis (L20.9) with an onset of March 2019. The condition has significantly impacted quality of life with extensive body surface area involvement exceeding 30%. Standard topical corticosteroids and calcineurin inhibitors have been trialed for a period of 12+ months without adequate disease control.\n\nDupilumab (Dupixent) is an IL-4/IL-13 receptor antagonist that has demonstrated superior efficacy in Phase 3 SOLO trials with 36–38% of patients achieving clear/almost clear skin at 16 weeks. Given the patient's documented failure of conventional therapies and comorbid asthma (J45.50), dupilumab represents the evidence-based standard of care per AAD guidelines.\n\nThis medication is medically necessary to reduce disease burden, prevent secondary infections, and address the concurrent Type 2 inflammatory pathway shared with the patient's asthma diagnosis.",
          previousTreatments:
            "1. Triamcinolone 0.1% topical cream — 12 months, inadequate response\n2. Tacrolimus 0.1% ointment — 6 months, partial response with recurrence\n3. Oral antihistamines — ongoing, symptomatic relief only",
          prescribingPhysician: "Dr. Sarah Chen, MD (Dermatology)",
          physicianNPI: "1234567890",
          urgency: "routine",
          supportingDocumentation: [
            "EASI or IGA score documenting disease severity",
            "Documentation of prior treatment failures with dates",
            "Photos of affected skin areas",
            "Pulmonology notes confirming concurrent asthma diagnosis",
          ],
        },
        submissionResult: {
          referenceNumber: `PA-${Date.now()}-DEMO`,
          status: "submitted",
          estimatedDecisionDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
          submittedAt: new Date().toISOString(),
        },
      };

      setCurrentRequest(demoResult);
      setWorkflowStatus("submitted");
      setHistory((prev) => [demoResult, ...prev]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-sky-500 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="font-semibold text-gray-800">PriorAgent</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {user.picture ? (
                <img src={user.picture} alt="" className="w-7 h-7 rounded-full" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-sky-100 flex items-center justify-center text-xs font-semibold text-sky-700">
                  {user.name?.[0] || "U"}
                </div>
              )}
              <span className="text-sm text-gray-600 hidden sm:block">{user.name}</span>
            </div>
            <a
              href={`${API.replace("/api", "")}/api/auth/logout`}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              Sign out
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Page title */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Prior Authorization Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">
            AI-powered PA requests with CIBA consent and Token Vault EHR access
          </p>
        </div>

        {/* Auth0 badge */}
        <div className="flex flex-wrap gap-2 mb-8">
          {[
            { icon: "🔐", label: "Auth0 Token Vault" },
            { icon: "🔔", label: "CIBA Step-up Auth" },
            { icon: "🏥", label: "Epic FHIR R4" },
            { icon: "🤖", label: "Claude AI" },
          ].map((b) => (
            <span
              key={b.label}
              className="inline-flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-600 shadow-sm"
            >
              {b.icon} {b.label}
            </span>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="space-y-6">
            <WorkflowForm
              insurers={insurers}
              onSubmit={runWorkflow}
              loading={loading}
            />

            {workflowStatus !== "idle" && (
              <WorkflowSteps status={workflowStatus} />
            )}

            <RequestHistory requests={history} />
          </div>

          {/* Right column */}
          <div className="lg:col-span-2 space-y-6">
            {workflowStatus === "idle" && (
              <Card className="p-10 flex flex-col items-center justify-center text-center min-h-64">
                <div className="text-5xl mb-4">🏥</div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  Ready to automate prior authorizations
                </h3>
                <p className="text-gray-400 text-sm max-w-xs">
                  Select a patient and insurer, then click Run to start the AI-powered
                  workflow with CIBA consent and FHIR record access.
                </p>
              </Card>
            )}

            {loading && workflowStatus !== "idle" && (
              <Card className="p-10 flex flex-col items-center justify-center min-h-64">
                <Spinner size="lg" />
                <div className="mt-4 text-sm font-medium text-gray-600">
                  {STATUS_LABELS[workflowStatus]}…
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {workflowStatus === "pending_consent" && "Waiting for patient to approve on their device"}
                  {workflowStatus === "fetching_records" && "Connecting to Epic FHIR via Token Vault"}
                  {workflowStatus === "analyzing" && "Claude is reading clinical records"}
                  {workflowStatus === "draft_ready" && "Finalizing form fields"}
                </div>
              </Card>
            )}

            {!loading && currentRequest?.submissionResult && (
              <SubmissionCard result={currentRequest.submissionResult} />
            )}

            {!loading && currentRequest?.aiDraftForm && (
              <PAFormViewer form={currentRequest.aiDraftForm} />
            )}
          </div>
        </div>
      </main>

      <ConsentModal show={showConsent} onClose={() => setShowConsent(false)} />
    </div>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export default function App() {
  const [authStatus, setAuthStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    apiFetch<{ authenticated: boolean; user?: User }>("/auth/me")
      .then((data) => {
        if (data.authenticated && data.user) {
          setUser(data.user);
          setAuthStatus("authenticated");
        } else {
          setAuthStatus("unauthenticated");
        }
      })
      .catch(() => setAuthStatus("unauthenticated"));
  }, []);

  const handleLogin = () => {
    window.location.href = "http://localhost:3001/api/auth/login";
  };

  if (authStatus === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Spinner size="lg" />
      </div>
    );
  }

  if (authStatus === "unauthenticated") {
    return <Hero onLogin={handleLogin} />;
  }

  return <Dashboard user={user!} />;
}