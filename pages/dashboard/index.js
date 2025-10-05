import { useState, useEffect } from "react";
import Head from "next/head";
import DashboardLayout from "../../components/DashboardLayout";
import { loadKOIData, loadK2Data, loadTESSData } from "../../utils/dataLoader";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("KOI");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(50);

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

  const tableColumns = [
    "Planet ID",
    "Discovery Date",
    "Orbital Period",
    "Planet Radius",
    "Stellar Mass",
    "Temperature",
    "Status",
  ];

  const [data, setData] = useState({ KOI: [], TESS: [], K2: [] });
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  const currentData = data[activeTab] || [];
  const totalPages = Math.ceil(currentData.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedData = currentData.slice(startIndex, endIndex);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const totalExoplanets = Object.values(data).reduce(
    (sum, arr) => sum + arr.length,
    0
  );

  return (
    <>
      <Head>
        <title>Overview - NASA Exoplanet Explorer</title>
        <meta
          name="description"
          content="Comprehensive exoplanet data overview"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </Head>

      <DashboardLayout>
        {/* Hero Section */}
        <div
          style={{
            marginBottom: "3rem",
          }}
        >
          <h1
            style={{
              fontSize: "3.5rem",
              fontWeight: "800",
              margin: "0 0 1rem 0",
              background: "linear-gradient(135deg, #ffffff 0%, #8072FF 100%)",
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
            Explore thousands of confirmed and candidate exoplanets from NASA's
            space missions
          </p>
        </div>

        {/* Mission Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "2rem",
            marginBottom: "3rem",
          }}
        >
          {missions.map((mission) => (
            <div
              key={mission.id}
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                backdropFilter: "blur(10px)",
                borderRadius: "1.5rem",
                padding: "2rem",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                transition: "all 0.3s ease",
                cursor: "pointer",
                position: "relative",
                overflow: "hidden",
              }}
              onClick={() => setActiveTab(mission.id)}
              onMouseEnter={(e) => {
                e.target.style.transform = "translateY(-0.5rem)";
                e.target.style.borderColor = mission.color;
                e.target.style.boxShadow = `0 20px 40px rgba(128, 114, 255, 0.2)`;
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = "translateY(0)";
                e.target.style.borderColor = "rgba(255, 255, 255, 0.1)";
                e.target.style.boxShadow = "none";
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                  marginBottom: "1rem",
                }}
              >
                <div
                  style={{
                    fontSize: "2rem",
                    opacity: activeTab === mission.id ? 1 : 0.7,
                  }}
                >
                  {mission.icon}
                </div>
                <div>
                  <h3
                    style={{
                      color: activeTab === mission.id ? mission.color : "white",
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
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <p
                    style={{
                      fontSize: "3rem",
                      fontWeight: "800",
                      margin: "0",
                      color: activeTab === mission.id ? mission.color : "white",
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    {loading ? "..." : data[mission.id]?.length || 0}
                  </p>
                  <p
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: "400",
                      color: "rgba(255, 255, 255, 0.6)",
                      margin: "0",
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    exoplanets
                  </p>
                </div>

                {activeTab === mission.id && (
                  <div
                    style={{
                      width: "0.5rem",
                      height: "0.5rem",
                      borderRadius: "50%",
                      background: mission.color,
                      boxShadow: `0 0 20px ${mission.color}`,
                    }}
                  />
                )}
              </div>
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
            marginBottom: "3rem",
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

        {/* Data Table */}
        <div
          style={{
            background: "rgba(255, 255, 255, 0.05)",
            backdropFilter: "blur(10px)",
            borderRadius: "1.5rem",
            padding: "2rem",
            border: "1px solid rgba(255, 255, 255, 0.1)",
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
              {missions.find((m) => m.id === activeTab)?.label} Data
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
              Showing {startIndex + 1}-{Math.min(endIndex, currentData.length)}{" "}
              of {currentData.length}
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
                  {tableColumns.map((column, index) => (
                    <th
                      key={index}
                      style={{
                        padding: "1rem 0.75rem",
                        textAlign: "left",
                        borderBottom: "2px solid rgba(128, 114, 255, 0.3)",
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
                      colSpan={tableColumns.length}
                      style={{
                        padding: "3rem",
                        textAlign: "center",
                        color: "rgba(255, 255, 255, 0.6)",
                        fontSize: "1rem",
                        fontFamily: "'Inter', sans-serif",
                      }}
                    >
                      Loading {activeTab} data...
                    </td>
                  </tr>
                ) : paginatedData.length > 0 ? (
                  paginatedData.map((planet, rowIndex) => (
                    <tr
                      key={rowIndex}
                      style={{
                        borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = "rgba(128, 114, 255, 0.05)";
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
                        {planet.planetId}
                      </td>
                      <td
                        style={{
                          padding: "1rem 0.75rem",
                          color: "rgba(255, 255, 255, 0.8)",
                        }}
                      >
                        {planet.discoveryDate}
                      </td>
                      <td
                        style={{
                          padding: "1rem 0.75rem",
                          color: "rgba(255, 255, 255, 0.8)",
                        }}
                      >
                        {planet.orbitalPeriod}
                      </td>
                      <td
                        style={{
                          padding: "1rem 0.75rem",
                          color: "rgba(255, 255, 255, 0.8)",
                        }}
                      >
                        {planet.planetRadius}
                      </td>
                      <td
                        style={{
                          padding: "1rem 0.75rem",
                          color: "rgba(255, 255, 255, 0.8)",
                        }}
                      >
                        {planet.stellarMass}
                      </td>
                      <td
                        style={{
                          padding: "1rem 0.75rem",
                          color: "rgba(255, 255, 255, 0.8)",
                        }}
                      >
                        {planet.equilibriumTemp}
                      </td>
                      <td style={{ padding: "1rem 0.75rem" }}>
                        <span
                          style={{
                            padding: "0.375rem 0.75rem",
                            borderRadius: "0.75rem",
                            fontSize: "0.75rem",
                            fontWeight: "500",
                            fontFamily: "'Inter', sans-serif",
                            background:
                              planet.status === "CONFIRMED"
                                ? "rgba(34, 197, 94, 0.2)"
                                : planet.status === "CANDIDATE"
                                ? "rgba(251, 191, 36, 0.2)"
                                : "rgba(239, 68, 68, 0.2)",
                            color:
                              planet.status === "CONFIRMED"
                                ? "#22c55e"
                                : planet.status === "CANDIDATE"
                                ? "#fbbf24"
                                : "#ef4444",
                            border: "1px solid",
                            borderColor:
                              planet.status === "CONFIRMED"
                                ? "rgba(34, 197, 94, 0.3)"
                                : planet.status === "CANDIDATE"
                                ? "rgba(251, 191, 36, 0.3)"
                                : "rgba(239, 68, 68, 0.3)",
                          }}
                        >
                          {planet.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={tableColumns.length}
                      style={{
                        padding: "3rem",
                        textAlign: "center",
                        color: "rgba(255, 255, 255, 0.6)",
                        fontSize: "1rem",
                        fontFamily: "'Inter', sans-serif",
                      }}
                    >
                      No data available for {activeTab}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Modern Pagination */}
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
                    currentPage === 1 ? "rgba(255, 255, 255, 0.4)" : "white",
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
                    e.target.style.background = "rgba(128, 114, 255, 0.3)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentPage !== 1) {
                    e.target.style.background = "rgba(128, 114, 255, 0.2)";
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
                    currentPage === totalPages ? "not-allowed" : "pointer",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  fontFamily: "'Inter', sans-serif",
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  if (currentPage !== totalPages) {
                    e.target.style.background = "rgba(128, 114, 255, 0.3)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentPage !== totalPages) {
                    e.target.style.background = "rgba(128, 114, 255, 0.2)";
                  }
                }}
              >
                Next →
              </button>
            </div>
          )}
        </div>
      </DashboardLayout>
    </>
  );
}
