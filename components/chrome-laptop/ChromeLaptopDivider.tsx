"use client";

import { useEffect, useState } from "react";
import ModelViewer from "@/components/ModelViewer";

export function ChromeLaptopDivider({ reserveCtaSpace = false }: { reserveCtaSpace?: boolean }) {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const desktopQuery = window.matchMedia("(min-width: 1024px)");
    const updateDesktop = () => setIsDesktop(desktopQuery.matches);
    updateDesktop();
    desktopQuery.addEventListener("change", updateDesktop);
    return () => desktopQuery.removeEventListener("change", updateDesktop);
  }, []);

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-x-0 z-10 flex w-full -translate-y-[8%] justify-center lg:pointer-events-auto lg:bottom-auto lg:top-1/2 lg:-mt-16 lg:-translate-y-1/2 ${reserveCtaSpace ? "bottom-[176px] md:bottom-[174px]" : "bottom-0"}`}
    >
      <div className="aspect-square w-[min(100vw,560px)] lg:w-[600px]">
        <ModelViewer
          url="/models/laptop-liquid-chrome.glb"
          width="100%"
          height="100%"
          environment="studio"
          environmentIntensity={1.35}
          exposure={1.2}
          autoRotate
          autoRotateSpeed={0.18}
          autoRotateDelay={0}
          dragRotate
          turntable
          zoom={false}
          hoverTilt={0}
          float={0}
          shadow
          shadowOpacity={0.35}
          intro="none"
          startAngle={isDesktop ? 60 : -20}
          tilt={8}
          fit={1.05}
          className="h-full w-full"
        />
      </div>
    </div>
  );
}
