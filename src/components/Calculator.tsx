import { useState } from "react";
import { CalculatorButton } from "./CalculatorButton";
import { CalculatorDisplay } from "./CalculatorDisplay";

export const Calculator = () => {
  const [display, setDisplay] = useState("0");
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  const inputNumber = (num: string) => {
    if (waitingForOperand) {
      setDisplay(num);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === "0" ? num : display + num);
    }
  };

  const inputDecimal = () => {
    if (waitingForOperand) {
      setDisplay("0.");
      setWaitingForOperand(false);
    } else if (display.indexOf(".") === -1) {
      setDisplay(display + ".");
    }
  };

  const clear = () => {
    setDisplay("0");
    setPreviousValue(null);
    setOperation(null);
    setWaitingForOperand(false);
  };

  const performOperation = (nextOperation: string) => {
    const inputValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(inputValue);
    } else if (operation) {
      const currentValue = previousValue || 0;
      let result = 0;

      switch (operation) {
        case "+":
          result = currentValue + inputValue;
          break;
        case "-":
          result = currentValue - inputValue;
          break;
        case "×":
          result = currentValue * inputValue;
          break;
        case "÷":
          result = currentValue / inputValue;
          break;
        default:
          return;
      }

      setPreviousValue(result);
      setDisplay(String(result));
    }

    setWaitingForOperand(true);
    setOperation(nextOperation);
  };

  const calculate = () => {
    performOperation("=");
    setOperation(null);
    setPreviousValue(null);
    setWaitingForOperand(true);
  };

  return (
    <div className="bg-gradient-glass backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl">
      <CalculatorDisplay value={display} />
      
      <div className="grid grid-cols-4 gap-3 mt-6">
        {/* Row 1 */}
        <CalculatorButton variant="secondary" onClick={clear}>
          AC
        </CalculatorButton>
        <CalculatorButton variant="secondary" onClick={() => {}}>
          ±
        </CalculatorButton>
        <CalculatorButton variant="secondary" onClick={() => {}}>
          %
        </CalculatorButton>
        <CalculatorButton variant="accent" onClick={() => performOperation("÷")}>
          ÷
        </CalculatorButton>

        {/* Row 2 */}
        <CalculatorButton onClick={() => inputNumber("7")}>7</CalculatorButton>
        <CalculatorButton onClick={() => inputNumber("8")}>8</CalculatorButton>
        <CalculatorButton onClick={() => inputNumber("9")}>9</CalculatorButton>
        <CalculatorButton variant="accent" onClick={() => performOperation("×")}>
          ×
        </CalculatorButton>

        {/* Row 3 */}
        <CalculatorButton onClick={() => inputNumber("4")}>4</CalculatorButton>
        <CalculatorButton onClick={() => inputNumber("5")}>5</CalculatorButton>
        <CalculatorButton onClick={() => inputNumber("6")}>6</CalculatorButton>
        <CalculatorButton variant="accent" onClick={() => performOperation("-")}>
          −
        </CalculatorButton>

        {/* Row 4 */}
        <CalculatorButton onClick={() => inputNumber("1")}>1</CalculatorButton>
        <CalculatorButton onClick={() => inputNumber("2")}>2</CalculatorButton>
        <CalculatorButton onClick={() => inputNumber("3")}>3</CalculatorButton>
        <CalculatorButton variant="accent" onClick={() => performOperation("+")}>
          +
        </CalculatorButton>

        {/* Row 5 */}
        <CalculatorButton className="col-span-2" onClick={() => inputNumber("0")}>
          0
        </CalculatorButton>
        <CalculatorButton onClick={inputDecimal}>.</CalculatorButton>
        <CalculatorButton variant="primary" onClick={calculate}>
          =
        </CalculatorButton>
      </div>
    </div>
  );
};