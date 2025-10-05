import { useEffect, useRef, useState } from "react";
import Head from "next/head";
import Layout from "../components/Layout";
import ThreeJSEarth from "../components/ThreeJSEarth";
import { loadKOIData, loadK2Data, loadTESSData } from "../utils/dataLoader";

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
      const response = await fetch("http://localhost:5002/predict", {
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

    // Trigger Earth animation based on destination
    if (
      itemId === "ai" &&
      earthRef.current &&
      earthRef.current.triggerLeftAnimation
    ) {
      // Move Earth to bottom left for AI content
      earthRef.current.triggerLeftAnimation();
      // Wait for Earth animation to complete before transitioning content
      setTimeout(() => {
        setActiveNavItem(itemId);
        setTimeout(() => {
          setIsTransitioning(false);
        }, 50);
      }, 1000); // Wait 1 second for smooth Earth movement, then transition content
    } else if (
      activeNavItem === "ai" &&
      itemId !== "ai" &&
      earthRef.current &&
      earthRef.current.triggerRightAnimation
    ) {
      // Move Earth back to bottom right when leaving AI content
      earthRef.current.triggerRightAnimation();
      // Wait for Earth animation to complete before transitioning content
      setTimeout(() => {
        setActiveNavItem(itemId);
        setTimeout(() => {
          setIsTransitioning(false);
        }, 50);
      }, 1000); // Wait 1 second for smooth Earth movement, then transition content
    } else {
      // For other transitions, use the original fast transition
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

  const missions = [
    {
      id: "KOI",
      label: "Kepler Objects of Interest",
      description: "Kepler mission candidates",
      icon: "🪐",
      color: "#8072FF",
    },
    {
      id: "TESS",
      label: "Transiting Exoplanet Survey Satellite",
      description: "TESS mission discoveries",
      icon: "🛰️",
      color: "#675DC2",
    },
    {
      id: "K2",
      label: "Kepler Extended Mission",
      description: "K2 mission observations",
      icon: "⭐",
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
          in submission to A World Away: Hunting for Exoplanets with{" "}
          <strong>AI</strong>
        </div>

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
          {/* Placeholder image with 340:142 ratio */}
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
          />
          <button
            onClick={handleGetStarted}
            disabled={isAnimating}
            style={{
              display: "inline-block",
              background: "#675DC2",
              color: "white",
              textDecoration: "none",
              padding: "1.125rem 2.25rem",
              borderRadius: "0.75rem",
              fontSize: "1.375rem",
              marginTop: "1rem",
              transition: "all 0.4s ease",
              textAlign: "center",
              alignSelf: "flex-end",
              fontFamily: "'Inter', sans-serif",
              fontWeight: "600",
              border: "2px solid #675DC2",
              position: "relative",
              overflow: "hidden",
              cursor: isAnimating ? "default" : "pointer",
              opacity: isAnimating ? 0.7 : 1,
            }}
            onMouseEnter={(e) => {
              if (!isAnimating) {
                e.target.style.background = "white";
                e.target.style.color = "#675DC2";
                e.target.style.borderColor = "white";
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow = "0 8px 25px rgba(103, 93, 194, 0.3)";
              }
            }}
            onMouseLeave={(e) => {
              if (!isAnimating) {
                e.target.style.background = "#675DC2";
                e.target.style.color = "white";
                e.target.style.borderColor = "#675DC2";
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "none";
              }
            }}
          >
            {isAnimating ? "Transitioning..." : "Get Started"}
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
              background: "rgba(255, 255, 255, 0.05)",
              backdropFilter: "blur(10px)",
              borderRadius: "2rem",
              padding: "1.5rem 1rem",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              display: "flex",
              flexDirection: "column",
              gap: "1.5rem",
              alignItems: "center",
              position: "relative",
            }}
          >
            {[
              { icon: "🌌", label: "Overview", id: "overview" },
              { icon: "📊", label: "Data", id: "data" },
              { icon: "🤖", label: "AI", id: "ai" },
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
                        border: "2px solid rgba(255, 255, 255, 0.3)",
                        borderTop: "2px solid white",
                        borderRadius: "50%",
                        animation: "spin 1s linear infinite",
                      }}
                    />
                  ) : (
                    item.icon
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
          {/* AI Classifier Content */}
          {activeNavItem === "ai" ? (
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
                  🔬 Classify New Exoplanets
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
                    }}
                  >
                    95.45% Accurate
                  </span>
                  <span
                    style={{
                      background: "rgba(255, 255, 255, 0.1)",
                      color: "rgba(255, 255, 255, 0.8)",
                      padding: "0.75rem 1.5rem",
                      borderRadius: "1.5rem",
                      fontWeight: "600",
                    }}
                  >
                    LLM In-Context Learning
                  </span>
                  <span
                    style={{
                      background: "rgba(255, 255, 255, 0.1)",
                      color: "rgba(255, 255, 255, 0.8)",
                      padding: "0.75rem 1.5rem",
                      borderRadius: "1.5rem",
                      fontWeight: "600",
                    }}
                  >
                    25 RAG Examples
                  </span>
                </div>
              </div>

              {/* Quick Examples */}
              <div
                style={{
                  background: "rgba(255, 255, 255, 0.05)",
                  backdropFilter: "blur(10px)",
                  borderRadius: "1.5rem",
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
                  🎯 Quick Start - Load Example Data:
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
                      background: "rgba(255, 255, 255, 0.1)",
                      color: "white",
                      border: "2px solid rgba(255, 255, 255, 0.2)",
                      padding: "1rem 1.5rem",
                      borderRadius: "0.75rem",
                      cursor: "pointer",
                      fontSize: "1rem",
                      fontWeight: "600",
                      transition: "all 0.2s",
                      fontFamily: "'Inter', sans-serif",
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = "rgba(255, 255, 255, 0.2)";
                      e.target.style.borderColor = "#8072FF";
                      e.target.style.transform = "translateY(-2px)";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = "rgba(255, 255, 255, 0.1)";
                      e.target.style.borderColor = "rgba(255, 255, 255, 0.2)";
                      e.target.style.transform = "translateY(0)";
                    }}
                  >
                    🛰️ Kepler Example
                  </button>
                  <button
                    onClick={() => loadExample("tess")}
                    style={{
                      flex: "1",
                      minWidth: "180px",
                      background: "rgba(255, 255, 255, 0.1)",
                      color: "white",
                      border: "2px solid rgba(255, 255, 255, 0.2)",
                      padding: "1rem 1.5rem",
                      borderRadius: "0.75rem",
                      cursor: "pointer",
                      fontSize: "1rem",
                      fontWeight: "600",
                      transition: "all 0.2s",
                      fontFamily: "'Inter', sans-serif",
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = "rgba(255, 255, 255, 0.2)";
                      e.target.style.borderColor = "#8072FF";
                      e.target.style.transform = "translateY(-2px)";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = "rgba(255, 255, 255, 0.1)";
                      e.target.style.borderColor = "rgba(255, 255, 255, 0.2)";
                      e.target.style.transform = "translateY(0)";
                    }}
                  >
                    🔭 TESS Example
                  </button>
                  <button
                    onClick={() => loadExample("k2")}
                    style={{
                      flex: "1",
                      minWidth: "180px",
                      background: "rgba(255, 255, 255, 0.1)",
                      color: "white",
                      border: "2px solid rgba(255, 255, 255, 0.2)",
                      padding: "1rem 1.5rem",
                      borderRadius: "0.75rem",
                      cursor: "pointer",
                      fontSize: "1rem",
                      fontWeight: "600",
                      transition: "all 0.2s",
                      fontFamily: "'Inter', sans-serif",
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = "rgba(255, 255, 255, 0.2)";
                      e.target.style.borderColor = "#8072FF";
                      e.target.style.transform = "translateY(-2px)";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = "rgba(255, 255, 255, 0.1)";
                      e.target.style.borderColor = "rgba(255, 255, 255, 0.2)";
                      e.target.style.transform = "translateY(0)";
                    }}
                  >
                    🌟 K2 Example
                  </button>
                </div>
              </div>

              {/* Classification Form */}
              <div
                style={{
                  background: "rgba(255, 255, 255, 0.05)",
                  backdropFilter: "blur(10px)",
                  borderRadius: "1.5rem",
                  padding: "2rem",
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
                  📝 Enter Exoplanet Parameters
                </h2>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: "1.5rem",
                    marginBottom: "2rem",
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <label
                      style={{
                        color: "rgba(255, 255, 255, 0.9)",
                        fontSize: "0.95rem",
                        marginBottom: "0.5rem",
                        fontWeight: "600",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        fontFamily: "'Inter', sans-serif",
                      }}
                    >
                      <span style={{ fontSize: "1.2rem" }}>🌍</span>
                      Orbital Period (days)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.period}
                      onChange={(e) =>
                        handleInputChange("period", e.target.value)
                      }
                      placeholder="e.g., 9.49"
                      style={{
                        background: "rgba(255, 255, 255, 0.1)",
                        border: "2px solid rgba(255, 255, 255, 0.2)",
                        borderRadius: "0.75rem",
                        padding: "1rem",
                        color: "white",
                        fontSize: "1rem",
                        transition: "border-color 0.2s",
                        fontFamily: "'Inter', sans-serif",
                      }}
                      onFocus={(e) => {
                        e.target.style.outline = "none";
                        e.target.style.borderColor = "#8072FF";
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = "rgba(255, 255, 255, 0.2)";
                      }}
                    />
                  </div>

                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <label
                      style={{
                        color: "rgba(255, 255, 255, 0.9)",
                        fontSize: "0.95rem",
                        marginBottom: "0.5rem",
                        fontWeight: "600",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        fontFamily: "'Inter', sans-serif",
                      }}
                    >
                      <span style={{ fontSize: "1.2rem" }}>⏱️</span>
                      Transit Duration (hours)
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      value={formData.duration}
                      onChange={(e) =>
                        handleInputChange("duration", e.target.value)
                      }
                      placeholder="e.g., 2.96"
                      style={{
                        background: "rgba(255, 255, 255, 0.1)",
                        border: "2px solid rgba(255, 255, 255, 0.2)",
                        borderRadius: "0.75rem",
                        padding: "1rem",
                        color: "white",
                        fontSize: "1rem",
                        transition: "border-color 0.2s",
                        fontFamily: "'Inter', sans-serif",
                      }}
                      onFocus={(e) => {
                        e.target.style.outline = "none";
                        e.target.style.borderColor = "#8072FF";
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = "rgba(255, 255, 255, 0.2)";
                      }}
                    />
                  </div>

                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <label
                      style={{
                        color: "rgba(255, 255, 255, 0.9)",
                        fontSize: "0.95rem",
                        marginBottom: "0.5rem",
                        fontWeight: "600",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        fontFamily: "'Inter', sans-serif",
                      }}
                    >
                      <span style={{ fontSize: "1.2rem" }}>📉</span>
                      Transit Depth (ppm)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.depth}
                      onChange={(e) =>
                        handleInputChange("depth", e.target.value)
                      }
                      placeholder="e.g., 615.8"
                      style={{
                        background: "rgba(255, 255, 255, 0.1)",
                        border: "2px solid rgba(255, 255, 255, 0.2)",
                        borderRadius: "0.75rem",
                        padding: "1rem",
                        color: "white",
                        fontSize: "1rem",
                        transition: "border-color 0.2s",
                        fontFamily: "'Inter', sans-serif",
                      }}
                      onFocus={(e) => {
                        e.target.style.outline = "none";
                        e.target.style.borderColor = "#8072FF";
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = "rgba(255, 255, 255, 0.2)";
                      }}
                    />
                  </div>

                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <label
                      style={{
                        color: "rgba(255, 255, 255, 0.9)",
                        fontSize: "0.95rem",
                        marginBottom: "0.5rem",
                        fontWeight: "600",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        fontFamily: "'Inter', sans-serif",
                      }}
                    >
                      <span style={{ fontSize: "1.2rem" }}>🪐</span>
                      Planetary Radius (R⊕)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.prad}
                      onChange={(e) =>
                        handleInputChange("prad", e.target.value)
                      }
                      placeholder="e.g., 2.26"
                      style={{
                        background: "rgba(255, 255, 255, 0.1)",
                        border: "2px solid rgba(255, 255, 255, 0.2)",
                        borderRadius: "0.75rem",
                        padding: "1rem",
                        color: "white",
                        fontSize: "1rem",
                        transition: "border-color 0.2s",
                        fontFamily: "'Inter', sans-serif",
                      }}
                      onFocus={(e) => {
                        e.target.style.outline = "none";
                        e.target.style.borderColor = "#8072FF";
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = "rgba(255, 255, 255, 0.2)";
                      }}
                    />
                  </div>

                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <label
                      style={{
                        color: "rgba(255, 255, 255, 0.9)",
                        fontSize: "0.95rem",
                        marginBottom: "0.5rem",
                        fontWeight: "600",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        fontFamily: "'Inter', sans-serif",
                      }}
                    >
                      <span style={{ fontSize: "1.2rem" }}>🌡️</span>
                      Equilibrium Temp (K)
                    </label>
                    <input
                      type="number"
                      step="1"
                      value={formData.teq}
                      onChange={(e) => handleInputChange("teq", e.target.value)}
                      placeholder="e.g., 793"
                      style={{
                        background: "rgba(255, 255, 255, 0.1)",
                        border: "2px solid rgba(255, 255, 255, 0.2)",
                        borderRadius: "0.75rem",
                        padding: "1rem",
                        color: "white",
                        fontSize: "1rem",
                        transition: "border-color 0.2s",
                        fontFamily: "'Inter', sans-serif",
                      }}
                      onFocus={(e) => {
                        e.target.style.outline = "none";
                        e.target.style.borderColor = "#8072FF";
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = "rgba(255, 255, 255, 0.2)";
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
                      borderRadius: "0.75rem",
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
                      ? "⏳ Classifying..."
                      : "🚀 Classify with AI"}
                  </button>
                  <button
                    onClick={resetForm}
                    style={{
                      flex: "1",
                      background: "rgba(255, 255, 255, 0.1)",
                      color: "white",
                      border: "2px solid rgba(255, 255, 255, 0.2)",
                      padding: "1rem 2rem",
                      borderRadius: "0.75rem",
                      fontSize: "1.15rem",
                      fontWeight: "bold",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      fontFamily: "'Inter', sans-serif",
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = "rgba(255, 255, 255, 0.2)";
                      e.target.style.borderColor = "#8072FF";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = "rgba(255, 255, 255, 0.1)";
                      e.target.style.borderColor = "rgba(255, 255, 255, 0.2)";
                    }}
                  >
                    🔄 Reset
                  </button>
                </div>
              </div>

              {/* Results Section */}
              {result && (
                <div
                  style={{
                    background: "rgba(255, 255, 255, 0.05)",
                    backdropFilter: "blur(10px)",
                    borderRadius: "1.5rem",
                    padding: "2rem",
                    marginBottom: "2rem",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    width: "100%",
                    maxWidth: "1000px",
                  }}
                >
                  <h2
                    style={{
                      color: "white",
                      fontSize: "2rem",
                      fontWeight: "600",
                      margin: "0 0 1.5rem 0",
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    🎯 Classification Result
                  </h2>

                  <div
                    style={{
                      background: "rgba(255, 255, 255, 0.05)",
                      borderRadius: "1rem",
                      padding: "2rem",
                      marginBottom: "1.5rem",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                    }}
                  >
                    {/* Main Result */}
                    <div
                      style={{
                        paddingBottom: "1.5rem",
                        borderBottom: "2px solid rgba(255, 255, 255, 0.1)",
                        marginBottom: "1.5rem",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          flexWrap: "wrap",
                          gap: "1rem",
                        }}
                      >
                        <span
                          style={{
                            background:
                              result.prediction === "CANDIDATE"
                                ? "#48bb78"
                                : "#f56565",
                            color: "white",
                            padding: "1rem 2rem",
                            borderRadius: "1rem",
                            fontSize: "1.5rem",
                            fontWeight: "bold",
                          }}
                        >
                          {result.prediction === "CANDIDATE"
                            ? "✅ CANDIDATE"
                            : "❌ FALSE POSITIVE"}
                        </span>
                        <span
                          style={{
                            color: "rgba(255, 255, 255, 0.8)",
                            fontSize: "1.3rem",
                            fontWeight: "600",
                          }}
                        >
                          {(result.confidence * 100).toFixed(1)}% confidence
                        </span>
                      </div>
                    </div>

                    {/* Result Details */}
                    <div
                      style={{
                        background: "rgba(255, 255, 255, 0.1)",
                        padding: "1.5rem",
                        borderRadius: "0.75rem",
                        marginBottom: "1.5rem",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          padding: "0.75rem 0",
                          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                        }}
                      >
                        <span
                          style={{
                            color: "rgba(255, 255, 255, 0.8)",
                            fontWeight: "600",
                          }}
                        >
                          Model:
                        </span>
                        <span
                          style={{
                            color: "white",
                            fontWeight: "500",
                          }}
                        >
                          {result.model}
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          padding: "0.75rem 0",
                          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                        }}
                      >
                        <span
                          style={{
                            color: "rgba(255, 255, 255, 0.8)",
                            fontWeight: "600",
                          }}
                        >
                          RAG Examples Used:
                        </span>
                        <span
                          style={{
                            color: "white",
                            fontWeight: "500",
                          }}
                        >
                          {result.similar_examples_used} most similar entries
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          padding: "0.75rem 0",
                        }}
                      >
                        <span
                          style={{
                            color: "rgba(255, 255, 255, 0.8)",
                            fontWeight: "600",
                          }}
                        >
                          Processing Time:
                        </span>
                        <span
                          style={{
                            color: "white",
                            fontWeight: "500",
                          }}
                        >
                          {result.processing_time}
                        </span>
                      </div>
                    </div>

                    {/* Input Summary */}
                    <div
                      style={{
                        background: "rgba(255, 255, 255, 0.1)",
                        padding: "1.5rem",
                        borderRadius: "0.75rem",
                        marginBottom: "1.5rem",
                      }}
                    >
                      <h4
                        style={{
                          margin: "0 0 1rem 0",
                          color: "white",
                          fontSize: "1.1rem",
                          fontWeight: "600",
                        }}
                      >
                        📋 Input Parameters:
                      </h4>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "repeat(auto-fit, minmax(180px, 1fr))",
                          gap: "0.75rem",
                          color: "rgba(255, 255, 255, 0.8)",
                          fontSize: "0.95rem",
                        }}
                      >
                        <span>Period: {formData.period} days</span>
                        <span>Duration: {formData.duration} hrs</span>
                        <span>Depth: {formData.depth} ppm</span>
                        <span>Radius: {formData.prad} R⊕</span>
                        <span>Temp: {formData.teq} K</span>
                      </div>
                    </div>

                    {/* RAG Examples Button */}
                    {result.similar_examples &&
                      result.similar_examples.length > 0 && (
                        <button
                          onClick={() => setShowRagExamples(true)}
                          style={{
                            width: "100%",
                            background: "#4299e1",
                            color: "white",
                            border: "none",
                            padding: "1rem",
                            borderRadius: "0.75rem",
                            fontSize: "1.1rem",
                            fontWeight: "bold",
                            cursor: "pointer",
                            transition: "background 0.2s",
                            fontFamily: "'Inter', sans-serif",
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.background = "#3182ce";
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.background = "#4299e1";
                          }}
                        >
                          🔍 View {result.similar_examples.length} RAG Examples
                          Used
                        </button>
                      )}
                  </div>

                  {/* What This Means */}
                  <div
                    style={{
                      background: "rgba(255, 255, 255, 0.1)",
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
                      }}
                    >
                      💡 What Does This Mean?
                    </h3>
                    {result.prediction === "CANDIDATE" ? (
                      <p
                        style={{
                          color: "rgba(255, 255, 255, 0.8)",
                          lineHeight: "1.7",
                          margin: "0",
                          fontSize: "1rem",
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
                  background: "rgba(255, 255, 255, 0.05)",
                  backdropFilter: "blur(10px)",
                  borderRadius: "1.5rem",
                  padding: "2rem",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
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
                  🧠 How Our AI Works
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
                      background: "rgba(255, 255, 255, 0.1)",
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
                      }}
                    >
                      Finds 25 most similar exoplanets from 17,594 labeled
                      entries using vector embeddings
                    </p>
                  </div>
                  <div
                    style={{
                      background: "rgba(255, 255, 255, 0.1)",
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
                      }}
                    >
                      Sends similar examples to GPT-4o-mini as context for
                      classification
                    </p>
                  </div>
                  <div
                    style={{
                      background: "rgba(255, 255, 255, 0.1)",
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
                      }}
                    >
                      LLM analyzes patterns and predicts: CANDIDATE or FALSE
                      POSITIVE
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Original Dashboard Content */
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
                          ? "rgba(128, 114, 255, 0.1)"
                          : "rgba(255, 255, 255, 0.05)",
                      backdropFilter: "blur(10px)",
                      borderRadius: "1.5rem",
                      padding: "2rem",
                      border:
                        activeMission === mission.id
                          ? `2px solid ${mission.color}`
                          : "1px solid rgba(255, 255, 255, 0.1)",
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
                        e.target.style.borderColor = "rgba(255, 255, 255, 0.1)";
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
                    "linear-gradient(135deg, rgba(128, 114, 255, 0.2) 0%, rgba(103, 93, 194, 0.2) 100%)",
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
                  Total Exoplanets Discovered
                </p>
              </div>

              {/* Data Table Section */}
              <div
                style={{
                  background: "rgba(255, 255, 255, 0.05)",
                  backdropFilter: "blur(10px)",
                  borderRadius: "1.5rem",
                  padding: "2rem",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
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
                              borderBottom:
                                "1px solid rgba(255, 255, 255, 0.05)",
                              transition: "all 0.2s ease",
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.background =
                                "rgba(128, 114, 255, 0.05)";
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.background = "transparent";
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
                      background: "rgba(255, 255, 255, 0.03)",
                      borderRadius: "1rem",
                    }}
                  >
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      style={{
                        background:
                          currentPage === 1
                            ? "rgba(255, 255, 255, 0.1)"
                            : "rgba(128, 114, 255, 0.2)",
                        color:
                          currentPage === 1
                            ? "rgba(255, 255, 255, 0.4)"
                            : "white",
                        border: "1px solid rgba(255, 255, 255, 0.2)",
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
                            ? "rgba(255, 255, 255, 0.1)"
                            : "rgba(128, 114, 255, 0.2)",
                        color:
                          currentPage === totalPages
                            ? "rgba(255, 255, 255, 0.4)"
                            : "white",
                        border: "1px solid rgba(255, 255, 255, 0.2)",
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
                background: "rgba(255, 255, 255, 0.05)",
                backdropFilter: "blur(10px)",
                border: "2px solid rgba(255, 255, 255, 0.1)",
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
                  background: "rgba(255, 255, 255, 0.1)",
                  borderRadius: "0.75rem",
                  fontWeight: "600",
                  fontSize: "0.95rem",
                }}
              >
                <span style={{ color: "#48bb78" }}>
                  ✅ Candidates:{" "}
                  {
                    result.similar_examples.filter(
                      (e) => e.disposition === "CANDIDATE"
                    ).length
                  }
                </span>
                <span style={{ color: "#f56565" }}>
                  ❌ False Positives:{" "}
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
                  border: "1px solid rgba(255, 255, 255, 0.1)",
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
                        background: "rgba(255, 255, 255, 0.1)",
                        position: "sticky",
                        top: 0,
                      }}
                    >
                      <th
                        style={{
                          padding: "1rem",
                          textAlign: "left",
                          fontWeight: "bold",
                          borderBottom: "2px solid rgba(255, 255, 255, 0.2)",
                        }}
                      >
                        #
                      </th>
                      <th
                        style={{
                          padding: "1rem",
                          textAlign: "left",
                          fontWeight: "bold",
                          borderBottom: "2px solid rgba(255, 255, 255, 0.2)",
                        }}
                      >
                        Name
                      </th>
                      <th
                        style={{
                          padding: "1rem",
                          textAlign: "left",
                          fontWeight: "bold",
                          borderBottom: "2px solid rgba(255, 255, 255, 0.2)",
                        }}
                      >
                        Period
                      </th>
                      <th
                        style={{
                          padding: "1rem",
                          textAlign: "left",
                          fontWeight: "bold",
                          borderBottom: "2px solid rgba(255, 255, 255, 0.2)",
                        }}
                      >
                        Duration
                      </th>
                      <th
                        style={{
                          padding: "1rem",
                          textAlign: "left",
                          fontWeight: "bold",
                          borderBottom: "2px solid rgba(255, 255, 255, 0.2)",
                        }}
                      >
                        Depth
                      </th>
                      <th
                        style={{
                          padding: "1rem",
                          textAlign: "left",
                          fontWeight: "bold",
                          borderBottom: "2px solid rgba(255, 255, 255, 0.2)",
                        }}
                      >
                        Radius
                      </th>
                      <th
                        style={{
                          padding: "1rem",
                          textAlign: "left",
                          fontWeight: "bold",
                          borderBottom: "2px solid rgba(255, 255, 255, 0.2)",
                        }}
                      >
                        Temp
                      </th>
                      <th
                        style={{
                          padding: "1rem",
                          textAlign: "left",
                          fontWeight: "bold",
                          borderBottom: "2px solid rgba(255, 255, 255, 0.2)",
                        }}
                      >
                        Label
                      </th>
                      <th
                        style={{
                          padding: "1rem",
                          textAlign: "left",
                          fontWeight: "bold",
                          borderBottom: "2px solid rgba(255, 255, 255, 0.2)",
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
                          borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background =
                            "rgba(255, 255, 255, 0.1)";
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = "transparent";
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
                  background: "rgba(255, 255, 255, 0.1)",
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
                  }}
                >
                  💡 How RAG Works
                </h4>
                <p
                  style={{
                    color: "rgba(255, 255, 255, 0.8)",
                    lineHeight: "1.7",
                    margin: "0",
                    fontSize: "1rem",
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
                  background: "rgba(255, 255, 255, 0.1)",
                  color: "white",
                  border: "2px solid rgba(255, 255, 255, 0.2)",
                  padding: "1rem",
                  borderRadius: "0.75rem",
                  fontSize: "1.1rem",
                  fontWeight: "bold",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  fontFamily: "'Inter', sans-serif",
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = "rgba(255, 255, 255, 0.2)";
                  e.target.style.borderColor = "#8072FF";
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = "rgba(255, 255, 255, 0.1)";
                  e.target.style.borderColor = "rgba(255, 255, 255, 0.2)";
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
