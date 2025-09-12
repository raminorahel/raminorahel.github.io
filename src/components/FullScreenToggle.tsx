// src/components/FullScreenToggle.tsx
import React, { useState, useEffect } from "react";
import { Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FullScreenToggleProps {
  className?: string;
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

export const FullScreenToggle: React.FC<FullScreenToggleProps> = ({
  className = "",
  variant = "outline",
  size = "icon",
}) => {
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Check if fullscreen is supported
  const isFullScreenSupported = () => {
    return (
      document.fullscreenEnabled ||
      (document as any).webkitFullscreenEnabled ||
      (document as any).mozFullScreenEnabled ||
      (document as any).msFullscreenEnabled
    );
  };

  // Toggle fullscreen mode
  const toggleFullScreen = async () => {
    if (!isFullScreenSupported()) {
      console.warn("Fullscreen is not supported in this browser");
      return;
    }

    try {
      if (!document.fullscreenElement) {
        // Enter fullscreen
        const element = document.documentElement;
        if (element.requestFullscreen) {
          await element.requestFullscreen();
        } else if ((element as any).webkitRequestFullscreen) {
          await (element as any).webkitRequestFullscreen();
        } else if ((element as any).mozRequestFullScreen) {
          await (element as any).mozRequestFullScreen();
        } else if ((element as any).msRequestFullscreen) {
          await (element as any).msRequestFullscreen();
        }
      } else {
        // Exit fullscreen
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        } else if ((document as any).mozCancelFullScreen) {
          await (document as any).mozCancelFullScreen();
        } else if ((document as any).msExitFullscreen) {
          await (document as any).msExitFullscreen();
        }
      }
    } catch (error) {
      console.error("Error toggling fullscreen:", error);
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullScreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullScreenChange);
    document.addEventListener("mozfullscreenchange", handleFullScreenChange);
    document.addEventListener("MSFullscreenChange", handleFullScreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullScreenChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullScreenChange
      );
      document.removeEventListener(
        "mozfullscreenchange",
        handleFullScreenChange
      );
      document.removeEventListener(
        "MSFullscreenChange",
        handleFullScreenChange
      );
    };
  }, []);

  // Check initial fullscreen state
  useEffect(() => {
    setIsFullScreen(!!document.fullscreenElement);
  }, []);

  if (!isFullScreenSupported()) {
    return null; // Don't render if fullscreen isn't supported
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={toggleFullScreen}
      className={"cursor-pointer" + className}
      aria-label={isFullScreen ? "Exit fullscreen" : "Enter fullscreen"}
      title={isFullScreen ? "Exit fullscreen" : "Enter fullscreen"}
    >
      {isFullScreen ? (
        <Minimize2 className="h-4 w-4" />
      ) : (
        <Maximize2 className="h-4 w-4" />
      )}
    </Button>
  );
};

export default FullScreenToggle;
