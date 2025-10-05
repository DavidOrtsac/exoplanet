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
          {/* AI Content */}
          {activeNavItem === "ai" ? (
            <div
              style={{
                minHeight: "100vh",
                padding: "3rem 5% 3rem 8rem",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  textAlign: "center",
                  maxWidth: "800px",
                  background: "rgba(255, 255, 255, 0.05)",
                  backdropFilter: "blur(10px)",
                  borderRadius: "2rem",
                  padding: "4rem 3rem",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                }}
              >
                <div
                  style={{
                    fontSize: "4rem",
                    marginBottom: "2rem",
                  }}
                >
                  🤖
                </div>
                <h1
                  style={{
                    fontSize: "3rem",
                    fontWeight: "800",
                    margin: "0 0 1.5rem 0",
                    background:
                      "linear-gradient(135deg, #ffffff 0%, #8072FF 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  AI Exoplanet Classifier
                </h1>
                <p
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: "300",
                    color: "rgba(255, 255, 255, 0.8)",
                    margin: "0 0 2rem 0",
                    fontFamily: "'Inter', sans-serif",
                    lineHeight: "1.6",
                  }}
                >
                  Our advanced machine learning model analyzes exoplanet data to
                  classify and predict the likelihood of habitability and
                  planetary characteristics.
                </p>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: "1.5rem",
                    marginTop: "2rem",
                  }}
                >
                  <div
                    style={{
                      background: "rgba(128, 114, 255, 0.1)",
                      padding: "1.5rem",
                      borderRadius: "1rem",
                      border: "1px solid rgba(128, 114, 255, 0.2)",
                    }}
                  >
                    <h3
                      style={{
                        color: "#8072FF",
                        fontSize: "1.125rem",
                        fontWeight: "600",
                        margin: "0 0 0.5rem 0",
                        fontFamily: "'Inter', sans-serif",
                      }}
                    >
                      Classification
                    </h3>
                    <p
                      style={{
                        color: "rgba(255, 255, 255, 0.7)",
                        fontSize: "0.875rem",
                        margin: "0",
                        fontFamily: "'Inter', sans-serif",
                      }}
                    >
                      Predict planet types and characteristics
                    </p>
                  </div>
                  <div
                    style={{
                      background: "rgba(128, 114, 255, 0.1)",
                      padding: "1.5rem",
                      borderRadius: "1rem",
                      border: "1px solid rgba(128, 114, 255, 0.2)",
                    }}
                  >
                    <h3
                      style={{
                        color: "#8072FF",
                        fontSize: "1.125rem",
                        fontWeight: "600",
                        margin: "0 0 0.5rem 0",
                        fontFamily: "'Inter', sans-serif",
                      }}
                    >
                      Habitability
                    </h3>
                    <p
                      style={{
                        color: "rgba(255, 255, 255, 0.7)",
                        fontSize: "0.875rem",
                        margin: "0",
                        fontFamily: "'Inter', sans-serif",
                      }}
                    >
                      Assess potential for life
                    </p>
                  </div>
                  <div
                    style={{
                      background: "rgba(128, 114, 255, 0.1)",
                      padding: "1.5rem",
                      borderRadius: "1rem",
                      border: "1px solid rgba(128, 114, 255, 0.2)",
                    }}
                  >
                    <h3
                      style={{
                        color: "#8072FF",
                        fontSize: "1.125rem",
                        fontWeight: "600",
                        margin: "0 0 0.5rem 0",
                        fontFamily: "'Inter', sans-serif",
                      }}
                    >
                      Analysis
                    </h3>
                    <p
                      style={{
                        color: "rgba(255, 255, 255, 0.7)",
                        fontSize: "0.875rem",
                        margin: "0",
                        fontFamily: "'Inter', sans-serif",
                      }}
                    >
                      Deep learning insights
                    </p>
                  </div>
                </div>
                <button
                  style={{
                    background:
                      "linear-gradient(135deg, #8072FF 0%, #675DC2 100%)",
                    color: "white",
                    border: "none",
                    padding: "1rem 2rem",
                    borderRadius: "1rem",
                    fontSize: "1.125rem",
                    fontWeight: "600",
                    fontFamily: "'Inter', sans-serif",
                    cursor: "pointer",
                    marginTop: "2rem",
                    transition: "all 0.3s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = "translateY(-2px)";
                    e.target.style.boxShadow =
                      "0 10px 30px rgba(128, 114, 255, 0.4)";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = "translateY(0)";
                    e.target.style.boxShadow = "none";
                  }}
                >
                  Try AI Classifier
                </button>
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
      </Layout>
    </>
  );
}
