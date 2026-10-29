module.exports = [
 {
  slug:'vingrade', name:'VinGrade', category:'ai', type:'AI · EDUCATION', year:'2026', color:'#194cc2', tint:'#e9efff', image:'vingrade-landing-en.png',
  title:'Grading, with evidence.', summary:'An AI essay grading assistant that keeps teachers in control.',
  stack:['Python','FastAPI','pgvector','React'], status:'Private repository', role:'AI & backend development',
  intro:'Essay scores need a reason. VinGrade connects rubric-based assessment to evidence in the essay, with a review flow for teachers.',
  challenge:'Make AI-assisted assessment inspectable: a teacher should be able to understand the evidence behind a score and review the result.',
  steps:[['Assess','Evaluate the essay against assignment-specific rubric criteria.'],['Ground','Attach quoted essay evidence to the assessment.'],['Review','Let a teacher inspect and review the grading output.']],
  contributions:['Rubric-based grading and evidence validation.','JWT-secured FastAPI endpoints for classes, assignments and rubrics.','Similarity-based duplicate flags for human review.','LLM tracing, token usage visibility and regression checks.'],
  decisions:[['Evidence before confidence','Scores are accompanied by essay evidence so the teacher can inspect the reasoning.'],['A reviewable workflow','AI assists the assessment; teachers remain responsible for reviewing the result.']],
  note:'Built during the Vingroup × VinUni Applied AI Talent Program. The screenshot shows the English landing page from a local build. Repository access is private; no public live demo is linked.'
 },
 {
  slug:'englow3', name:'Englow3', category:'fullstack', type:'FULL-STACK · EDUCATION', year:'2026 — ONGOING', color:'#80522c', tint:'#f4eee6', image:'englow3-interface.png',
  title:'A clearer path to English.', summary:'IELTS and TOEIC preparation, connected across web and mobile.',
  stack:['Spring Boot','Next.js','Expo','PostgreSQL'], status:'Private repository', role:'Backend & platform development',
  intro:'A graduation-thesis project bringing placement, exam practice and learning flows into one English test-preparation platform.',
  challenge:'Keep placement and exam data consistent while supporting different learning experiences on the web and on mobile.',
  steps:[['Place','Use a placement flow to establish a starting point.'],['Practice','Deliver exam and learning content through shared backend models.'],['Connect','Serve web and mobile clients through the platform API.']],
  contributions:['Backend development with Java 21 and Spring Boot 3.','Placement flow and a shared exam model.','PostgreSQL data management with Flyway and jOOQ.','API integration supporting Next.js web and Expo mobile clients.'],
  decisions:[['One shared exam model','Web and mobile consume a consistent representation of exam content.'],['A platform foundation','Schema migrations and modular backend components support ongoing feature work.']],
  note:'Ongoing graduation-thesis project. The screenshot shows the project landing page from a local build. Repository access is private; no public live demo is linked.'
 },
 {
  slug:'ledgerlens', name:'LedgerLens', category:'ai', type:'DOCUMENT AUTOMATION', year:'2026', color:'#6d4b30', tint:'#f2e9dd', image:'ledgerlens-current.png', detailImage:'ledgerlens-review.png',
  title:'From invoice to audit trail.', summary:'A document review workspace for layout-aware invoice extraction and purchase-order matching.',
  stack:['Python','FastAPI','PostgreSQL','Next.js'], status:'Independent demo', repo:'https://github.com/KaitoA1008/ledgerlens', role:'Product, full-stack & workflow development',
  intro:'An independent portfolio demo that makes invoice automation reviewable—from document intake to field evidence, purchase-order checks and approved exports.',
  challenge:'An extracted value is not enough. Reviewers need its source, a way to correct it, and a reliable record of what was approved.',
  steps:[['Extract','Read PDF or image invoices by layout and keep where each value sits on the page.'],['Verify','Inspect field evidence and purchase-order discrepancies.'],['Approve','Create a versioned approval snapshot and export CSV or JSON.']],
  contributions:['Layout-aware extraction with page evidence for every field and line item.','Line-level purchase-order matching and discrepancy handling.','Manual corrections, reviewer-marked evidence and versioned approval snapshots.','A held-out benchmark, background jobs, live updates and CSV/JSON exports.'],
  decisions:[['Evidence stays close','The source document and review controls share a workspace.'],['Approvals are snapshots','Exports correspond to the approved version, rather than an untracked mutable view.']],
  note:'Independent demonstration using synthetic invoices and purchase orders. On 48 synthetic invoices in eight layouts, the local parser reads 216/216 fields on development layouts and 159/216 on held-out layouts, with 97% of filled values correct; receipts and photos remain weak. Optional LLM extraction has not been benchmarked on real business documents. Screenshots are from the working local application.'
 },
 {
  slug:'relaydesk', name:'RelayDesk', category:'ai', type:'AGENT WORKFLOWS', year:'2026', color:'#1d5745', tint:'#e6eee7', image:'relaydesk-current.png', detailImage:'relaydesk-receipt.png',
  title:'Automation, with a handoff.', summary:'A support operations desk with policy retrieval, agent tools and human approval.',
  stack:['LangGraph','PostgreSQL','FastAPI','Next.js'], status:'Independent demo', repo:'https://github.com/KaitoA1008/relaydesk', role:'Product, full-stack & agent workflow development',
  intro:'An independent portfolio demo exploring how an agent can prepare support decisions while a person retains control over sensitive actions.',
  challenge:'Turn a support request into a traceable decision without letting an automated recommendation silently become a real-world action.',
  steps:[['Retrieve','Check order ownership, find versioned policy passages and run read tools.'],['Review','Prepare a grounded reply and pause before any change for human approval.'],['Resolve','Execute the approved sandbox action, record its receipt and resolution history.']],
  contributions:['LangGraph routing with conditional edges and PostgreSQL checkpoints.','Read and write tools with before/after previews and re-checked preconditions.','Hybrid retrieval with optional local embeddings and a semantic intent fallback.','A 90-case benchmark, human approval, receipts and case history.'],
  decisions:[['A deliberate approval boundary','The agent pauses before the reviewer approves an action.'],['Policy versions matter','The case retains the policy context used to prepare the decision.']],
  note:'Independent demonstration using synthetic support cases. On 90 hand-written cases, a local semantic fallback raises correct held-out outcomes from 18/30 to 25/30; 3 of 10 injection phrasings are still answered, but cannot run a tool without approval. Responses default to local templates; actions are sandboxed. No real refund, outbound email or customer-system integration is claimed.'
 }
];
