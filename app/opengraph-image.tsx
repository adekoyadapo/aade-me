import { ImageResponse } from "next/og";

export const alt = "Ade A. — Lead Architect, Enterprise Solutions Architecture";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 96,
          background: "#000",
          color: "#fff",
        }}
      >
        <div style={{ fontSize: 144, fontWeight: 700, letterSpacing: -4 }}>Ade A.</div>
        <div style={{ fontSize: 48, marginTop: 24, color: "#d4d4d4" }}>Lead Architect, Enterprise Solutions Architecture</div>
        <div style={{ fontSize: 32, marginTop: 16, color: "#a3a3a3" }}>Agentic AI Programs | Multi-Cloud Platforms</div>
        <div style={{ fontSize: 28, marginTop: 40, color: "#a3a3a3" }}>aade.me</div>
      </div>
    ),
    size,
  );
}
