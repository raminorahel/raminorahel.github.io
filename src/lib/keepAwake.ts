let wakeLock: WakeLockSentinel | null = null;

export async function enableWakeLock(): Promise<void> {
  try {
    // Check if the Wake Lock API is supported
    if (!("wakeLock" in navigator)) {
      console.warn("Screen Wake Lock API not supported");
      return;
    }

    // Request a screen wake lock
    wakeLock = await navigator.wakeLock.request("screen");

    // Listen for release event
    wakeLock.addEventListener("release", () => {
      console.log("Screen Wake Lock released:", wakeLock?.released);
    });

    console.log("Screen Wake Lock enabled");
  } catch (err) {
    console.error(`Error enabling wake lock: ${(err as Error).message}`);
  }
}

export function disableWakeLock(): void {
  if (wakeLock) {
    wakeLock.release();
    wakeLock = null;
    console.log("Screen Wake Lock disabled");
  }
}

// Reacquire wake lock when page becomes visible again
if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", async () => {
    if (wakeLock && document.visibilityState === "visible") {
      await enableWakeLock();
    }
  });
}
