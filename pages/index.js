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
          }}
        >
          in submission to A World Away: Hunting for Exoplanets with{" "}
          <strong>AI</strong>
        </div>

        <div className="stars">{generateStars()}</div>
        <ThreeJSEarth />
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
          <Link
            href="/dashboard"
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
            }}
            onMouseEnter={(e) => {
              e.target.style.background = "white";
              e.target.style.color = "#675DC2";
              e.target.style.borderColor = "white";
              e.target.style.transform = "translateY(-2px)";
              e.target.style.boxShadow = "0 8px 25px rgba(103, 93, 194, 0.3)";
            }}
            onMouseLeave={(e) => {
              e.target.style.background = "#675DC2";
              e.target.style.color = "white";
              e.target.style.borderColor = "#675DC2";
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "none";
            }}
          >
            Get Started
          </Link>
        </header>

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
