import { info } from "@/configs/default";
import PWABadge from "@/PWABadge";

function Home() {
  return (
    <>
      <div className="fixed inset-0 transition-all duration-500 z-40">
        <iframe
          src={info.provider}
          className="w-full h-full border-0"
          allow="autoplay; encrypted-media; fullscreen"
        />
      </div>
      <PWABadge />
    </>
  );
}

export default Home;
