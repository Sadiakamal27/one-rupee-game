import Image from "next/image";
import { Milestone } from "@/types/database";
import { Trophy } from "lucide-react";

// Image mapping configuration (fallback when no image_url in Supabase)
const PLAN_IMAGES: Record<string, string> = {
    'iphone': '/iphone17.webp',
    'phone': '/phone.png',
    'trip': '/trip.jpg',
    'cash': '/cash.png',
    'money': '/cash.png',
    'bike': '/bike.jpg',
    'motorcycle': '/bike.jpg',
    'car': '/car.jpg',
    'laptop': '/laptop.jpg',
    'macbook': '/laptop.jpg',
    'camera': '/smallcamera.jpg',
    '17 pro max': '/iphone17.webp',
    'pro max': '/iphone17.webp',
    'default': '/globe.svg'
};

const getPlanImage = (title: string) => {
    const lowerTitle = title.toLowerCase();
    // Check for keyword inclusion
    for (const [key, path] of Object.entries(PLAN_IMAGES)) {
        if (key !== 'default' && lowerTitle.includes(key)) {
            return path;
        }
    }
    return PLAN_IMAGES['default'];
};

interface ProgressBarProps {
    planId: number;
    goalAmount: number;
    progress: number;
    milestones: Milestone[];
    formatPKR: (amount: number) => string;
    participantCount: number;
}

