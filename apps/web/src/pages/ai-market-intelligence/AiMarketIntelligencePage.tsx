import { useCallback, useEffect, useState } from "react";
import type {
   MarketIntelligenceProjectSummary,
   MarketIntelligenceSourceSummary,
   MarketIntelligenceResearchRunSummary,
   MarketIntelligenceInsightSummary
} from "@dca-os-v1/shared";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api/v1";

async function apiCall(endpoint: string, method: string = "GET", body?: unknown) {
   const headers: Record<string, string> = {
     "Content-Type": "application/json"
   };
   const token = localStorage.getItem("dcaosv1.authToken");
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
   const [isLoading, setIsLoading] = useState(false);
   const [showProjectModal, setShowProjectModal] = useState(false);
   const [showSourceModal, setShowSourceModal] = useState(false);
   const [showInsightModal, setShowInsightModal] = useState(false);
   const [projectForm, setProjectForm] = useState({ title: "", description: "" });
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
         setProjectForm({ title: "", description: "" });
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
                 <h3 style={{ marginBottom: "1rem" }}>Research Runs</h3>
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
                         <span style={{ fontSize: "0.875rem", fontWeight: "500" }}>Status: {run.status}</span>
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
                       {run.resultSummary && (
                         <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
                           {run.resultSummary}
                         </p>
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
                         <h4 style={{ marginBottom: "0" }}>{insight.title}</h4>
                         <span
                           style={{
                             display: "inline-block",
                             padding: "0.25rem 0.5rem",
                             backgroundColor: "var(--color-bg-secondary)",
                             borderRadius: "3px",
                             fontSize: "0.75rem",
                             fontWeight: "500"
                           }}
                         >
                           {insight.status}
                         </span>
                       </div>
                       {insight.summary && (
                         <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", marginBottom: "0.75rem" }}>
                           {insight.summary}
                         </p>
                       )}
                       {insight.reviewerNotes && (
                         <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontStyle: "italic" }}>
                           Review: {insight.reviewerNotes}
                         </p>
                       )}
                     </div>
                   ))}
                 </div>
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
               maxWidth: "400px",
               width: "90%"
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
                 <option value="REVIEW">Under Review</option>
                 <option value="FINAL">Final</option>
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