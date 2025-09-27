import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  useReducer,
} from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { info } from "@/configs/default";
import {
  BrushCleaning,
  Diff,
  Divide,
  Equal,
  Eraser,
  Minus,
  Percent,
  Plus,
  Trash,
  X,
} from "lucide-react";

interface CalculatorState {
  display: string;
  previousValue: number | null;
  operation: string | null;
  waitingForNewValue: boolean;
  expression: string;
  shouldResetDisplay: boolean;
}

type CalculatorAction =
  | { type: "INPUT_NUMBER"; payload: string }
  | { type: "INPUT_DECIMAL" }
  | { type: "CLEAR_ALL" }
  | { type: "CLEAR_ENTRY" }
  | { type: "TOGGLE_SIGN" }
  | { type: "INPUT_PERCENTAGE" }
  | { type: "BACKSPACE" }
  | { type: "SET_OPERATION"; payload: string }
  | { type: "CALCULATE" };

const initialState: CalculatorState = {
  display: "0",
  previousValue: null,
  operation: null,
  waitingForNewValue: false,
  expression: "",
  shouldResetDisplay: false,
};

const calculatorReducer = (
  state: CalculatorState,
  action: CalculatorAction
): CalculatorState => {
  switch (action.type) {
    case "INPUT_NUMBER":
      if (state.waitingForNewValue || state.shouldResetDisplay) {
        return {
          ...state,
          display: action.payload,
          waitingForNewValue: false,
          shouldResetDisplay: false,
          expression: state.operation
            ? `${state.display} ${state.operation} ${action.payload}`
            : action.payload,
        };
      }
      return {
        ...state,
        display:
          state.display === "0"
            ? action.payload
            : state.display + action.payload,
        expression: state.operation
          ? `${state.previousValue} ${state.operation} ${
              state.display === "0"
                ? action.payload
                : state.display + action.payload
            }`
          : state.display === "0"
          ? action.payload
          : state.display + action.payload,
      };

    case "INPUT_DECIMAL":
      if (state.waitingForNewValue || state.shouldResetDisplay) {
        return {
          ...state,
          display: "0.",
          waitingForNewValue: false,
          shouldResetDisplay: false,
        };
      }
      if (state.display.includes(".")) return state;
      return {
        ...state,
        display: state.display + ".",
      };

    case "CLEAR_ALL":
      return initialState;

    case "CLEAR_ENTRY":
      return {
        ...state,
        display: "0",
        shouldResetDisplay: false,
      };

    case "TOGGLE_SIGN":
      const newValue = parseFloat(state.display) * -1;
      return {
        ...state,
        display: newValue.toString(),
      };

    case "INPUT_PERCENTAGE":
      const currentValue = parseFloat(state.display);
      let percentageValue: number;

      if (state.operation && state.previousValue !== null) {
        // اگر عملیاتی در جریان است، درصد نسبت به مقدار قبلی محاسبه شود
        percentageValue = (state.previousValue * currentValue) / 100;
      } else {
        // در غیر این صورت درصد ساده
        percentageValue = currentValue / 100;
      }

      return {
        ...state,
        display: percentageValue.toString(),
        shouldResetDisplay: true,
      };

    case "BACKSPACE":
      if (
        state.display.length === 1 ||
        (state.display.length === 2 && state.display.startsWith("-"))
      ) {
        return {
          ...state,
          display: "0",
        };
      }
      return {
        ...state,
        display: state.display.slice(0, -1),
      };

    case "SET_OPERATION":
      if (
        state.operation &&
        state.previousValue !== null &&
        !state.waitingForNewValue
      ) {
        // اگر عملیات قبلی وجود دارد، ابتدا آن را محاسبه کن
        const currentInput = parseFloat(state.display);
        let result = calculateResult(
          state.previousValue,
          currentInput,
          state.operation
        );

        return {
          display: result.toString(),
          previousValue: result,
          operation: action.payload,
          waitingForNewValue: true,
          expression: `${result} ${action.payload}`,
          shouldResetDisplay: false,
        };
      }

      return {
        ...state,
        previousValue: parseFloat(state.display),
        operation: action.payload,
        waitingForNewValue: true,
        expression: state.expression
          ? `${state.expression} ${action.payload}`
          : `${state.display} ${action.payload}`,
        shouldResetDisplay: false,
      };

    case "CALCULATE":
      if (state.previousValue === null || !state.operation) return state;

      const currentInput = parseFloat(state.display);
      const result = calculateResult(
        state.previousValue,
        currentInput,
        state.operation
      );

      return {
        display: result.toString(),
        previousValue: result,
        operation: null,
        waitingForNewValue: true,
        expression: `${state.previousValue} ${state.operation} ${currentInput} = ${result}`,
        shouldResetDisplay: true,
      };

    default:
      return state;
  }
};

