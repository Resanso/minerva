"use client";

import React, { useEffect, useState } from "react";
import GLTFViewer from "@/components/GLTFViewer";

export default function Home() {
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    // localStorage persistence temporarily disabled per request.
    // try {
    //   const shown = localStorage.getItem("companyProfileShown");
    //   if (!shown) setShowProfile(true);
    // } catch (e) {
    //   setShowProfile(true);
    // }
    // For now, always show the profile when the page loads.
    setShowProfile(true);
  }, []);

  const handleClose = () => {
    // persistence disabled while testing; uncomment to re-enable
    // try {
    //   localStorage.setItem("companyProfileShown", "1");
    // } catch (e) {}
    setShowProfile(false);
  };

  return (
    <>
      <GLTFViewer />
    </>
  );
}
