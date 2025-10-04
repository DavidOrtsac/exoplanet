import { useState, useEffect, useMemo } from "react";
import Head from "next/head";
import DashboardLayout from "../../components/DashboardLayout";
import { loadDatasetData } from "../../utils/dataLoader";
import { saveDataset, uploadUserData } from "../../utils/datasetActions";
import styles from "../../styles/Dataset.module.css";

const measureText = (text, font) => {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  context.font = font;
  return context.measureText(text).width;
};

export default function Dataset() {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(50);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'ascending' });
  const [columnWidths, setColumnWidths] = useState({});

  const tableColumns = [
    { key: 'type', label: 'Telescope Type' },
    { key: 'id', label: 'Planet ID' },
    { key: 'name', label: 'Planet Name' },
    { key: 'disposition', label: 'Disposition' },
    { key: 'period', label: 'Orbital Period (days)' },
    { key: 'duration', label: 'Transit Duration (hours)' },
    { key: 'depth', label: 'Transit Depth (ppm)' },
    { key: 'prad', label: 'Orbital Radius (Earth radii)' },
    { key: 'teq', label: 'Equilibrium Temperature (K)' },
  ];

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const datasetData = await loadDatasetData();
        setData(datasetData);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (data.length > 0) {
      const timer = setTimeout(() => {
        const headerFont = "600 0.85rem Inter";
        const cellFont = "400 0.9rem Inter";
        const numericCellFont = "400 0.9rem 'Roboto Mono'";
        const padding = 32;

        const newWidths = {};
        tableColumns.forEach(column => {
          let maxWidth = measureText(column.label, headerFont);
          
          if (column.key === 'disposition') {
            maxWidth = Math.max(maxWidth, 140);
          }

          const sampleSize = 500;
          const dataSample = data.slice(0, sampleSize);

          dataSample.forEach(row => {
            const isNumeric = ['id', 'period', 'duration', 'depth', 'prad', 'teq'].includes(column.key);
            const font = isNumeric ? numericCellFont : cellFont;
            const text = row[column.key] ? row[column.key].toString() : '';
            const width = measureText(text, font);
            if (width > maxWidth) {
              maxWidth = width;
            }
          });
          newWidths[column.key] = Math.ceil(maxWidth + padding);
        });
        setColumnWidths(newWidths);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [data]);

  const sortedData = useMemo(() => {
    let sortableData = [...data];
    if (sortConfig.key !== null) {
      sortableData.sort((a, b) => {
        if (a[sortConfig.key] === null) return 1;
        if (b[sortConfig.key] === null) return -1;
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableData;
  }, [data, sortConfig]);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };
  
  const totalPages = Math.ceil(sortedData.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedData = sortedData.slice(startIndex, endIndex);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getDisposition = (disposition) => {
    const value = Number(disposition);
    switch (value) {
      case 1:
        return <span className={`${styles.dispositionBadge} ${styles['disposition-1']}`}>Confirmed</span>;
      case 0:
        return <span className={`${styles.dispositionBadge} ${styles['disposition-0']}`}>False Positive</span>;
      default:
        return "Unknown";
    }
  };

  const getTelescopeName = (type) => {
    switch (type?.toLowerCase()) {
      case 'koi': return 'Kepler';
      case 'toi': return 'TESS';
      case 'k2': return 'K2';
      case 'user': return 'User';
      default: return type || 'Unknown';
    }
  };

  const handleUploadUserData = async (file) => {
    setLoading(true);
    try {
        const datasetData = await uploadUserData(file);
        setData(datasetData);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
  };



  const handleSaveDataset = async () => {
    setLoading(true);
    try {
      await saveDataset(data);
   
    } catch (error) {
      console.error("Error saving dataset:", error);
    } finally {
      setLoading(false);
    }
  };


  return (
    <>
      <Head>
        <title>Dataset Explorer - Exoplanet Dash</title>
        <meta
          name="description"
          content="Interactive dataset of exoplanets from KOI, TESS, and K2 missions."
        />
      </Head>

      <DashboardLayout>
        <div style={{ maxWidth: "1200px", margin: "0 auto", width: "70vw" }}>
          <h1 style={{ fontSize: "3rem", marginBottom: "2rem", textAlign: "center" }}>
            Exoplanet Dataset
          </h1>

          <div style={{display: "flex", justifyContent: "space-between", marginBottom: "2rem"}}>
            <button onClick={() => {
              const fileInput = document.createElement('input');
              fileInput.type = 'file';
              fileInput.accept = '.csv';
              fileInput.onchange = (e) => {
                const file = e.target.files[0];
                handleUploadUserData(file);
              };
              fileInput.click();
            }} className={styles.downloadButton}>Upload User Data to Dataset</button>
            
            <button onClick={handleSaveDataset} className={styles.downloadButton}>Save Dataset</button>
          </div>

          <div className={styles.tableContainer}>
            <div className={styles.tableWrapper}>
              <table className={styles.datasetTable}>
                <thead>
                  <tr>
                    {tableColumns.map((column) => (
                      <th 
                        key={column.key} 
                        onClick={() => requestSort(column.key)}
                        className={styles.sortableHeader}
                        style={{ width: columnWidths[column.key] || 'auto' }}
                      >
                        <span>{column.label}</span>
                        {sortConfig.key === column.key && (
                          <span className={styles.sortIcon}>
                            {sortConfig.direction === 'ascending' ? ' ▲' : ' ▼'}
                          </span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={tableColumns.length} className={styles.loadingCell}>
                        Loading dataset data...
                      </td>
                    </tr>
                  ) : paginatedData.length > 0 ? (
                    paginatedData.map((planet, rowIndex) => (
                      <tr key={rowIndex}>
                        <td>{getTelescopeName(planet.type)}</td>
                        <td className={styles.numericCell}>{planet.id}</td>
                        <td>{planet.name}</td>
                        <td>{getDisposition(planet.disposition)}</td>
                        <td className={styles.numericCell}>{planet.period}</td>
                        <td className={styles.numericCell}>{planet.duration}</td>
                        <td className={styles.numericCell}>{planet.depth}</td>
                        <td className={styles.numericCell}>{planet.prad}</td>
                        <td className={styles.numericCell}>{planet.teq}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={tableColumns.length} className={styles.noDataCell}>
                        No data available for your dataset
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
            {!loading && sortedData.length > rowsPerPage && (
              <div className={styles.paginationContainer}>
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={styles.paginationButton}
                >
                  ← Previous
                </button>
                <div className={styles.paginationInfo}>
                  <span>
                    Page {currentPage} of {totalPages}
                  </span>
                  <span>
                    ({startIndex + 1}-{Math.min(endIndex, sortedData.length)} of {sortedData.length})
                  </span>
                </div>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={styles.paginationButton}
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
