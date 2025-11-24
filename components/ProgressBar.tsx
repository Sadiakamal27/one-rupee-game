"use client";

import Image from "next/image";

// Image mapping configuration
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
    uniformLabels: string[];
    uniformPercents: number[];
    formatPKR: (amount: number) => string;
}

export default function ProgressBar({
    planId,
    goalAmount,
    progress,
    uniformLabels,
    uniformPercents,
    formatPKR
}: ProgressBarProps) {
    return (
        <div className="flex justify-center mb-6">
            <div className="w-36 sm:w-40 relative overflow-hidden">
                {/* Premium Goal Badge - Green Theme */}
                <div className="mb-3 flex justify-center">
                    <div className="relative inline-flex items-center justify-center px-4 py-2 rounded-full bg-gradient-to-r from-green-500 via-emerald-500 to-green-500 shadow-lg">
                        {/* Glow effect */}
                        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-green-500 via-emerald-500 to-green-500 blur-md opacity-50"></div>

                        {/* Content */}
                        <div className="relative flex items-center gap-1.5">
                            <span className="text-green-100 text-lg"></span>
                            <div className="text-center">
                                <div className="text-[9px] font-semibold text-green-900 uppercase tracking-wide">Goal</div>
                                <div className="text-sm font-bold text-white">{formatPKR(goalAmount)}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="relative h-56 sm:h-64">
                    {/* Tube container with clipped fill */}
                    <div className="absolute inset-0 mx-auto w-12 sm:w-14 bg-gray-100 border-2 border-gray-300 rounded-full overflow-hidden shadow-inner">
                        <div
                            className="absolute bottom-0 left-0 right-0 overflow-hidden rounded-b-full rounded-t-none"
                            style={{
                                height: `${Math.max(progress, 0)}%`,
                                minHeight: progress > 0 ? '2px' : '0px',
                                transition: 'height 600ms ease-in-out',
                                backgroundImage: `
                  repeating-linear-gradient(
                    0deg,
                    #f7c948 0%,
                    #f7c948 10%,
                    #e0ac00 10%,
                    #e0ac00 20%
                  )
                `,
                                backgroundSize: '100% 20px',
                                position: 'absolute',
                                bottom: 0,
                                borderTop: '1px solid rgba(255,255,255,0.6)',
                                boxShadow:
                                    'inset 0 2px 4px rgba(255,255,255,0.3), inset 0 -2px 4px rgba(0,0,0,0.4), 0 0 10px rgba(255,200,0,0.4)',
                                animation: 'coinRise 1.8s linear infinite',
                            }}
                        >
                            {/* subtle rim highlight for curved coins */}
                            <div
                                className="absolute inset-x-0 bottom-0 h-full rounded-b-full rounded-t-none pointer-events-none"
                                style={{
                                    background:
                                        'radial-gradient(circle at 50% 10%, rgba(255,255,255,0.35), transparent 70%)',
                                    mixBlendMode: 'screen',
                                    opacity: 0.5,
                                }}
                            ></div>
                        </div>
                    </div>

                    {/* Milestone labels outside the tube */}
                    <div className="absolute top-0 bottom-0 left-0 right-0 pointer-events-none">
                        {uniformPercents.map((pct, i) => {
                            const label = uniformLabels[i];
                            const imageSrc = getPlanImage(label);

                            return (
                                <div
                                    key={`label-${planId}-${i}`}
                                    className="absolute w-full"
                                    style={{
                                        bottom: `${Math.min(96, Math.max(4, pct))}%`,
                                        transform: 'translateY(50%)'
                                    }}
                                >
                                    {/* Left Side: Callout with Image */}
                                    <div className="absolute right-[calc(50%+24px)] top-1/2 -translate-y-1/2 flex items-center justify-end">
                                        <div className="relative bg-white border-2 border-gray-200 rounded-lg p-1 shadow-sm w-10 h-10 flex items-center justify-center">
                                            <div className="relative w-full h-full">
                                                <Image
                                                    src={imageSrc}
                                                    alt={label}
                                                    fill
                                                    className="object-contain"
                                                />
                                            </div>
                                            {/* Connector line to tube */}
                                            <div className="absolute right-[-6px] top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white border-t-2 border-r-2 border-gray-200 rotate-45"></div>
                                        </div>
                                    </div>

                                    {/* Right Side: Text Label */}
                                    <div className="absolute left-[calc(50%+24px)] top-1/2 -translate-y-1/2 flex items-center">
                                        <div className="w-3 border-t-2 border-gray-400 mr-2"></div>
                                        <div className="text-[10px] text-gray-800 font-semibold max-w-40 bg-white/80 px-1 rounded leading-tight">
                                            {label}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
