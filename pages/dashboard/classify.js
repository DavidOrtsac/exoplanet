import { useState, useEffect } from "react";
import Head from "next/head";
import DashboardLayout from "../../components/DashboardLayout";
import styles from "../../styles/Classify.module.css";

export default function Classify() {
  // Mode state
  const [testMode, setTestMode] = useState(false);
  const [holdoutPercentage, setHoldoutPercentage] = useState(20);
  
  // Dataset tables
  const [mainDataset, setMainDataset] = useState([]);
  const [heldoutDataset, setHeldoutDataset] = useState([]);
  const [totalEntries, setTotalEntries] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Classification state
  const [classifyEntry, setClassifyEntry] = useState({ period: "", duration: "", depth: "", prad: "", teq: "" });
  const [classifyResult, setClassifyResult] = useState(null);
  const [isClassifying, setIsClassifying] = useState(false);
  
  // Modals
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showRagExamples, setShowRagExamples] = useState(null);
  const [showAddUserDataModal, setShowAddUserDataModal] = useState(false);
  
  // User data form
  const [newUserData, setNewUserData] = useState({ period: "", duration: "", depth: "", prad: "", teq: "", disposition: "CANDIDATE" });

  // Load main dataset
  useEffect(() => {
    loadMainDataset();
  }, [currentPage]);

  // Load held-out dataset
  useEffect(() => {
    loadHeldoutDataset();
  }, []);

  const loadMainDataset = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5002/api/data/full?page=${currentPage}&per_page=50`);
      if (response.ok) {
        const data = await response.json();
        setMainDataset(data.data);
        setTotalEntries(data.total);
      }
    } catch (error) {
      console.error("Error loading dataset:", error);
    }
    setLoading(false);
  };

  const loadHeldoutDataset = async () => {
    try {
      const response = await fetch('http://localhost:5002/api/heldout/get');
      if (response.ok) {
        const data = await response.json();
        setHeldoutDataset(data.data);
      }
    } catch (error) {
      console.error("Error loading held-out dataset:", error);
    }
  };

  const toggleTestMode = async () => {
    if (!testMode) {
      // Entering test mode
      setTestMode(true);
    } else {
      // Exiting test mode - clear held-out set
      if (confirm("Exit Test Mode and return to full strength RAG?")) {
        await clearHeldout();
        setTestMode(false);
      }
    }
  };

  const generateRandomSplit = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5002/api/heldout/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ percentage: holdoutPercentage })
      });
      
      if (response.ok) {
        const data = await response.json();
        alert(`✅ ${data.message}\nTraining: ${data.training_count.toLocaleString()} | Test: ${data.heldout_count.toLocaleString()}`);
        await loadMainDataset();
        await loadHeldoutDataset();
      }
    } catch (error) {
      alert("Error generating split: " + error.message);
    }
    setLoading(false);
  };

  const clearHeldout = async () => {
    try {
      const response = await fetch('http://localhost:5002/api/heldout/clear', {
        method: 'POST'
      });
      
      if (response.ok) {
        const data = await response.json();
        alert("✅ " + data.message);
        await loadMainDataset();
        await loadHeldoutDataset();
      }
    } catch (error) {
      console.error("Error clearing held-out:", error);
    }
  };

  const moveToHeldout = async (entryId) => {
    try {
      const response = await fetch('http://localhost:5002/api/heldout/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [entryId] })
      });
      
      if (response.ok) {
        await loadMainDataset();
        await loadHeldoutDataset();
      }
    } catch (error) {
      alert("Error moving to held-out: " + error.message);
    }
  };

  const moveToMain = async (entryId) => {
    try {
      const response = await fetch('http://localhost:5002/api/heldout/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [entryId] })
      });
      
      if (response.ok) {
        await loadMainDataset();
        await loadHeldoutDataset();
      }
    } catch (error) {
      alert("Error moving to main: " + error.message);
    }
  };

  const addUserData = async () => {
    // Validate
    if (!newUserData.period || !newUserData.duration || !newUserData.depth || !newUserData.prad || !newUserData.teq) {
      alert("Please fill all fields!");
      return;
    }

    try {
      const response = await fetch('http://localhost:5002/api/userdata/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entries: [{
            period: parseFloat(newUserData.period),
            duration: parseFloat(newUserData.duration),
            depth: parseFloat(newUserData.depth),
            prad: parseFloat(newUserData.prad),
            teq: parseFloat(newUserData.teq),
            disposition: newUserData.disposition,
            name: `USER-${Date.now()}`
          }]
        })
      });
      
      if (response.ok) {
        alert("✅ User data added to main dataset! RAG updated.");
        setShowAddUserDataModal(false);
        setNewUserData({ period: "", duration: "", depth: "", prad: "", teq: "", disposition: "CANDIDATE" });
        await loadMainDataset();
      }
    } catch (error) {
      alert("Error adding user data: " + error.message);
    }
  };

  const classifyWithAI = async () => {
    if (!classifyEntry.period || !classifyEntry.duration || !classifyEntry.depth || !classifyEntry.prad || !classifyEntry.teq) {
      alert("Please fill all classification fields!");
      return;
    }

    setIsClassifying(true);
    try {
      const response = await fetch('http://localhost:5002/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          period: parseFloat(classifyEntry.period),
          duration: parseFloat(classifyEntry.duration),
          depth: parseFloat(classifyEntry.depth),
          prad: parseFloat(classifyEntry.prad),
          teq: parseFloat(classifyEntry.teq)
        })
      });

      if (response.ok) {
        const data = await response.json();
        setClassifyResult(data);
      } else {
        const error = await response.json();
        alert("Classification failed: " + error.error);
      }
    } catch (error) {
      alert("Error: " + error.message);
    }
    setIsClassifying(false);
  };

  const loadFromHeldout = (entry) => {
    setClassifyEntry({
      period: entry.period?.toString() || "",
      duration: entry.duration?.toString() || "",
      depth: entry.depth?.toString() || "",
      prad: entry.prad?.toString() || "",
      teq: entry.teq?.toString() || ""
    });
    setClassifyResult(null);
  };

  return (
    <DashboardLayout>
      <Head>
        <title>Classify Exoplanets | NASA Detective</title>
      </Head>

      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <h1>🔬 Exoplanet Classification System</h1>
          <p className={styles.subtitle}>
            Revolutionary RAG + LLM powered classifier with full transparency and control
          </p>
          <div className={styles.accuracyBanner}>
            <span className={styles.accuracy}>95.45% Accurate</span>
            <span className={styles.model}>LLM In-Context Learning</span>
            <span className={styles.rag}>25 RAG Examples</span>
          </div>
        </div>

        {/* Mode Toggle */}
        <div className={styles.modeSection}>
          <div className={styles.modeHeader}>
            <h2>{testMode ? "🧪 TEST MODE" : "🚀 DEFAULT MODE (Full Strength)"}</h2>
            <button 
              className={testMode ? styles.btnTestMode : styles.btnDefaultMode}
              onClick={toggleTestMode}
            >
              {testMode ? "Exit Test Mode" : "Enter Test Mode"}
            </button>
          </div>
          
          <div className={styles.modeDescription}>
            {testMode ? (
              <>
                <p>🧪 <strong>Test Mode Active:</strong> You can manually hold out entries or generate a random split. RAG only uses non-held-out data. Perfect for validation!</p>
                <div className={styles.splitControls}>
                  <label>
                    Hold out <input type="number" min="1" max="50" value={holdoutPercentage} onChange={(e) => setHoldoutPercentage(e.target.value)} className={styles.percentInput} />% of data
                  </label>
                  <button onClick={generateRandomSplit} className={styles.btnGenerate}>
                    Generate Random Split
                  </button>
                </div>
              </>
            ) : (
              <p>🚀 <strong>Default Mode:</strong> Full strength RAG! All {totalEntries.toLocaleString()} entries available. Use this for classifying truly unknown exoplanet data.</p>
            )}
          </div>
        </div>

        {/* Table 1: Main Training Dataset */}
        <div className={styles.tableSection}>
          <div className={styles.tableSectionHeader}>
            <h2>📊 Table 1: Main Training Dataset</h2>
            <div className={styles.tableActions}>
              <span className={styles.entryCount}>{totalEntries.toLocaleString()} total entries</span>
              <button onClick={() => setShowAddUserDataModal(true)} className={styles.btnAddData}>
                ➕ Add Your Data
              </button>
              <button onClick={loadMainDataset} className={styles.btnRefresh}>🔄 Refresh</button>
            </div>
          </div>
          
          {loading ? (
            <div className={styles.loading}>Loading dataset...</div>
          ) : (
            <>
              <div className={styles.tableWrapper}>
                <table className={styles.dataTable}>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Period (days)</th>
                      <th>Duration (hrs)</th>
                      <th>Depth (ppm)</th>
                      <th>Radius (R⊕)</th>
                      <th>Temp (K)</th>
                      <th>Label</th>
                      <th>Type</th>
                      {testMode && <th>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {mainDataset.filter(e => !e.is_heldout).map((entry) => (
                      <tr key={entry.id} className={entry.is_user_added ? styles.userAddedRow : ""}>
                        <td>{entry.id}</td>
                        <td>{entry.name || "N/A"}</td>
                        <td>{entry.period?.toFixed(2)}</td>
                        <td>{entry.duration?.toFixed(3)}</td>
                        <td>{entry.depth?.toFixed(1)}</td>
                        <td>{entry.prad?.toFixed(2)}</td>
                        <td>{entry.teq?.toFixed(0)}</td>
                        <td>
                          <span className={entry.disposition === "CANDIDATE" ? styles.labelCandidate : styles.labelFalsePositive}>
                            {entry.disposition}
                          </span>
                        </td>
                        <td>{entry.type}</td>
                        {testMode && (
                          <td>
                            <button onClick={() => moveToHeldout(entry.id)} className={styles.btnMove}>
                              → Hold Out
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              <div className={styles.pagination}>
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className={styles.btnPage}
                >
                  Previous
                </button>
                <span className={styles.pageInfo}>
                  Page {currentPage} of {Math.ceil(totalEntries / 50)}
                </span>
                <button 
                  onClick={() => setCurrentPage(p => Math.min(Math.ceil(totalEntries / 50), p + 1))}
                  disabled={currentPage >= Math.ceil(totalEntries / 50)}
                  className={styles.btnPage}
                >
                  Next
                </button>
              </div>
            </>
          )}
        </div>

        {/* Table 2: Held-Out Test Set */}
        <div className={styles.tableSection}>
          <div className={styles.tableSectionHeader}>
            <h2>🧪 Table 2: Held-Out Test Set</h2>
            <div className={styles.tableActions}>
              <span className={styles.entryCount}>{heldoutDataset.length} held-out entries</span>
              {heldoutDataset.length > 0 && (
                <button onClick={clearHeldout} className={styles.btnClear}>
                  🗑️ Clear All
                </button>
              )}
            </div>
          </div>
          
          {heldoutDataset.length === 0 ? (
            <div className={styles.emptyState}>
              <p>🌟 No held-out data yet!</p>
              <p className={styles.emptyHint}>
                {testMode 
                  ? "Manually move entries from Table 1 or generate a random split."
                  : "Enter Test Mode to hold out data for validation."}
              </p>
            </div>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Period (days)</th>
                    <th>Duration (hrs)</th>
                    <th>Depth (ppm)</th>
                    <th>Radius (R⊕)</th>
                    <th>Temp (K)</th>
                    <th>Expected Label</th>
                    <th>Type</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {heldoutDataset.map((entry) => (
                    <tr key={entry.id} className={styles.heldoutRow}>
                      <td>{entry.id}</td>
                      <td>{entry.name || "N/A"}</td>
                      <td>{entry.period?.toFixed(2)}</td>
                      <td>{entry.duration?.toFixed(3)}</td>
                      <td>{entry.depth?.toFixed(1)}</td>
                      <td>{entry.prad?.toFixed(2)}</td>
                      <td>{entry.teq?.toFixed(0)}</td>
                      <td>
                        <span className={entry.disposition === "CANDIDATE" ? styles.labelCandidate : styles.labelFalsePositive}>
                          {entry.disposition}
                        </span>
                      </td>
                      <td>{entry.type}</td>
                      <td>
                        <button onClick={() => loadFromHeldout(entry)} className={styles.btnTest}>
                          🧪 Test
                        </button>
                        <button onClick={() => moveToMain(entry.id)} className={styles.btnMove}>
                          ← Return
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Classification Section */}
        <div className={styles.classificationSection}>
          <h2>🚀 Classify New Exoplanet Data</h2>
          <p className={styles.classifySubtitle}>
            Enter exoplanet parameters to classify using our RAG + LLM system
          </p>
          
          <div className={styles.classifyForm}>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Period (days)</label>
                <input
                  type="number"
                  step="0.01"
                  value={classifyEntry.period}
                  onChange={(e) => setClassifyEntry({ ...classifyEntry, period: e.target.value })}
                  placeholder="e.g., 9.49"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Duration (hours)</label>
                <input
                  type="number"
                  step="0.001"
                  value={classifyEntry.duration}
                  onChange={(e) => setClassifyEntry({ ...classifyEntry, duration: e.target.value })}
                  placeholder="e.g., 2.96"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Depth (ppm)</label>
                <input
                  type="number"
                  step="0.1"
                  value={classifyEntry.depth}
                  onChange={(e) => setClassifyEntry({ ...classifyEntry, depth: e.target.value })}
                  placeholder="e.g., 615.8"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Radius (R⊕)</label>
                <input
                  type="number"
                  step="0.01"
                  value={classifyEntry.prad}
                  onChange={(e) => setClassifyEntry({ ...classifyEntry, prad: e.target.value })}
                  placeholder="e.g., 2.26"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Temperature (K)</label>
                <input
                  type="number"
                  step="1"
                  value={classifyEntry.teq}
                  onChange={(e) => setClassifyEntry({ ...classifyEntry, teq: e.target.value })}
                  placeholder="e.g., 793"
                />
              </div>
            </div>
            
            <button 
              onClick={classifyWithAI}
              disabled={isClassifying}
              className={styles.btnClassify}
            >
              {isClassifying ? "⏳ Classifying..." : "🚀 Classify with AI"}
            </button>
          </div>

          {/* Classification Result */}
          {classifyResult && (
            <div className={styles.resultCard}>
              <h3>🎯 Classification Result</h3>
              <div className={styles.resultMain}>
                <span className={classifyResult.prediction === "CANDIDATE" ? styles.resultCandidate : styles.resultFalsePositive}>
                  {classifyResult.prediction}
                </span>
                <span className={styles.confidence}>{(classifyResult.confidence * 100).toFixed(1)}% confidence</span>
              </div>
              
              <div className={styles.resultDetails}>
                <p><strong>Model:</strong> {classifyResult.model}</p>
                <p><strong>RAG Examples:</strong> {classifyResult.similar_examples_used}</p>
                <p><strong>Processing Time:</strong> {classifyResult.processing_time}</p>
              </div>
              
              {classifyResult.similar_examples && (
                <button 
                  onClick={() => setShowRagExamples(classifyResult.similar_examples)}
                  className={styles.btnViewRag}
                >
                  🔍 View {classifyResult.similar_examples.length} RAG Examples Used
                </button>
              )}
            </div>
          )}
        </div>

        {/* Add User Data Modal */}
        {showAddUserDataModal && (
          <div className={styles.modal}>
            <div className={styles.modalContent}>
              <h3>➕ Add Your Labeled Data</h3>
              <p>Add your own exoplanet data to the main dataset. RAG will use it!</p>
              
              <div className={styles.formGroup}>
                <label>Period (days)</label>
                <input type="number" step="0.01" value={newUserData.period} onChange={(e) => setNewUserData({ ...newUserData, period: e.target.value })} />
              </div>
              <div className={styles.formGroup}>
                <label>Duration (hours)</label>
                <input type="number" step="0.001" value={newUserData.duration} onChange={(e) => setNewUserData({ ...newUserData, duration: e.target.value })} />
              </div>
              <div className={styles.formGroup}>
                <label>Depth (ppm)</label>
                <input type="number" step="0.1" value={newUserData.depth} onChange={(e) => setNewUserData({ ...newUserData, depth: e.target.value })} />
              </div>
              <div className={styles.formGroup}>
                <label>Radius (R⊕)</label>
                <input type="number" step="0.01" value={newUserData.prad} onChange={(e) => setNewUserData({ ...newUserData, prad: e.target.value })} />
              </div>
              <div className={styles.formGroup}>
                <label>Temperature (K)</label>
                <input type="number" step="1" value={newUserData.teq} onChange={(e) => setNewUserData({ ...newUserData, teq: e.target.value })} />
              </div>
              <div className={styles.formGroup}>
                <label>Label</label>
                <select value={newUserData.disposition} onChange={(e) => setNewUserData({ ...newUserData, disposition: e.target.value })}>
                  <option value="CANDIDATE">CANDIDATE</option>
                  <option value="FALSE POSITIVE">FALSE POSITIVE</option>
                </select>
              </div>
              
              <div className={styles.modalActions}>
                <button onClick={addUserData} className={styles.btnAdd}>Add to Dataset</button>
                <button onClick={() => setShowAddUserDataModal(false)} className={styles.btnCancel}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* RAG Examples Modal */}
        {showRagExamples && (
          <div className={styles.modal} onClick={() => setShowRagExamples(null)}>
            <div className={styles.modalContentLarge} onClick={(e) => e.stopPropagation()}>
              <h3>🔍 RAG Examples Used for Classification</h3>
              <p>These are the 25 most similar examples the AI retrieved for this classification:</p>
              
              <div className={styles.ragStats}>
                <span>✅ Candidates: {showRagExamples.filter(e => e.disposition === "CANDIDATE").length}</span>
                <span>❌ False Positives: {showRagExamples.filter(e => e.disposition === "FALSE POSITIVE").length}</span>
              </div>
              
              <div className={styles.tableWrapper}>
                <table className={styles.ragTable}>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Period</th>
                      <th>Duration</th>
                      <th>Depth</th>
                      <th>Radius</th>
                      <th>Temp</th>
                      <th>Label</th>
                    </tr>
                  </thead>
                  <tbody>
                    {showRagExamples.map((ex, idx) => (
                      <tr key={idx}>
                        <td>{idx + 1}</td>
                        <td>{ex.id}</td>
                        <td>{ex.name}</td>
                        <td>{ex.period}</td>
                        <td>{ex.duration}</td>
                        <td>{ex.depth}</td>
                        <td>{ex.prad}</td>
                        <td>{ex.teq}</td>
                        <td>
                          <span className={ex.disposition === "CANDIDATE" ? styles.labelCandidate : styles.labelFalsePositive}>
                            {ex.disposition}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <button onClick={() => setShowRagExamples(null)} className={styles.btnClose}>Close</button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
