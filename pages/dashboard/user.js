import Head from "next/head";
import DashboardLayout from "../../components/DashboardLayout";

export default function User() {
  return (
    <>
      <Head>
        <title>User Profile - NASA Exoplanet Explorer</title>
        <meta
          name="description"
          content="User profile and settings for NASA Exoplanet Explorer"
        />
      </Head>

      <DashboardLayout>
        <div
          style={{
            maxWidth: "800px",
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
            User Profile
          </h1>

          <div
            style={{
              background: "rgba(255, 255, 255, 0.1)",
              backdropFilter: "blur(10px)",
              borderRadius: "15px",
              padding: "3rem",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              marginBottom: "2rem",
            }}
          >
            <h2 style={{ color: "#4A90E2", marginBottom: "1.5rem" }}>
              Profile Information
            </h2>

            <div style={{ display: "grid", gap: "1.5rem" }}>
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontSize: "1.1rem",
                  }}
                >
                  Username
                </label>
                <input
                  type="text"
                  defaultValue="space_explorer_2024"
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "8px",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    background: "rgba(255, 255, 255, 0.1)",
                    color: "white",
                    fontSize: "1rem",
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontSize: "1.1rem",
                  }}
                >
                  Email
                </label>
                <input
                  type="email"
                  defaultValue="user@nasa.gov"
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "8px",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    background: "rgba(255, 255, 255, 0.1)",
                    color: "white",
                    fontSize: "1rem",
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontSize: "1.1rem",
                  }}
                >
                  Research Institution
                </label>
                <input
                  type="text"
                  defaultValue="NASA Ames Research Center"
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "8px",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    background: "rgba(255, 255, 255, 0.1)",
                    color: "white",
                    fontSize: "1rem",
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontSize: "1.1rem",
                  }}
                >
                  Research Focus
                </label>
                <select
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "8px",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    background: "rgba(255, 255, 255, 0.1)",
                    color: "white",
                    fontSize: "1rem",
                  }}
                >
                  <option value="exoplanets">Exoplanet Discovery</option>
                  <option value="atmospheres">Planetary Atmospheres</option>
                  <option value="habitability">Habitability Studies</option>
                  <option value="statistics">Statistical Analysis</option>
                </select>
              </div>
            </div>
          </div>

          <div
            style={{
              background: "rgba(255, 255, 255, 0.1)",
              backdropFilter: "blur(10px)",
              borderRadius: "15px",
              padding: "2rem",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              textAlign: "center",
            }}
          >
            <h3 style={{ color: "#4A90E2", marginBottom: "1rem" }}>
              Account Actions
            </h3>
            <div
              style={{ display: "flex", gap: "1rem", justifyContent: "center" }}
            >
              <button
                style={{
                  background: "#4A90E2",
                  color: "white",
                  border: "none",
                  padding: "12px 24px",
                  borderRadius: "8px",
                  fontSize: "1rem",
                  cursor: "pointer",
                  transition: "background 0.3s ease",
                }}
                onMouseEnter={(e) => (e.target.style.background = "#357ABD")}
                onMouseLeave={(e) => (e.target.style.background = "#4A90E2")}
              >
                Save Changes
              </button>
              <button
                style={{
                  background: "rgba(255, 255, 255, 0.1)",
                  color: "white",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  padding: "12px 24px",
                  borderRadius: "8px",
                  fontSize: "1rem",
                  cursor: "pointer",
                  transition: "background 0.3s ease",
                }}
                onMouseEnter={(e) =>
                  (e.target.style.background = "rgba(255, 255, 255, 0.2)")
                }
                onMouseLeave={(e) =>
                  (e.target.style.background = "rgba(255, 255, 255, 0.1)")
                }
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </>
  );
}
