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

// ─── API helper ──────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

// ─── UI Components ───────────────────────────────────────────────────────────

function Spinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const s = size === "sm" ? "h-4 w-4" : size === "lg" ? "h-10 w-10" : "h-6 w-6";
  return (
    <svg className={`animate-spin ${s} text-sky-500`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
      {children}
    </div>
  );
}

// ─── Hero ────────────────────────────────────────────────────────────────────

function Hero({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-950 via-sky-900 to-indigo-900 flex flex-col">
      <nav className="flex items-center justify-between px-8 py-5">
        <span className="text-white font-semibold text-lg">PriorAgent</span>
        <button onClick={onLogin} className="text-sky-200 hover:text-white text-sm">
          Sign in →
        </button>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
        <h1 className="text-5xl font-bold text-white mb-6">
          Prior Authorization, <span className="text-sky-400">handled by AI.</span>
        </h1>

        <div className="flex gap-3">
          <button
            onClick={onLogin}
            className="bg-sky-400 text-sky-950 px-6 py-3 rounded-xl"
          >
            Get Started
          </button>

          {/* ✅ FIXED */}
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="border border-sky-700 text-sky-200 px-6 py-3 rounded-xl"
          >
            View on GitHub
          </a>
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

function Dashboard({ user }: { user: User }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex justify-between">
        <span className="font-semibold">PriorAgent</span>

        <div className="flex items-center gap-3">
          <span>{user.name}</span>

          {/* ✅ FIXED */}
          <a
            href={`${API.replace("/api", "")}/api/auth/logout`}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            Sign out
          </a>
        </div>
      </header>

      <main className="p-6">
        <h1 className="text-xl font-bold">Dashboard</h1>
      </main>
    </div>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────

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
    window.location.href = `${API.replace("/api", "")}/api/auth/login`;
  };

  if (authStatus === "loading") {
    return <div className="min-h-screen flex items-center justify-center"><Spinner /></div>;
  }

  if (authStatus === "unauthenticated") {
    return <Hero onLogin={handleLogin} />;
  }

  return <Dashboard user={user!} />;
}