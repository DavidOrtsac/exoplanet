import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect } from "react";

export default function DashboardLayout({ children }) {
  const router = useRouter();

  const sidebarItems = [
    { href: "/dashboard", label: "Overview", icon: "🌌" },
    { href: "/dashboard/classify", label: "AI Classifier", icon: "🤖" },
    { href: "/dashboard/dataset", label: "Data Explorer", icon: "📊" },
    { href: "/dashboard/user", label: "Profile", icon: "👤" },
  ];

  // Generate random stars (same as front page)
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
    <div className="App">
      {/* Stars background */}
      <div className="stars">{generateStars()}</div>

      {/* Navigation to main site */}
      <nav
        style={{
          position: "fixed",
          top: "2rem",
          left: "2rem",
          zIndex: 1000,
        }}
      >
        <Link
          href="/"
          style={{
            color: "rgba(255, 255, 255, 0.8)",
            textDecoration: "none",
            fontSize: "1rem",
            fontFamily: "'Inter', sans-serif",
            fontWeight: "400",
            padding: "0.75rem 1.5rem",
            borderRadius: "0.75rem",
            background: "rgba(255, 255, 255, 0.1)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            transition: "all 0.3s ease",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
          onMouseEnter={(e) => {
            e.target.style.background = "rgba(255, 255, 255, 0.2)";
            e.target.style.color = "white";
          }}
          onMouseLeave={(e) => {
            e.target.style.background = "rgba(255, 255, 255, 0.1)";
            e.target.style.color = "rgba(255, 255, 255, 0.8)";
          }}
        >
          ← Back to Earth
        </Link>
      </nav>

      <div
        style={{
          display: "flex",
          minHeight: "100vh",
          position: "relative",
          zIndex: 10,
        }}
      >
        {/* Modern Sidebar */}
        <div
          style={{
            width: "280px",
            background: "rgba(255, 255, 255, 0.05)",
            backdropFilter: "blur(10px)",
            borderRight: "1px solid rgba(255, 255, 255, 0.1)",
            padding: "6rem 0 2rem 0",
            position: "fixed",
            height: "100vh",
            left: 0,
            top: 0,
            zIndex: 5,
          }}
        >
          <div style={{ padding: "0 2rem" }}>
            <div
              style={{
                textAlign: "center",
                marginBottom: "3rem",
                paddingBottom: "2rem",
                borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
              }}
            >
              <h1
                style={{
                  color: "white",
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: "700",
                  fontSize: "1.75rem",
                  margin: "0 0 0.5rem 0",
                  letterSpacing: "0.05em",
                }}
              >
                NASA
              </h1>
              <p
                style={{
                  color: "#8072FF",
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: "300",
                  fontSize: "0.875rem",
                  margin: "0",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}
              >
                Exoplanet Explorer
              </p>
            </div>

            <nav
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}
            >
              {sidebarItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "1rem",
                    padding: "1rem 1.5rem",
                    color:
                      router.pathname === item.href
                        ? "white"
                        : "rgba(255, 255, 255, 0.7)",
                    textDecoration: "none",
                    fontSize: "1rem",
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: router.pathname === item.href ? "600" : "400",
                    borderRadius: "1rem",
                    background:
                      router.pathname === item.href
                        ? "linear-gradient(135deg, #8072FF 0%, #675DC2 100%)"
                        : "transparent",
                    border: "1px solid transparent",
                    transition: "all 0.3s ease",
                    position: "relative",
                  }}
                  onMouseEnter={(e) => {
                    if (router.pathname !== item.href) {
                      e.target.style.background = "rgba(128, 114, 255, 0.1)";
                      e.target.style.borderColor = "rgba(128, 114, 255, 0.3)";
                      e.target.style.color = "white";
                      e.target.style.transform = "translateX(0.25rem)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (router.pathname !== item.href) {
                      e.target.style.background = "transparent";
                      e.target.style.borderColor = "transparent";
                      e.target.style.color = "rgba(255, 255, 255, 0.7)";
                      e.target.style.transform = "translateX(0)";
                    }
                  }}
                >
                  <span style={{ fontSize: "1.25rem" }}>{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>

        {/* Main content */}
        <div
          style={{
            marginLeft: "280px",
            flex: 1,
            padding: "6rem 3rem 3rem",
            color: "white",
            minHeight: "100vh",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
