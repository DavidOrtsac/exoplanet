import { useState, useEffect } from "react";
import Head from "next/head";
import DashboardLayout from "../../components/DashboardLayout";
import { loadKOIData, loadK2Data, loadTESSData } from "../../utils/dataLoader";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("KOI");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(100); // Show 100 rows per page

  const tabs = [
    { id: "KOI", label: "KOI" },
    { id: "TESS", label: "TESS" },
    { id: "K2", label: "K2" },
  ];

  const tableColumns = [
    "Planet ID",
    "Discovery Date",
    "Orbital Period (days)",
    "Planet Radius (Earth radii)",
    "Stellar Mass (Solar masses)",
    "Equilibrium Temperature (K)",
    "Status",
  ];

  const [data, setData] = useState({ KOI: [], TESS: [], K2: [] });
  const [loading, setLoading] = useState(true);

  console.log(data);
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

  // Reset to page 1 when switching tabs
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  // Calculate pagination
  const currentData = data[activeTab] || [];
  const totalPages = Math.ceil(currentData.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedData = currentData.slice(startIndex, endIndex);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const sampleData = {
    KOI: [
      ["KOI-1.01", "2009-04-15", "2.47", "1.31", "0.91", "1200", "Confirmed"],
      ["KOI-2.01", "2009-04-15", "4.89", "2.12", "1.05", "950", "Confirmed"],
      ["KOI-3.01", "2009-04-15", "1.76", "0.89", "0.78", "1400", "Candidate"],
      ["KOI-4.01", "2009-04-15", "8.92", "3.45", "1.12", "800", "Confirmed"],
      [
        "KOI-5.01",
        "2009-04-15",
        "12.34",
        "1.67",
        "0.95",
        "1100",
        "False Positive",
      ],
    ],
    TESS: [
      [
        "TIC-100100827",
        "2018-09-20",
        "3.12",
        "1.45",
        "0.88",
        "1250",
        "Confirmed",
      ],
      [
        "TIC-200200827",
        "2018-09-20",
        "6.78",
        "2.33",
        "1.02",
        "900",
        "Confirmed",
      ],
      [
        "TIC-300300827",
        "2018-09-20",
        "1.95",
        "0.76",
        "0.82",
        "1350",
        "Candidate",
      ],
      [
        "TIC-400400827",
        "2018-09-20",
        "15.67",
        "4.12",
        "1.15",
        "750",
        "Confirmed",
      ],
      [
        "TIC-500500827",
        "2018-09-20",
        "2.34",
        "1.23",
        "0.91",
        "1150",
        "Confirmed",
      ],
    ],
    K2: [
      [
        "EPIC-201367065",
        "2014-06-15",
        "4.56",
        "1.78",
        "0.97",
        "1050",
        "Confirmed",
      ],
      [
        "EPIC-201912552",
        "2014-06-15",
        "8.91",
        "2.67",
        "1.08",
        "850",
        "Confirmed",
      ],
      [
        "EPIC-202071638",
        "2014-06-15",
        "2.13",
        "0.92",
        "0.85",
        "1300",
        "Candidate",
      ],
      [
        "EPIC-203771098",
        "2014-06-15",
        "11.23",
        "3.89",
        "1.22",
        "700",
        "Confirmed",
      ],
      [
        "EPIC-204750116",
        "2014-06-15",
        "3.45",
        "1.56",
        "0.93",
        "1200",
        "Confirmed",
      ],
    ],
  };

  return (
    <>
      <Head>
        <title>Dashboard - NASA Exoplanet Explorer</title>
        <meta
          name="description"
          content="Exoplanet data dashboard with KOI, TESS, and K2 missions"
        />
      </Head>

      <DashboardLayout>
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
          }}
        >
          <h1
            style={{
              fontSize: "3rem",
              marginBottom: "2rem",
              textAlign: "center",
            }}
          >
            Exoplanet Data Dashboard
          </h1>

          {/* Data Summary */}
          {!loading && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "1rem",
                marginBottom: "2rem",
              }}
            >
              {tabs.map((tab) => (
                <div
                  key={tab.id}
                  style={{
                    background: "rgba(255, 255, 255, 0.1)",
                    backdropFilter: "blur(10px)",
                    borderRadius: "10px",
                    padding: "1.5rem",
                    textAlign: "center",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                  }}
                >
                  <h3 style={{ color: "#4A90E2", marginBottom: "0.5rem" }}>
                    {tab.label}
                  </h3>
                  <p
                    style={{
                      fontSize: "2rem",
                      fontWeight: "bold",
                      margin: "0",
                    }}
                  >
                    {data[tab.id]?.length || 0}
                  </p>
                  <p style={{ fontSize: "0.9rem", opacity: 0.8, margin: "0" }}>
                    exoplanets
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Tabs */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: "2rem",
              gap: "1rem",
            }}
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  background:
                    activeTab === tab.id
                      ? "#4A90E2"
                      : "rgba(255, 255, 255, 0.1)",
                  color: "white",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  padding: "12px 24px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "1.1rem",
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== tab.id) {
                    e.target.style.background = "rgba(255, 255, 255, 0.2)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== tab.id) {
                    e.target.style.background = "rgba(255, 255, 255, 0.1)";
                  }
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Table */}
          <div
            style={{
              background: "rgba(255, 255, 255, 0.1)",
              backdropFilter: "blur(10px)",
              borderRadius: "15px",
              padding: "2rem",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              overflow: "auto",
            }}
          >
            <h2
              style={{
                color: "#4A90E2",
                marginBottom: "1.5rem",
                textAlign: "center",
              }}
            >
              {activeTab} Mission Data
            </h2>

            <div style={{ overflow: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "0.9rem",
                }}
              >
                <thead>
                  <tr style={{ background: "rgba(74, 144, 226, 0.2)" }}>
                    {tableColumns.map((column, index) => (
                      <th
                        key={index}
                        style={{
                          padding: "12px 8px",
                          textAlign: "left",
                          borderBottom: "1px solid rgba(255, 255, 255, 0.2)",
                          fontWeight: "bold",
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
                          padding: "40px",
                          textAlign: "center",
                          color: "#4A90E2",
                          fontSize: "1.2rem",
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
                          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                          transition: "background 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background =
                            "rgba(255, 255, 255, 0.05)";
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = "transparent";
                        }}
                      >
                        <td
                          style={{
                            padding: "10px 8px",
                            borderRight: "1px solid rgba(255, 255, 255, 0.1)",
                          }}
                        >
                          {planet.planetId}
                        </td>
                        <td
                          style={{
                            padding: "10px 8px",
                            borderRight: "1px solid rgba(255, 255, 255, 0.1)",
                          }}
                        >
                          {planet.discoveryDate}
                        </td>
                        <td
                          style={{
                            padding: "10px 8px",
                            borderRight: "1px solid rgba(255, 255, 255, 0.1)",
                          }}
                        >
                          {planet.orbitalPeriod}
                        </td>
                        <td
                          style={{
                            padding: "10px 8px",
                            borderRight: "1px solid rgba(255, 255, 255, 0.1)",
                          }}
                        >
                          {planet.planetRadius}
                        </td>
                        <td
                          style={{
                            padding: "10px 8px",
                            borderRight: "1px solid rgba(255, 255, 255, 0.1)",
                          }}
                        >
                          {planet.stellarMass}
                        </td>
                        <td
                          style={{
                            padding: "10px 8px",
                            borderRight: "1px solid rgba(255, 255, 255, 0.1)",
                          }}
                        >
                          {planet.equilibriumTemp}
                        </td>
                        <td style={{ padding: "10px 8px" }}>
                          <span
                            style={{
                              padding: "4px 8px",
                              borderRadius: "4px",
                              fontSize: "0.9rem",
                              background:
                                planet.status === "CONFIRMED"
                                  ? "rgba(0, 255, 0, 0.2)"
                                  : planet.status === "CANDIDATE"
                                  ? "rgba(255, 255, 0, 0.2)"
                                  : "rgba(255, 0, 0, 0.2)",
                              color:
                                planet.status === "CONFIRMED"
                                  ? "#00ff00"
                                  : planet.status === "CANDIDATE"
                                  ? "#ffff00"
                                  : "#ff0000",
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
                          padding: "40px",
                          textAlign: "center",
                          color: "rgba(255, 255, 255, 0.6)",
                          fontSize: "1.1rem",
                        }}
                      >
                        No data available for {activeTab}
                      </td>
                    </tr>
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
                  padding: "1rem",
                }}
              >
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  style={{
                    background:
                      currentPage === 1
                        ? "rgba(255, 255, 255, 0.1)"
                        : "#4A90E2",
                    color: "white",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    padding: "8px 16px",
                    borderRadius: "6px",
                    cursor: currentPage === 1 ? "not-allowed" : "pointer",
                    opacity: currentPage === 1 ? 0.5 : 1,
                    transition: "all 0.3s ease",
                  }}
                >
                  ← Previous
                </button>

                <div
                  style={{
                    display: "flex",
                    gap: "0.5rem",
                    alignItems: "center",
                  }}
                >
                  <span style={{ color: "white", fontSize: "0.9rem" }}>
                    Page {currentPage} of {totalPages}
                  </span>
                  <span
                    style={{
                      color: "rgba(255, 255, 255, 0.6)",
                      fontSize: "0.8rem",
                    }}
                  >
                    ({startIndex + 1}-{Math.min(endIndex, currentData.length)}{" "}
                    of {currentData.length})
                  </span>
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  style={{
                    background:
                      currentPage === totalPages
                        ? "rgba(255, 255, 255, 0.1)"
                        : "#4A90E2",
                    color: "white",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    padding: "8px 16px",
                    borderRadius: "6px",
                    cursor:
                      currentPage === totalPages ? "not-allowed" : "pointer",
                    opacity: currentPage === totalPages ? 0.5 : 1,
                    transition: "all 0.3s ease",
                  }}
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </>
  );
}