export default function ProgressBar({
    planId,
    goalAmount,
    progress,
    milestones,
    formatPKR,
    participantCount
}: ProgressBarProps) {
    // Sort milestones by amount (ascending) to display from left to right
    const sortedMilestones = [...milestones].sort((a, b) => a.amount - b.amount);

    // Use UNIFORM spacing for visual consistency across all plans
    // Dynamically calculate positions based on number of milestones
    // Stop at 85% to leave room for trophy at the end
    const getUniformPositions = (count: number) => {
        if (count === 0) return [];
        if (count === 1) return [50];
        if (count === 2) return [25, 65];
        if (count === 3) return [20, 50, 75];
        if (count === 4) return [15, 40, 60, 80];

        // For 5+ milestones, distribute evenly between 15% and 80%
        const positions: number[] = [];
        const minPos = 15;
        const maxPos = 80;
        const spacing = (maxPos - minPos) / (count - 1);

        for (let i = 0; i < count; i++) {
            positions.push(minPos + (spacing * i));
        }

        return positions;
    };

    const uniformPercents = getUniformPositions(sortedMilestones.length);

    // Interpolate visual progress to match uniform milestone positions
    const getVisualProgress = (currentProgress: number) => {
        if (goalAmount <= 0) return 0;
        const points = [{ log: 0, vis: 0 }];
        sortedMilestones.forEach((m, i) => {
            points.push({ log: (m.amount / goalAmount) * 100, vis: uniformPercents[i] });
        });
        points.push({ log: 100, vis: 100 });
        points.sort((a, b) => a.log - b.log);

        for (let i = 0; i < points.length - 1; i++) {
            const start = points[i];
            const end = points[i + 1];
            if (currentProgress >= start.log && currentProgress <= end.log) {
                if (end.log === start.log) return start.vis;
                const ratio = (currentProgress - start.log) / (end.log - start.log);
                return start.vis + (ratio * (end.vis - start.vis));
            }
        }
        return currentProgress >= 100 ? 100 : 0;
    };

    const visualProgress = getVisualProgress(Math.max(progress, 0));

    return (
        <div className="w-full mb-8 px-2">
            {/* Participant Count Badge - Overlapping Header */}
            <div className="flex justify-center -mt-12 mb-8 relative z-10">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-gray-300 shadow-md">
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Participants</span>
                    <span className="text-base font-semibold text-gray-900">{participantCount}</span>
                </div>
            </div>

            <div className="relative h-24 pr-16">
                {/* Horizontal Bar Container */}
                <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-4 bg-gray-100 border border-gray-300 rounded-full overflow-hidden shadow-inner">
                    <div
                        className="absolute top-0 left-0 bottom-0 overflow-hidden rounded-r-full rounded-l-none"
                        style={{
                            width: `${visualProgress}%`,
                            minWidth: progress > 0 ? '2px' : '0px',
                            transition: 'width 600ms ease-in-out',
                            backgroundImage: `
              repeating-linear-gradient(
                45deg,
                #f7c948 0%,
                #f7c948 10px,
                #e0ac00 10px,
                #e0ac00 20px
              )
            `,
                            backgroundSize: '28px 28px',
                            boxShadow:
                                'inset 0 2px 4px rgba(255,255,255,0.3), inset 0 -2px 4px rgba(0,0,0,0.4), 0 0 10px rgba(255,200,0,0.4)',
                            animation: 'progressMove 1s linear infinite',
                        }}
                    >
                        {/* Shimmer effect */}
                        <div
                            className="absolute inset-0"
                            style={{
                                background:
                                    'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
                                width: '50%',
                                transform: 'skewX(-20deg)',
                                animation: 'shimmer 2s infinite',
                            }}
                        ></div>
                    </div>
                </div>

                {/* Milestones */}
                <div className="absolute inset-0 pointer-events-none">
                    {sortedMilestones.map((milestone, i) => {
                        const position = uniformPercents[i];
                        // Use Supabase image_url if available, otherwise fall back to keyword matching
                        const imageSrc = milestone.image_url || getPlanImage(milestone.reward_name);
                        const isCompleted = progress >= (milestone.amount / goalAmount) * 100;

                        return (
                            <div
                                key={`milestone-${planId}-${milestone.id}`}
                                className="absolute h-full flex flex-col items-center justify-center"
                                style={{
                                    left: `${position}%`,
                                    transform: 'translateX(-50%)'
                                }}
                            >
                                {/* Top: Image Callout */}
                                <div className="absolute bottom-[calc(50%+12px)] flex flex-col items-center mb-1">
                                    <div className={`relative bg-white border-2 ${isCompleted ? 'border-green-500' : 'border-gray-200'} rounded-lg p-1 shadow-sm w-10 h-10 flex items-center justify-center transition-colors duration-300`}>
                                        <div className="relative w-full h-full">
                                            <Image
                                                src={imageSrc}
                                                alt={milestone.reward_name}
                                                fill
                                                className="object-contain"
                                            />
                                        </div>
                                        {/* Connector triangle pointing down */}
                                        <div className={`absolute bottom-[-5px] left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-white border-b-2 border-r-2 ${isCompleted ? 'border-green-500' : 'border-gray-200'} rotate-45`}></div>
                                    </div>
                                </div>

                                {/* Middle: Dot on the bar */}
                                {(() => {
                                    if (isCompleted) console.log(`Milestone ${milestone.reward_name} completed!`, { progress, req: (milestone.amount / goalAmount) * 100 });
                                    return (
                                        <div
                                            className={`z-10 w-3 h-3 rounded-full border-2 ${isCompleted ? 'border-green-400 shadow-[0_0_8px_rgba(74,222,128,1)]' : 'bg-gray-200 border-gray-400 shadow-sm'} transition-colors duration-300`}
                                            style={{ backgroundColor: isCompleted ? '#4ade80' : '' }}
                                        ></div>
                                    );
                                })()}

                                {/* Bottom: Text Label */}
                                <div className="absolute top-[calc(50%+12px)] flex flex-col items-center mt-1">
                                    <div className="text-[10px] text-gray-800 font-semibold text-center bg-white/80 px-1 rounded leading-tight whitespace-nowrap">
                                        {milestone.reward_name}
                                    </div>
                                    {milestone.price > 0 && (
                                        <div className="text-[9px] text-green-600 font-bold text-center bg-white/80 px-1 rounded leading-tight whitespace-nowrap mt-0.5">
                                            {formatPKR(milestone.price)}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {/* Trophy at the end - Final Reward */}
                    <div
                        className="absolute h-full flex flex-col items-center justify-center"
                        style={{
                            left: '98%',
                            transform: 'translateX(-50%)'
                        }}
                    >
                        {/* Top: Trophy Icon */}
                        <div className="absolute bottom-[calc(50%+12px)] flex flex-col items-center mb-1">
                            <div className={`relative bg-white border-2 ${progress >= 100 ? 'border-yellow-500' : 'border-gray-300'} rounded-lg p-2 shadow-md w-14 h-14 flex items-center justify-center transition-all duration-300`}>
                                <Trophy className="w-8 h-8 fill-yellow-500 text-yellow-600" strokeWidth={2} />
                                {/* Connector triangle pointing down */}
                                <div className={`absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-b-2 border-r-2 ${progress >= 100 ? 'border-yellow-500' : 'border-gray-300'} rotate-45`}></div>
                            </div>
                        </div>

                        {/* Middle: Dot on the bar */}
                        <div className={`z-10 w-4 h-4 rounded-full border-2 ${progress >= 100 ? 'bg-yellow-500 border-white' : 'bg-gray-200 border-gray-400'} shadow-sm transition-colors duration-300`}></div>

                        {/* Bottom: Label */}
                        <div className="absolute top-[calc(50%+12px)] flex flex-col items-center mt-1">
                            <div className="text-xs text-gray-800 font-bold text-center bg-white/80 px-1 rounded leading-tight whitespace-nowrap">
                                {formatPKR(goalAmount)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes progressMove {
                    0% { background-position: 0 0; }
                    100% { background-position: 28px 0; }
                }
                @keyframes shimmer {
                    0% { left: -50%; }
                    100% { left: 150%; }
                }
            `}</style>
        </div>
    );
}
