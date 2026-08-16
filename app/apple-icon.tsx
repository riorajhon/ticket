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
          background: "#07110e",
        }}
      >
        <div
          style={{
            width: 148,
            height: 88,
            background: "#3d9a57",
            borderRadius: 18,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingLeft: 16,
            paddingRight: 16,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              background: "#f4f0e6",
              borderRadius: 8,
              display: "flex",
            }}
          />
          <div
            style={{
              width: 28,
              height: 28,
              background: "#e07a3d",
              borderRadius: 14,
              display: "flex",
            }}
          />
        </div>
      </div>
    ),
    size,
  );
}
