"use client";

import GLTFViewer from "@/components/GLTFViewer";

// Previous homepage (Minerva 3D digital-twin viewer), relocated here so the
// GeoGemma-style immersive page can own `/`. Chrome (TopBar/BottomBar) intact.
export default function TwinPage() {
  return (
    <>
      <GLTFViewer />
    </>
  );
}
