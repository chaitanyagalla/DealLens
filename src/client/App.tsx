import { Link, Route, Routes } from "react-router-dom";
import { LeadDetailPage } from "./pages/LeadDetailPage";
import { ResearchQueuePage } from "./pages/ResearchQueuePage";

export function App() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-line/80 bg-canvas/85 backdrop-blur-xl">
        <div className="mx-auto flex h-18 max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12">
          <Link to="/" className="flex items-center gap-3 text-ink no-underline" aria-label="Shortlist home">
            <span className="grid size-9 place-items-center rounded-[10px_4px_10px_4px] bg-acid font-mono text-xs font-bold text-canvas">
              SL
            </span>
            <span className="text-lg font-bold tracking-[-0.03em]">Shortlist</span>
          </Link>
          <span className="hidden text-xs text-muted sm:block">
            Demo acquisition thesis
          </span>
        </div>
      </header>
      <Routes>
        <Route path="/" element={<ResearchQueuePage />} />
        <Route path="/leads/:leadId" element={<LeadDetailPage />} />
        <Route path="*" element={
          <main className="grid min-h-[70vh] place-items-center px-5 text-center">
            <div>
              <p className="font-mono text-xs uppercase tracking-wider text-danger">Page not found</p>
              <h1 className="mt-3 text-3xl font-semibold text-ink">This page does not exist.</h1>
              <Link to="/" className="mt-6 inline-block rounded-lg bg-acid px-4 py-2.5 text-sm font-semibold text-canvas no-underline">Back to queue</Link>
            </div>
          </main>
        } />
      </Routes>
    </div>
  );
}
