import React, { useState, useEffect, useRef } from "react";
import "@/styles/for-love.css";

interface ForLoveProps {
  multicolor?: boolean;
  scrollWithWindow?: boolean;
  amount?: number;
  contained?: boolean;
  children?: React.ReactNode;
}

const ForLove: React.FC<ForLoveProps> = ({
  multicolor = false,
  scrollWithWindow = false,
  amount = 10,
  contained = false,
  children,
}) => {
  const [hearts, setHearts] = useState<React.ReactElement[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const maxAmount = 400;

  useEffect(() => {
    const validatedAmount = Math.min(amount, maxAmount);

    const newHearts = Array(validatedAmount)
      .fill(null)
      .map((_, index) => {
        const randomNumberLeft = Math.floor(Math.random() * 101);
        const randomNumberDelay = Math.floor(Math.random() * 101);
        const colors = ["#4285F4", "#DB4437", "#F4B400", "#0F9D58"];
        const color = multicolor
          ? colors[Math.floor(Math.random() * colors.length)]
          : "#F8C8DC";

        return (
          <div
            key={index}
            className="heart"
            style={
              {
                "--left": `${randomNumberLeft}%`,
                "--delay": `${randomNumberDelay}`,
                "--_color": color,
              } as React.CSSProperties
            }
          />
        );
      });

    setHearts(newHearts);
  }, [amount, multicolor]);

  return (
    <div className={`for-love-container ${contained ? "contained" : ""}`}>
      {children}
      <div
        ref={containerRef}
        className={`for-love-hearts ${
          scrollWithWindow ? "scroll-with-window" : ""
        }`}
      >
        {hearts}
      </div>
    </div>
  );
};

export default ForLove;
