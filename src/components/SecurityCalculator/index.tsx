import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { info } from "@/configs/default";

interface CalculatorState {
  display: string;
  previousValue: number | null;
  operation: string | null;
  waitingForNewValue: boolean;
}

const SecurityCalculator: React.FC = () => {
  const [state, setState] = useState<CalculatorState>({
    display: "0",
    previousValue: null,
    operation: null,
    waitingForNewValue: false,
  });

  const [iframeVisible, setIframeVisible] = useState(false);
  const [_, setSecurityBreach] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const inputSequenceRef = useRef<string[]>([]);
  const securityCheckRef = useRef<NodeJS.Timeout>(null);

  // Secret code detection
  const checkSecretCode = useCallback((input: string) => {
    inputSequenceRef.current.push(input);
    if (inputSequenceRef.current.length > 6) {
      inputSequenceRef.current.shift();
    }

    const sequence = inputSequenceRef.current.join("");
    if (sequence === "1666+=") {
      setIframeVisible(true);
      setSecurityBreach(false);
      inputSequenceRef.current = [];
    }
  }, []);

  // Security monitoring
  const monitorSecurity = useCallback(() => {
    // Check if devtools is open
    const checkDevTools = () => {
      const widthThreshold = window.outerWidth - window.innerWidth > 160;
      const heightThreshold = window.outerHeight - window.innerHeight > 160;
      return widthThreshold || heightThreshold;
    };

    // Check if tab is active
    const checkTabActive = () => !document.hidden;

    // Check if online
    const checkOnline = () => navigator.onLine;

    // Check for screenshot/recording attempts
    const checkScreenRecording = () => {
      // Detect common screen recording patterns
      if (window.screenTop < 0 || window.screenLeft < 0) {
        return false;
      }
      return true;
    };

    const isSecure =
      !checkDevTools() &&
      checkTabActive() &&
      checkOnline() &&
      checkScreenRecording();

    if (!isSecure && iframeVisible) {
      setSecurityBreach(true);
      setIframeVisible(false);

      // Mute and pause iframe content if possible
      if (iframeRef.current) {
        try {
          iframeRef.current.contentWindow?.postMessage(
            {
              action: "pause",
              mute: true,
            },
            "*"
          );
        } catch (error) {
          // Cross-origin restriction, can't control iframe content directly
        }
      }
    }
  }, [iframeVisible]);

  // Security event listeners
  useEffect(() => {
    const events = [
      "online",
      "offline",
      "resize",
      "visibilitychange",
      "blur",
      "focus",
      "contextmenu",
      "keydown",
    ];

    const handleSecurityEvent = () => {
      if (iframeVisible) {
        monitorSecurity();
      }
    };

    events.forEach((event) => {
      window.addEventListener(event, handleSecurityEvent);
    });

    // Continuous security monitoring
    securityCheckRef.current = setInterval(monitorSecurity, 1000);

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleSecurityEvent);
      });
      if (securityCheckRef.current) {
        clearInterval(securityCheckRef.current);
      }
    };
  }, [iframeVisible, monitorSecurity]);

  // Calculator functions
  const inputNumber = (num: string) => {
    checkSecretCode(num);

    if (state.waitingForNewValue) {
      setState({
        ...state,
        display: num,
        waitingForNewValue: false,
      });
    } else {
      setState({
        ...state,
        display: state.display === "0" ? num : state.display + num,
      });
    }
  };

  const inputDecimal = () => {
    checkSecretCode(".");

    if (state.waitingForNewValue) {
      setState({
        ...state,
        display: "0.",
        waitingForNewValue: false,
      });
    } else if (state.display.indexOf(".") === -1) {
      setState({
        ...state,
        display: state.display + ".",
      });
    }
  };

  const clearDisplay = () => {
    checkSecretCode("AC");
    setState({
      display: "0",
      previousValue: null,
      operation: null,
      waitingForNewValue: false,
    });
  };

  const toggleSign = () => {
    checkSecretCode("±");
    setState({
      ...state,
      display: (parseFloat(state.display) * -1).toString(),
    });
  };

  const inputPercentage = () => {
    checkSecretCode("%");
    const value = parseFloat(state.display) / 100;
    setState({
      ...state,
      display: value.toString(),
    });
  };

  const performOperation = (nextOperation: string) => {
    checkSecretCode(nextOperation);

    const inputValue = parseFloat(state.display);

    if (state.previousValue === null) {
      setState({
        ...state,
        previousValue: inputValue,
        operation: nextOperation,
        waitingForNewValue: true,
      });
    } else if (state.operation) {
      const currentValue = state.previousValue || 0;
      let newValue = 0;

      switch (state.operation) {
        case "+":
          newValue = currentValue + inputValue;
          break;
        case "-":
          newValue = currentValue - inputValue;
          break;
        case "×":
          newValue = currentValue * inputValue;
          break;
        case "÷":
          newValue = currentValue / inputValue;
          break;
        default:
          newValue = inputValue;
      }

      setState({
        display: String(newValue),
        previousValue: nextOperation === "=" ? null : newValue,
        operation: nextOperation === "=" ? null : nextOperation,
        waitingForNewValue: nextOperation === "=" ? false : true,
      });
    }
  };

  // Button components for consistent styling
  const CalculatorButton: React.FC<{
    children: React.ReactNode;
    onClick: () => void;
    variant?: "default" | "operator" | "special";
    className?: string;
  }> = ({ children, onClick, variant = "default", className = "" }) => {
    const baseClasses =
      "h-16 rounded-full text-2xl font-medium transition-all active:scale-95";

    const variantClasses = {
      default: "bg-gray-500 hover:bg-gray-400 text-white",
      operator: "bg-orange-500 hover:bg-orange-400 text-white",
      special: "bg-gray-300 hover:bg-gray-200 text-black",
    };

    return (
      <Button
        className={`${baseClasses} ${variantClasses[variant]} ${className}`}
        onClick={onClick}
        size="lg"
      >
        {children}
      </Button>
    );
  };

  // Iframe content management
  const handleIframeLoad = () => {
    // Send initial message to iframe content if needed
    if (iframeRef.current) {
      try {
        iframeRef.current.contentWindow?.postMessage(
          {
            action: "load",
            security: true,
          },
          "*"
        );
      } catch (error) {
        // Cross-origin restriction
      }
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative">
      {/* Calculator */}
      <div
        className={`transition-all duration-300 ${
          iframeVisible
            ? "opacity-0 scale-95 pointer-events-none"
            : "opacity-100 scale-100"
        }`}
      >
        <Card className="w-80 bg-transparent border-0 shadow-none">
          <CardContent className="p-0">
            {/* Display */}
            <div className="h-32 flex items-end justify-end p-4">
              <div className="text-white text-7xl font-light tracking-tight">
                {state.display.length > 9
                  ? Number(state.display).toExponential(6)
                  : state.display}
              </div>
            </div>

            {/* Buttons Grid */}
            <div className="grid grid-cols-4 gap-3 p-3">
              {/* Row 1 */}
              <CalculatorButton variant="special" onClick={clearDisplay}>
                {state.display === "0" ? "AC" : "C"}
              </CalculatorButton>
              <CalculatorButton variant="special" onClick={toggleSign}>
                ±
              </CalculatorButton>
              <CalculatorButton variant="special" onClick={inputPercentage}>
                %
              </CalculatorButton>
              <CalculatorButton
                variant="operator"
                onClick={() => performOperation("÷")}
              >
                ÷
              </CalculatorButton>

              {/* Row 2 */}
              <CalculatorButton onClick={() => inputNumber("7")}>
                7
              </CalculatorButton>
              <CalculatorButton onClick={() => inputNumber("8")}>
                8
              </CalculatorButton>
              <CalculatorButton onClick={() => inputNumber("9")}>
                9
              </CalculatorButton>
              <CalculatorButton
                variant="operator"
                onClick={() => performOperation("×")}
              >
                ×
              </CalculatorButton>

              {/* Row 3 */}
              <CalculatorButton onClick={() => inputNumber("4")}>
                4
              </CalculatorButton>
              <CalculatorButton onClick={() => inputNumber("5")}>
                5
              </CalculatorButton>
              <CalculatorButton onClick={() => inputNumber("6")}>
                6
              </CalculatorButton>
              <CalculatorButton
                variant="operator"
                onClick={() => performOperation("-")}
              >
                –
              </CalculatorButton>

              {/* Row 4 */}
              <CalculatorButton onClick={() => inputNumber("1")}>
                1
              </CalculatorButton>
              <CalculatorButton onClick={() => inputNumber("2")}>
                2
              </CalculatorButton>
              <CalculatorButton onClick={() => inputNumber("3")}>
                3
              </CalculatorButton>
              <CalculatorButton
                variant="operator"
                onClick={() => performOperation("+")}
              >
                +
              </CalculatorButton>

              {/* Row 5 */}
              <CalculatorButton
                onClick={() => inputNumber("0")}
                className="col-span-2 !rounded-[32px] !justify-start pl-6"
              >
                0
              </CalculatorButton>
              <CalculatorButton onClick={inputDecimal}>.</CalculatorButton>
              <CalculatorButton
                variant="operator"
                onClick={() => performOperation("=")}
              >
                =
              </CalculatorButton>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Iframe Overlay */}
      <div
        className={`fixed inset-0 transition-all duration-500 z-40 ${
          iframeVisible ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
      >
        <iframe
          ref={iframeRef}
          src={info.provider}
          className="w-full h-full border-0"
          allow="autoplay; encrypted-media; fullscreen"
          onLoad={handleIframeLoad}
        />
      </div>
    </div>
  );
};

export default SecurityCalculator;
