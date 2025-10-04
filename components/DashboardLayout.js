import Link from "next/link";
import { useRouter } from "next/router";

export default function DashboardLayout({ children }) {
  const router = useRouter();

  const sidebarItems = [
    { href: "/dashboard", label: "Home", icon: "🏠" },
    { href: "/dashboard/classify", label: "Classify", icon: "🔬" },
    { href: "/dashboard/dataset", label: "Dataset", icon: "📊" },

  ];

  return (
    <div className="App">
      {/* Navigation to main site */}
      <nav
        style={{
          position: "fixed",
          top: "20px",
          left: "20px",
          zIndex: 1000,
          display: "flex",
          gap: "20px",
        }}
      >
        <Link
          href="/"
          style={{ color: "white", textDecoration: "none", fontSize: "18px" }}
        >
          ← Back to Earth
        </Link>
      </nav>

      {/* Stars background */}
      <div
        className="stars"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: 1,
        }}
      ></div>

      <div
        style={{
          display: "flex",
          minHeight: "100vh",
          position: "relative",
          zIndex: 10,
        }}
      >
        {/* Sidebar */}
        <div
          style={{
            width: "250px",
            background: "rgba(255, 255, 255, 0.1)",
            backdropFilter: "blur(10px)",
            borderRight: "1px solid rgba(255, 255, 255, 0.2)",
            padding: "100px 0 20px 0",
            position: "fixed",
            height: "100vh",
            left: 0,
            top: 0,
            zIndex: 5,
          }}
        >
          <div style={{ padding: "0 20px" }}>
            <h2
              style={{
                color: "#4A90E2",
                marginBottom: "2rem",
                fontSize: "1.5rem",
                textAlign: "center",
              }}
            >
              Dashboard
            </h2>
            <nav
              style={{ display: "flex", flexDirection: "column", gap: "10px" }}
            >
              {sidebarItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "15px 20px",
                    color: router.pathname === item.href ? "#4A90E2" : "white",
                    textDecoration: "none",
                    fontSize: "1.1rem",
                    borderRadius: "8px",
                    background:
                      router.pathname === item.href
                        ? "rgba(74, 144, 226, 0.2)"
                        : "transparent",
                    border: "1px solid transparent",
                    transition: "all 0.3s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (router.pathname !== item.href) {
                      e.target.style.background = "rgba(255, 255, 255, 0.1)";
                      e.target.style.borderColor = "rgba(255, 255, 255, 0.2)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (router.pathname !== item.href) {
                      e.target.style.background = "transparent";
                      e.target.style.borderColor = "transparent";
                    }
                  }}
                >
                  <span style={{ fontSize: "1.2rem" }}>{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>

        {/* Main content */}
        <div
          style={{
            marginLeft: "250px",
            flex: 1,
            padding: "100px 20px 20px",
            color: "white",
            minHeight: "100vh",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
