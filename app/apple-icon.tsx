import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#14120f",
          color: "#e0602a",
          fontSize: 78,
          fontWeight: 700,
          fontFamily: "sans-serif",
        }}
      >
        JT
      </div>
    ),
    size,
  );
}
