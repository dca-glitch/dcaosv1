import { useCallback, useEffect, useState } from "react";
import type {
   MarketIntelligenceProjectSummary,
   MarketIntelligenceSourceSummary,
   MarketIntelligenceResearchRunSummary,
   MarketIntelligenceInsightSummary,
   MarketIntelligenceHandoffSummary
} from "@dca-os-v1/shared";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api/v1";

async function apiCall(endpoint: string, method: string = "GET", body?: unknown) {
   const headers: Record<string, string> = {
     "Content-Type": "application/json"
   };
   const token = window.sessionStorage.getItem("dcaosv1.authToken");
   if (token) {
     headers.Authorization = `Bearer ${token}`;
   }

   const options: RequestInit = {
     method,
     headers
   };
   if (body) {
     options.body = JSON.stringify(body);
   }

   const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
   if (!response.ok) {
     throw new Error(`API error: ${response.statusText}`);
   }
   return response.json();
}

export function AiMarketIntelligencePage() {
   const [projects, setProjects] = useState<MarketIntelligenceProjectSummary[]>([]);
   const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
   const [selectedProject, setSelectedProject] = useState<MarketIntelligenceProjectSummary | null>(null);
   const [sources, setSources] = useState<MarketIntelligenceSourceSummary[]>([]);
   const [runs, setRuns] = useState<MarketIntelligenceResearchRunSummary[]>([]);
   const [insights, setInsights] = useState<MarketIntelligenceInsightSummary[]>([]);
   const [handoffs, setHandoffs] = useState<MarketIntelligenceHandoffSummary[]>([]);
   const [handoffPreparing, setHandoffPreparing] = useState<string | null>(null); // insightId being prepared
   const [isLoading, setIsLoading] = useState(false);
   const [showProjectModal, setShowProjectModal] = useState(false);
   const [showSourceModal, setShowSourceModal] = useState(false);
   const [showInsightModal, setShowInsightModal] = useState(false);
   const [projectForm, setProjectForm] = useState({ title: "", description: "", keywords: "", competitors: "", niche: "", productServiceFocus: "", targetClientName: "", targetMonth: "" });
   const [sourceForm, setSourceForm] = useState({ title: "", sourceUrl: "", sourceNotes: "" });
   const [insightForm, setInsightForm] = useState({ title: "", summary: "", status: "DRAFT" });

   // Load projects on mount
   useEffect(() => {
     loadProjects();
   }, []);

   // Load project data when selected project changes
   useEffect(() => {
     if (selectedProjectId) {
       const project = projects.find((p) => p.id === selectedProjectId);
       if (project) {
         setSelectedProject(project);
         loadProjectData(selectedProjectId);
       }
     }
   }, [selectedProjectId, projects]);

   const loadProjects = async () => {
     try {
       const response = await apiCall("/market-intelligence-projects", "GET");
       if (response?.projects) {
         setProjects(response.projects);
       }
     } catch (error) {
       console.error("Failed to load projects:", error);
     }
   };

   const loadProjectData = async (projectId: string) => {
     setIsLoading(true);
     try {
       const [sourcesRes, runsRes, insightsRes] = await Promise.all([
         apiCall(`/market-intelligence-projects/${projectId}/sources`, "GET"),
         apiCall(`/market-intelligence-projects/${projectId}/research-runs`, "GET"),
         apiCall(`/market-intelligence-projects/${projectId}/insights`, "GET")
       ]);

       if (sourcesRes?.sources) setSources(sourcesRes.sources);
       if (runsRes?.researchRuns) setRuns(runsRes.researchRuns);
       if (insightsRes?.insights) setInsights(insightsRes.insights);

       // Load handoffs
       try {
         const handoffsRes = await apiCall(`/market-intelligence-projects/${projectId}/handoffs`, "GET");
         if (handoffsRes?.data?.handoffs) setHandoffs(handoffsRes.data.handoffs);
       } catch {
         setHandoffs([]);
       }
     } catch (error) {
       console.error("Failed to load project data:", error);
     } finally {
       setIsLoading(false);
     }
   };

   const handleCreateProject = useCallback(async () => {
     if (!projectForm.title) {
       alert("Title is required");
       return;
     }

     try {
       const result = await apiCall("/market-intelligence-projects", "POST", projectForm);
       if (result?.project) {
         setProjectForm({ title: "", description: "", keywords: "", competitors: "", niche: "", productServiceFocus: "", targetClientName: "", targetMonth: "" });
         setShowProjectModal(false);
         await loadProjects();
       }
     } catch (error) {
       console.error("Failed to create project:", error);
       alert("Failed to create project");
     }
   }, [projectForm]);

   const handleCreateSource = useCallback(async () => {
     if (!selectedProjectId || !sourceForm.title) {
       alert("Project and title are required");
       return;
     }

     try {
       const result = await apiCall(
         `/market-intelligence-projects/${selectedProjectId}/sources`,
         "POST",
         { ...sourceForm, projectId: selectedProjectId }
       );
       if (result?.source) {
         setSourceForm({ title: "", sourceUrl: "", sourceNotes: "" });
         setShowSourceModal(false);
         await loadProjectData(selectedProjectId);
       }
     } catch (error) {
       console.error("Failed to create source:", error);
       alert("Failed to create source");
     }
   }, [selectedProjectId, sourceForm]);

   const handleCreateInsight = useCallback(async () => {
     if (!selectedProjectId || !insightForm.title) {
       alert("Project and title are required");
       return;
     }

     try {
       const result = await apiCall(
         `/market-intelligence-projects/${selectedProjectId}/insights`,
         "POST",
         { ...insightForm, projectId: selectedProjectId }
       );
       if (result?.insight) {
         setInsightForm({ title: "", summary: "", status: "DRAFT" });
         setShowInsightModal(false);
         await loadProjectData(selectedProjectId);
       }
     } catch (error) {
       console.error("Failed to create insight:", error);
       alert("Failed to create insight");
     }
   }, [selectedProjectId, insightForm]);


   const handleCreateRun = useCallback(async () => {
     if (!selectedProjectId) return;

     try {
       const result = await apiCall(
         `/market-intelligence-projects/${selectedProjectId}/research-runs`,
         "POST",
         { projectId: selectedProjectId, status: "PENDING" }
       );
       if (result?.researchRun) {
         await loadProjectData(selectedProjectId);
       }
     } catch (error) {
       console.error("Failed to create run:", error);
       alert("Failed to create run");
     }
   }, [selectedProjectId]);

   const handleExecuteRun = useCallback(async (runId: string) => {
     if (!selectedProjectId) return;

     try {
       const result = await apiCall(
         `/market-intelligence-projects/${selectedProjectId}/research-runs/${runId}/execute`,
         "POST"
       );
       if (result?.researchRun) {
         await loadProjectData(selectedProjectId);
       }
     } catch (error) {
       console.error("Failed to execute run:", error);
       alert("Failed to execute run");
     }
   }, [selectedProjectId]);

   const handlePrepareHandoff = useCallback(async (insightId: string) => {
    if (!selectedProjectId) return;
    setHandoffPreparing(insightId);
    try {
      const result = await apiCall(
        `/market-intelligence-projects/${selectedProjectId}/handoffs/prepare`,
        "POST",
        { insightId }
      );
      if (result?.data?.handoff) {
        await loadProjectData(selectedProjectId);
      } else {
        alert("Handoff prepare failed. Ensure the insight is APPROVED.");
      }
    } catch (error) {
      console.error("Failed to prepare handoff:", error);
      alert("Failed to prepare handoff");
    } finally {
      setHandoffPreparing(null);
    }
   }, [selectedProjectId]);

   const handleUpdateHandoffStatus = useCallback(async (handoffId: string, handoffStatus: string) => {
    if (!selectedProjectId) return;
    try {
      await apiCall(
        `/market-intelligence-projects/${selectedProjectId}/handoffs/${handoffId}/status`,
        "PUT",
        { handoffStatus }
      );
      await loadProjectData(selectedProjectId);
    } catch (error) {
      console.error("Failed to update handoff status:", error);
      alert("Failed to update handoff status");
    }
   }, [selectedProjectId]);

   return (
     <section style={{ padding: "1.5rem" }}>
       <div style={{ marginBottom: "1.5rem" }}>
         <h1>Market Intelligence</h1>
         <p>Admin-only competitive analysis and market research hub</p>
       </div>

       <div style={{ display: "grid", gridTemplateColumns: "250px 1fr", gap: "1.5rem", marginTop: "1.5rem" }}>
         {/* Sidebar - Project List */}
         <div style={{ borderRight: "1px solid var(--color-border)" }}>
           <div style={{ marginBottom: "1rem" }}>
             <button
               onClick={() => setShowProjectModal(true)}
               style={{
                 width: "100%",
                 padding: "0.5rem 0.75rem",
                 backgroundColor: "var(--color-primary)",
                 color: "white",
                 border: "none",
                 borderRadius: "4px",
                 cursor: "pointer",
                 fontSize: "0.875rem"
               }}
             >
               + New Project
             </button>
           </div>

           <div style={{ maxHeight: "600px", overflowY: "auto" }}>
             {projects.map((project) => (
               <div
                 key={project.id}
                 onClick={() => setSelectedProjectId(project.id)}
                 style={{
                   padding: "0.75rem",
                   marginBottom: "0.5rem",
                   backgroundColor: selectedProjectId === project.id ? "var(--color-bg-secondary)" : "transparent",
                   borderLeft: selectedProjectId === project.id ? "3px solid var(--color-primary)" : "3px solid transparent",
                   cursor: "pointer",
                   borderRadius: "4px"
                 }}
               >
                 <div style={{ fontWeight: "500", fontSize: "0.875rem" }}>{project.title}</div>
                 <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "0.25rem" }}>
                   {new Date(project.createdAt).toLocaleDateString()}
                 </div>
               </div>
             ))}
           </div>
         </div>

         {/* Main Content */}
         <div>
           {selectedProject ? (
             <div>
               <div style={{ marginBottom: "2rem" }}>
                 <h2>{selectedProject.title}</h2>
                 <p style={{ color: "var(--color-text-muted)", marginTop: "0.5rem" }}>
                   {selectedProject.description || "No description"}
                 </p>
                 {((selectedProject as any).targetClientName || (selectedProject as any).targetMonth) && (
                   <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", marginTop: "0.25rem" }}>
                     {(selectedProject as any).targetClientName ? `Client: ${(selectedProject as any).targetClientName}` : ""}
                     {(selectedProject as any).targetClientName && (selectedProject as any).targetMonth ? " · " : ""}
                     {(selectedProject as any).targetMonth ? `Month: ${(selectedProject as any).targetMonth}` : ""}
                   </p>
                 )}
                 {((selectedProject as any).niche || (selectedProject as any).productServiceFocus) && (
                   <div style={{ marginTop: "0.5rem", fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
                     {(selectedProject as any).niche && <span>Niche: <strong>{(selectedProject as any).niche}</strong></span>}
                     {(selectedProject as any).niche && (selectedProject as any).productServiceFocus ? " · " : ""}
                     {(selectedProject as any).productServiceFocus && <span>Focus: <strong>{(selectedProject as any).productServiceFocus}</strong></span>}
                   </div>
                 )}
                 {(selectedProject as any).keywords && (
                   <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", marginTop: "0.25rem" }}>
                     Keywords: {(selectedProject as any).keywords}
                   </p>
                 )}
                 {(selectedProject as any).competitors && (
                   <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", marginTop: "0.25rem" }}>
                     Competitors: {(selectedProject as any).competitors}
                   </p>
                 )}
               </div>

               {/* Sources Section */}
               <div style={{ marginBottom: "2rem" }}>
                 <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                   <h3>Research Sources</h3>
                   <button
                     onClick={() => setShowSourceModal(true)}
                     style={{
                       padding: "0.5rem 0.75rem",
                       backgroundColor: "var(--color-secondary)",
                       color: "white",
                       border: "none",
                       borderRadius: "4px",
                       cursor: "pointer",
                       fontSize: "0.875rem"
                     }}
                   >
                     + Add Source
                   </button>
                 </div>

                 <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "1rem" }}>
                   {sources.map((source) => (
                     <div
                       key={source.id}
                       style={{
                         padding: "1rem",
                         border: "1px solid var(--color-border)",
                         borderRadius: "6px",
                         backgroundColor: "var(--color-bg)"
                       }}
                     >
                       <h4 style={{ marginBottom: "0.5rem" }}>{source.title}</h4>
                       {source.sourceUrl && (
                         <p style={{ fontSize: "0.875rem", color: "var(--color-primary)", marginBottom: "0.5rem" }}>
                           <a href={source.sourceUrl} target="_blank" rel="noopener noreferrer">
                             {source.sourceUrl}
                           </a>
                         </p>
                       )}
                       {source.sourceNotes && (
                         <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
                           {source.sourceNotes}
                         </p>
                       )}
                     </div>
                   ))}
                 </div>
               </div>

               {/* Research Runs Section */}
               <div style={{ marginBottom: "2rem" }}>
                 <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                   <h3>Research Runs</h3>
                   <button
                     onClick={handleCreateRun}
                     style={{
                       padding: "0.5rem 0.75rem",
                       backgroundColor: "var(--color-secondary)",
                       color: "white",
                       border: "none",
                       borderRadius: "4px",
                       cursor: "pointer",
                       fontSize: "0.875rem"
                     }}
                   >
                     + Create Run
                   </button>
                 </div>
                 <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "1rem" }}>
                   {runs.map((run) => (
                     <div
                       key={run.id}
                       style={{
                         padding: "1rem",
                         border: "1px solid var(--color-border)",
                         borderRadius: "6px",
                         backgroundColor: "var(--color-bg)"
                       }}
                     >
                       <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                         <span
                           style={{
                             fontSize: "0.875rem",
                             fontWeight: "500",
                             padding: "0.25rem 0.5rem",
                             backgroundColor: run.status === "EXECUTED" ? "#10b981" : run.status === "PENDING" ? "#f59e0b" : "var(--color-bg-secondary)",
                             color: run.status === "EXECUTED" || run.status === "PENDING" ? "white" : "inherit",
                             borderRadius: "3px"
                           }}
                         >
                           {run.status}
                         </span>
                         {run.status === "PENDING" && (
                           <button
                             onClick={() => handleExecuteRun(run.id)}
                             style={{
                               padding: "0.35rem 0.5rem",
                               backgroundColor: "var(--color-success)",
                               color: "white",
                               border: "none",
                               borderRadius: "3px",
                               cursor: "pointer",
                               fontSize: "0.75rem"
                             }}
                           >
                             Execute
                           </button>
                         )}
                       </div>
                       {(run as any).sourceCount !== undefined && (
                         <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginBottom: "0.5rem" }}>
                           Analyzed {(run as any).sourceCount} source{(run as any).sourceCount !== 1 ? 's' : ''}
                         </p>
                       )}
                       {run.resultSummary && (
                         <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", marginBottom: "0.5rem" }}>
                           {run.resultSummary}
                         </p>
                       )}
                       {(run as any).generatedInsightId && (
                         <p style={{ fontSize: "0.75rem", color: "var(--color-secondary)", marginBottom: "0.5rem", fontWeight: "500" }}>
                           ✓ Generated Insight (see Market Insights section)
                         </p>
                       )}
                       {(run as any).executionLog && (
                         <details style={{ marginTop: "0.5rem" }}>
                           <summary style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", cursor: "pointer", marginBottom: "0.5rem" }}>
                             Execution Log
                           </summary>
                           <pre style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", backgroundColor: "var(--color-bg-secondary)", padding: "0.5rem", borderRadius: "4px", overflowX: "auto", whiteSpace: "pre-wrap", marginTop: "0.25rem" }}>
                             {(run as any).executionLog}
                           </pre>
                         </details>
                       )}
                     </div>
                   ))}
                 </div>
               </div>

               {/* Insights Section */}
               <div style={{ marginBottom: "2rem" }}>
                 <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                   <h3>Market Insights</h3>
                   <button
                     onClick={() => setShowInsightModal(true)}
                     style={{
                       padding: "0.5rem 0.75rem",
                       backgroundColor: "var(--color-secondary)",
                       color: "white",
                       border: "none",
                       borderRadius: "4px",
                       cursor: "pointer",
                       fontSize: "0.875rem"
                     }}
                   >
                     + Add Insight
                   </button>
                 </div>

                 <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
                   {insights.map((insight) => (
                     <div
                       key={insight.id}
                       style={{
                         padding: "1rem",
                         border: "1px solid var(--color-border)",
                         borderRadius: "6px",
                         backgroundColor: "var(--color-bg)"
                       }}
                     >
                       <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "0.75rem" }}>
                         <div>
                           <h4 style={{ marginBottom: "0.25rem" }}>{insight.title}</h4>
                           {(insight as any).sourceCount !== undefined && (
                             <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", margin: "0" }}>
                               Evidence: Based on {(insight as any).sourceCount} project source{(insight as any).sourceCount !== 1 ? 's' : ''}
                             </p>
                           )}
                         </div>
                         <select
                           value={insight.status}
                           onChange={async (e) => {
                             const newStatus = e.target.value;
                             try {
                               await apiCall(`/market-intelligence-projects/${selectedProjectId}/insights/${insight.id}`, "PUT", { status: newStatus });
                               await loadProjectData(selectedProjectId!);
                             } catch (err) {
                               console.error(err);
                               alert("Failed to update status");
                             }
                           }}
                           style={{
                             padding: "0.25rem 0.5rem",
                             backgroundColor:
                               insight.status === "APPROVED" ? "#10b981" :
                               insight.status === "REVIEWED" ? "#3b82f6" :
                               insight.status === "NEEDS_REVISION" ? "#f59e0b" :
                               "var(--color-bg-secondary)",
                             color:
                               insight.status === "APPROVED" || insight.status === "REVIEWED" || insight.status === "NEEDS_REVISION" ? "white" : "inherit",
                             border: "1px solid var(--color-border)",
                             borderRadius: "3px",
                             fontSize: "0.75rem",
                             fontWeight: "500",
                             cursor: "pointer"
                           }}
                         >
                           <option value="DRAFT">DRAFT</option>
                           <option value="NEEDS_REVISION">NEEDS_REVISION</option>
                           <option value="REVIEWED">REVIEWED</option>
                           <option value="APPROVED">APPROVED</option>
                         </select>
                       </div>
                       {insight.summary && (
                         <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", marginBottom: "0.75rem" }}>
                           {insight.summary}
                         </p>
                       )}
                       {(insight as any).resultData && (
                         <div style={{ marginTop: "1rem", borderTop: "1px solid var(--color-border)", paddingTop: "1rem" }}>
                           <h5 style={{ marginBottom: "0.5rem", fontSize: "0.875rem" }}>Structured Output</h5>
                           <div style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
                             {Object.entries((insight as any).resultData).map(([key, value]) => {
                               if (!value || (Array.isArray(value) && value.length === 0)) return null;
                               return (
                                 <div key={key} style={{ marginBottom: "0.5rem" }}>
                                   <strong>{key}:</strong>
                                   {Array.isArray(value) ? (
                                     <ul style={{ margin: "0.25rem 0", paddingLeft: "1.5rem" }}>
                                       {value.map((v, i) => <li key={i}>{v}</li>)}
                                     </ul>
                                   ) : (
                                     <span style={{ marginLeft: "0.25rem" }}>{String(value)}</span>
                                   )}
                                 </div>
                               );
                             })}
                           </div>
                         </div>
                       )}
                       {insight.reviewerNotes && (
                         <div style={{
                           marginTop: "0.75rem",
                           padding: "0.75rem",
                           backgroundColor: "var(--color-bg-secondary)",
                           borderLeft: "3px solid var(--color-secondary)",
                           borderRadius: "4px"
                         }}>
                           <p style={{ fontSize: "0.75rem", fontWeight: "600", marginBottom: "0.25rem", color: "var(--color-text)" }}>
                             Reviewer Notes:
                           </p>
                           <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", margin: "0" }}>
                             {insight.reviewerNotes}
                           </p>
                         </div>
                       )}
                     </div>
                   ))}
                 </div>
               </div>

               {/* Internal Handoffs Section */}
               <div style={{ marginBottom: "2rem" }}>
                 <div style={{ marginBottom: "1rem" }}>
                   <h3>Internal Handoffs</h3>
                   <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", margin: "0.25rem 0 0" }}>
                     Admin-only delivery planning bridge. Prepare a handoff from an APPROVED insight to use in AI Delivery or reporting.
                   </p>
                 </div>

                 {/* Approved insights available for handoff */}
                 {insights.filter(i => i.status === "APPROVED" && !i.isArchived).length > 0 && (
                   <div style={{ marginBottom: "1rem", padding: "0.75rem", border: "1px solid var(--color-border)", borderRadius: "6px", backgroundColor: "var(--color-bg-secondary)" }}>
                     <p style={{ fontSize: "0.875rem", fontWeight: "600", marginBottom: "0.5rem" }}>Approved insights ready for handoff:</p>
                     {insights.filter(i => i.status === "APPROVED" && !i.isArchived).map(insight => (
                       <div key={insight.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                         <span style={{ fontSize: "0.875rem" }}>{insight.title}</span>
                         <button
                           onClick={() => handlePrepareHandoff(insight.id)}
                           disabled={handoffPreparing === insight.id}
                           style={{
                             padding: "0.3rem 0.6rem",
                             backgroundColor: handoffPreparing === insight.id ? "var(--color-bg-secondary)" : "var(--color-primary)",
                             color: handoffPreparing === insight.id ? "var(--color-text-muted)" : "white",
                             border: "none",
                             borderRadius: "3px",
                             cursor: handoffPreparing === insight.id ? "not-allowed" : "pointer",
                             fontSize: "0.75rem",
                             fontWeight: "500"
                           }}
                         >
                           {handoffPreparing === insight.id ? "Preparing…" : "Prepare Internal Handoff"}
                         </button>
                       </div>
                     ))}
                   </div>
                 )}

                 {/* Handoff cards */}
                 {handoffs.length === 0 ? (
                   <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
                     No internal handoffs yet. Approve an insight above, then prepare a handoff.
                   </p>
                 ) : (
                   <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
                     {handoffs.map(handoff => (
                       <div
                         key={handoff.id}
                         style={{ padding: "1rem", border: "1px solid var(--color-border)", borderRadius: "6px", backgroundColor: "var(--color-bg)" }}
                       >
                         <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "0.75rem" }}>
                           <div>
                             <h4 style={{ marginBottom: "0.25rem", fontSize: "0.9rem" }}>{handoff.title}</h4>
                             {(handoff.targetClientName || handoff.targetMonth) && (
                               <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", margin: "0" }}>
                                 {handoff.targetClientName ? `Client: ${handoff.targetClientName}` : ""}
                                 {handoff.targetClientName && handoff.targetMonth ? " · " : ""}
                                 {handoff.targetMonth ? `Month: ${handoff.targetMonth}` : ""}
                               </p>
                             )}
                           </div>
                           <select
                             value={handoff.handoffStatus}
                             onChange={async (e) => handleUpdateHandoffStatus(handoff.id, e.target.value)}
                             style={{
                               padding: "0.25rem 0.5rem",
                               backgroundColor:
                                 handoff.handoffStatus === "APPLIED" ? "#10b981" :
                                 handoff.handoffStatus === "READY" ? "#3b82f6" :
                                 "var(--color-bg-secondary)",
                               color:
                                 handoff.handoffStatus === "APPLIED" || handoff.handoffStatus === "READY" ? "white" : "inherit",
                               border: "1px solid var(--color-border)",
                               borderRadius: "3px",
                               fontSize: "0.75rem",
                               fontWeight: "500",
                               cursor: "pointer"
                             }}
                           >
                             <option value="DRAFT">DRAFT</option>
                             <option value="READY">READY</option>
                             <option value="APPLIED">APPLIED</option>
                             <option value="ARCHIVED">ARCHIVED</option>
                           </select>
                         </div>

                         {handoff.marketSummary && (
                           <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", marginBottom: "0.5rem" }}>
                             {handoff.marketSummary}
                           </p>
                         )}

                         {handoff.audienceSignals && handoff.audienceSignals.length > 0 && (
                           <div style={{ marginBottom: "0.5rem" }}>
                             <p style={{ fontSize: "0.75rem", fontWeight: "600", marginBottom: "0.25rem" }}>Audience signals:</p>
                             <ul style={{ margin: "0", paddingLeft: "1.25rem", fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                               {handoff.audienceSignals.map((s, i) => <li key={i}>{s}</li>)}
                             </ul>
                           </div>
                         )}

                         {handoff.opportunities && handoff.opportunities.length > 0 && (
                           <div style={{ marginBottom: "0.5rem" }}>
                             <p style={{ fontSize: "0.75rem", fontWeight: "600", marginBottom: "0.25rem" }}>Opportunities:</p>
                             <ul style={{ margin: "0", paddingLeft: "1.25rem", fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                               {handoff.opportunities.map((o, i) => <li key={i}>{o}</li>)}
                             </ul>
                           </div>
                         )}

                         {handoff.risks && handoff.risks.length > 0 && (
                           <div style={{ marginBottom: "0.5rem" }}>
                             <p style={{ fontSize: "0.75rem", fontWeight: "600", marginBottom: "0.25rem" }}>Risks:</p>
                             <ul style={{ margin: "0", paddingLeft: "1.25rem", fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                               {handoff.risks.map((r, i) => <li key={i}>{r}</li>)}
                             </ul>
                           </div>
                         )}

                         {handoff.recommendedActions && handoff.recommendedActions.length > 0 && (
                           <div style={{ marginBottom: "0.5rem" }}>
                             <p style={{ fontSize: "0.75rem", fontWeight: "600", marginBottom: "0.25rem" }}>Recommended actions:</p>
                             <ul style={{ margin: "0", paddingLeft: "1.25rem", fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                               {handoff.recommendedActions.map((a, i) => <li key={i}>{a}</li>)}
                             </ul>
                           </div>
                         )}

                         {handoff.sourceNote && (
                           <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontStyle: "italic", marginTop: "0.5rem", marginBottom: "0" }}>
                             {handoff.sourceNote}
                           </p>
                         )}
                       </div>
                     ))}
                   </div>
                 )}
               </div>
             </div>
           ) : (
             <div style={{ textAlign: "center", padding: "2rem", color: "var(--color-text-muted)" }}>
               Select a project to view details
             </div>
           )}
         </div>
       </div>

       {/* Project Modal */}
       {showProjectModal && (
         <div
           style={{
             position: "fixed",
             top: "0",
             left: "0",
             right: "0",
             bottom: "0",
             backgroundColor: "rgba(0, 0, 0, 0.5)",
             display: "flex",
             alignItems: "center",
             justifyContent: "center",
             zIndex: 1000
           }}
           onClick={() => setShowProjectModal(false)}
         >
           <div
             style={{
               backgroundColor: "white",
               borderRadius: "8px",
               padding: "2rem",
               maxWidth: "480px",
               width: "90%",
               maxHeight: "90vh",
               overflowY: "auto"
             }}
             onClick={(e) => e.stopPropagation()}
           >
             <h2 style={{ marginBottom: "1rem" }}>Create Project</h2>
             <div style={{ marginBottom: "1rem" }}>
               <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
                 Project Name *
               </label>
               <input
                 type="text"
                 value={projectForm.title}
                 onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })}
                 style={{
                   width: "100%",
                   padding: "0.5rem",
                   border: "1px solid var(--color-border)",
                   borderRadius: "4px",
                   boxSizing: "border-box"
                 }}
               />
             </div>
             <div style={{ marginBottom: "1.5rem" }}>
               <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
                 Description
               </label>
               <textarea
                 value={projectForm.description}
                 onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                 style={{
                   width: "100%",
                   padding: "0.5rem",
                   border: "1px solid var(--color-border)",
                   borderRadius: "4px",
                   boxSizing: "border-box",
                   minHeight: "80px"
                 }}
               />
             </div>
             <div style={{ marginBottom: "1rem" }}>
               <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
                 Keywords (comma-separated)
               </label>
               <input
                 type="text"
                 value={projectForm.keywords}
                 onChange={(e) => setProjectForm({ ...projectForm, keywords: e.target.value })}
                 placeholder="e.g. AI tools, SaaS pricing, content marketing"
                 style={{ width: "100%", padding: "0.5rem", border: "1px solid var(--color-border)", borderRadius: "4px", boxSizing: "border-box" }}
               />
             </div>
             <div style={{ marginBottom: "1rem" }}>
               <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
                 Competitors (comma-separated)
               </label>
               <input
                 type="text"
                 value={projectForm.competitors}
                 onChange={(e) => setProjectForm({ ...projectForm, competitors: e.target.value })}
                 placeholder="e.g. Acme Corp, Rival Co"
                 style={{ width: "100%", padding: "0.5rem", border: "1px solid var(--color-border)", borderRadius: "4px", boxSizing: "border-box" }}
               />
             </div>
             <div style={{ marginBottom: "1rem" }}>
               <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
                 Market Niche
               </label>
               <input
                 type="text"
                 value={projectForm.niche}
                 onChange={(e) => setProjectForm({ ...projectForm, niche: e.target.value })}
                 placeholder="e.g. B2B SaaS, local SEO agencies"
                 style={{ width: "100%", padding: "0.5rem", border: "1px solid var(--color-border)", borderRadius: "4px", boxSizing: "border-box" }}
               />
             </div>
             <div style={{ marginBottom: "1rem" }}>
               <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
                 Product / Service Focus
               </label>
               <input
                 type="text"
                 value={projectForm.productServiceFocus}
                 onChange={(e) => setProjectForm({ ...projectForm, productServiceFocus: e.target.value })}
                 placeholder="e.g. content delivery platform, monthly SEO reports"
                 style={{ width: "100%", padding: "0.5rem", border: "1px solid var(--color-border)", borderRadius: "4px", boxSizing: "border-box" }}
               />
             </div>
             <div style={{ marginBottom: "1rem" }}>
               <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
                 Client Name (optional)
               </label>
               <input
                 type="text"
                 value={projectForm.targetClientName}
                 onChange={(e) => setProjectForm({ ...projectForm, targetClientName: e.target.value })}
                 placeholder="e.g. Acme Client"
                 style={{ width: "100%", padding: "0.5rem", border: "1px solid var(--color-border)", borderRadius: "4px", boxSizing: "border-box" }}
               />
             </div>
             <div style={{ marginBottom: "1.5rem" }}>
               <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
                 Target Month (optional)
               </label>
               <input
                 type="text"
                 value={projectForm.targetMonth}
                 onChange={(e) => setProjectForm({ ...projectForm, targetMonth: e.target.value })}
                 placeholder="e.g. 2026-07"
                 style={{ width: "100%", padding: "0.5rem", border: "1px solid var(--color-border)", borderRadius: "4px", boxSizing: "border-box" }}
               />
             </div>
             <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
               <button
                 onClick={() => setShowProjectModal(false)}
                 style={{
                   padding: "0.5rem 1rem",
                   backgroundColor: "var(--color-bg-secondary)",
                   border: "none",
                   borderRadius: "4px",
                   cursor: "pointer"
                 }}
               >
                 Cancel
               </button>
               <button
                 onClick={handleCreateProject}
                 style={{
                   padding: "0.5rem 1rem",
                   backgroundColor: "var(--color-primary)",
                   color: "white",
                   border: "none",
                   borderRadius: "4px",
                   cursor: "pointer"
                 }}
               >
                 Create
               </button>
             </div>
           </div>
         </div>
       )}

       {/* Source Modal */}
       {showSourceModal && (
         <div
           style={{
             position: "fixed",
             top: "0",
             left: "0",
             right: "0",
             bottom: "0",
             backgroundColor: "rgba(0, 0, 0, 0.5)",
             display: "flex",
             alignItems: "center",
             justifyContent: "center",
             zIndex: 1000
           }}
           onClick={() => setShowSourceModal(false)}
         >
           <div
             style={{
               backgroundColor: "white",
               borderRadius: "8px",
               padding: "2rem",
               maxWidth: "400px",
               width: "90%"
             }}
             onClick={(e) => e.stopPropagation()}
           >
             <h2 style={{ marginBottom: "1rem" }}>Add Research Source</h2>
             <div style={{ marginBottom: "1rem" }}>
               <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
                 Source Title *
               </label>
               <input
                 type="text"
                 value={sourceForm.title}
                 onChange={(e) => setSourceForm({ ...sourceForm, title: e.target.value })}
                 style={{
                   width: "100%",
                   padding: "0.5rem",
                   border: "1px solid var(--color-border)",
                   borderRadius: "4px",
                   boxSizing: "border-box"
                 }}
               />
             </div>
             <div style={{ marginBottom: "1rem" }}>
               <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
                 Source URL
               </label>
               <input
                 type="text"
                 value={sourceForm.sourceUrl}
                 onChange={(e) => setSourceForm({ ...sourceForm, sourceUrl: e.target.value })}
                 style={{
                   width: "100%",
                   padding: "0.5rem",
                   border: "1px solid var(--color-border)",
                   borderRadius: "4px",
                   boxSizing: "border-box"
                 }}
               />
             </div>
             <div style={{ marginBottom: "1.5rem" }}>
               <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
                 Notes
               </label>
               <textarea
                 value={sourceForm.sourceNotes}
                 onChange={(e) => setSourceForm({ ...sourceForm, sourceNotes: e.target.value })}
                 style={{
                   width: "100%",
                   padding: "0.5rem",
                   border: "1px solid var(--color-border)",
                   borderRadius: "4px",
                   boxSizing: "border-box",
                   minHeight: "60px"
                 }}
               />
             </div>
             <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
               <button
                 onClick={() => setShowSourceModal(false)}
                 style={{
                   padding: "0.5rem 1rem",
                   backgroundColor: "var(--color-bg-secondary)",
                   border: "none",
                   borderRadius: "4px",
                   cursor: "pointer"
                 }}
               >
                 Cancel
               </button>
               <button
                 onClick={handleCreateSource}
                 style={{
                   padding: "0.5rem 1rem",
                   backgroundColor: "var(--color-primary)",
                   color: "white",
                   border: "none",
                   borderRadius: "4px",
                   cursor: "pointer"
                 }}
               >
                 Add Source
               </button>
             </div>
           </div>
         </div>
       )}

       {/* Insight Modal */}
       {showInsightModal && (
         <div
           style={{
             position: "fixed",
             top: "0",
             left: "0",
             right: "0",
             bottom: "0",
             backgroundColor: "rgba(0, 0, 0, 0.5)",
             display: "flex",
             alignItems: "center",
             justifyContent: "center",
             zIndex: 1000
           }}
           onClick={() => setShowInsightModal(false)}
         >
           <div
             style={{
               backgroundColor: "white",
               borderRadius: "8px",
               padding: "2rem",
               maxWidth: "400px",
               width: "90%"
             }}
             onClick={(e) => e.stopPropagation()}
           >
             <h2 style={{ marginBottom: "1rem" }}>Add Market Insight</h2>
             <div style={{ marginBottom: "1rem" }}>
               <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
                 Insight Title *
               </label>
               <input
                 type="text"
                 value={insightForm.title}
                 onChange={(e) => setInsightForm({ ...insightForm, title: e.target.value })}
                 style={{
                   width: "100%",
                   padding: "0.5rem",
                   border: "1px solid var(--color-border)",
                   borderRadius: "4px",
                   boxSizing: "border-box"
                 }}
               />
             </div>
             <div style={{ marginBottom: "1rem" }}>
               <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
                 Summary
               </label>
               <textarea
                 value={insightForm.summary}
                 onChange={(e) => setInsightForm({ ...insightForm, summary: e.target.value })}
                 style={{
                   width: "100%",
                   padding: "0.5rem",
                   border: "1px solid var(--color-border)",
                   borderRadius: "4px",
                   boxSizing: "border-box",
                   minHeight: "60px"
                 }}
               />
             </div>
             <div style={{ marginBottom: "1.5rem" }}>
               <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
                 Status
               </label>
               <select
                 value={insightForm.status}
                 onChange={(e) => setInsightForm({ ...insightForm, status: e.target.value })}
                 style={{
                   width: "100%",
                   padding: "0.5rem",
                   border: "1px solid var(--color-border)",
                   borderRadius: "4px",
                   boxSizing: "border-box"
                 }}
               >
                 <option value="DRAFT">Draft</option>
                 <option value="NEEDS_REVISION">Needs Revision</option>
                 <option value="REVIEWED">Reviewed</option>
                 <option value="APPROVED">Approved</option>
               </select>
             </div>
             <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
               <button
                 onClick={() => setShowInsightModal(false)}
                 style={{
                   padding: "0.5rem 1rem",
                   backgroundColor: "var(--color-bg-secondary)",
                   border: "none",
                   borderRadius: "4px",
                   cursor: "pointer"
                 }}
               >
                 Cancel
               </button>
               <button
                 onClick={handleCreateInsight}
                 style={{
                   padding: "0.5rem 1rem",
                   backgroundColor: "var(--color-primary)",
                   color: "white",
                   border: "none",
                   borderRadius: "4px",
                   cursor: "pointer"
                 }}
               >
                 Add Insight
               </button>
             </div>
           </div>
         </div>
       )}
     </section>
   );
}
