## Goal

After the roast/analysis, give the user a one-click way to get a clean, ATS-friendly rewritten version of their resume — viewable on screen and downloadable as a PDF.

## UX Flow

1. User uploads → sees scores, roast, fixes, recruiter reactions (existing flow, unchanged).
2. New section at the top of `ResultsView` (or as a new tab): **"Rewrite My Resume"** button with a short tagline ("Let ResumeRIP build a better one for you").
3. Click → button shows a loading state ("Rebuilding your resume…").
4. On success → renders the rewritten resume in a clean preview card (sections: Summary, Skills, Experience, Projects, Education, Certifications) + two action buttons: **Copy text** and **Download PDF**.
5. On failure → toast with the error, button returns to idle so user can retry.

## Backend (new server function)

New file: `src/lib/rewrite.functions.ts`

- `rewriteResume` server function (POST), input `{ resumeText: string }` validated with Zod (50–40,000 chars, same as analyze).
- Calls Lovable AI Gateway with `google/gemini-3-flash-preview`.
- Uses **tool calling** (same pattern as `analyzeResume`) with a tool `submit_rewritten_resume` that returns a structured JSON resume:
  - `name`, `headline`, `contact { email, phone, location, linkedin, github, portfolio }`
  - `summary` (3–4 lines, recruiter-targeted)
  - `skills` (categorized: languages, frameworks, tools, concepts)
  - `experience[]` (company, role, dates, location, bullets[] — strong action verbs + quantified impact)
  - `projects[]` (name, stack, link, bullets[])
  - `education[]` (institution, degree, dates, score)
  - `certifications[]`, `achievements[]` (optional)
- System prompt: ATS-optimized, India fresher-aware, no fluff phrases ("hardworking team player"), uses XYZ format ("did X using Y, achieved Z"), keeps factual content from the original — never invents companies, dates, or fake achievements; only rewords, restructures, and strengthens.
- Returns `{ ok: true, resume }` or `{ ok: false, error }` with the same 429 / 402 handling as `analyzeResume`.

## Frontend

### New component: `src/components/RewrittenResume.tsx`
- Renders the structured resume in clean typography (matches the carbon-black/danger-red theme but the resume preview card uses light/neutral background so it looks like a real document).
- "Copy as text" button → copies a plain-text version (used for ATS parsers).
- "Download PDF" button → calls the PDF generator (below).

### PDF generation (client-side, no server)
- Use **`@react-pdf/renderer`** (works in browser, no native deps, plays nicely with edge runtime since it stays on the client).
- New file: `src/lib/resumePdf.tsx` — defines a single-page A4 ATS-friendly template (clear headings, no multi-column, no graphics, standard fonts) and exports a `downloadResumePdf(resume, filename)` helper that uses `pdf().toBlob()` + `URL.createObjectURL` to trigger a download.

### Wire into `ResultsView.tsx`
- Add a new top-level CTA card above the tabs: heading "Want a better version?" + subtitle + "Rewrite My Resume" button.
- On click: `useServerFn(rewriteResume)` → store result in local state → render `<RewrittenResume />` inline below the CTA (or expand into a modal/drawer — inline is simpler).
- Pass the original `resumeText` down from `routes/index.tsx` (it already has it from PDF parsing) into `ResultsView` as a new prop.

## Files Touched

- **New:** `src/lib/rewrite.functions.ts`
- **New:** `src/components/RewrittenResume.tsx`
- **New:** `src/lib/resumePdf.tsx`
- **Edit:** `src/components/ResultsView.tsx` (add CTA + render rewritten resume)
- **Edit:** `src/routes/index.tsx` (pass `resumeText` prop into `ResultsView`)
- **Install:** `@react-pdf/renderer`

## Out of Scope

- Editing the rewritten resume in-app (read-only preview for v1).
- Saving rewrites to a database (no Cloud yet, per earlier decision).
- Multiple template choices (one clean ATS template for v1).
- Auto-rewriting on low scores (manual button only, per your choice).
