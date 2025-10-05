import { useEffect, useRef, useState, useMemo } from "react";
import Head from "next/head";
import Layout from "../components/Layout";
import ThreeJSEarth from "../components/ThreeJSEarth";
import LoadingOverlay from "../components/LoadingOverlay";
import {
  loadKOIData,
  loadK2Data,
  loadTESSData,
  loadDatasetData,
} from "../utils/dataLoader";
import { RiPlanetLine, RiSatelliteLine, RiStarLine, RiDashboardLine, RiBarChartBoxLine, RiBrainLine, RiQuestionLine } from "react-icons/ri";
import {
  filterData,
  saveDataset,
  uploadUserData,
} from "../utils/datasetActions";

// Tooltip Component
const Tooltip = ({ children, content }) => {
  const [isVisible, setIsVisible] = useState(false);
  
  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        style={{ cursor: "help" }}
      >
        {children}
      </div>
      {isVisible && (
        <div
          style={{
            position: "absolute",
            bottom: "100%",
            left: "50%",
            transform: "translateX(-50%) translateY(0)",
            backgroundColor: "rgba(0, 0, 0, 0.95)",
            color: "white",
            padding: "0.75rem 1rem",
            borderRadius: "0.5rem",
            fontSize: "0.875rem",
            zIndex: 1000,
            marginBottom: "0.5rem",
            maxWidth: "350px",
            minWidth: "200px",
            textAlign: "left",
            boxShadow: "0 4px 16px rgba(0, 0, 0, 0.4)",
            fontFamily: "'Inter', sans-serif",
            lineHeight: "1.5",
            animation: "tooltipFadeIn 0.2s ease-out",
            pointerEvents: "none",
          }}
        >
          {content}
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: "50%",
              transform: "translateX(-50%)",
              border: "6px solid transparent",
              borderTopColor: "rgba(0, 0, 0, 0.95)",
            }}
          />
          <style jsx>{`
            @keyframes tooltipFadeIn {
              from {
                opacity: 0;
                transform: translateX(-50%) translateY(5px);
              }
              to {
                opacity: 1;
                transform: translateX(-50%) translateY(0);
              }
            }
          `}</style>
        </div>
      )}
    </div>
  );
};