// تابع کمکی برای محاسبات
const calculateResult = (a: number, b: number, operation: string): number => {
  switch (operation) {
    case "+":
      return a + b;
    case "-":
      return a - b;
    case "×":
      return a * b;
    case "÷":
      if (b === 0) throw new Error("Division by zero");
      return a / b;
    default:
      return b;
  }
};

const SecurityCalculator: React.FC = () => {
  const [state, dispatch] = useReducer(calculatorReducer, initialState);
  const [iframeVisible, setIframeVisible] = useState(false);
  const [_, setSecurityBreach] = useState(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const inputSequenceRef = useRef<string[]>([]);

  // تعیین متن دکمه Clear (AC/CE)
  const clearButtonText = useMemo(() => {
    return state.display === "0" || state.shouldResetDisplay ? (
      <Trash className="scale-150" />
    ) : (
      <BrushCleaning className="scale-150" />
    );
  }, [state.display, state.shouldResetDisplay]);

  // تابع clear با منطق AC/CE
  const handleClear = useCallback(() => {
    if (state.display === "0" || state.shouldResetDisplay) {
      dispatch({ type: "CLEAR_ALL" });
    } else {
      dispatch({ type: "CLEAR_ENTRY" });
    }
    checkSecretCode("AC");
  }, [state.display, state.shouldResetDisplay]);

  const getFontSize = useCallback((numberStr: string): string => {
    const length = numberStr.replace(".", "").length;
    if (length <= 6) return "text-7xl";
    if (length <= 8) return "text-6xl";
    if (length <= 10) return "text-5xl";
    if (length <= 12) return "text-4xl";
    return "text-3xl";
  }, []);

  const fontSizeClass = useMemo(
    () => getFontSize(state.display),
    [state.display, getFontSize]
  );

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
      dispatch({ type: "CLEAR_ALL" });
    }
  }, []);

  const monitorSecurity = useCallback(() => {
    if (!iframeVisible) return;

    try {
      // روش بهبود یافته برای تشخیص dev tools
      const start = Date.now();
      console.log("Security Check");
      console.clear();
      const diff = Date.now() - start;

      const isDevToolsOpen = diff > 100;
      const widthDiff = window.outerWidth - window.innerWidth;
      const heightDiff = window.outerHeight - window.innerHeight;

      if (
        isDevToolsOpen ||
        widthDiff > 200 ||
        heightDiff > 200 ||
        document.hidden ||
        !navigator.onLine
      ) {
        setSecurityBreach(true);
        setIframeVisible(false);
      }
    } catch {
      setSecurityBreach(true);
      setIframeVisible(false);
    }
  }, [iframeVisible]);

  useEffect(() => {
    if (!iframeVisible) return;

    const handleSecurityEvent = (event: Event) => {
      if (event.type === "keydown" && (event as KeyboardEvent).key === "F12") {
        event.preventDefault();
        setSecurityBreach(true);
        setIframeVisible(false);
        return;
      }

      if (event.type === "contextmenu") {
        event.preventDefault();
        setSecurityBreach(true);
        setIframeVisible(false);
        return;
      }

      if (event.type === "resize" || event.type === "visibilitychange") {
        monitorSecurity();
      }
    };

    const events = ["resize", "visibilitychange", "keydown", "contextmenu"];
    events.forEach((event) => {
      window.addEventListener(event, handleSecurityEvent, { passive: false });
    });

    // چک دوره‌ای امنیت
    const interval = setInterval(monitorSecurity, 1000);

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleSecurityEvent);
      });
      clearInterval(interval);
    };
  }, [iframeVisible, monitorSecurity]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const key = e.key;

      if (
        [
          "0",
          "1",
          "2",
          "3",
          "4",
          "5",
          "6",
          "7",
          "8",
          "9",
          "+",
          "-",
          "*",
          "/",
          "=",
          "Enter",
          "Delete",
          "Backspace",
          ".",
        ].includes(key)
      ) {
        e.preventDefault();
      }

      switch (key) {
        case "0":
        case "1":
        case "2":
        case "3":
        case "4":
        case "5":
        case "6":
        case "7":
        case "8":
        case "9":
          dispatch({ type: "INPUT_NUMBER", payload: key });
          checkSecretCode(key);
          break;
        case "+":
          dispatch({ type: "SET_OPERATION", payload: "+" });
          checkSecretCode("+");
          break;
        case "-":
          dispatch({ type: "SET_OPERATION", payload: "-" });
          checkSecretCode("-");
          break;
        case "*":
          dispatch({ type: "SET_OPERATION", payload: "×" });
          checkSecretCode("×");
          break;
        case "/":
          dispatch({ type: "SET_OPERATION", payload: "÷" });
          checkSecretCode("÷");
          break;
        case "=":
        case "Enter":
          dispatch({ type: "CALCULATE" });
          checkSecretCode("=");
          break;
        case "Delete":
          handleClear();
          break;
        case "Backspace":
          dispatch({ type: "BACKSPACE" });
          break;
        case ".":
          dispatch({ type: "INPUT_DECIMAL" });
          checkSecretCode(".");
          break;
      }
    },
    [checkSecretCode, handleClear]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const handleBackgroundClick = useCallback(
    (e: React.MouseEvent) => {
      if (iframeVisible && e.target === e.currentTarget) {
        setIframeVisible(false);
        setSecurityBreach(false);
      }
    },
    [iframeVisible]
  );

  const inputNumber = useCallback(
    (num: string) => {
      dispatch({ type: "INPUT_NUMBER", payload: num });
      checkSecretCode(num);
    },
    [checkSecretCode]
  );

  const inputDecimal = useCallback(() => {
    dispatch({ type: "INPUT_DECIMAL" });
    checkSecretCode(".");
  }, [checkSecretCode]);

  const toggleSign = useCallback(() => {
    dispatch({ type: "TOGGLE_SIGN" });
    checkSecretCode("±");
  }, [checkSecretCode]);

  const inputPercentage = useCallback(() => {
    dispatch({ type: "INPUT_PERCENTAGE" });
    checkSecretCode("%");
  }, [checkSecretCode]);

  const performOperation = useCallback(
    (nextOperation: string) => {
      if (nextOperation === "=") {
        dispatch({ type: "CALCULATE" });
      } else {
        dispatch({ type: "SET_OPERATION", payload: nextOperation });
      }
      checkSecretCode(nextOperation);
    },
    [checkSecretCode]
  );

  const CalculatorButton = useMemo(
    () =>
      React.memo(
        ({
          children,
          onClick,
          variant = "default",
          className = "",
        }: {
          children: React.ReactNode;
          onClick: () => void;
          variant?: "default" | "operator" | "special";
          className?: string;
        }) => {
          const baseClasses =
            "h-[9vh] rounded-3xl md:rounded-4xl text-2xl md:text-3xl font-medium transition-all active:scale-95 cursor-pointer";

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
              variant="secondary"
              style={{
                height: "calc((100vh / 2.75) / 4)",
              }}
            >
              {children}
            </Button>
          );
        }
      ),
    []
  );

  const handleIframeLoad = useCallback(() => {
    if (iframeRef.current) {
      try {
        iframeRef.current.contentWindow?.postMessage(
          { action: "load", security: true, timestamp: Date.now() },
          "*"
        );
      } catch {
        // ignore cross-origin errors
      }
    }
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.action === "close") {
        setIframeVisible(false);
        setSecurityBreach(false);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return (
    <div
      className="fixed w-full bottom-0 flex flex-col items-center justify-end px-3.5 py-5"
      onClick={handleBackgroundClick}
    >
      <div
        className={`transition-all duration-300 w-full max-w-md ${
          iframeVisible
            ? "opacity-0 scale-95 pointer-events-none"
            : "opacity-100 scale-100"
        }`}
      >
        <Card className="w-full bg-transparent border-0 shadow-none mx-auto py-0">
          <CardContent className="p-0">
            <div className="h-40 flex flex-col items-end justify-end py-4 px-2">
              {state.expression && (
                <div className="text-gray-400 text-sm md:text-lg mb-2 truncate w-full text-right px-2">
                  {state.expression}
                </div>
              )}
              <div
                className={`text-white font-light tracking-tight px-2 ${fontSizeClass}`}
              >
                {state.display.length > 12
                  ? Number(state.display).toExponential(6)
                  : state.display}
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 md:gap-3 p-2 md:p-3">
              <CalculatorButton variant="special" onClick={handleClear}>
                {clearButtonText}
              </CalculatorButton>
              <CalculatorButton variant="special" onClick={toggleSign}>
                <Diff className="scale-150" />
              </CalculatorButton>
              <CalculatorButton variant="special" onClick={inputPercentage}>
                <Percent className="scale-150" />
              </CalculatorButton>
              <CalculatorButton
                variant="operator"
                onClick={() => performOperation("÷")}
              >
                <Divide className="scale-150" />
              </CalculatorButton>

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
                <X className="scale-150" />
              </CalculatorButton>

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
                <Minus className="scale-150" />
              </CalculatorButton>

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
                <Plus className="scale-150" />
              </CalculatorButton>

              <CalculatorButton
                variant="special"
                onClick={() => dispatch({ type: "BACKSPACE" })}
              >
                <Eraser className="scale-150" />
              </CalculatorButton>

              <CalculatorButton onClick={() => inputNumber("0")}>
                0
              </CalculatorButton>
              <CalculatorButton onClick={inputDecimal}>.</CalculatorButton>
              <CalculatorButton
                variant="operator"
                onClick={() => performOperation("=")}
              >
                <Equal className="scale-150" />
              </CalculatorButton>
            </div>
          </CardContent>
        </Card>
      </div>

      {iframeVisible && (
        <div className="fixed inset-0 z-40 bg-black">
          <div className="relative w-full h-full">
            <iframe
              ref={iframeRef}
              src={info.provider}
              className="w-full h-full border-0"
              allow="autoplay; encrypted-media; fullscreen"
              onLoad={handleIframeLoad}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default SecurityCalculator;
