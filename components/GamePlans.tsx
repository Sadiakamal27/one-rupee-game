"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { GamePlan, Order, Milestone } from "@/types/database";
import Link from "next/link";
import Image from "next/image";
import Navbar from "./Navbar";

export default function GamePlans() {
  const [plans, setPlans] = useState<GamePlan[]>([]);
  const [recentOrders, setRecentOrders] = useState<Record<number, Order[]>>({});
  const [milestones, setMilestones] = useState<Record<number, Milestone[]>>({});
  const [chosenPlanIds, setChosenPlanIds] = useState<number[]>(() => {
    try {
      if (typeof window !== 'undefined') {
        // First check for new format (array)
        const savedNew = window.localStorage.getItem('chosenPlanIds')
        if (savedNew) {
          const parsed = JSON.parse(savedNew) as number[]
          if (Array.isArray(parsed)) {
            const validIds = parsed.filter(id => typeof id === 'number' && !Number.isNaN(id))
            if (validIds.length > 0) {
              return validIds
            }
          }
        }
        // Migrate from old format (single ID) if it exists
        const savedOld = window.localStorage.getItem('chosenPlanId')
        if (savedOld) {
          const parsed = parseInt(savedOld, 10)
          if (!Number.isNaN(parsed)) {
            // Migrate to new format
            const migrated = [parsed]
            window.localStorage.setItem('chosenPlanIds', JSON.stringify(migrated))
            window.localStorage.removeItem('chosenPlanId')
            return migrated
          }
        }
      }
    } catch {}
    return []
  })
  const [hydrated, setHydrated] = useState(false)
  const supabase = createClient();

  useEffect(() => {
    // Initial data fetch (progress is hydrated from localStorage via state initializers)
    fetchPlans();
    fetchMilestones();
    fetchRecentOrders();

    // Set up real-time subscription for orders
    const ordersChannel = supabase
      .channel("orders_changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
          filter: "payment_status=eq.completed",
        },
        () => {
          fetchRecentOrders();
          fetchPlans();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
    };
  }, []);

  // mark hydration complete so other effects that depend on restored state don't
  // overwrite the restored progress on first render
  useEffect(() => {
    setHydrated(true)
  }, [])

  // Persist chosen plan IDs when they change
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        if (chosenPlanIds.length > 0) {
          window.localStorage.setItem("chosenPlanIds", JSON.stringify(chosenPlanIds));
        } else {
          window.localStorage.removeItem("chosenPlanIds");
        }
      }
    } catch {}
  }, [chosenPlanIds]);

  // Check for completed orders and add those plan IDs to chosen plans
  useEffect(() => {
    if (!hydrated || !plans.length) return;
    
    const checkCompletedOrders = async () => {
      try {
        const { data: orders } = await supabase
          .from("orders")
          .select("plan_id")
          .eq("payment_status", "completed")
          .order("created_at", { ascending: false });

        if (orders && orders.length > 0) {
          const orderPlanIds = [...new Set(orders.map(o => o.plan_id))] as number[];
          setChosenPlanIds((prev) => {
            const combined = [...new Set([...prev, ...orderPlanIds])];
            return combined;
          });
        }
      } catch (err) {
        console.error("Error checking completed orders:", err);
      }
    };

    checkCompletedOrders();
  }, [hydrated, plans.length, supabase]);


  // no header clock (per latest UI request)

  // sign-out now handled in Navbar

  const fetchPlans = async () => {
    const { data, error } = await supabase
      .from("game_plans")
      .select("*")
      .order("price", { ascending: true });

    if (error) {
      console.error("Error fetching plans:", error);
    } else {
      setPlans(data || []);
    }
  };

  const fetchMilestones = async () => {
    const { data, error } = await supabase
      .from("milestones")
      .select("*")
      .order("amount", { ascending: false });

    if (error) {
      console.error("Error fetching milestones:", error);
    } else {
      const grouped: Record<number, Milestone[]> = {};
      data?.forEach((milestone) => {
        if (!grouped[milestone.plan_id]) {
          grouped[milestone.plan_id] = [];
        }
        grouped[milestone.plan_id].push(milestone);
      });
      setMilestones(grouped);
    }
  };

  const fetchRecentOrders = async () => {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("payment_status", "completed")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error fetching orders:", error);
    } else {
      const grouped: Record<number, Order[]> = {};
      data?.forEach((order) => {
        if (!grouped[order.plan_id]) {
          grouped[order.plan_id] = [];
        }
        grouped[order.plan_id].push(order);
      });
      setRecentOrders(grouped);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getProgressPercentage = (current: number, goal: number) => {
    if (!goal || goal === 0) return 0;
    if (!current || current === 0) return 0;
    return Math.min((current / goal) * 100, 100);
  };

  const formatPKR = (amount: number) => {
    try {
      return amount.toLocaleString("ur-PK", {
        style: "currency",
        currency: "PKR",
        maximumFractionDigits: 0,
      });
    } catch {
      return `Rs ${amount.toLocaleString()}`;
    }
  };

  return (
    <div className="min-h-screen bg-white p-4">
      

      {/* Game Plans Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8 px-1 sm:px-0">
        {plans.map((plan) => {
          // Debug: Log progress data
          console.log(`Plan ${plan.id}: current_amount=${plan.current_amount}, goal_amount=${plan.goal_amount}`);
          
          const progressDataPct = getProgressPercentage(
            plan.current_amount || 0,
            plan.goal_amount || 1
          );
          const planMilestones = milestones[plan.id] || [];
          // If no milestones present for a plan, provide defaults requested by user
          const defaultMilestones = [
            {
              id: `d-${plan.id}-cash`,
              amount: plan.goal_amount * 0.1,
              reward_name: "cash",
            },
            {
              id: `d-${plan.id}-camera`,
              amount: plan.goal_amount * 0.3,
              reward_name: "small camera",
            },
            {
              id: `d-${plan.id}-phone`,
              amount: plan.goal_amount * 0.6,
              reward_name: "phone",
            },
            {
              id: `d-${plan.id}-17promax`,
              amount: plan.goal_amount * 1.0,
              reward_name: "17 Pro Max",
            },
          ] as unknown as Milestone[];
          const displayMilestones = planMilestones.length
            ? planMilestones
            : (defaultMilestones as Milestone[]);
          // Uniform spacing for milestone markers inside the tube (4 markers)
          const uniformLabels = ["cash", "small camera", "phone", "17 Pro Max"];
          const uniformPercents = [25, 50, 75, 100].map((p) => Math.min(87, p)); // keep top safely inside
          const planOrders = recentOrders[plan.id] || [];
          // Use only real progress from database (current_amount / goal_amount)
          const progress = progressDataPct;
          const rupeesProgress = plan.current_amount || 0;
          
          // Debug: Log calculated progress
          console.log(`Plan ${plan.id}: progress=${progress}%, rupeesProgress=${rupeesProgress}`);
          // End date handling (ensure 15 days window visual; if no end_date, derive one)
          const endDate = plan.end_date
            ? new Date(plan.end_date)
            : new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);
          const now = new Date();
          const msLeft = endDate.getTime() - now.getTime();
          const daysLeft = Math.ceil(msLeft / (24 * 60 * 60 * 1000));
          const ended = msLeft <= 0;

          return (
            <div
              key={plan.id}
              className="border-2 border-black rounded-lg p-4 bg-white relative"
            >
              {/* Reward Title */}
              <h2 className="text-xl font-bold mb-2">{plan.reward_title}</h2>

              {/* End Date */}
              <p className="text-green-600 mb-4 text-sm">
                {ended ? "Ended" : `Ends: ${formatDate(endDate.toISOString())}`}{" "}
                {ended ? "" : `(~${Math.max(daysLeft, 0)} days left)`}
              </p>

              <div className="flex gap-4">
                {/* Left Side - Participants List */}
                <div className="flex-1">
                  <h3 className="text-sm font-semibold mb-2">
                    Live Participants:
                  </h3>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {planOrders.slice(0, 10).map((order) => (
                      <p key={order.id} className="text-green-600 text-sm">
                        {order.name} just bought
                      </p>
                    ))}
                    {planOrders.length === 0 && (
                      <p className="text-gray-400 text-sm">
                        No participants yet
                      </p>
                    )}
                  </div>
                </div>

                {/* Right Side - Tube Progress with Milestones */}
                <div className="w-36 sm:w-40 relative overflow-hidden">
                  <div className="text-right text-xs mb-1 font-semibold">
                    Goal: {formatPKR(plan.goal_amount)}
                  </div>
                  <div className="relative h-56 sm:h-64">
                    {/* Tube container with clipped fill */}
                     <div className="absolute inset-0 mx-auto w-12 sm:w-14 bg-gray-100 border-2 border-gray-300 rounded-full overflow-hidden shadow-inner">
                     <div
  className="absolute bottom-0 left-0 right-0 overflow-hidden rounded-b-full rounded-t-none"
  style={{
    height: `${Math.max(progress, 0)}%`,
    minHeight: progress > 0 ? '2px' : '0px', // Ensure even tiny progress is visible
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
                    {/* Milestone labels outside the tube but inside this box */}
                    <div className="absolute top-0 bottom-0 left-14 right-0">
                      {uniformPercents.map((pct, i) => (
                        <div
                          key={`label-${plan.id}-${i}`}
                          className="absolute -translate-y-1/2 flex items-center"
                          style={{
                            bottom: `${Math.min(96, Math.max(4, pct))}%`,
                          }}
                        >
                          <div className="w-3 border-t-2 border-gray-400"></div>
                          <div className="ml-2 text-[10px] text-gray-800 font-semibold truncate max-w-26">
                            {uniformLabels[i]}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Current Amount Display at Bottom
                  <div className="mt-2 text-center text-xs font-semibold text-gray-700 bg-white/80 px-2 py-1 rounded border border-gray-200">
                    Progress: {formatPKR(rupeesProgress)} of{" "}
                    {formatPKR(plan.goal_amount)}
                  </div> */}
                </div>
              </div>

              {/* Winner announcement placeholder after end */}
              {ended && (
                <div className="mt-3 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-amber-800 text-sm">
                  Winner will be announced shortly.
                </div>
              )}

              {/* Enter Button */}
              <Link
                href={`/payment?plan=${plan.id}&amount=${plan.price}`}
                onClick={() => {
                  setChosenPlanIds((prev) => {
                    if (prev.includes(plan.id)) {
                      return prev; // Already chosen, don't add again
                    }
                    return [...prev, plan.id];
                  });
                }}
                className="mt-4 block w-full bg-green-500 hover:bg-green-600 text-white text-center py-2 rounded-lg font-semibold transition-colors"
              >
                Enter for {plan.price} Rs
              </Link>
            </div>
          );
        })}
      </div>

      {/* Ad Section */}
      <Link
        href="https://blog.hubspot.com/website/landscaper-websites" // 🔗 your ad's target link
        target="_blank" // opens in new tab (optional)
        rel="noopener noreferrer" // security best practice
        className="block"
      >
        <div className="relative max-w-7xl mx-auto border-2 border-red-500 rounded-lg overflow-hidden h-64 flex items-center justify-center">
  <p className="text-red-500 text-xl font-bold">Ad</p>
</div>

      </Link>
    </div>
  );
}