export default function Home() {
  const earthRef = useRef(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [data, setData] = useState({ KOI: [], TESS: [], K2: [] });
  const [loading, setLoading] = useState(true);
  const [activeMission, setActiveMission] = useState("KOI");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [hoveredNavItem, setHoveredNavItem] = useState(null);
  const [activeNavItem, setActiveNavItem] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingDataset, setIsSavingDataset] = useState(false);
  const [saveProgress, setSaveProgress] = useState(null);

  // AI Classifier state
  const [formData, setFormData] = useState({
    period: "",
    duration: "",
    depth: "",
    prad: "",
    teq: "",
  });
  const [result, setResult] = useState(null);
  const [isClassifying, setIsClassifying] = useState(false);
  const [showRagExamples, setShowRagExamples] = useState(false);

  // Dual Table & Test Mode state
  const [trainingData, setTrainingData] = useState([]);
  const [heldOutData, setHeldOutData] = useState([]);
  const [isTestMode, setIsTestMode] = useState(false);
  const [holdoutPercentage, setHoldoutPercentage] = useState(20);
  const [isSplitting, setIsSplitting] = useState(false);

  // Data Explorer state
  const [datasetData, setDatasetData] = useState([]);
  const [datasetLoading, setDatasetLoading] = useState(true);
  const [datasetSortConfig, setDatasetSortConfig] = useState({
    key: "id",
    direction: "ascending",
  });
  const [datasetColumnWidths, setDatasetColumnWidths] = useState({});
  const [datasetTypeFilter, setDatasetTypeFilter] = useState([]);
  const [datasetCurrentPage, setDatasetCurrentPage] = useState(1);
  const [datasetRowsPerPage] = useState(50);

  // Example data for quick testing
  const examples = {
    kepler: {
      period: "9.49",
      duration: "2.96",
      depth: "615.8",
      prad: "2.26",
      teq: "793",
    },
    tess: {
      period: "3.12",
      duration: "2.02",
      depth: "656.9",
      prad: "5.82",
      teq: "3127",
    },
    k2: {
      period: "7.78",
      duration: "3.18",
      depth: "1320.0",
      prad: "4.19",
      teq: "1050",
    },
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

  // Data Explorer helper functions
  const measureText = (text, font) => {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    context.font = font;
    return context.measureText(text).width;
  };

  const getDisposition = (disposition) => {
    const value = Number(disposition);
    switch (value) {
      case 1:
        return (
          <span
            style={{
              display: "inline-block",
              padding: "5px 12px",
              borderRadius: "15px",
              fontSize: "0.75rem",
              fontWeight: "700",
              lineHeight: "1",
              textTransform: "uppercase",
              whiteSpace: "nowrap",
              letterSpacing: "0.03em",
              background: "linear-gradient(to right, #80dda1, #7fdca0)",
              color: "#ffffff",
              boxShadow: "0 0 8px rgba(45, 211, 111, 0.3)",
            }}
          >
            Confirmed
          </span>
        );
      case 0:
        return (
          <span
            style={{
              display: "inline-block",
              padding: "5px 12px",
              borderRadius: "15px",
              fontSize: "0.75rem",
              fontWeight: "700",
              lineHeight: "1",
              textTransform: "uppercase",
              whiteSpace: "nowrap",
              letterSpacing: "0.03em",
              background: "linear-gradient(to right, #f98496, #ef6f82)",
              color: "#ffffff",
              boxShadow: "0 0 8px rgba(235, 68, 90, 0.3)",
            }}
          >
            False Positive
          </span>
        );
      default:
        return "Unknown";
    }
  };

  const getTelescopeName = (type) => {
    switch (type?.toLowerCase()) {
      case "koi":
        return "Kepler";
      case "toi":
        return "TESS";
      case "k2":
        return "K2";
      case "user":
        return "User";
      default:
        return type || "Unknown";
    }
  };

  const datasetRequestSort = (key) => {
    let direction = "ascending";
    if (
      datasetSortConfig.key === key &&
      datasetSortConfig.direction === "ascending"
    ) {
      direction = "descending";
    }
    setDatasetSortConfig({ key, direction });
    setDatasetCurrentPage(1);
  };

  const handleDatasetFilterChange = async (displayTypes) => {
    setDatasetLoading(true);
    try {
      const filteredData = await filterData(displayTypes);
      setDatasetData(filteredData);
    } catch (error) {
      console.error("Error filtering data:", error);
    } finally {
      setDatasetLoading(false);
    }
  };

  const handleUploadUserData = async (file) => {
    setDatasetLoading(true);
    try {
      const uploadedData = await uploadUserData(file);
      setDatasetData(uploadedData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setDatasetLoading(false);
    }
  };

  const handleRemoveRow = async (rowId) => {
    if (!confirm(`Are you sure you want to remove row with ID: ${rowId}?`)) {
      return;
    }
    
    try {
      const response = await fetch('http://localhost:5002/data/remove_row', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: rowId }),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove row');
      }

      // Update local state to remove the row
      setDatasetData(prevData => prevData.filter(row => row.id !== rowId));
      alert('Row removed successfully!');
    } catch (error) {
      console.error('Error removing row:', error);
      alert(`Error removing row: ${error.message}`);
    }
  };

  const handleSaveDataset = async () => {
    setIsSavingDataset(true);
    if (datasetData.length === 0) {
      alert("No data to save");
      setIsSavingDataset(false);
      return;
    }
    try {
      const response = await saveDataset(datasetData);
      console.log("Save dataset response:", response);
      
      // If we got a task_id, poll for status
      if (response.task_id) {
        const taskId = response.task_id;
        console.log("Polling for task status:", taskId);
        
        // Import getVectorTaskStatus dynamically if needed
        const { getVectorTaskStatus } = await import("../utils/datasetActions");
        
        // Poll until complete
        const pollStatus = async () => {
          try {
            const statusResponse = await getVectorTaskStatus(taskId);
            console.log("Task status:", statusResponse);
            
            // Update progress if available
            console.log("Status response:", statusResponse);
            if (statusResponse.progress) {
              setSaveProgress(statusResponse.progress);
            }
            
            if (statusResponse.status === "SUCCESS") {
              console.log("Vector store creation completed successfully!");
              setSaveProgress(null);
              setIsSavingDataset(false);
              alert("Dataset saved and vector store created successfully!");
            } else if (statusResponse.status === "FAILURE") {
              console.error("Vector store creation failed:", statusResponse.error_message);
              setSaveProgress(null);
              setIsSavingDataset(false);
              alert(`Failed to create vector store: ${statusResponse.error_message || "Unknown error"}`);
            } else {
              // Still in progress, poll again after 2 seconds
              setTimeout(pollStatus, 2000);
            }
          } catch (error) {
            console.error("Error polling task status:", error);
            setSaveProgress(null);
            setIsSavingDataset(false);
            alert("Error checking task status. Please check the console.");
          }
        };
        
        // Start polling
        pollStatus();
      } else {
        // No task_id means it completed immediately
        setIsSavingDataset(false);
        alert("Dataset saved successfully!");
      }
    } catch (error) {
      console.error("Error saving dataset:", error);
      setIsSavingDataset(false);
      alert(`Error saving dataset: ${error.message}`);
    }
  };

  const classifyExoplanet = async () => {
    // Validate inputs
    if (
      !formData.period ||
      !formData.duration ||
      !formData.depth ||
      !formData.prad ||
      !formData.teq
    ) {
      alert("Please fill in all fields!");
      return;
    }

    setIsClassifying(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_ML_SERVICE_URL || 'http://localhost:5001';
      const response = await fetch(`${baseUrl}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          period: parseFloat(formData.period),
          duration: parseFloat(formData.duration),
          depth: parseFloat(formData.depth),
          prad: parseFloat(formData.prad),
          teq: parseFloat(formData.teq),
        }),
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

  // Dual-Table & Test Mode Functions
  const loadTrainingAndHeldOutData = async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_ML_SERVICE_URL || 'http://localhost:5001';
      
      // Load training data (same as dataset)
      const trainingResp = await fetch(`${baseUrl}/data/dataset`, { credentials: 'include' });
      if (trainingResp.ok) {
        const training = await trainingResp.json();
        setTrainingData(training);
      }
      
      // Load held-out data
      const heldOutResp = await fetch(`${baseUrl}/data/held_out`, { credentials: 'include' });
      if (heldOutResp.ok) {
        const heldOut = await heldOutResp.json();
        setHeldOutData(heldOut);
        setIsTestMode(heldOut.length > 0); // Auto-enable test mode if held-out data exists
      }
    } catch (error) {
      console.error("Error loading training/held-out data:", error);
    }
  };

  const handleSplitDataset = async () => {
    if (!confirm(`Split dataset: ${holdoutPercentage}% will be moved to held-out set for testing. Continue?`)) {
      return;
    }
    
    setIsSplitting(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_ML_SERVICE_URL || 'http://localhost:5001';
      const response = await fetch(`${baseUrl}/data/split_dataset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ holdout_percentage: holdoutPercentage })
      });
      
      if (response.ok) {
        const result = await response.json();
        alert(`Dataset split successfully!\nTraining: ${result.training_count} rows\nHeld-out: ${result.held_out_count} rows\n\nBuilding vector store... (task ID: ${result.task_id})`);
        
        // Reload data
        await loadTrainingAndHeldOutData();
        setIsTestMode(true);
      } else {
        const error = await response.json();
        alert("Split failed: " + error.error);
      }
    } catch (error) {
      alert("Error splitting dataset: " + error.message);
    }
    setIsSplitting(false);
  };

  const moveToHeldOut = async (row) => {
    const newHeldOut = [...heldOutData, row];
    const newTraining = trainingData.filter(r => r.id !== row.id);
    
    setHeldOutData(newHeldOut);
    setTrainingData(newTraining);
    
    // Save to backend
    try {
      const baseUrl = process.env.NEXT_PUBLIC_ML_SERVICE_URL || 'http://localhost:5001';
      await fetch(`${baseUrl}/data/held_out`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newHeldOut)
      });
      
      // Also update training dataset
      await saveDataset(newTraining);
    } catch (error) {
      console.error("Error moving to held-out:", error);
    }
  };

  const moveToTraining = async (row) => {
    const newTraining = [...trainingData, row];
    const newHeldOut = heldOutData.filter(r => r.id !== row.id);
    
    setTrainingData(newTraining);
    setHeldOutData(newHeldOut);
    
    // Save to backend
    try {
      const baseUrl = process.env.NEXT_PUBLIC_ML_SERVICE_URL || 'http://localhost:5001';
      await fetch(`${baseUrl}/data/held_out`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newHeldOut)
      });
      
      // Also update training dataset
      await saveDataset(newTraining);
    } catch (error) {
      console.error("Error moving to training:", error);
    }
  };

  const handleGetStarted = () => {
    setIsAnimating(true);
    // Immediately show dashboard and fade out original content
    setShowDashboard(true);
    // Trigger the animation
    if (earthRef.current && earthRef.current.triggerAnimation) {
      earthRef.current.triggerAnimation();
    }
  };

  const handleAnimationComplete = () => {
    setIsAnimating(false);
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handleNavClick = (itemId) => {
    if (activeNavItem === itemId) return; // Don't transition if already active

    setIsTransitioning(true);

    // Trigger Earth animation based on destination and source
    if (itemId === "ai") {
      // Moving to AI
      if (activeNavItem === "data") {
        // Data → AI: No animation needed (both are bottom left)
        setTimeout(() => {
          setActiveNavItem(itemId);
          setTimeout(() => {
            setIsTransitioning(false);
          }, 50);
        }, 300);
      } else {
        // Overview → AI: Earth goes to bottom left
        if (earthRef.current && earthRef.current.triggerLeftAnimation) {
          earthRef.current.triggerLeftAnimation();
          setTimeout(() => {
            setActiveNavItem(itemId);
            setTimeout(() => {
              setIsTransitioning(false);
            }, 50);
          }, 1000);
        }
      }
    } else if (itemId === "data") {
      // Moving to Data tab
      if (activeNavItem === "ai") {
        // AI → Data: No animation needed (both are bottom left)
        setTimeout(() => {
          setActiveNavItem(itemId);
          setTimeout(() => {
            setIsTransitioning(false);
          }, 50);
        }, 300);
      } else {
        // Coming from Overview - Earth moves from bottom right to bottom left
        if (earthRef.current && earthRef.current.triggerLeftAnimation) {
          earthRef.current.triggerLeftAnimation();
          setTimeout(() => {
            setActiveNavItem(itemId);
            setTimeout(() => {
              setIsTransitioning(false);
            }, 50);
          }, 1000);
        }
      }
    } else if (activeNavItem === "data") {
      // Moving away from Data tab
      if (itemId === "ai") {
        // Data → AI: No animation needed (both are bottom left)
        setTimeout(() => {
          setActiveNavItem(itemId);
          setTimeout(() => {
            setIsTransitioning(false);
          }, 50);
        }, 300);
      } else if (itemId === "overview") {
        // Data → Overview: Earth moves from bottom left to bottom right
        if (earthRef.current && earthRef.current.triggerRightAnimation) {
          earthRef.current.triggerRightAnimation();
          setTimeout(() => {
            setActiveNavItem(itemId);
            setTimeout(() => {
              setIsTransitioning(false);
            }, 50);
          }, 1000);
        }
      }
    } else if (activeNavItem === "ai" && itemId !== "ai") {
      // Moving away from AI to Overview - Earth goes back to bottom right
      if (earthRef.current && earthRef.current.triggerRightAnimation) {
        earthRef.current.triggerRightAnimation();
        setTimeout(() => {
          setActiveNavItem(itemId);
          setTimeout(() => {
            setIsTransitioning(false);
          }, 50);
        }, 1000);
      }
    } else {
      // For other transitions (like Overview to AI), use the original fast transition
      setTimeout(() => {
        setActiveNavItem(itemId);
        setTimeout(() => {
          setIsTransitioning(false);
        }, 50);
      }, 300);
    }
  };

  // Reset to page 1 when mission changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeMission]);

  // Load exoplanet data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [koiData, k2Data, tessData] = await Promise.all([
          loadKOIData(),
          loadK2Data(),
          loadTESSData(),
        ]);

        setData({
          KOI: koiData,
          TESS: tessData,
          K2: k2Data,
        });
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Load dataset data for Data Explorer
  useEffect(() => {
    const loadDatasetDataAsync = async () => {
      setDatasetLoading(true);
      try {
        const datasetDataResult = await loadDatasetData();
        setDatasetData(datasetDataResult);
        const uniqueTypes = Array.from(
          new Set(datasetDataResult.map((row) => row.type))
        ).filter(Boolean);
        setDatasetTypeFilter(uniqueTypes);
      } catch (error) {
        console.error("Error loading dataset data:", error);
      } finally {
        setDatasetLoading(false);
      }
    };
    loadDatasetDataAsync();
  }, []);

  // Calculate column widths for dataset table
  useEffect(() => {
    if (datasetData.length > 0) {
      const timer = setTimeout(() => {
        const headerFont = "600 0.85rem Inter";
        const cellFont = "400 0.9rem Inter";
        const numericCellFont = "400 0.9rem 'Roboto Mono'";
        const padding = 32;

        const tableColumns = [
          { key: "type", label: "Telescope Type" },
          { key: "id", label: "Planet ID" },
          { key: "name", label: "Planet Name" },
          { key: "disposition", label: "Disposition" },
          { key: "period", label: "Orbital Period (days)" },
          { key: "duration", label: "Transit Duration (hours)" },
          { key: "depth", label: "Transit Depth (ppm)" },
          { key: "prad", label: "Orbital Radius (Earth radii)" },
          { key: "teq", label: "Equilibrium Temperature (K)" },
        ];

        const newWidths = {};
        tableColumns.forEach((column) => {
          let maxWidth = measureText(column.label, headerFont);

          if (column.key === "disposition") {
            maxWidth = Math.max(maxWidth, 140);
          }

          const sampleSize = 500;
          const dataSample = datasetData.slice(0, sampleSize);

          dataSample.forEach((row) => {
            const isNumeric = [
              "id",
              "period",
              "duration",
              "depth",
              "prad",
              "teq",
            ].includes(column.key);
            const font = isNumeric ? numericCellFont : cellFont;
            const text = row[column.key] ? row[column.key].toString() : "";
            const width = measureText(text, font);
            if (width > maxWidth) {
              maxWidth = width;
            }
          });
          newWidths[column.key] = Math.ceil(maxWidth + padding);
        });
        setDatasetColumnWidths(newWidths);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [datasetData]);

  // Load training/held-out data when classify tab becomes active
  useEffect(() => {
    if (activeNavItem === "classify") {
      loadTrainingAndHeldOutData();
    }
  }, [activeNavItem]);

  const missions = [
    {
      id: "KOI",
      label: "Kepler Objects of Interest",
      description: "Kepler mission candidates",
      icon: RiPlanetLine,
      color: "#8072FF",
    },
    {
      id: "TESS",
      label: "Transiting Exoplanet Survey Satellite",
      description: "TESS mission discoveries",
      icon: RiSatelliteLine,
      color: "#675DC2",
    },
    {
      id: "K2",
      label: "Kepler Extended Mission",
      description: "K2 mission observations",
      icon: RiStarLine,
      color: "#5A4BB8",
    },
  ];

  const totalExoplanets = Object.values(data).reduce(
    (sum, arr) => sum + arr.length,
    0
  );

  // Pagination logic
  const currentData = data[activeMission] || [];
  const totalPages = Math.ceil(currentData.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedData = currentData.slice(startIndex, endIndex);

  // Dataset table logic
  const datasetTableColumns = [
    { key: "type", label: "Telescope Type" },
    { key: "id", label: "Planet ID" },
    { key: "name", label: "Planet Name" },
    { key: "disposition", label: "Disposition" },
    { key: "period", label: "Orbital Period (days)" },
    { key: "duration", label: "Transit Duration (hours)" },
    { key: "depth", label: "Transit Depth (ppm)" },
    { key: "prad", label: "Orbital Radius (Earth radii)" },
    { key: "teq", label: "Equilibrium Temperature (K)" },
    { key: "actions", label: "Actions" },
  ];

  const sortedDatasetData = useMemo(() => {
    let sortableData = [...datasetData];
    if (datasetSortConfig.key !== null) {
      sortableData.sort((a, b) => {
        if (a[datasetSortConfig.key] === null) return 1;
        if (b[datasetSortConfig.key] === null) return -1;
        if (a[datasetSortConfig.key] < b[datasetSortConfig.key]) {
          return datasetSortConfig.direction === "ascending" ? -1 : 1;
        }
        if (a[datasetSortConfig.key] > b[datasetSortConfig.key]) {
          return datasetSortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableData;
  }, [datasetData, datasetSortConfig]);

  const datasetTotalPages = Math.ceil(
    sortedDatasetData.length / datasetRowsPerPage
  );
  const datasetStartIndex = (datasetCurrentPage - 1) * datasetRowsPerPage;
  const datasetEndIndex = datasetStartIndex + datasetRowsPerPage;
  const paginatedDatasetData = sortedDatasetData.slice(
    datasetStartIndex,
    datasetEndIndex
  );

  // Generate random stars
  const generateStars = () => {
    const stars = [];
    const numStars = 80;

    for (let i = 0; i < numStars; i++) {
      const size = Math.random() * 3 + 1;
      const x = Math.random() * 100;
      const y = Math.random() * 100;

      stars.push(
        <div
          key={i}
          className="star"
          style={{
            width: `${size}px`,
            height: `${size}px`,
            left: `${x}%`,
            top: `${y}%`,
          }}
        />
      );
    }
    return stars;
  };

  return (
    <>
      <Head>
        <title>NASA Exoplanet Explorer</title>
        <meta
          name="description"
          content="Explore exoplanets with NASA's interactive 3D Earth"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </Head>

      <Layout>
        {/* Submission Text */}
        <div
          style={{
            position: "fixed",
            top: "2rem",
            left: "50%",
            transform: "translateX(-50%)",
            textAlign: "center",
            color: "rgba(255, 255, 255, 0.8)",
            fontFamily: "'Inter', sans-serif",
            fontSize: "0.875rem",
            zIndex: 10,
            letterSpacing: "0.3em",
            fontWeight: "100",
            opacity: showDashboard ? 0 : 1,
            transition: "opacity 0.8s ease-in-out",
            pointerEvents: showDashboard ? "none" : "auto",
          }}
        >
          Submitted to: A World Away: Hunting for Exoplanets with{" "}
          <strong>AI</strong>
        </div>

        <img
          src="/images/spaceapps_logo.jpeg"
          alt="NASA Logo"
          style={{
            position: "fixed",
            top: "1.5rem",
            right: "2rem",
            width: "200px",
            height: "auto",
            zIndex: 20,
            opacity: 0.92,
            pointerEvents: "none",
            opacity: showDashboard ? 0 : 1,
            transition: "opacity 0.8s ease-in-out",
            userSelect: "none",
          }}
        />
        <div className="stars">{generateStars()}</div>
        <ThreeJSEarth
          ref={earthRef}
          onAnimationComplete={handleAnimationComplete}
        />
        {/* Original Header Content */}
        <header
          className="App-header"
          style={{
            position: "absolute",
            right: "16%",
            top: "48%",
            transform: "translateY(-50%)",
            textAlign: "right",
            zIndex: 10,
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            opacity: showDashboard ? 0 : 1,
            transition: "opacity 0.8s ease-in-out",
            pointerEvents: showDashboard ? "none" : "auto",
          }}
        >
          <h1
            style={{
              margin: "0",
              textAlign: "right",
              fontFamily: "'Inter', sans-serif",
              fontWeight: "400",
              color: "white",
              fontSize: "4rem",
            }}
          >
            Crackin'
          </h1>
          <h2
            style={{
              margin: "-0.5rem 0 0 0",
              textAlign: "right",
              fontFamily: "'Inter', sans-serif",
              fontWeight: "700",
              color: "#8072FF",
              fontSize: "4rem",
            }}
          >
            exoplanets
          </h2>
          <p
            style={{
              margin: "0.25rem 0 0 0",
              textAlign: "right",
              fontFamily: "'Inter', sans-serif",
              fontWeight: "300",
              color: "rgba(255, 255, 255, 0.7)",
              fontSize: "0.875rem",
              letterSpacing: "-0.02em",
              width: "fit-content",
              marginLeft: "auto",
            }}
          >
            RAG + LLM based exoplanet classifier solution
          </p>
          {/* Placeholder image with 340:142 ratio
          <img
            src="/images/spaceapps_logo.jpeg"
            alt="Space Apps Logo"
            style={{
              width: "21.25rem",
              height: "8.875rem",
              objectFit: "contain",
              borderRadius: "0.5rem",
              margin: "0.5rem 0",
            }}
          /> */}
          <button
            onClick={handleGetStarted}
            disabled={isAnimating}
            style={{
              display: "inline-block",
              background: "linear-gradient(135deg, #8072FF 0%, #675DC2 100%)",
              color: "white",
              textDecoration: "none",
              padding: "1.25rem 2.5rem",
              borderRadius: "3rem",
              fontSize: "1.375rem",
              marginTop: "1.5rem",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              textAlign: "center",
              alignSelf: "flex-end",
              fontFamily: "'Inter', sans-serif",
              fontWeight: "700",
              border: "none",
              position: "relative",
              overflow: "hidden",
              cursor: isAnimating ? "default" : "pointer",
              opacity: isAnimating ? 0.7 : 1,
              boxShadow: "0 4px 20px rgba(128, 114, 255, 0.4), 0 0 0 0 rgba(128, 114, 255, 0.5)",
              animation: isAnimating ? "none" : "buttonPulse 2s ease-in-out infinite",
            }}
            onMouseEnter={(e) => {
              if (!isAnimating) {
                e.target.style.transform = "translateY(-3px) scale(1.05)";
                e.target.style.boxShadow = "0 8px 30px rgba(128, 114, 255, 0.6), 0 0 40px rgba(128, 114, 255, 0.3)";
              }
            }}
            onMouseLeave={(e) => {
              if (!isAnimating) {
                e.target.style.transform = "translateY(0px) scale(1)";
                e.target.style.boxShadow = "0 4px 20px rgba(128, 114, 255, 0.4), 0 0 0 0 rgba(128, 114, 255, 0.5)";
              }
            }}
          >
            <style jsx>{`
              @keyframes buttonPulse {
                0%, 100% {
                  box-shadow: 0 4px 20px rgba(128, 114, 255, 0.4), 0 0 0 0 rgba(128, 114, 255, 0.5);
                }
                50% {
                  box-shadow: 0 4px 25px rgba(128, 114, 255, 0.5), 0 0 20px rgba(128, 114, 255, 0.4);
                }
              }
            `}</style>
            <span style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: "0.5rem", justifyContent: "center" }}>
              {isAnimating ? "Transitioning..." : (
                <>
                  Get Started
                  <span style={{ fontSize: "1.5rem", transition: "transform 0.3s" }}>→</span>
                </>
              )}
            </span>
          </button>
        </header>

        {/* Side Navigation Bar */}
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: "2rem",
            transform: "translateY(-50%)",
            zIndex: 15,
            opacity: showDashboard ? 1 : 0,
            transition: "opacity 0.8s ease-in-out",
            pointerEvents: showDashboard ? "auto" : "none",
          }}
        >
          <div
            style={{
              background: "rgba(0, 0, 0, 0.6)",
              backdropFilter: "blur(10px)",
              borderRadius: "2rem",
              padding: "1.5rem 1rem",
              border: "1px solid rgba(0, 0, 0, 0.5)",
              display: "flex",
              flexDirection: "column",
              gap: "1.5rem",
              alignItems: "center",
              position: "relative",
            }}
          >
            {[
              { icon: RiDashboardLine, label: "Overview", id: "overview" },
              { icon: RiBarChartBoxLine, label: "Data", id: "data" },
              { icon: RiBrainLine, label: "AI Classifier", id: "ai" },
            ].map((item, index) => (
              <div
                key={item.id}
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                }}
                onMouseEnter={() => setHoveredNavItem(item.id)}
                onMouseLeave={() => setHoveredNavItem(null)}
              >
                <button
                  onClick={() => !isTransitioning && handleNavClick(item.id)}
                  disabled={isTransitioning}
                  style={{
                    background:
                      activeNavItem === item.id
                        ? "rgba(128, 114, 255, 0.3)"
                        : "transparent",
                    border: "none",
                    color: isTransitioning
                      ? "rgba(255, 255, 255, 0.5)"
                      : "white",
                    fontSize: "1.5rem",
                    cursor: isTransitioning ? "not-allowed" : "pointer",
                    padding: "0.75rem",
                    borderRadius: "1rem",
                    transition: "all 0.3s ease",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "3rem",
                    height: "3rem",
                    opacity: isTransitioning ? 0.7 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!isTransitioning && activeNavItem !== item.id) {
                      e.target.style.background = "rgba(128, 114, 255, 0.2)";
                    }
                    if (!isTransitioning) {
                      e.target.style.transform = "scale(1.1)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isTransitioning && activeNavItem !== item.id) {
                      e.target.style.background = "transparent";
                    }
                    if (!isTransitioning) {
                      e.target.style.transform = "scale(1)";
                    }
                  }}
                >
                  {isTransitioning && activeNavItem === item.id ? (
                    <div
                      style={{
                        width: "1rem",
                        height: "1rem",
                        border: "2px solid rgba(0, 0, 0, 0.6)",
                        borderTop: "2px solid white",
                        borderRadius: "50%",
                        animation: "spin 1s linear infinite",
                      }}
                    />
                  ) : (
                    <item.icon size={20} />
                  )}
                </button>

                {/* Sliding Text Label */}
                <div
                  style={{
                    position: "absolute",
                    left: "4rem",
                    background: "rgba(128, 114, 255, 0.9)",
                    color: "white",
                    padding: "0.5rem 1rem",
                    borderRadius: "0.75rem",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    fontFamily: "'Inter', sans-serif",
                    whiteSpace: "nowrap",
                    transform:
                      hoveredNavItem === item.id
                        ? "translateX(0)"
                        : "translateX(-100%)",
                    opacity: hoveredNavItem === item.id ? 1 : 0,
                    transition: "all 0.3s ease",
                    pointerEvents: "none",
                    zIndex: 20,
                    boxShadow: "0 4px 12px rgba(128, 114, 255, 0.3)",
                  }}
                >
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Loading Overlay */}
        <LoadingOverlay
          isVisible={isLoading}
          duration={3000}
          title="Loading..."
          subtitle="Please wait while we process your request"
          onComplete={() => setIsLoading(false)}
        />

        {/* Save Dataset Loading Overlay */}
        <LoadingOverlay
          isVisible={isSavingDataset}
          duration={999999}
          title="Saving Dataset..."
          subtitle="Creating vector store in the background... This may take a minute."
          progress={saveProgress}
        />

        {/* Dashboard Content - Scrollable Container */}
        <div
          className="dashboard-scrollable"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            zIndex: 10,
            opacity: showDashboard ? (isTransitioning ? 0 : 1) : 0,
            transition: "opacity 0.6s ease-in-out",
            pointerEvents: showDashboard ? "auto" : "none",
            overflow: "auto",
          }}
        >
          {/* Data Tab Content */}
          {activeNavItem === "data" ? (
            <div
              style={{
                minHeight: "100vh",
                padding: "3rem 5% 3rem 8rem",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                overflow: "auto",
              }}
            >
              {/* Header */}
              <div
                style={{
                  textAlign: "center",
                  marginBottom: "3rem",
                  maxWidth: "1000px",
                }}
              >
                <h1
                  style={{
                    fontSize: "3.5rem",
                    fontWeight: "800",
                    margin: "0 0 1rem 0",
                    background:
                      "linear-gradient(135deg, #ffffff 0%, #8072FF 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                    Data Explorer
                </h1>
                <p
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: "300",
                    color: "rgba(255, 255, 255, 0.8)",
                    margin: "0 0 1.5rem 0",
                    fontFamily: "'Inter', sans-serif",
                    lineHeight: "1.6",
                  }}
                >
                  Interactive dataset of exoplanets from KOI, TESS, and K2
                  missions
                </p>
              </div>

              {/* Action Bar */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "2rem",
                  flexWrap: "wrap",
                  gap: "1.5rem",
                  width: "100%",
                  maxWidth: "1200px",
                }}
              >
                {/* Left Side: Controls for data manipulation */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "1rem",
                    flexWrap: "wrap",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.8rem",
                      flexWrap: "wrap",
                    }}
                  >
                    <span
                      style={{
                        marginRight: "0.5rem",
                        fontWeight: "500",
                        whiteSpace: "nowrap",
                        color: "rgba(255, 255, 255, 0.9)",
                        fontFamily: "'Inter', sans-serif",
                      }}
                    >
                      Filter by Type:
                    </span>
                    {[
                      { value: "koi", label: "Kepler" },
                      { value: "toi", label: "TESS" },
                      { value: "k2", label: "K2" },
                    ].map((option) => (
                      <label
                        key={option.value}
            style={{
              display: "inline-block",
                          cursor: "pointer",
                          userSelect: "none",
                        }}
                      >
                        <input
                          type="checkbox"
                          style={{ display: "none" }}
                          checked={datasetTypeFilter.includes(option.value)}
                          onChange={(e) => {
                            setDatasetCurrentPage(1);
                            let selected = datasetTypeFilter
                              ? datasetTypeFilter
                              : [];
                            if (e.target.checked) {
                              selected = [...selected, option.value];
                            } else {
                              selected = selected.filter(
                                (v) => v !== option.value
                              );
                            }
                            setDatasetTypeFilter(
                              selected.length === 0 ? [] : selected
                            );
                            handleDatasetFilterChange(selected);
                          }}
                        />
                        <span
                          style={{
                            display: "inline-block",
                            padding: "8px 16px",
                            borderRadius: "20px",
                            backgroundColor: datasetTypeFilter.includes(
                              option.value
                            )
                              ? "#4A90E2"
                              : "rgba(0, 0, 0, 0.5)",
                            color: datasetTypeFilter.includes(option.value)
                              ? "#ffffff"
                              : "rgba(255, 255, 255, 0.8)",
                            border: `1px solid ${
                              datasetTypeFilter.includes(option.value)
                                ? "#4A90E2"
                                : "rgba(0, 0, 0, 0.6)"
                            }`,
                            fontSize: "0.85rem",
                            fontWeight: "500",
                            transition: "all 0.2s ease-in-out",
                            fontFamily: "'Inter', sans-serif",
                            boxShadow: datasetTypeFilter.includes(option.value)
                              ? "0 0 10px rgba(74, 144, 226, 0.5)"
                              : "none",
                          }}
                        >
                          {option.label}
                        </span>
                      </label>
                    ))}
                  </div>

                  <button
                    onClick={() => {
                      const fileInput = document.createElement("input");
                      fileInput.type = "file";
                      fileInput.accept = ".csv";
                      fileInput.onchange = (e) => {
                        const file = e.target.files[0];
                        if (file) {
                          handleUploadUserData(file);
                        }
                      };
                      fileInput.click();
                    }}
                    style={{
                      background: "rgba(0, 0, 0, 0.5)",
                      color: "rgba(255, 255, 255, 0.8)",
                      border: "1px solid rgba(0, 0, 0, 0.6)",
                      padding: "10px 20px",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: "600",
                      fontSize: "0.9rem",
                      transition: "all 0.2s ease-in-out",
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = "rgba(0, 0, 0, 0.6)";
                      e.target.style.borderColor = "rgba(0, 0, 0, 0.6)";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = "rgba(0, 0, 0, 0.5)";
                      e.target.style.borderColor = "rgba(0, 0, 0, 0.6)";
                    }}
                  >
                    Upload CSV
                  </button>
                </div>

                {/* Right Side: Save action */}
                <div>
                  <button
                    onClick={handleSaveDataset}
                    disabled={isSavingDataset}
                    style={{
                      background: isSavingDataset
                        ? "rgba(74, 144, 226, 0.5)"
                        : "rgba(74, 144, 226, 0.8)",
                      color: "#ffffff",
                      border: "none",
                      padding: "10px 20px",
                      borderRadius: "8px",
                      cursor: isSavingDataset ? "not-allowed" : "pointer",
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: "600",
                      fontSize: "0.9rem",
                      transition: "all 0.2s ease-in-out",
                      boxShadow: "0 2px 5px rgba(0, 0, 0, 0.2)",
                      opacity: isSavingDataset ? 0.7 : 1,
                    }}
                    onMouseEnter={(e) => {
                      if (!isSavingDataset) {
                        e.target.style.background = "#4A90E2";
                        e.target.style.transform = "translateY(-2px)";
                        e.target.style.boxShadow =
                          "0 4px 8px rgba(0, 0, 0, 0.3)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSavingDataset) {
                        e.target.style.background = "rgba(74, 144, 226, 0.8)";
                        e.target.style.transform = "translateY(0)";
                        e.target.style.boxShadow =
                          "0 2px 5px rgba(0, 0, 0, 0.2)";
                      }
                    }}
                  >
                    Save Dataset
                  </button>
                </div>
              </div>

              {/* Table Container */}
              <div
                style={{
                  background: "rgba(0, 0, 0, 0.5)",
                  backdropFilter: "blur(10px)",
                  borderRadius: "15px",
                  padding: "2rem",
                  border: "1px solid rgba(0, 0, 0, 0.6)",
                  overflowX: "auto",
                  width: "100%",
                  maxWidth: "1200px",
                }}
              >
                <div style={{ overflow: "auto" }}>
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "separate",
                      borderSpacing: "0",
                      fontFamily: "'Inter', sans-serif",
                      color: "#c9d1d9",
                      tableLayout: "fixed",
                    }}
                  >
                    <thead>
                      <tr
                        onMouseEnter={(e) => {
                          const cells = e.currentTarget.querySelectorAll('th');
                          cells.forEach(cell => {
                            cell.style.color = "#c9d1d9";
                          });
                        }}
                        onMouseLeave={(e) => {
                          const cells = e.currentTarget.querySelectorAll('th');
                          cells.forEach(cell => {
                            cell.style.color = "#8b949e";
                          });
                        }}
                      >
                        {datasetTableColumns.map((column) => (
                          <th
                            key={column.key}
                            onClick={column.key !== "actions" ? () => datasetRequestSort(column.key) : undefined}
                            style={{
                              cursor: column.key !== "actions" ? "pointer" : "default",
                              userSelect: "none",
                              position: "relative",
                              paddingRight: column.key !== "actions" ? "30px" : "16px",
                              transition: "color 0.2s ease-in-out",
                              padding: "14px 16px",
                              textAlign: column.key === "actions" ? "center" : "left",
                              fontWeight: "600",
                              fontSize: "0.85rem",
                              textTransform: "uppercase",
                              letterSpacing: "0.05em",
                              backgroundColor: "transparent",
                              color: "#8b949e",
                              borderBottom: "2px solid #30363d",
                              width: column.key === "actions" ? "120px" : (datasetColumnWidths[column.key] || "auto"),
                            }}
                          >
                            <span>{column.label}</span>
                            {datasetSortConfig.key === column.key && column.key !== "actions" && (
                              <span
                                style={{
                                  position: "absolute",
                                  right: "8px",
                                  top: "50%",
                                  transform: "translateY(-50%)",
                                  opacity: "0.7",
                                  fontSize: "0.9em",
                                  marginLeft: "auto",
                                  paddingLeft: "12px",
                                  flexShrink: "0",
                                }}
                              >
                                {datasetSortConfig.direction === "ascending"
                                  ? " ▲"
                                  : " ▼"}
                              </span>
                            )}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {datasetLoading ? (
                        <tr>
                          <td
                            colSpan={datasetTableColumns.length}
                            style={{
                              padding: "3rem",
                              textAlign: "center",
                              color: "rgba(255, 255, 255, 0.6)",
                              fontSize: "1rem",
                              fontFamily: "'Inter', sans-serif",
                            }}
                          >
                            Loading dataset data...
                          </td>
                        </tr>
                      ) : paginatedDatasetData.length > 0 ? (
                        paginatedDatasetData.map((planet, rowIndex) => (
                          <tr
                            key={rowIndex}
                            style={{
                              borderBottom: "1px solid #21262d",
                              transition: "background-color 0.2s ease-in-out",
                              backgroundColor:
                                rowIndex % 2 === 0
                                  ? "rgba(13, 17, 23, 0.5)"
                                  : "transparent",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor =
                                "rgba(74, 144, 226, 0.1)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor =
                                rowIndex % 2 === 0
                                  ? "rgba(13, 17, 23, 0.5)"
                                  : "transparent";
                            }}
                          >
                            <td
                              style={{
                                padding: "12px 16px",
                                borderBottom: "1px solid #21262d",
                                verticalAlign: "middle",
                              }}
                            >
                              {getTelescopeName(planet.type)}
                            </td>
                            <td
                              style={{
                                padding: "12px 16px",
                                borderBottom: "1px solid #21262d",
                                verticalAlign: "middle",
                                fontFamily: "'Roboto Mono', monospace",
                                fontSize: "0.9rem",
                              }}
                            >
                              {planet.id}
                            </td>
                            <td
                              style={{
                                padding: "12px 16px",
                                borderBottom: "1px solid #21262d",
                                verticalAlign: "middle",
                              }}
                            >
                              {planet.name}
                            </td>
                            <td
                              style={{
                                padding: "12px 16px",
                                borderBottom: "1px solid #21262d",
                                verticalAlign: "middle",
                              }}
                            >
                              {getDisposition(planet.disposition)}
                            </td>
                            <td
                              style={{
                                padding: "12px 16px",
                                borderBottom: "1px solid #21262d",
                                verticalAlign: "middle",
                                fontFamily: "'Roboto Mono', monospace",
                                fontSize: "0.9rem",
                              }}
                            >
                              {planet.period}
                            </td>
                            <td
                              style={{
                                padding: "12px 16px",
                                borderBottom: "1px solid #21262d",
                                verticalAlign: "middle",
                                fontFamily: "'Roboto Mono', monospace",
                                fontSize: "0.9rem",
                              }}
                            >
                              {planet.duration}
                            </td>
                            <td
                              style={{
                                padding: "12px 16px",
                                borderBottom: "1px solid #21262d",
                                verticalAlign: "middle",
                                fontFamily: "'Roboto Mono', monospace",
                                fontSize: "0.9rem",
                              }}
                            >
                              {planet.depth}
                            </td>
                            <td
                              style={{
                                padding: "12px 16px",
                                borderBottom: "1px solid #21262d",
                                verticalAlign: "middle",
                                fontFamily: "'Roboto Mono', monospace",
                                fontSize: "0.9rem",
                              }}
                            >
                              {planet.prad}
                            </td>
                            <td
                              style={{
                                padding: "12px 16px",
                                borderBottom: "1px solid #21262d",
                                verticalAlign: "middle",
                                fontFamily: "'Roboto Mono', monospace",
                                fontSize: "0.9rem",
                              }}
                            >
                              {planet.teq}
                            </td>
                            <td
                              style={{
                                padding: "12px 16px",
                                borderBottom: "1px solid #21262d",
                                verticalAlign: "middle",
                                textAlign: "center",
                              }}
                            >
                              {planet.type?.toLowerCase() === "user" && (
                                <button
                                  onClick={() => handleRemoveRow(planet.id)}
                                  style={{
                                    background: "rgba(220, 38, 38, 0.8)",
                                    color: "white",
                                    border: "none",
                                    padding: "6px 12px",
                                    borderRadius: "6px",
                                    cursor: "pointer",
                                    fontSize: "0.8rem",
                                    fontWeight: "600",
                                    transition: "all 0.2s ease",
                                  }}
                                  onMouseEnter={(e) => {
                                    e.target.style.background = "rgba(220, 38, 38, 1)";
                                    e.target.style.transform = "translateY(-1px)";
                                  }}
                                  onMouseLeave={(e) => {
                                    e.target.style.background = "rgba(220, 38, 38, 0.8)";
                                    e.target.style.transform = "translateY(0)";
                                  }}
                                >
                                  Remove
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={datasetTableColumns.length}
                            style={{
                              padding: "3rem",
                              textAlign: "center",
                              color: "rgba(255, 255, 255, 0.6)",
                              fontSize: "1rem",
                              fontFamily: "'Inter', sans-serif",
                            }}
                          >
                            No data available for your dataset
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination */}
              {!datasetLoading &&
                sortedDatasetData.length > datasetRowsPerPage && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      gap: "1.5rem",
                      marginTop: "2rem",
                      padding: "1rem",
                      userSelect: "none",
                    }}
                  >
                    <button
                      onClick={() =>
                        setDatasetCurrentPage(datasetCurrentPage - 1)
                      }
                      disabled={datasetCurrentPage === 1}
                      style={{
                        background:
                          datasetCurrentPage === 1
                            ? "rgba(0, 0, 0, 0.5)"
                            : "rgba(74, 144, 226, 0.8)",
                        color:
                          datasetCurrentPage === 1
                            ? "rgba(0, 0, 0, 0.6)"
                            : "#ffffff",
                        border: "none",
                        padding: "10px 20px",
                        borderRadius: "8px",
                        cursor:
                          datasetCurrentPage === 1 ? "not-allowed" : "pointer",
                        fontFamily: "'Inter', sans-serif",
                        fontWeight: "600",
                        fontSize: "0.9rem",
                        transition: "all 0.2s ease-in-out",
                        boxShadow:
                          datasetCurrentPage === 1
                            ? "none"
                            : "0 2px 5px rgba(0, 0, 0, 0.2)",
                      }}
                      onMouseEnter={(e) => {
                        if (datasetCurrentPage !== 1) {
                          e.target.style.background = "#4A90E2";
                          e.target.style.transform = "translateY(-2px)";
                          e.target.style.boxShadow =
                            "0 4px 8px rgba(0, 0, 0, 0.3)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (datasetCurrentPage !== 1) {
                          e.target.style.background = "rgba(74, 144, 226, 0.8)";
                          e.target.style.transform = "translateY(0)";
                          e.target.style.boxShadow =
                            "0 2px 5px rgba(0, 0, 0, 0.2)";
                        }
                      }}
                    >
                      ← Previous
                    </button>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "0.25rem",
                      }}
                    >
                      <span
                        style={{
                          color: "#e0e0e0",
                          fontSize: "0.95rem",
                          fontWeight: "500",
                          fontFamily: "'Inter', sans-serif",
                        }}
                      >
                        Page {datasetCurrentPage} of {datasetTotalPages}
                      </span>
                      <span
                        style={{
                          color: "#8b949e",
                          fontSize: "0.8rem",
                          fontFamily: "'Roboto Mono', monospace",
                        }}
                      >
                        ({datasetStartIndex + 1}-
                        {Math.min(datasetEndIndex, sortedDatasetData.length)} of{" "}
                        {sortedDatasetData.length})
                      </span>
                    </div>
                    <button
                      onClick={() =>
                        setDatasetCurrentPage(datasetCurrentPage + 1)
                      }
                      disabled={datasetCurrentPage === datasetTotalPages}
                      style={{
                        background:
                          datasetCurrentPage === datasetTotalPages
                            ? "rgba(0, 0, 0, 0.5)"
                            : "rgba(74, 144, 226, 0.8)",
                        color:
                          datasetCurrentPage === datasetTotalPages
                            ? "rgba(0, 0, 0, 0.6)"
                            : "#ffffff",
                        border: "none",
                        padding: "10px 20px",
                        borderRadius: "8px",
                        cursor:
                          datasetCurrentPage === datasetTotalPages
                            ? "not-allowed"
                            : "pointer",
                        fontFamily: "'Inter', sans-serif",
                        fontWeight: "600",
                        fontSize: "0.9rem",
                        transition: "all 0.2s ease-in-out",
                        boxShadow:
                          datasetCurrentPage === datasetTotalPages
                            ? "none"
                            : "0 2px 5px rgba(0, 0, 0, 0.2)",
                      }}
                      onMouseEnter={(e) => {
                        if (datasetCurrentPage !== datasetTotalPages) {
                          e.target.style.background = "#4A90E2";
                          e.target.style.transform = "translateY(-2px)";
                          e.target.style.boxShadow =
                            "0 4px 8px rgba(0, 0, 0, 0.3)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (datasetCurrentPage !== datasetTotalPages) {
                          e.target.style.background = "rgba(74, 144, 226, 0.8)";
                          e.target.style.transform = "translateY(0)";
                          e.target.style.boxShadow =
                            "0 2px 5px rgba(0, 0, 0, 0.2)";
                        }
                      }}
                    >
                      Next →
                    </button>
                  </div>
                )}
            </div>
          ) : activeNavItem === "ai" ? (
            <div
              style={{
                minHeight: "100vh",
                padding: "3rem 5% 3rem 8rem",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                overflow: "auto",
              }}
            >
              {/* Header */}
              <div
                style={{
                  textAlign: "center",
                  marginBottom: "3rem",
                  maxWidth: "1000px",
                }}
              >
                <h1
                  style={{
                    fontSize: "3.5rem",
                    fontWeight: "800",
                    margin: "0 0 1rem 0",
                    background:
                      "linear-gradient(135deg, #ffffff 0%, #8072FF 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  Classify New Exoplanets
                </h1>
                <p
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: "300",
                    color: "rgba(255, 255, 255, 0.8)",
                    margin: "0 0 1.5rem 0",
                    fontFamily: "'Inter', sans-serif",
                    lineHeight: "1.6",
                  }}
                >
                  Upload CSV or manually enter exoplanet parameters to classify
                  using our 95.45% accurate LLM-based RAG system
                </p>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    gap: "1rem",
                    flexWrap: "wrap",
                  }}
                >
                  <span
                    style={{
                      background:
                        "linear-gradient(135deg, #8072FF 0%, #675DC2 100%)",
              color: "white",
                      padding: "0.75rem 1.5rem",
                      borderRadius: "1.5rem",
                      fontWeight: "bold",
                      fontSize: "1.1rem",
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    95.45% Accurate
                  </span>
                  <span
                    style={{
                      background: "rgba(0, 0, 0, 0.7)",
                      color: "rgba(255, 255, 255, 0.8)",
                      padding: "0.75rem 1.5rem",
                      borderRadius: "1.5rem",
                      fontWeight: "600",
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    LLM In-Context Learning
                  </span>
                  <span
                    style={{
                      background: "rgba(0, 0, 0, 0.7)",
                      color: "rgba(255, 255, 255, 0.8)",
                      padding: "0.75rem 1.5rem",
                      borderRadius: "1.5rem",
                      fontWeight: "600",
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    25 RAG Examples
                  </span>
                </div>
              </div>

              {/* Quick Examples */}
              <div
                style={{
                  background: "rgba(0, 0, 0, 0.4)",
                  borderRadius: "1rem",
                  padding: "2rem",
                  marginBottom: "2rem",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  width: "100%",
                  maxWidth: "1000px",
                }}
              >
                <h3
                  style={{
                    color: "white",
                    fontSize: "1.5rem",
                    fontWeight: "600",
                    margin: "0 0 1.5rem 0",
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  Quick Start - Load Example Data:
                </h3>
                <div
                  style={{
                    display: "flex",
                    gap: "1rem",
                    flexWrap: "wrap",
                  }}
                >
                  <button
                    onClick={() => loadExample("kepler")}
                    style={{
                      flex: "1",
                      minWidth: "180px",
                      background: "rgba(0, 0, 0, 0.3)",
                      color: "white",
                      border: "1px solid rgba(255, 255, 255, 0.2)",
                      padding: "1rem 1.5rem",
                      borderRadius: "0.5rem",
                      cursor: "pointer",
                      fontSize: "1rem",
                      fontWeight: "600",
                      transition: "all 0.2s",
                      fontFamily: "'Inter', sans-serif",
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = "rgba(0, 0, 0, 0.5)";
                      e.target.style.borderColor = "#8072FF";
                      e.target.style.transform = "translateY(-2px)";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = "rgba(0, 0, 0, 0.3)";
                      e.target.style.borderColor = "rgba(255, 255, 255, 0.2)";
                      e.target.style.transform = "translateY(0)";
                    }}
                  >
                    Kepler Example
                  </button>
                  <button
                    onClick={() => loadExample("tess")}
                    style={{
                      flex: "1",
                      minWidth: "180px",
                      background: "rgba(0, 0, 0, 0.3)",
                      color: "white",
                      border: "1px solid rgba(255, 255, 255, 0.2)",
                      padding: "1rem 1.5rem",
                      borderRadius: "0.5rem",
                      cursor: "pointer",
                      fontSize: "1rem",
                      fontWeight: "600",
                      transition: "all 0.2s",
                      fontFamily: "'Inter', sans-serif",
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = "rgba(0, 0, 0, 0.5)";
                      e.target.style.borderColor = "#8072FF";
                      e.target.style.transform = "translateY(-2px)";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = "rgba(0, 0, 0, 0.3)";
                      e.target.style.borderColor = "rgba(255, 255, 255, 0.2)";
                      e.target.style.transform = "translateY(0)";
                    }}
                  >
                    TESS Example
                  </button>
                  <button
                    onClick={() => loadExample("k2")}
                    style={{
                      flex: "1",
                      minWidth: "180px",
                      background: "rgba(0, 0, 0, 0.3)",
                      color: "white",
                      border: "1px solid rgba(255, 255, 255, 0.2)",
                      padding: "1rem 1.5rem",
                      borderRadius: "0.5rem",
                      cursor: "pointer",
                      fontSize: "1rem",
                      fontWeight: "600",
                      transition: "all 0.2s",
                      fontFamily: "'Inter', sans-serif",
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = "rgba(0, 0, 0, 0.5)";
                      e.target.style.borderColor = "#8072FF";
                      e.target.style.transform = "translateY(-2px)";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = "rgba(0, 0, 0, 0.3)";
                      e.target.style.borderColor = "rgba(255, 255, 255, 0.2)";
                      e.target.style.transform = "translateY(0)";
                    }}
                  >
                    K2 Example
                  </button>
                </div>
              </div>

              {/* Classification Form */}
              <div
                style={{
                  background: "rgba(0, 0, 0, 0.4)",
                  borderRadius: "1rem",
                  padding: "2.5rem",
                  marginBottom: "2rem",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  width: "100%",
                  maxWidth: "1000px",
                }}
              >
                <h2
                  style={{
                    color: "white",
                    fontSize: "1.75rem",
                    fontWeight: "600",
                    margin: "0 0 2rem 0",
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  Enter Exoplanet Parameters
                </h2>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                    gap: "2rem",
                    marginBottom: "2.5rem",
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <Tooltip content="Time for the planet to complete one orbit around its star">
                      <label
                        style={{
                          color: "rgba(255, 255, 255, 0.9)",
                          fontSize: "0.95rem",
                          marginBottom: "0.75rem",
                          fontWeight: "600",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          fontFamily: "'Inter', sans-serif",
                        }}
                      >
                        Orbital Period (days)
                        <RiQuestionLine size={14} style={{ opacity: 0.7 }} />
                      </label>
                    </Tooltip>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.period}
                      onChange={(e) =>
                        handleInputChange("period", e.target.value)
                      }
                      placeholder="e.g., 9.49"
                      style={{
                        background: "rgba(0, 0, 0, 0.3)",
                        border: "1px solid rgba(255, 255, 255, 0.2)",
                        borderRadius: "0.5rem",
                        padding: "1rem",
                        color: "white",
                        fontSize: "1rem",
                        transition: "all 0.2s",
                        fontFamily: "'Inter', sans-serif",
                      }}
                      onFocus={(e) => {
                        e.target.style.outline = "none";
                        e.target.style.borderColor = "#8072FF";
                        e.target.style.background = "rgba(0, 0, 0, 0.5)";
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = "rgba(255, 255, 255, 0.2)";
                        e.target.style.background = "rgba(0, 0, 0, 0.3)";
                      }}
                    />
                  </div>

                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <Tooltip content="How long the planet takes to pass in front of its star">
                      <label
                        style={{
                          color: "rgba(255, 255, 255, 0.9)",
                          fontSize: "0.95rem",
                          marginBottom: "0.75rem",
                          fontWeight: "600",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          fontFamily: "'Inter', sans-serif",
                        }}
                      >
                        Transit Duration (hours)
                        <RiQuestionLine size={14} style={{ opacity: 0.7 }} />
                      </label>
                    </Tooltip>
                    <input
                      type="number"
                      step="0.001"
                      value={formData.duration}
                      onChange={(e) =>
                        handleInputChange("duration", e.target.value)
                      }
                      placeholder="e.g., 2.96"
                      style={{
                        background: "rgba(0, 0, 0, 0.3)",
                        border: "1px solid rgba(255, 255, 255, 0.2)",
                        borderRadius: "0.5rem",
                        padding: "1rem",
                        color: "white",
                        fontSize: "1rem",
                        transition: "all 0.2s",
                        fontFamily: "'Inter', sans-serif",
                      }}
                      onFocus={(e) => {
                        e.target.style.outline = "none";
                        e.target.style.borderColor = "#8072FF";
                        e.target.style.background = "rgba(0, 0, 0, 0.5)";
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = "rgba(255, 255, 255, 0.2)";
                        e.target.style.background = "rgba(0, 0, 0, 0.3)";
                      }}
                    />
                  </div>

                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <Tooltip content="Amount of starlight blocked when the planet passes in front">
                      <label
                        style={{
                          color: "rgba(255, 255, 255, 0.9)",
                          fontSize: "0.95rem",
                          marginBottom: "0.75rem",
                          fontWeight: "600",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          fontFamily: "'Inter', sans-serif",
                        }}
                      >
                        Transit Depth (ppm)
                        <RiQuestionLine size={14} style={{ opacity: 0.7 }} />
                      </label>
                    </Tooltip>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.depth}
                      onChange={(e) =>
                        handleInputChange("depth", e.target.value)
                      }
                      placeholder="e.g., 615.8"
                      style={{
                        background: "rgba(0, 0, 0, 0.3)",
                        border: "1px solid rgba(255, 255, 255, 0.2)",
                        borderRadius: "0.5rem",
                        padding: "1rem",
                        color: "white",
                        fontSize: "1rem",
                        transition: "all 0.2s",
                        fontFamily: "'Inter', sans-serif",
                      }}
                      onFocus={(e) => {
                        e.target.style.outline = "none";
                        e.target.style.borderColor = "#8072FF";
                        e.target.style.background = "rgba(0, 0, 0, 0.5)";
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = "rgba(255, 255, 255, 0.2)";
                        e.target.style.background = "rgba(0, 0, 0, 0.3)";
                      }}
                    />
                  </div>

                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <Tooltip content="The radius of the planet compared to Earth's radius (R⊕). Values greater than 1 indicate planets larger than Earth, while values less than 1 indicate smaller planets.">
                      <label
                        style={{
                          color: "rgba(255, 255, 255, 0.9)",
                          fontSize: "0.95rem",
                          marginBottom: "0.75rem",
                          fontWeight: "600",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          fontFamily: "'Inter', sans-serif",
                        }}
                      >
                        Planetary Radius (R⊕)
                        <RiQuestionLine size={14} style={{ opacity: 0.7 }} />
                      </label>
                    </Tooltip>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.prad}
                      onChange={(e) =>
                        handleInputChange("prad", e.target.value)
                      }
                      placeholder="e.g., 2.26"
                      style={{
                        background: "rgba(0, 0, 0, 0.3)",
                        border: "1px solid rgba(255, 255, 255, 0.2)",
                        borderRadius: "0.5rem",
                        padding: "1rem",
                        color: "white",
                        fontSize: "1rem",
                        transition: "all 0.2s",
                        fontFamily: "'Inter', sans-serif",
                      }}
                      onFocus={(e) => {
                        e.target.style.outline = "none";
                        e.target.style.borderColor = "#8072FF";
                        e.target.style.background = "rgba(0, 0, 0, 0.5)";
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = "rgba(255, 255, 255, 0.2)";
                        e.target.style.background = "rgba(0, 0, 0, 0.3)";
                      }}
                    />
                  </div>

                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <Tooltip content="The theoretical temperature of the planet's surface if it had no atmosphere, measured in Kelvin (K). This depends on the star's temperature and the planet's distance from it.">
                      <label
                        style={{
                          color: "rgba(255, 255, 255, 0.9)",
                          fontSize: "0.95rem",
                          marginBottom: "0.75rem",
                          fontWeight: "600",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          fontFamily: "'Inter', sans-serif",
                        }}
                      >
                        Equilibrium Temp (K)
                        <RiQuestionLine size={14} style={{ opacity: 0.7 }} />
                      </label>
                    </Tooltip>
                    <input
                      type="number"
                      step="1"
                      value={formData.teq}
                      onChange={(e) => handleInputChange("teq", e.target.value)}
                      placeholder="e.g., 793"
                      style={{
                        background: "rgba(0, 0, 0, 0.3)",
                        border: "1px solid rgba(255, 255, 255, 0.2)",
                        borderRadius: "0.5rem",
                        padding: "1rem",
                        color: "white",
                        fontSize: "1rem",
                        transition: "all 0.2s",
                        fontFamily: "'Inter', sans-serif",
                      }}
                      onFocus={(e) => {
                        e.target.style.outline = "none";
                        e.target.style.borderColor = "#8072FF";
                        e.target.style.background = "rgba(0, 0, 0, 0.5)";
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = "rgba(255, 255, 255, 0.2)";
                        e.target.style.background = "rgba(0, 0, 0, 0.3)";
                      }}
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div
                  style={{
                    display: "flex",
                    gap: "1rem",
                    flexWrap: "wrap",
                  }}
                >
                  <button
                    onClick={classifyExoplanet}
                    disabled={isClassifying}
                    style={{
                      flex: "3",
                      background:
                        "linear-gradient(135deg, #8072FF 0%, #675DC2 100%)",
                      color: "white",
                      border: "none",
                      padding: "1rem 2rem",
                      borderRadius: "0.5rem",
                      fontSize: "1.15rem",
                      fontWeight: "bold",
                      cursor: isClassifying ? "not-allowed" : "pointer",
                      transition: "transform 0.2s",
                      fontFamily: "'Inter', sans-serif",
                      opacity: isClassifying ? 0.6 : 1,
                    }}
                    onMouseEnter={(e) => {
                      if (!isClassifying) {
                        e.target.style.transform = "scale(1.02)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isClassifying) {
                        e.target.style.transform = "scale(1)";
                      }
                    }}
                  >
                    {isClassifying
                      ? "Classifying..."
                      : "Classify with AI"}
                  </button>
                  <button
                    onClick={resetForm}
                    style={{
                      flex: "1",
                      background: "rgba(0, 0, 0, 0.3)",
                      color: "white",
                      border: "1px solid rgba(255, 255, 255, 0.2)",
                      padding: "1rem 2rem",
                      borderRadius: "0.5rem",
                      fontSize: "1.15rem",
                      fontWeight: "bold",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      fontFamily: "'Inter', sans-serif",
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = "rgba(0, 0, 0, 0.5)";
                      e.target.style.borderColor = "#8072FF";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = "rgba(0, 0, 0, 0.3)";
                      e.target.style.borderColor = "rgba(255, 255, 255, 0.2)";
                    }}
                  >
                    Reset
                  </button>
                </div>
              </div>

              {/* Results Section */}
              {result && (
                <div
                  style={{
                    background: "rgba(0, 0, 0, 0.4)",
                    borderRadius: "1rem",
                    padding: "2.5rem",
                    marginBottom: "2rem",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    width: "100%",
                    maxWidth: "1000px",
                    animation: "resultFadeIn 0.5s ease-out",
                  }}
                >
                  <style jsx>{`
                    @keyframes resultFadeIn {
                      from {
                        opacity: 0;
                        transform: translateY(20px);
                      }
                      to {
                        opacity: 1;
                        transform: translateY(0);
                      }
                    }
                    @keyframes pulseGlow {
                      0%, 100% {
                        box-shadow: 0 0 20px rgba(180, 170, 255, 0.3);
                      }
                      50% {
                        box-shadow: 0 0 40px rgba(180, 170, 255, 0.4);
                      }
                    }
                    @keyframes successGlow {
                      0%, 100% {
                        box-shadow: 0 0 30px rgba(140, 220, 170, 0.3);
                      }
                      50% {
                        box-shadow: 0 0 50px rgba(140, 220, 170, 0.4);
                      }
                    }
                    @keyframes falseGlow {
                      0%, 100% {
                        box-shadow: 0 0 30px rgba(255, 180, 180, 0.3);
                      }
                      50% {
                        box-shadow: 0 0 50px rgba(255, 180, 180, 0.4);
                      }
                    }
                  `}</style>

                  {/* Hero Result Banner */}
                  <div
                    style={{
                      background:
                        result.prediction === "CANDIDATE"
                          ? "linear-gradient(135deg, #48bb78 0%, #38a169 100%)"
                          : "linear-gradient(135deg, #f56565 0%, #e53e3e 100%)",
                      borderRadius: "1rem",
                      padding: "3rem 2rem",
                      marginBottom: "2rem",
                      textAlign: "center",
                      position: "relative",
                      overflow: "hidden",
                      animation:
                        result.prediction === "CANDIDATE"
                          ? "successGlow 2s ease-in-out infinite"
                          : "falseGlow 2s ease-in-out infinite",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "3.5rem",
                        marginBottom: "1rem",
                      }}
                    >
                      {result.prediction === "CANDIDATE" ? "✨" : "⚠️"}
                    </div>
                    <h2
                      style={{
                        color: "white",
                        fontSize: "2.5rem",
                        fontWeight: "800",
                        margin: "0 0 1rem 0",
                        fontFamily: "'Inter', sans-serif",
                        textTransform: "uppercase",
                        letterSpacing: "2px",
                        textShadow: "0 2px 10px rgba(0, 0, 0, 0.3)",
                      }}
                    >
                      {result.prediction === "CANDIDATE"
                        ? "Exoplanet Candidate"
                        : "False Positive"}
                    </h2>
                    <div
                      style={{
                        fontSize: "2rem",
                        fontWeight: "700",
                        color: "white",
                        fontFamily: "'Inter', sans-serif",
                        textShadow: "0 2px 10px rgba(0, 0, 0, 0.3)",
                      }}
                    >
                      {(result.confidence * 100).toFixed(1)}% Confidence
                    </div>
                    <div
                      style={{
                        marginTop: "1.5rem",
                        fontSize: "1.1rem",
                        color: "rgba(255, 255, 255, 0.95)",
                        fontFamily: "'Inter', sans-serif",
                        fontWeight: "500",
                      }}
                    >
                      {result.prediction === "CANDIDATE"
                        ? "This object shows strong characteristics of an exoplanet"
                        : "This signal is likely not from a planetary transit"}
                    </div>
                  </div>

                    {/* Result Details - Cards */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                        gap: "1rem",
                        marginBottom: "2rem",
                      }}
                    >
                      <div
                        style={{
                          background: "linear-gradient(135deg, rgba(128, 114, 255, 0.2) 0%, rgba(103, 93, 194, 0.2) 100%)",
                          border: "1px solid rgba(128, 114, 255, 0.3)",
                          padding: "1.5rem",
                          borderRadius: "0.75rem",
                          textAlign: "center",
                        }}
                      >
                        <div
                          style={{
                            color: "rgba(255, 255, 255, 0.7)",
                            fontSize: "0.875rem",
                            marginBottom: "0.5rem",
                            fontFamily: "'Inter', sans-serif",
                            textTransform: "uppercase",
                            letterSpacing: "1px",
                          }}
                        >
                          Model
                        </div>
                        <div
                          style={{
                            color: "white",
                            fontSize: "1.25rem",
                            fontWeight: "700",
                            fontFamily: "'Inter', sans-serif",
                          }}
                        >
                          {result.model}
                        </div>
                      </div>

                      <div
                        style={{
                          background: "linear-gradient(135deg, rgba(128, 114, 255, 0.2) 0%, rgba(103, 93, 194, 0.2) 100%)",
                          border: "1px solid rgba(128, 114, 255, 0.3)",
                          padding: "1.5rem",
                          borderRadius: "0.75rem",
                          textAlign: "center",
                        }}
                      >
                        <div
                          style={{
                            color: "rgba(255, 255, 255, 0.7)",
                            fontSize: "0.875rem",
                            marginBottom: "0.5rem",
                            fontFamily: "'Inter', sans-serif",
                            textTransform: "uppercase",
                            letterSpacing: "1px",
                          }}
                        >
                          RAG Examples
                        </div>
                        <div
                          style={{
                            color: "white",
                            fontSize: "1.25rem",
                            fontWeight: "700",
                            fontFamily: "'Inter', sans-serif",
                          }}
                        >
                          {result.similar_examples_used}
                        </div>
                      </div>

                      <div
                        style={{
                          background: "linear-gradient(135deg, rgba(128, 114, 255, 0.2) 0%, rgba(103, 93, 194, 0.2) 100%)",
                          border: "1px solid rgba(128, 114, 255, 0.3)",
                          padding: "1.5rem",
                          borderRadius: "0.75rem",
                          textAlign: "center",
                        }}
                      >
                        <div
                          style={{
                            color: "rgba(255, 255, 255, 0.7)",
                            fontSize: "0.875rem",
                            marginBottom: "0.5rem",
                            fontFamily: "'Inter', sans-serif",
                            textTransform: "uppercase",
                            letterSpacing: "1px",
                          }}
                        >
                          Processing Time
                        </div>
                        <div
                          style={{
                            color: "white",
                            fontSize: "1.25rem",
                            fontWeight: "700",
                            fontFamily: "'Inter', sans-serif",
                          }}
                        >
                          {result.processing_time}
                        </div>
                      </div>
                    </div>

                    {/* Input Summary */}
                    <div
                      style={{
                        background: "rgba(0, 0, 0, 0.3)",
                        padding: "2rem",
                        borderRadius: "0.75rem",
                        marginBottom: "1.5rem",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                      }}
                    >
                      <h4
                        style={{
                          margin: "0 0 1.5rem 0",
                          color: "white",
              fontSize: "1.2rem",
                          fontWeight: "700",
                          fontFamily: "'Inter', sans-serif",
                          textAlign: "center",
                        }}
                      >
                        Input Parameters
                      </h4>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "repeat(auto-fit, minmax(140px, 1fr))",
                          gap: "1rem",
                          fontFamily: "'Inter', sans-serif",
                        }}
                      >
                        <div style={{ textAlign: "center" }}>
                          <div style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: "0.75rem", marginBottom: "0.25rem", textTransform: "uppercase", letterSpacing: "1px" }}>Period</div>
                          <div style={{ color: "white", fontSize: "1.1rem", fontWeight: "600" }}>{formData.period} days</div>
                        </div>
                        <div style={{ textAlign: "center" }}>
                          <div style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: "0.75rem", marginBottom: "0.25rem", textTransform: "uppercase", letterSpacing: "1px" }}>Duration</div>
                          <div style={{ color: "white", fontSize: "1.1rem", fontWeight: "600" }}>{formData.duration} hrs</div>
                        </div>
                        <div style={{ textAlign: "center" }}>
                          <div style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: "0.75rem", marginBottom: "0.25rem", textTransform: "uppercase", letterSpacing: "1px" }}>Depth</div>
                          <div style={{ color: "white", fontSize: "1.1rem", fontWeight: "600" }}>{formData.depth} ppm</div>
                        </div>
                        <div style={{ textAlign: "center" }}>
                          <div style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: "0.75rem", marginBottom: "0.25rem", textTransform: "uppercase", letterSpacing: "1px" }}>Radius</div>
                          <div style={{ color: "white", fontSize: "1.1rem", fontWeight: "600" }}>{formData.prad} R⊕</div>
                        </div>
                        <div style={{ textAlign: "center" }}>
                          <div style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: "0.75rem", marginBottom: "0.25rem", textTransform: "uppercase", letterSpacing: "1px" }}>Temp</div>
                          <div style={{ color: "white", fontSize: "1.1rem", fontWeight: "600" }}>{formData.teq} K</div>
                        </div>
                      </div>
                    </div>

                    {/* RAG Examples Button */}
                    {result.similar_examples &&
                      result.similar_examples.length > 0 && (
                        <button
                          onClick={() => setShowRagExamples(true)}
                          style={{
                            width: "100%",
                            background: "linear-gradient(135deg, #8072FF 0%, #675DC2 100%)",
                            color: "white",
                            border: "none",
                            padding: "1.25rem",
                            borderRadius: "0.75rem",
                            fontSize: "1.15rem",
                            fontWeight: "bold",
                            cursor: "pointer",
                            transition: "all 0.3s",
                            fontFamily: "'Inter', sans-serif",
                            boxShadow: "0 4px 15px rgba(128, 114, 255, 0.3)",
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.transform = "translateY(-2px)";
                            e.target.style.boxShadow = "0 6px 20px rgba(128, 114, 255, 0.4)";
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.transform = "translateY(0)";
                            e.target.style.boxShadow = "0 4px 15px rgba(128, 114, 255, 0.3)";
                          }}
                        >
                          View {result.similar_examples.length} Similar Examples
                        </button>
                      )}


                  {/* What This Means */}
                  <div
                    style={{
                      background: "rgba(0, 0, 0, 0.7)",
                      borderLeft: "4px solid #8072FF",
                      padding: "1.5rem",
                      borderRadius: "0.75rem",
                      marginBottom: "1.5rem",
                    }}
                  >
                    <h3
                      style={{
                        margin: "0 0 1rem 0",
                        color: "white",
              fontSize: "1.2rem",
                        fontWeight: "600",
                        fontFamily: "'Inter', sans-serif",
                      }}
                    >
                      What Does This Mean?
                    </h3>
                    {result.prediction === "CANDIDATE" ? (
                      <p
                        style={{
                          color: "rgba(255, 255, 255, 0.8)",
                          lineHeight: "1.7",
                          margin: "0",
                          fontSize: "1rem",
                          fontFamily: "'Inter', sans-serif",
                        }}
                      >
                        <strong>CANDIDATE:</strong> Our AI predicts this is
                        likely a real exoplanet! The parameters match patterns
                        of confirmed exoplanets in our training data. This
                        detection would typically require further verification
                        through additional observations.
                      </p>
                    ) : (
                      <p
                        style={{
                          color: "rgba(255, 255, 255, 0.8)",
                          lineHeight: "1.7",
                          margin: "0",
                          fontSize: "1rem",
                          fontFamily: "'Inter', sans-serif",
                        }}
                      >
                        <strong>FALSE POSITIVE:</strong> Our AI predicts this
                        signal is likely noise or a detection artifact, not a
                        real exoplanet. The parameters match patterns of
                        previously identified false positives.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* How It Works */}
              <div
                style={{
                  background: "rgba(0, 0, 0, 0.6)",
                  backdropFilter: "blur(10px)",
                  borderRadius: "1.5rem",
                  padding: "2rem",
                  border: "1px solid rgba(0, 0, 0, 0.5)",
                  width: "100%",
                  maxWidth: "1000px",
                }}
              >
                <h3
                  style={{
                    margin: "0 0 2rem 0",
                    fontSize: "1.8rem",
                    textAlign: "center",
                    color: "white",
                    fontWeight: "600",
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  How Our AI Works
                </h3>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                    gap: "1.5rem",
                  }}
                >
                  <div
                    style={{
                      background: "rgba(0, 0, 0, 0.2)",
                      padding: "2rem",
                      borderRadius: "1rem",
                      textAlign: "center",
                      transition: "transform 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = "translateY(-5px)";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = "translateY(0)";
                    }}
                  >
                    <span
                      style={{
                        display: "inline-block",
                        background:
                          "linear-gradient(135deg, #8072FF 0%, #675DC2 100%)",
                        color: "white",
                        width: "50px",
                        height: "50px",
                        lineHeight: "50px",
                        borderRadius: "50%",
                        fontSize: "1.5rem",
                        fontWeight: "bold",
                        marginBottom: "1rem",
                      }}
                    >
                      1
                    </span>
                    <h4
                      style={{
                        color: "white",
                        margin: "1rem 0 0.75rem 0",
                        fontSize: "1.1rem",
                        fontWeight: "600",
                        fontFamily: "'Inter', sans-serif",
                      }}
                    >
                      RAG Retrieval
                    </h4>
                    <p
                      style={{
                        color: "rgba(255, 255, 255, 0.8)",
                        fontSize: "0.95rem",
                        lineHeight: "1.6",
                        margin: "0",
                        fontFamily: "'Inter', sans-serif",
                      }}
                    >
                      Finds 25 most similar exoplanets from 17,594 labeled
                      entries using vector embeddings
                    </p>
                  </div>
                  <div
                    style={{
                      background: "rgba(0, 0, 0, 0.2)",
                      padding: "2rem",
                      borderRadius: "1rem",
                      textAlign: "center",
                      transition: "transform 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = "translateY(-5px)";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = "translateY(0)";
                    }}
                  >
                    <span
                      style={{
                        display: "inline-block",
                        background:
                          "linear-gradient(135deg, #8072FF 0%, #675DC2 100%)",
                        color: "white",
                        width: "50px",
                        height: "50px",
                        lineHeight: "50px",
                        borderRadius: "50%",
                        fontSize: "1.5rem",
                        fontWeight: "bold",
                        marginBottom: "1rem",
                      }}
                    >
                      2
                    </span>
                    <h4
                      style={{
                        color: "white",
                        margin: "1rem 0 0.75rem 0",
                        fontSize: "1.1rem",
                        fontWeight: "600",
                        fontFamily: "'Inter', sans-serif",
                      }}
                    >
                      In-Context Learning
                    </h4>
                    <p
                      style={{
                        color: "rgba(255, 255, 255, 0.8)",
                        fontSize: "0.95rem",
                        lineHeight: "1.6",
                        margin: "0",
                        fontFamily: "'Inter', sans-serif",
                      }}
                    >
                      Sends similar examples to GPT-4o-mini as context for
                      classification
                    </p>
                  </div>
                  <div
                    style={{
                      background: "rgba(0, 0, 0, 0.2)",
                      padding: "2rem",
                      borderRadius: "1rem",
                      textAlign: "center",
                      transition: "transform 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = "translateY(-5px)";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = "translateY(0)";
                    }}
                  >
                    <span
                      style={{
                        display: "inline-block",
                        background:
                          "linear-gradient(135deg, #8072FF 0%, #675DC2 100%)",
                        color: "white",
                        width: "50px",
                        height: "50px",
                        lineHeight: "50px",
                        borderRadius: "50%",
                        fontSize: "1.5rem",
                        fontWeight: "bold",
                        marginBottom: "1rem",
                      }}
                    >
                      3
                    </span>
                    <h4
                      style={{
                        color: "white",
                        margin: "1rem 0 0.75rem 0",
                        fontSize: "1.1rem",
                        fontWeight: "600",
                        fontFamily: "'Inter', sans-serif",
                      }}
                    >
                      Expert Decision
                    </h4>
                    <p
                      style={{
                        color: "rgba(255, 255, 255, 0.8)",
                        fontSize: "0.95rem",
                        lineHeight: "1.6",
                        margin: "0",
                        fontFamily: "'Inter', sans-serif",
                      }}
                    >
                      LLM analyzes patterns and predicts: CANDIDATE or FALSE
                      POSITIVE
                    </p>
                  </div>
                </div>
              </div>

              {/* DUAL TABLE SYSTEM - Training & Held-Out Data */}
              <div
                style={{
                  background: "rgba(0, 0, 0, 0.6)",
                  backdropFilter: "blur(10px)",
                  borderRadius: "1.5rem",
                  padding: "2rem",
                  border: "1px solid rgba(0, 0, 0, 0.5)",
                  width: "100%",
                  maxWidth: "1400px",
                  marginTop: "2rem",
                }}
              >
                <h3
                  style={{
                    margin: "0 0 1.5rem 0",
                    fontSize: "1.8rem",
                    color: "white",
                    fontWeight: "600",
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  🗂️ RAG Training Data Management
                </h3>

                {/* Mode Toggle & Split Controls */}
                <div
                  style={{
                    background: "rgba(0, 0, 0, 0.4)",
                    padding: "1.5rem",
                    borderRadius: "1rem",
                    marginBottom: "2rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "1rem",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                    <label
                      style={{
                        color: "white",
                        fontWeight: "600",
                        fontSize: "1.1rem",
                        fontFamily: "'Inter', sans-serif",
                      }}
                    >
                      Mode:
                    </label>
                    <button
                      onClick={() => {
                        setIsTestMode(false);
                        setHeldOutData([]);
                      }}
                      style={{
                        background: !isTestMode
                          ? "linear-gradient(135deg, #48bb78 0%, #38a169 100%)"
                          : "rgba(255, 255, 255, 0.1)",
                        color: "white",
                        border: "none",
                        padding: "0.75rem 1.5rem",
                        borderRadius: "0.5rem",
                        fontSize: "1rem",
                        fontWeight: "600",
                        cursor: "pointer",
                        fontFamily: "'Inter', sans-serif",
                        transition: "all 0.3s",
                      }}
                    >
                      🚀 Default Mode (Max Strength)
                    </button>
                    <button
                      onClick={() => setIsTestMode(true)}
                      style={{
                        background: isTestMode
                          ? "linear-gradient(135deg, #8072FF 0%, #675DC2 100%)"
                          : "rgba(255, 255, 255, 0.1)",
                        color: "white",
                        border: "none",
                        padding: "0.75rem 1.5rem",
                        borderRadius: "0.5rem",
                        fontSize: "1rem",
                        fontWeight: "600",
                        cursor: "pointer",
                        fontFamily: "'Inter', sans-serif",
                        transition: "all 0.3s",
                      }}
                    >
                      🧪 Test Mode (Hold-Out Data)
                    </button>
                  </div>

                  {isTestMode && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "1rem",
                        flexWrap: "wrap",
                        paddingTop: "1rem",
                        borderTop: "1px solid rgba(255, 255, 255, 0.1)",
                      }}
                    >
                      <label
                        style={{
                          color: "white",
                          fontWeight: "600",
                          fontSize: "1rem",
                          fontFamily: "'Inter', sans-serif",
                        }}
                      >
                        Hold-Out Percentage:
                      </label>
                      <input
                        type="range"
                        min="5"
                        max="50"
                        value={holdoutPercentage}
                        onChange={(e) => setHoldoutPercentage(Number(e.target.value))}
                        style={{
                          flex: "1",
                          minWidth: "200px",
                          maxWidth: "300px",
                        }}
                      />
                      <span
                        style={{
                          color: "#8072FF",
                          fontWeight: "700",
                          fontSize: "1.2rem",
                          fontFamily: "'Inter', sans-serif",
                        }}
                      >
                        {holdoutPercentage}%
                      </span>
                      <button
                        onClick={handleSplitDataset}
                        disabled={isSplitting}
                        style={{
                          background: isSplitting
                            ? "rgba(128, 114, 255, 0.5)"
                            : "linear-gradient(135deg, #8072FF 0%, #675DC2 100%)",
                          color: "white",
                          border: "none",
                          padding: "0.75rem 1.5rem",
                          borderRadius: "0.5rem",
                          fontSize: "1rem",
                          fontWeight: "600",
                          cursor: isSplitting ? "not-allowed" : "pointer",
                          fontFamily: "'Inter', sans-serif",
                        }}
                      >
                        {isSplitting ? "Splitting..." : "🔀 Random Split Dataset"}
                      </button>
                    </div>
                  )}

                  <p
                    style={{
                      color: "rgba(255, 255, 255, 0.7)",
                      fontSize: "0.9rem",
                      margin: "0.5rem 0 0 0",
                      fontFamily: "'Inter', sans-serif",
                      lineHeight: "1.6",
                    }}
                  >
                    {!isTestMode
                      ? "🚀 Default Mode: All data available for RAG (maximum strength). Use for real classifications."
                      : "🧪 Test Mode: Hold-out data excluded from RAG. Use held-out examples to test accuracy like a teacher with answer keys."}
                  </p>
                </div>

                {/* Dual Tables */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: isTestMode ? "1fr 1fr" : "1fr",
                    gap: "1.5rem",
                  }}
                >
                  {/* Training Data Table */}
                  <div>
                    <h4
                      style={{
                        color: "white",
                        fontSize: "1.2rem",
                        fontWeight: "600",
                        marginBottom: "1rem",
                        fontFamily: "'Inter', sans-serif",
                      }}
                    >
                      📚 Training Data ({trainingData.length} examples)
                    </h4>
                    <div
                      style={{
                        background: "rgba(0, 0, 0, 0.4)",
                        borderRadius: "0.75rem",
                        maxHeight: "500px",
                        overflowY: "auto",
                        border: "1px solid rgba(0, 0, 0, 0.5)",
                      }}
                    >
                      <table
                        style={{
                          width: "100%",
                          borderCollapse: "collapse",
                          color: "white",
                          fontSize: "0.85rem",
                          fontFamily: "'Inter', sans-serif",
                        }}
                      >
                        <thead
                          style={{
                            position: "sticky",
                            top: 0,
                            background: "rgba(0, 0, 0, 0.9)",
                            zIndex: 1,
                          }}
                        >
                          <tr>
                            <th style={{ padding: "0.75rem", textAlign: "left" }}>Name</th>
                            <th style={{ padding: "0.75rem", textAlign: "left" }}>Period</th>
                            <th style={{ padding: "0.75rem", textAlign: "left" }}>Depth</th>
                            <th style={{ padding: "0.75rem", textAlign: "left" }}>Label</th>
                            {isTestMode && (
                              <th style={{ padding: "0.75rem", textAlign: "center" }}>Action</th>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {trainingData.slice(0, 100).map((row, idx) => (
                            <tr
                              key={idx}
                              style={{
                                borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = "rgba(128, 114, 255, 0.2)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = "transparent";
                              }}
                            >
                              <td style={{ padding: "0.5rem 0.75rem" }}>{row.name || row.id}</td>
                              <td style={{ padding: "0.5rem 0.75rem" }}>{row.period}</td>
                              <td style={{ padding: "0.5rem 0.75rem" }}>{row.depth}</td>
                              <td style={{ padding: "0.5rem 0.75rem" }}>
                                <span
                                  style={{
                                    background:
                                      row.disposition === 1 || row.disposition === "CANDIDATE"
                                        ? "#48bb78"
                                        : "#f56565",
                                    color: "white",
                                    padding: "0.25rem 0.5rem",
                                    borderRadius: "0.25rem",
                                    fontSize: "0.75rem",
                                    fontWeight: "600",
                                  }}
                                >
                                  {row.disposition === 1 || row.disposition === "CANDIDATE"
                                    ? "CANDIDATE"
                                    : "FALSE POS"}
                                </span>
                              </td>
                              {isTestMode && (
                                <td style={{ padding: "0.5rem 0.75rem", textAlign: "center" }}>
                                  <button
                                    onClick={() => moveToHeldOut(row)}
                                    style={{
                                      background: "#8072FF",
                                      color: "white",
                                      border: "none",
                                      padding: "0.25rem 0.5rem",
                                      borderRadius: "0.25rem",
                                      fontSize: "0.75rem",
                                      cursor: "pointer",
                                      fontFamily: "'Inter', sans-serif",
                                    }}
                                  >
                                    Hold Out →
                                  </button>
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {trainingData.length > 100 && (
                        <p
                          style={{
                            color: "rgba(255, 255, 255, 0.6)",
                            textAlign: "center",
                            padding: "1rem",
                            fontSize: "0.85rem",
                            fontFamily: "'Inter', sans-serif",
                          }}
                        >
                          Showing first 100 of {trainingData.length} examples
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Held-Out Data Table (only in Test Mode) */}
                  {isTestMode && (
                    <div>
                      <h4
                        style={{
                          color: "white",
                          fontSize: "1.2rem",
                          fontWeight: "600",
                          marginBottom: "1rem",
                          fontFamily: "'Inter', sans-serif",
                        }}
                      >
                        🧪 Held-Out Test Set ({heldOutData.length} examples)
                      </h4>
                      <div
                        style={{
                          background: "rgba(0, 0, 0, 0.4)",
                          borderRadius: "0.75rem",
                          maxHeight: "500px",
                          overflowY: "auto",
                          border: "1px solid rgba(128, 114, 255, 0.5)",
                        }}
                      >
                        <table
                          style={{
                            width: "100%",
                            borderCollapse: "collapse",
                            color: "white",
                            fontSize: "0.85rem",
                            fontFamily: "'Inter', sans-serif",
                          }}
                        >
                          <thead
                            style={{
                              position: "sticky",
                              top: 0,
                              background: "rgba(0, 0, 0, 0.9)",
                              zIndex: 1,
                            }}
                          >
                            <tr>
                              <th style={{ padding: "0.75rem", textAlign: "left" }}>Name</th>
                              <th style={{ padding: "0.75rem", textAlign: "left" }}>Period</th>
                              <th style={{ padding: "0.75rem", textAlign: "left" }}>Depth</th>
                              <th style={{ padding: "0.75rem", textAlign: "left" }}>Label</th>
                              <th style={{ padding: "0.75rem", textAlign: "center" }}>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {heldOutData.map((row, idx) => (
                              <tr
                                key={idx}
                                style={{
                                  borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = "rgba(128, 114, 255, 0.2)";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = "transparent";
                                }}
                              >
                                <td style={{ padding: "0.5rem 0.75rem" }}>{row.name || row.id}</td>
                                <td style={{ padding: "0.5rem 0.75rem" }}>{row.period}</td>
                                <td style={{ padding: "0.5rem 0.75rem" }}>{row.depth}</td>
                                <td style={{ padding: "0.5rem 0.75rem" }}>
                                  <span
                                    style={{
                                      background:
                                        row.disposition === 1 || row.disposition === "CANDIDATE"
                                          ? "#48bb78"
                                          : "#f56565",
                                      color: "white",
                                      padding: "0.25rem 0.5rem",
                                      borderRadius: "0.25rem",
                                      fontSize: "0.75rem",
                                      fontWeight: "600",
                                    }}
                                  >
                                    {row.disposition === 1 || row.disposition === "CANDIDATE"
                                      ? "CANDIDATE"
                                      : "FALSE POS"}
                                  </span>
                                </td>
                                <td style={{ padding: "0.5rem 0.75rem", textAlign: "center" }}>
                                  <div style={{ display: "flex", gap: "0.25rem", justifyContent: "center" }}>
                                    <button
                                      onClick={() => {
                                        setFormData({
                                          period: String(row.period || ""),
                                          duration: String(row.duration || ""),
                                          depth: String(row.depth || ""),
                                          prad: String(row.prad || ""),
                                          teq: String(row.teq || ""),
                                        });
                                        setResult(null);
                                        // Scroll to form
                                        window.scrollTo({ top: 0, behavior: "smooth" });
                                      }}
                                      style={{
                                        background: "linear-gradient(135deg, #8072FF 0%, #675DC2 100%)",
                                        color: "white",
                                        border: "none",
                                        padding: "0.25rem 0.5rem",
                                        borderRadius: "0.25rem",
                                        fontSize: "0.75rem",
                                        cursor: "pointer",
                                        fontFamily: "'Inter', sans-serif",
                                        fontWeight: "600",
                                      }}
                                    >
                                      🧪 Test This →
                                    </button>
                                    <button
                                      onClick={() => moveToTraining(row)}
                                      style={{
                                        background: "#48bb78",
                                        color: "white",
                                        border: "none",
                                        padding: "0.25rem 0.5rem",
                                        borderRadius: "0.25rem",
                                        fontSize: "0.75rem",
                                        cursor: "pointer",
                                        fontFamily: "'Inter', sans-serif",
                                      }}
                                    >
                                      ← Back
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {heldOutData.length === 0 && (
                          <p
                            style={{
                              color: "rgba(255, 255, 255, 0.6)",
                              textAlign: "center",
                              padding: "2rem",
                              fontSize: "0.95rem",
                              fontFamily: "'Inter', sans-serif",
                            }}
                          >
                            No held-out data yet. Use "Random Split Dataset" or manually move rows.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Original Dashboard Content (Overview) */
            <div
              style={{
                minHeight: "100vh",
                padding: "3rem 5% 3rem 8rem",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              {/* Dashboard Title */}
              <div
                style={{
                  textAlign: "center",
                  marginBottom: "3rem",
                }}
              >
                <h1
                  style={{
                    fontSize: "3.5rem",
                    fontWeight: "800",
                    margin: "0 0 1rem 0",
                    background:
                      "linear-gradient(135deg, #ffffff 0%, #8072FF 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  Exoplanet Overview
                </h1>
                <p
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: "300",
                    color: "rgba(255, 255, 255, 0.7)",
                    margin: "0",
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  Explore thousands of confirmed and candidate exoplanets from
                  NASA's space missions
                </p>
              </div>

              {/* Mission Cards */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: "2rem",
                  marginBottom: "3rem",
                  alignItems: "stretch",
                }}
              >
                {missions.map((mission) => (
                  <div
                    key={mission.id}
                    onClick={() => setActiveMission(mission.id)}
                    style={{
                      background:
                        activeMission === mission.id
                          ? "rgba(128, 114, 255, 0.22)"
                          : "rgba(0, 0, 0, 0.6)",
                      backdropFilter: "blur(10px)",
                      borderRadius: "1.5rem",
                      padding: "2rem",
                      border:
                        activeMission === mission.id
                          ? `2px solid ${mission.color}`
                          : "1px solid rgba(0, 0, 0, 0.5)",
                      transition: "all 0.3s ease",
                      cursor: "pointer",
                      position: "relative",
                      overflow: "hidden",
                      display: "flex",
                      flexDirection: "column",
                      height: "100%",
                      transform:
                        activeMission === mission.id
                          ? "translateY(-0.5rem)"
                          : "translateY(0)",
                      boxShadow:
                        activeMission === mission.id
                          ? `0 20px 40px rgba(128, 114, 255, 0.3)`
                          : "none",
                    }}
                    onMouseEnter={(e) => {
                      if (activeMission !== mission.id) {
                        e.target.style.transform = "translateY(-0.5rem)";
                        e.target.style.borderColor = mission.color;
                        e.target.style.boxShadow = `0 20px 40px rgba(128, 114, 255, 0.2)`;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (activeMission !== mission.id) {
                        e.target.style.transform = "translateY(0)";
                        e.target.style.borderColor = "rgba(0, 0, 0, 0.5)";
                        e.target.style.boxShadow = "none";
                      }
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "1rem",
                        marginBottom: "1rem",
                        flex: "1",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "2rem",
                          opacity: 1,
                        }}
                      >
                        {mission.icon}
                      </div>
                      <div>
                        <h3
                          style={{
                            color: mission.color,
                            fontSize: "1.25rem",
                            fontWeight: "600",
                            margin: "0 0 0.25rem 0",
                            fontFamily: "'Inter', sans-serif",
                          }}
                        >
                          {mission.label}
                        </h3>
                        <p
                          style={{
                            color: "rgba(255, 255, 255, 0.6)",
                            fontSize: "0.875rem",
                            margin: "0",
                            fontFamily: "'Inter', sans-serif",
                            fontWeight: "300",
                          }}
                        >
                          {mission.description}
                        </p>
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        flexDirection: "column",
                        marginTop: "auto",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "3rem",
                          fontWeight: "800",
                          margin: "0",
                          color: mission.color,
                          fontFamily: "'Inter', sans-serif",
                          background: "transparent",
                          textAlign: "center",
                        }}
                      >
                        {loading ? "..." : data[mission.id]?.length || 0}
                      </div>
                      <div
                        style={{
                          fontSize: "0.875rem",
                          fontWeight: "400",
                          color: "rgba(255, 255, 255, 0.6)",
                          margin: "0",
                          fontFamily: "'Inter', sans-serif",
                          textAlign: "center",
                        }}
                      >
                        exoplanets
                      </div>
                    </div>

                    {/* Active indicator */}
                    {activeMission === mission.id && (
                      <div
                        style={{
                          position: "absolute",
                          top: "1rem",
                          right: "1rem",
                          width: "0.75rem",
                          height: "0.75rem",
                          borderRadius: "50%",
                          background: mission.color,
                          boxShadow: `0 0 20px ${mission.color}`,
                          animation: "pulse 2s infinite",
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Total Stats */}
              <div
                style={{
                  background:
                    "linear-gradient(135deg, rgba(128, 114, 255, 0.3) 0%, rgba(103, 93, 194, 0.3) 100%)",
                  backdropFilter: "blur(20px)",
                  borderRadius: "1.5rem",
                  padding: "2rem",
                  border: "1px solid rgba(128, 114, 255, 0.3)",
                  textAlign: "center",
                }}
              >
                <h2
                  style={{
                    fontSize: "2.5rem",
                    fontWeight: "700",
                    margin: "0 0 0.5rem 0",
                    color: "#8072FF",
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  {loading ? "..." : totalExoplanets.toLocaleString()}
                </h2>
                <p
                  style={{
                    fontSize: "1.125rem",
                    fontWeight: "400",
                    color: "rgba(255, 255, 255, 0.8)",
                    margin: "0",
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  Total Entries
                </p>
              </div>

              {/* Data Table Section */}
              <div
                style={{
                  background: "rgba(0, 0, 0, 0.6)",
                  backdropFilter: "blur(10px)",
                  borderRadius: "1.5rem",
                  padding: "2rem",
                  border: "1px solid rgba(0, 0, 0, 0.5)",
                  marginTop: "3rem",
                  width: "100%",
                  maxWidth: "1200px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "2rem",
                  }}
                >
                  <h2
                    style={{
                      color: "white",
                      fontSize: "1.75rem",
                      fontWeight: "600",
                      margin: "0",
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    {missions.find((m) => m.id === activeMission)?.label} Data
                  </h2>
                  <div
                    style={{
                      display: "flex",
                      gap: "0.5rem",
                      alignItems: "center",
                      color: "rgba(255, 255, 255, 0.6)",
                      fontSize: "0.875rem",
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: "400",
                    }}
                  >
                    Showing {startIndex + 1}-
                    {Math.min(endIndex, currentData.length)} of{" "}
                    {currentData.length} exoplanets
                  </div>
                </div>

                <div style={{ overflow: "auto" }}>
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      fontSize: "0.875rem",
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    <thead>
                      <tr>
                        {[
                          "Planet ID",
                          "Discovery Date",
                          "Orbital Period",
                          "Planet Radius",
                          "Stellar Mass",
                          "Temperature",
                          "Status",
                        ].map((column, index) => (
                          <th
                            key={index}
                            style={{
                              padding: "1rem 0.75rem",
                              textAlign: "left",
                              borderBottom:
                                "2px solid rgba(128, 114, 255, 0.3)",
                              fontWeight: "600",
                              color: "#8072FF",
                              fontSize: "0.875rem",
                              textTransform: "uppercase",
                              letterSpacing: "0.05em",
                            }}
                          >
                            {column}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td
                            colSpan={7}
                            style={{
                              padding: "3rem",
                              textAlign: "center",
                              color: "rgba(255, 255, 255, 0.6)",
                              fontSize: "1rem",
                              fontFamily: "'Inter', sans-serif",
                            }}
                          >
                            Loading exoplanet data...
                          </td>
                        </tr>
                      ) : (
                        // Show paginated data from the active mission
                        paginatedData.map((planet, rowIndex) => (
                          <tr
                            key={rowIndex}
                            style={{
                              borderBottom: "1px solid rgba(0, 0, 0, 0.2)",
                              transition: "all 0.2s ease",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background =
                                "rgba(128, 114, 255, 0.05)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "transparent";
                            }}
                          >
                            <td
                              style={{
                                padding: "1rem 0.75rem",
                                fontWeight: "500",
                                color: "white",
                              }}
                            >
                              {planet.planetId ||
                                `${activeMission}-${rowIndex + 1}`}
                            </td>
                            <td
                              style={{
                                padding: "1rem 0.75rem",
                                color: "rgba(255, 255, 255, 0.8)",
                              }}
                            >
                              {planet.discoveryDate || "2010-2020"}
                            </td>
                            <td
                              style={{
                                padding: "1rem 0.75rem",
                                color: "rgba(255, 255, 255, 0.8)",
                              }}
                            >
                              {planet.orbitalPeriod || "12.5"}
                            </td>
                            <td
                              style={{
                                padding: "1rem 0.75rem",
                                color: "rgba(255, 255, 255, 0.8)",
                              }}
                            >
                              {planet.planetRadius || "1.2"}
                            </td>
                            <td
                              style={{
                                padding: "1rem 0.75rem",
                                color: "rgba(255, 255, 255, 0.8)",
                              }}
                            >
                              {planet.stellarMass || "0.95"}
                            </td>
                            <td
                              style={{
                                padding: "1rem 0.75rem",
                                color: "rgba(255, 255, 255, 0.8)",
                              }}
                            >
                              {planet.equilibriumTemp || "580"}
                            </td>
                            <td style={{ padding: "1rem 0.75rem" }}>
                              <span
                                style={{
                                  padding: "0.375rem 0.75rem",
                                  borderRadius: "0.75rem",
                                  fontSize: "0.75rem",
                                  fontWeight: "500",
                                  fontFamily: "'Inter', sans-serif",
                                  background: "rgba(34, 197, 94, 0.2)",
                                  color: "#22c55e",
                                  border: "1px solid rgba(34, 197, 94, 0.3)",
                                }}
                              >
                                CONFIRMED
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {!loading && currentData.length > rowsPerPage && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      gap: "1rem",
                      marginTop: "2rem",
                      padding: "1.5rem",
                      background: "rgba(0, 0, 0, 0.1)",
                      borderRadius: "1rem",
                    }}
                  >
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      style={{
                        background:
                          currentPage === 1
                            ? "rgba(0, 0, 0, 0.5)"
                            : "rgba(128, 114, 255, 0.2)",
                        color:
                          currentPage === 1 ? "rgba(0, 0, 0, 0.6)" : "white",
                        border: "1px solid rgba(0, 0, 0, 0.6)",
                        padding: "0.75rem 1.5rem",
                        borderRadius: "0.75rem",
                        cursor: currentPage === 1 ? "not-allowed" : "pointer",
                        fontSize: "0.875rem",
                        fontWeight: "500",
                        fontFamily: "'Inter', sans-serif",
                        transition: "all 0.3s ease",
                      }}
                      onMouseEnter={(e) => {
                        if (currentPage !== 1) {
                          e.target.style.background =
                            "rgba(128, 114, 255, 0.3)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (currentPage !== 1) {
                          e.target.style.background =
                            "rgba(128, 114, 255, 0.2)";
                        }
                      }}
                    >
                      ← Previous
                    </button>

                    <div
                      style={{
                        display: "flex",
                        gap: "0.5rem",
                        alignItems: "center",
                        color: "white",
                        fontSize: "0.875rem",
                        fontFamily: "'Inter', sans-serif",
                        fontWeight: "500",
                      }}
                    >
                      <span>
                        Page {currentPage} of {totalPages}
                      </span>
                    </div>

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      style={{
                        background:
                          currentPage === totalPages
                            ? "rgba(0, 0, 0, 0.5)"
                            : "rgba(128, 114, 255, 0.2)",
                        color:
                          currentPage === totalPages
                            ? "rgba(0, 0, 0, 0.6)"
                            : "white",
                        border: "1px solid rgba(0, 0, 0, 0.6)",
                        padding: "0.75rem 1.5rem",
                        borderRadius: "0.75rem",
                        cursor:
                          currentPage === totalPages
                            ? "not-allowed"
                            : "pointer",
                        fontSize: "0.875rem",
                        fontWeight: "500",
                        fontFamily: "'Inter', sans-serif",
                        transition: "all 0.3s ease",
                      }}
                      onMouseEnter={(e) => {
                        if (currentPage !== totalPages) {
                          e.target.style.background =
                            "rgba(128, 114, 255, 0.3)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (currentPage !== totalPages) {
                          e.target.style.background =
                            "rgba(128, 114, 255, 0.2)";
                        }
                      }}
                    >
                      Next →
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Credits */}
        <div
          style={{
            position: "fixed",
            bottom: "2rem",
            left: "50%",
            transform: "translateX(-50%)",
            textAlign: "center",
            color: "rgba(255, 255, 255, 0.7)",
            fontFamily: "'Inter', sans-serif",
            fontSize: "0.875rem",
            zIndex: 10,
            letterSpacing: "0.15em",
            opacity: showDashboard ? 0 : 1,
            transition: "opacity 0.8s ease-in-out",
            pointerEvents: showDashboard ? "none" : "auto",
          }}
        >
          <div style={{ fontWeight: "500", marginBottom: "0.25rem" }}>
            created by the Maroon and the Blues
          </div>
          <div
            style={{
              fontWeight: "300",
              fontSize: "0.8rem",
              letterSpacing: "0.1em",
            }}
          >
            zachary fiel • david castro • kent lacno
          </div>
        </div>

        {/* RAG Examples Modal */}
        {showRagExamples && result && result.similar_examples && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0, 0, 0, 0.85)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              padding: "20px",
            }}
            onClick={() => setShowRagExamples(false)}
          >
            <div
              style={{
                background: "rgba(0, 0, 0, 0.6)",
                backdropFilter: "blur(10px)",
                border: "2px solid rgba(0, 0, 0, 0.5)",
                borderRadius: "1.5rem",
                padding: "2rem",
                maxWidth: "1200px",
                width: "100%",
                maxHeight: "90vh",
                overflowY: "auto",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3
                style={{
                  margin: "0 0 1rem 0",
                  fontSize: "1.8rem",
                  color: "white",
                  fontWeight: "600",
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                🔍 RAG Examples Used for Classification
              </h3>
              <p
                style={{
                  color: "rgba(255, 255, 255, 0.8)",
                  marginBottom: "1.5rem",
                  fontSize: "1rem",
                  lineHeight: "1.6",
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                These are the 25 most similar examples the AI retrieved from the
                training data:
              </p>

              <div
                style={{
                  display: "flex",
                  gap: "1.5rem",
                  marginBottom: "1.5rem",
                  padding: "1rem",
                  background: "rgba(0, 0, 0, 0.7)",
                  borderRadius: "0.75rem",
                  fontWeight: "600",
                  fontSize: "0.95rem",
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                <span
                  style={{
                    color: "#48bb78",
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  Candidates: 
                  {
                    result.similar_examples.filter(
                      (e) => e.disposition === "CANDIDATE"
                    ).length
                  }
                </span>
                <span
                  style={{
                    color: "#f56565",
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  False Positives: 
                  {
                    result.similar_examples.filter(
                      (e) => e.disposition === "FALSE POSITIVE"
                    ).length
                  }
                </span>
              </div>

              <div
                style={{
                  overflowX: "auto",
                  border: "1px solid rgba(0, 0, 0, 0.5)",
                  borderRadius: "0.75rem",
                  marginBottom: "1.5rem",
                }}
              >
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    color: "white",
                    fontSize: "0.9rem",
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        background: "rgba(0, 0, 0, 0.7)",
                        position: "sticky",
                        top: 0,
                      }}
                    >
                      <th
                        style={{
                          padding: "1rem",
                          textAlign: "left",
                          fontWeight: "bold",
                          borderBottom: "2px solid rgba(0, 0, 0, 0.6)",
                        }}
                      >
                        #
                      </th>
                      <th
                        style={{
                          padding: "1rem",
                          textAlign: "left",
                          fontWeight: "bold",
                          borderBottom: "2px solid rgba(0, 0, 0, 0.6)",
                        }}
                      >
                        Name
                      </th>
                      <th
                        style={{
                          padding: "1rem",
                          textAlign: "left",
                          fontWeight: "bold",
                          borderBottom: "2px solid rgba(0, 0, 0, 0.6)",
                        }}
                      >
                        Period
                      </th>
                      <th
                        style={{
                          padding: "1rem",
                          textAlign: "left",
                          fontWeight: "bold",
                          borderBottom: "2px solid rgba(0, 0, 0, 0.6)",
                        }}
                      >
                        Duration
                      </th>
                      <th
                        style={{
                          padding: "1rem",
                          textAlign: "left",
                          fontWeight: "bold",
                          borderBottom: "2px solid rgba(0, 0, 0, 0.6)",
                        }}
                      >
                        Depth
                      </th>
                      <th
                        style={{
                          padding: "1rem",
                          textAlign: "left",
                          fontWeight: "bold",
                          borderBottom: "2px solid rgba(0, 0, 0, 0.6)",
                        }}
                      >
                        Radius
                      </th>
                      <th
                        style={{
                          padding: "1rem",
                          textAlign: "left",
                          fontWeight: "bold",
                          borderBottom: "2px solid rgba(0, 0, 0, 0.6)",
                        }}
                      >
                        Temp
                      </th>
                      <th
                        style={{
                          padding: "1rem",
                          textAlign: "left",
                          fontWeight: "bold",
                          borderBottom: "2px solid rgba(0, 0, 0, 0.6)",
                        }}
                      >
                        Label
                      </th>
                      <th
                        style={{
                          padding: "1rem",
                          textAlign: "left",
                          fontWeight: "bold",
                          borderBottom: "2px solid rgba(0, 0, 0, 0.6)",
                        }}
                      >
                        Mission
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.similar_examples.map((ex, idx) => (
                      <tr
                        key={idx}
                        style={{
                          borderBottom: "1px solid rgba(0, 0, 0, 0.2)",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "rgba(0, 0, 0, 0.5)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                        }}
                      >
                        <td style={{ padding: "0.75rem 1rem" }}>{idx + 1}</td>
                        <td style={{ padding: "0.75rem 1rem" }}>{ex.name}</td>
                        <td style={{ padding: "0.75rem 1rem" }}>{ex.period}</td>
                        <td style={{ padding: "0.75rem 1rem" }}>
                          {ex.duration}
                        </td>
                        <td style={{ padding: "0.75rem 1rem" }}>{ex.depth}</td>
                        <td style={{ padding: "0.75rem 1rem" }}>{ex.prad}</td>
                        <td style={{ padding: "0.75rem 1rem" }}>{ex.teq}</td>
                        <td style={{ padding: "0.75rem 1rem" }}>
                          <span
                            style={{
                              background:
                                ex.disposition === "CANDIDATE"
                                  ? "#48bb78"
                                  : "#f56565",
                              color: "white",
                              padding: "0.25rem 0.75rem",
                              borderRadius: "1rem",
                              fontSize: "0.85rem",
                              fontWeight: "bold",
                              display: "inline-block",
                            }}
                          >
                            {ex.disposition}
                          </span>
                        </td>
                        <td style={{ padding: "0.75rem 1rem" }}>{ex.type}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div
                style={{
                  background: "rgba(0, 0, 0, 0.7)",
                  borderLeft: "4px solid #8072FF",
                  padding: "1.5rem",
                  borderRadius: "0.75rem",
                  marginBottom: "1.5rem",
                }}
              >
                <h4
                  style={{
                    margin: "0 0 0.75rem 0",
                    color: "white",
                    fontSize: "1.1rem",
                    fontWeight: "600",
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  How RAG Works
                </h4>
                <p
                  style={{
                    color: "rgba(255, 255, 255, 0.8)",
                    lineHeight: "1.7",
                    margin: "0",
                    fontSize: "1rem",
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  Our system uses{" "}
                  <strong>Retrieval-Augmented Generation (RAG)</strong> to find
                  the most similar examples from our training data. It converts
                  each exoplanet's parameters into a vector embedding and uses
                  cosine similarity to find the nearest neighbors. These
                  examples provide context to the LLM, enabling accurate
                  classification through in-context learning.
                </p>
              </div>

              <button
                onClick={() => setShowRagExamples(false)}
                style={{
                  width: "100%",
                  background: "rgba(0, 0, 0, 0.7)",
                  color: "white",
                  border: "2px solid rgba(0, 0, 0, 0.6)",
                  padding: "1rem",
                  borderRadius: "0.75rem",
                  fontSize: "1.1rem",
                  fontWeight: "bold",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  fontFamily: "'Inter', sans-serif",
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = "rgba(0, 0, 0, 0.6)";
                  e.target.style.borderColor = "#8072FF";
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = "rgba(0, 0, 0, 0.5)";
                  e.target.style.borderColor = "rgba(0, 0, 0, 0.6)";
                }}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Layout>
    </>
  );
}
