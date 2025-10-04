import { useState } from "react";
import Head from "next/head";
import DashboardLayout from "../../components/DashboardLayout";
import styles from "../../styles/Classify.module.css";

export default function Classify() {
  // Classification state
  const [formData, setFormData] = useState({
    period: "",
    duration: "",
    depth: "",
    prad: "",
    teq: ""
  });
  
  const [result, setResult] = useState(null);
  const [isClassifying, setIsClassifying] = useState(false);
  const [showRagExamples, setShowRagExamples] = useState(false);

  // Example data for quick testing
  const examples = {
    kepler: { period: "9.49", duration: "2.96", depth: "615.8", prad: "2.26", teq: "793" },
    tess: { period: "3.12", duration: "2.02", depth: "656.9", prad: "5.82", teq: "3127" },
    k2: { period: "7.78", duration: "3.18", depth: "1320.0", prad: "4.19", teq: "1050" }
  };

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const loadExample = (type) => {
    setFormData(examples[type]);
    setResult(null);
  };

  const resetForm = () => {
    setFormData({ period: "", duration: "", depth: "", prad: "", teq: "" });
    setResult(null);
  };

  const classifyExoplanet = async () => {
    // Validate inputs
    if (!formData.period || !formData.duration || !formData.depth || !formData.prad || !formData.teq) {
      alert("Please fill in all fields!");
      return;
    }

    setIsClassifying(true);
    try {
      const response = await fetch('http://localhost:5002/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          period: parseFloat(formData.period),
          duration: parseFloat(formData.duration),
          depth: parseFloat(formData.depth),
          prad: parseFloat(formData.prad),
          teq: parseFloat(formData.teq)
        })
      });

      if (response.ok) {
        const data = await response.json();
        setResult(data);
      } else {
        const error = await response.json();
        alert("Classification failed: " + error.error);
      }
    } catch (error) {
      alert("Error connecting to server: " + error.message);
    }
    setIsClassifying(false);
  };

  return (
    <DashboardLayout>
      <Head>
        <title>Classify Exoplanets | NASA Detective</title>
      </Head>

      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <h1>🔬 Classify New Exoplanets</h1>
          <p className={styles.subtitle}>
            Upload CSV or manually enter exoplanet parameters to classify using our 95.45% accurate LLM-based RAG system
          </p>
          <div className={styles.accuracyBanner}>
            <span className={styles.accuracy}>95.45% Accurate</span>
            <span className={styles.model}>LLM In-Context Learning</span>
            <span className={styles.rag}>25 RAG Examples</span>
          </div>
        </div>

        {/* Quick Examples */}
        <div className={styles.examplesSection}>
          <h3>🎯 Quick Start - Load Example Data:</h3>
          <div className={styles.exampleButtons}>
            <button onClick={() => loadExample('kepler')} className={styles.btnExample}>
              🛰️ Kepler Example
            </button>
            <button onClick={() => loadExample('tess')} className={styles.btnExample}>
              🔭 TESS Example
            </button>
            <button onClick={() => loadExample('k2')} className={styles.btnExample}>
              🌟 K2 Example
            </button>
          </div>
        </div>

        {/* Classification Form */}
        <div className={styles.formSection}>
          <h2>📝 Enter Exoplanet Parameters</h2>
          
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>
                <span className={styles.labelIcon}>🌍</span>
                Orbital Period (days)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.period}
                onChange={(e) => handleInputChange('period', e.target.value)}
                placeholder="e.g., 9.49"
                className={styles.input}
              />
            </div>

            <div className={styles.formGroup}>
              <label>
                <span className={styles.labelIcon}>⏱️</span>
                Transit Duration (hours)
              </label>
              <input
                type="number"
                step="0.001"
                value={formData.duration}
                onChange={(e) => handleInputChange('duration', e.target.value)}
                placeholder="e.g., 2.96"
                className={styles.input}
              />
            </div>

            <div className={styles.formGroup}>
              <label>
                <span className={styles.labelIcon}>📉</span>
                Transit Depth (ppm)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.depth}
                onChange={(e) => handleInputChange('depth', e.target.value)}
                placeholder="e.g., 615.8"
                className={styles.input}
              />
            </div>

            <div className={styles.formGroup}>
              <label>
                <span className={styles.labelIcon}>🪐</span>
                Planetary Radius (R⊕)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.prad}
                onChange={(e) => handleInputChange('prad', e.target.value)}
                placeholder="e.g., 2.26"
                className={styles.input}
              />
            </div>

            <div className={styles.formGroup}>
              <label>
                <span className={styles.labelIcon}>🌡️</span>
                Equilibrium Temp (K)
              </label>
              <input
                type="number"
                step="1"
                value={formData.teq}
                onChange={(e) => handleInputChange('teq', e.target.value)}
                placeholder="e.g., 793"
                className={styles.input}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className={styles.actionButtons}>
            <button 
              onClick={classifyExoplanet}
              disabled={isClassifying}
              className={styles.btnClassify}
            >
              {isClassifying ? "⏳ Classifying..." : "🚀 Classify with AI"}
            </button>
            <button 
              onClick={resetForm}
              className={styles.btnReset}
            >
              🔄 Reset
            </button>
          </div>
        </div>

        {/* Results Section */}
        {result && (
          <div className={styles.resultsSection}>
            <h2>🎯 Classification Result</h2>
            
            <div className={styles.resultCard}>
              {/* Main Result */}
              <div className={styles.resultMain}>
                <div className={styles.resultLabel}>
                  <span className={result.prediction === "CANDIDATE" ? styles.candidateBadge : styles.falsePositiveBadge}>
                    {result.prediction === "CANDIDATE" ? "✅ CANDIDATE" : "❌ FALSE POSITIVE"}
                  </span>
                  <span className={styles.confidence}>
                    {(result.confidence * 100).toFixed(1)}% confidence
                  </span>
                </div>
              </div>

              {/* Result Details */}
              <div className={styles.resultDetails}>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Model:</span>
                  <span className={styles.detailValue}>{result.model}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>RAG Examples Used:</span>
                  <span className={styles.detailValue}>{result.similar_examples_used} most similar entries</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Processing Time:</span>
                  <span className={styles.detailValue}>{result.processing_time}</span>
                </div>
              </div>

              {/* Input Summary */}
              <div className={styles.inputSummary}>
                <h4>📋 Input Parameters:</h4>
                <div className={styles.inputGrid}>
                  <span>Period: {formData.period} days</span>
                  <span>Duration: {formData.duration} hrs</span>
                  <span>Depth: {formData.depth} ppm</span>
                  <span>Radius: {formData.prad} R⊕</span>
                  <span>Temp: {formData.teq} K</span>
                </div>
              </div>

              {/* RAG Examples Button */}
              {result.similar_examples && result.similar_examples.length > 0 && (
                <button 
                  onClick={() => setShowRagExamples(true)}
                  className={styles.btnViewRag}
                >
                  🔍 View {result.similar_examples.length} RAG Examples Used
                </button>
              )}
            </div>

            {/* What This Means */}
            <div className={styles.infoBox}>
              <h3>💡 What Does This Mean?</h3>
              {result.prediction === "CANDIDATE" ? (
                <p>
                  <strong>CANDIDATE:</strong> Our AI predicts this is likely a real exoplanet! 
                  The parameters match patterns of confirmed exoplanets in our training data. 
                  This detection would typically require further verification through additional observations.
                </p>
              ) : (
                <p>
                  <strong>FALSE POSITIVE:</strong> Our AI predicts this signal is likely noise or a detection artifact, 
                  not a real exoplanet. The parameters match patterns of previously identified false positives.
                </p>
              )}
            </div>
          </div>
        )}

        {/* How It Works */}
        <div className={styles.howItWorks}>
          <h3>🧠 How Our AI Works</h3>
          <div className={styles.stepsGrid}>
            <div className={styles.step}>
              <span className={styles.stepNumber}>1</span>
              <h4>RAG Retrieval</h4>
              <p>Finds 25 most similar exoplanets from 17,594 labeled entries using vector embeddings</p>
            </div>
            <div className={styles.step}>
              <span className={styles.stepNumber}>2</span>
              <h4>In-Context Learning</h4>
              <p>Sends similar examples to GPT-4o-mini as context for classification</p>
            </div>
            <div className={styles.step}>
              <span className={styles.stepNumber}>3</span>
              <h4>Expert Decision</h4>
              <p>LLM analyzes patterns and predicts: CANDIDATE or FALSE POSITIVE</p>
            </div>
          </div>
        </div>

        {/* RAG Examples Modal */}
        {showRagExamples && result && result.similar_examples && (
          <div className={styles.modal} onClick={() => setShowRagExamples(false)}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <h3>🔍 RAG Examples Used for Classification</h3>
              <p>These are the 25 most similar examples the AI retrieved from the training data:</p>
              
              <div className={styles.ragStats}>
                <span>✅ Candidates: {result.similar_examples.filter(e => e.disposition === "CANDIDATE").length}</span>
                <span>❌ False Positives: {result.similar_examples.filter(e => e.disposition === "FALSE POSITIVE").length}</span>
              </div>
              
              <div className={styles.tableWrapper}>
                <table className={styles.ragTable}>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Name</th>
                      <th>Period</th>
                      <th>Duration</th>
                      <th>Depth</th>
                      <th>Radius</th>
                      <th>Temp</th>
                      <th>Label</th>
                      <th>Mission</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.similar_examples.map((ex, idx) => (
                      <tr key={idx}>
                        <td>{idx + 1}</td>
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
                        <td>{ex.type}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className={styles.ragExplanation}>
                <h4>💡 How RAG Works</h4>
                <p>
                  Our system uses <strong>Retrieval-Augmented Generation (RAG)</strong> to find the most similar 
                  examples from our training data. It converts each exoplanet's parameters into a vector embedding 
                  and uses cosine similarity to find the nearest neighbors. These examples provide context to the 
                  LLM, enabling accurate classification through in-context learning.
                </p>
              </div>
              
              <button onClick={() => setShowRagExamples(false)} className={styles.btnClose}>
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
