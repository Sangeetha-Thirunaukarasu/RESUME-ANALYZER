interface CircularScoreProps {
  score: number;
}

export default function CircularScore({ score }: CircularScoreProps) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * score) / 100;

  // Dynamically calculate tailwind text and stroke color properties based on score
  const getColorClass = (val: number) => {
    if (val >= 80) return "stroke-emerald-500 text-emerald-400";
    if (val >= 50) return "stroke-amber-500 text-amber-400";
    return "stroke-rose-500 text-rose-400";
  };

  return (
    <div className="flex items-center space-x-6 border-b border-slate-800/60 pb-5">
      <div className="relative flex items-center justify-center w-24 h-24 flex-shrink-0">
        <svg className="w-full h-full transform -rotate-90">
          {/* Background Rail */}
          <circle cx="48" cy="48" r={radius} stroke="#1e293b" strokeWidth="8" fill="transparent" />
          {/* Animated Value Rail */}
          <circle
            cx="48"
            cy="48"
            r={radius}
            strokeWidth="8"
            fill="transparent"
            strokeLinecap="round"
            className={`transition-all duration-1000 ease-out ${getColorClass(score)}`}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
          />
        </svg>
        <span className={`absolute text-xl font-black ${getColorClass(score).split(" ")[1]}`}>
          {score}%
        </span>
      </div>
      <div>
        <h3 className="text-lg font-bold text-white tracking-tight">Applicant Tracking System (ATS) Score</h3>
        <p className="text-xs text-slate-400 mt-0.5">Calculated based on how accurately your experience matches the core job requirements.</p>
      </div>
    </div>
  );
}