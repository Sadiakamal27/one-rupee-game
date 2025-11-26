import Image from "next/image";
import { Milestone } from "@/types/database";

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
}

export default function ProgressBar({
    planId,
    goalAmount,
    progress,
    milestones,
    formatPKR
}: ProgressBarProps) {
    // Sort milestones by amount (ascending) to display from left to right
    const sortedMilestones = [...milestones].sort((a, b) => a.amount - b.amount);

    // Use UNIFORM spacing for visual consistency across all plans
    // Dynamically calculate positions based on number of milestones
    const getUniformPositions = (count: number) => {
        if (count === 0) return [];
        if (count === 1) return [50];
        if (count === 2) return [30, 80];
        if (count === 3) return [25, 50, 85];
        if (count === 4) return [20, 45, 70, 90];

        // For 5+ milestones, distribute evenly between 15% and 90%
        const positions: number[] = [];
        const minPos = 15;
        const maxPos = 90;
        const spacing = (maxPos - minPos) / (count - 1);

        for (let i = 0; i < count; i++) {
            positions.push(minPos + (spacing * i));
        }

        return positions;
    };

    const uniformPercents = getUniformPositions(sortedMilestones.length);

    return (
        <div className="w-full mb-8 px-2">
            {/* Premium Goal Badge - Green Theme - Centered Above */}
            <div className="mb-8 flex justify-center">
                <div className="relative inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-gradient-to-r from-green-500 via-emerald-500 to-green-500 shadow-lg">
                    {/* Glow effect */}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-green-500 via-emerald-500 to-green-500 blur-md opacity-50"></div>

                    {/* Content */}
                    <div className="relative flex items-center gap-1.5">
                        <div className="text-center">
                            <span className="text-[9px] font-semibold text-green-900 uppercase tracking-wide mr-2">Goal</span>
                            <span className="text-sm font-bold text-white">{formatPKR(goalAmount)}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="relative h-24">
                {/* Horizontal Bar Container */}
                <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-4 bg-gray-100 border border-gray-300 rounded-full overflow-hidden shadow-inner">
                    <div
                        className="absolute top-0 left-0 bottom-0 overflow-hidden rounded-r-full rounded-l-none"
                        style={{
                            width: `${Math.max(progress, 0)}%`,
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
                                <div className={`z-10 w-3 h-3 rounded-full border-2 ${isCompleted ? 'bg-green-500 border-white' : 'bg-gray-200 border-gray-400'} shadow-sm transition-colors duration-300`}></div>

                                {/* Bottom: Text Label */}
                                <div className="absolute top-[calc(50%+12px)] flex flex-col items-center mt-1">
                                    <div className="text-[10px] text-gray-800 font-semibold text-center bg-white/80 px-1 rounded leading-tight whitespace-nowrap">
                                        {milestone.reward_name}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
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
