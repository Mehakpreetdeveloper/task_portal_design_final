interface CalculatorDisplayProps {
  value: string;
}

export const CalculatorDisplay = ({ value }: CalculatorDisplayProps) => {
  return (
    <div className="bg-calculator-display/60 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
      <div className="text-right">
        <div className="text-4xl font-light text-foreground min-h-[3rem] flex items-center justify-end">
          {value}
        </div>
      </div>
    </div>
  );
};