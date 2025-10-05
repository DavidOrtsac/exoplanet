import { useState, useEffect } from "react";

const LoadingOverlay = ({
  isVisible,
  duration = 3000,
  title = "Loading...",
  subtitle = "Please wait while we process your request",
  onComplete,
  progress = null,
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [startTime, setStartTime] = useState(null);

  useEffect(() => {
    if (isVisible) {
      setStartTime(Date.now());
      setShouldRender(true);
      // Small delay to ensure DOM is ready before starting animation
      const timer = setTimeout(() => {
        setIsAnimating(true);
      }, 10);
      return () => clearTimeout(timer);
    } else {
      setIsAnimating(false);
      // Wait for fade out animation to complete before removing from DOM
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        // Ensure minimum 500ms delay from when loading started
        const elapsed = Date.now() - startTime;
        const remainingTime = Math.max(0, 500 - elapsed);

        setTimeout(() => {
          if (onComplete) {
            onComplete();
          }
        }, remainingTime);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onComplete, startTime]);

  if (!shouldRender) {
    return null;
  }

  return (
    <>
      <style jsx>{`
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        @keyframes fadeIn {
          0% {
            opacity: 0;
            backdrop-filter: blur(0px);
          }
          100% {
            opacity: 1;
            backdrop-filter: blur(10px);
          }
        }

        @keyframes fadeOut {
          0% {
            opacity: 1;
            backdrop-filter: blur(10px);
          }
          100% {
            opacity: 0;
            backdrop-filter: blur(0px);
          }
        }

        @keyframes slideIn {
          0% {
            transform: translateY(20px) scale(0.9);
            opacity: 0;
          }
          100% {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
        }

        @keyframes slideOut {
          0% {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translateY(-20px) scale(0.9);
            opacity: 0;
          }
        }

        .loading-overlay {
          animation: ${isAnimating ? "fadeIn" : "fadeOut"} 0.3s ease-in-out;
        }

        .loading-container {
          animation: ${isAnimating ? "slideIn" : "slideOut"} 0.3s ease-in-out;
        }
      `}</style>

      <div
        className="loading-overlay"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          zIndex: 9999,
          background: "rgba(0, 0, 0, 0.7)",
          backdropFilter: "blur(10px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          className="loading-container"
          style={{
            background: "rgba(0, 0, 0, 0.8)",
            borderRadius: "2rem",
            padding: "3rem 4rem",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "2rem",
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.5)",
          }}
        >
          <div
            style={{
              width: "4rem",
              height: "4rem",
              border: "4px solid rgba(255, 255, 255, 0.2)",
              borderTop: "4px solid #8072FF",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
            }}
          />
          <div
            style={{
              color: "white",
              fontSize: "1.5rem",
              fontWeight: "600",
              fontFamily: "'Inter', sans-serif",
              textAlign: "center",
            }}
          >
            {title}
          </div>
          <div
            style={{
              color: "rgba(255, 255, 255, 0.7)",
              fontSize: "1rem",
              fontFamily: "'Inter', sans-serif",
              textAlign: "center",
            }}
          >
            {subtitle}
          </div>
          
          {/* Progress Bar */}
          {progress && progress.current !== undefined && (
            <div
              style={{
                width: "100%",
                marginTop: "1rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "0.5rem",
                }}
              >
                <div
                  style={{
                    color: "rgba(255, 255, 255, 0.9)",
                    fontSize: "0.875rem",
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  Processing...
                </div>
                <div
                  style={{
                    color: "rgba(255, 255, 255, 0.7)",
                    fontSize: "0.875rem",
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  {Math.round(progress.current)}%
                </div>
              </div>
              
              {/* Progress Bar */}
              <div
                style={{
                  width: "100%",
                  height: "8px",
                  background: "rgba(255, 255, 255, 0.1)",
                  borderRadius: "4px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    background: "linear-gradient(90deg, #8072FF 0%, #A896FF 100%)",
                    borderRadius: "4px",
                    transition: "width 0.3s ease",
                    width: `${Math.min(100, Math.max(0, progress.current))}%`,
                    boxShadow: "0 0 10px rgba(128, 114, 255, 0.5)",
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default LoadingOverlay;