// Utility functions to load and process exoplanet data

export async function loadKOIData() {
  try {
    const response = await fetch("/data/koi_data_full.csv");
    const csvText = await response.text();
    const lines = csvText.split("\n");
    const headers = lines[0].split(",");

    const data = lines
      .slice(1) // Remove header, keep all data
      .map((line) => {
        const values = line.split(",");
        return {
          planetId: values[1] || "N/A", // kepoi_name
          discoveryDate: "2009-2018", // Approximate range for KOI
          orbitalPeriod: values[10] ? parseFloat(values[10]).toFixed(2) : "N/A", // koi_period
          planetRadius: values[26] ? parseFloat(values[26]).toFixed(2) : "N/A", // koi_prad
          stellarMass: values[37]
            ? (parseFloat(values[37]) / 1.989e30).toFixed(2)
            : "N/A", // koi_steff (converted to solar masses)
          equilibriumTemp: values[29]
            ? parseFloat(values[29]).toFixed(0)
            : "N/A", // koi_teq
          status: values[3] || "Unknown", // koi_disposition
          keplerName: values[2] || "N/A", // kepler_name
          stellarTemp: values[37] ? parseFloat(values[37]).toFixed(0) : "N/A", // koi_steff
          stellarRadius: values[40] ? parseFloat(values[40]).toFixed(2) : "N/A", // koi_srad
        };
      })
      .filter((item) => item.planetId !== "N/A" && item.planetId !== "");

    return data;
  } catch (error) {
    console.error("Error loading KOI data:", error);
    return [];
  }
}

export async function loadK2Data() {
  try {
    const response = await fetch("/data/k2_data_full.csv");
    const csvText = await response.text();
    const lines = csvText.split("\n");
    const headers = lines[0].split(",");

    const data = lines
      .slice(1) // Remove header, keep all data
      .map((line) => {
        const values = line.split(",");
        return {
          planetId: values[4] || values[1] || "N/A", // k2_name or pl_name as fallback
          discoveryDate: values[19] || "N/A", // disc_year
          orbitalPeriod: values[41] ? parseFloat(values[41]).toFixed(2) : "N/A", // pl_orbper
          planetRadius: values[43] ? parseFloat(values[43]).toFixed(2) : "N/A", // pl_rade
          stellarMass: values[75] ? parseFloat(values[75]).toFixed(2) : "N/A", // st_mass
          equilibriumTemp: values[55]
            ? parseFloat(values[55]).toFixed(0)
            : "N/A", // pl_eqt
          status: values[12] || "Unknown", // disposition
          planetName: values[1] || "N/A", // pl_name
          stellarTemp: values[74] ? parseFloat(values[74]).toFixed(0) : "N/A", // st_teff
          stellarRadius: values[76] ? parseFloat(values[76]).toFixed(2) : "N/A", // st_rad
        };
      })
      .filter((item) => item.planetId !== "N/A" && item.planetId !== "");

    return data;
  } catch (error) {
    console.error("Error loading K2 data:", error);
    return [];
  }
}

export async function loadTESSData() {
  try {
    const response = await fetch("/data/toi_data_full.csv");
    const csvText = await response.text();
    const lines = csvText.split("\n");
    const headers = lines[0].split(",");

    const data = lines
      .slice(1) // Remove header, keep all data
      .map((line) => {
        const values = line.split(",");
        return {
          planetId: values[1] || "N/A", // toi (index 1)
          discoveryDate: values[25] ? values[25].split(" ")[0] : "N/A", // toi_created (index 25)
          orbitalPeriod: values[14] ? parseFloat(values[14]).toFixed(2) : "N/A", // pl_orbper (index 14)
          planetRadius: values[17] ? parseFloat(values[17]).toFixed(2) : "N/A", // pl_rade (index 17)
          stellarMass: values[24] ? parseFloat(values[24]).toFixed(2) : "N/A", // st_rad (index 24)
          equilibriumTemp: values[19]
            ? parseFloat(values[19]).toFixed(0)
            : "N/A", // pl_eqt (index 19)
          status: values[6] || "Unknown", // tfopwg_disp (index 6)
          ticId: values[3] || "N/A", // tid (index 3)
          stellarTemp: values[22] ? parseFloat(values[22]).toFixed(0) : "N/A", // st_teff (index 22)
          stellarRadius: values[24] ? parseFloat(values[24]).toFixed(2) : "N/A", // st_rad (index 24)
        };
      })
      .filter((item) => item.planetId !== "N/A" && item.planetId !== "");

    return data;
  } catch (error) {
    console.error("Error loading TESS data:", error);
    return [];
  }
}

export async function loadDatasetData() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_ML_SERVICE_URL || 'http://localhost:5001';
    const response = await fetch(`${baseUrl}/data/dataset`, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const text = await response.text();
    const data = JSON.parse(text);
    return data;

  } catch (error) {
    console.error("Error loading or parsing dataset data:", error);
    return [];
  }
}