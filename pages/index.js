import { useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import Layout from "../components/Layout";
import ThreeJSEarth from "../components/ThreeJSEarth";

export default function Home() {
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
      </Head>

      <Layout>
        {/* Navigation */}
        <nav
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            zIndex: 1000,
            display: "flex",
            gap: "20px",
          }}
        >
          <Link
            href="/dashboard"
            style={{
              color: "#4A90E2",
              textDecoration: "none",
              fontSize: "18px",
              background: "rgba(255, 255, 255, 0.1)",
              padding: "10px 20px",
              borderRadius: "8px",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.target.style.background = "rgba(74, 144, 226, 0.2)";
              e.target.style.borderColor = "#4A90E2";
            }}
            onMouseLeave={(e) => {
              e.target.style.background = "rgba(255, 255, 255, 0.1)";
              e.target.style.borderColor = "rgba(255, 255, 255, 0.2)";
            }}
          >
            Open Dashboard →
          </Link>
        </nav>

        <div className="stars">{generateStars()}</div>
        <ThreeJSEarth />
        <header className="App-header">
          <h1>NASA</h1>
          <p style={{ fontSize: "1.5rem", marginTop: "20px", opacity: 0.9 }}>
            Exoplanet Explorer
          </p>
          <Link
            href="/dashboard"
            style={{
              display: "inline-block",
              background: "#4A90E2",
              color: "white",
              textDecoration: "none",
              padding: "15px 30px",
              borderRadius: "10px",
              fontSize: "1.2rem",
              marginTop: "30px",
              transition: "background 0.3s ease",
            }}
            onMouseEnter={(e) => (e.target.style.background = "#357ABD")}
            onMouseLeave={(e) => (e.target.style.background = "#4A90E2")}
          >
            Explore Data Dashboard
          </Link>
        </header>
      </Layout>
    </>
  );
}
