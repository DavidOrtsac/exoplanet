import Head from "next/head";
import ThreeJSEarthBottomRight from "../components/ThreeJSEarthBottomRight";

export default function NewDashboard() {
  return (
    <>
      <Head>
        <title>NASA</title>
      </Head>

      <ThreeJSEarthBottomRight />

      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          color: "white",
          fontSize: "4rem",
          fontWeight: "bold",
          zIndex: 10,
          textAlign: "center",
        }}
      >
        NASA
      </div>
    </>
  );
}
