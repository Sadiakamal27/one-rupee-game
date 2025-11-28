"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { GamePlan, Order, Milestone } from "@/types/database";
import Link from "next/link";
import Image from "next/image";
import ConfettiSprinkles from "./ConfettiSprinkles";
import { Calendar, User } from "lucide-react";
import ProgressBar from "./ProgressBar";

// Image mapping configuration
const PLAN_IMAGES: Record<string, string> = {
  'iphone': '/iphone.jpg',
  'trip': '/trip.jpg',
  'cash': '/cash.jpg',
  'money': '/cash.jpg',
  'bike': '/bike.jpg',
  'motorcycle': '/bike.jpg',
  'car': '/car.jpg',
  'laptop': '/laptop.jpg',
  'macbook': '/laptop.jpg',
  'camera': '/camera.jpg',
  '17 pro max': '/iphone.jpg',
  'pro max': '/iphone.jpg',
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

export default function GamePlans() {
  const [plans, setPlans] = useState<GamePlan[]>([]);
  const [recentOrders, setRecentOrders] = useState<Record<number, Order[]>>({});
  const [milestones, setMilestones] = useState<Record<number, Milestone[]>>({});
  const [loading, setLoading] = useState(true);
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
    } catch { }
    return []
  })
  const [hydrated, setHydrated] = useState(false)
  const supabase = createClient();

  useEffect(() => {
    // Check and reset expired plans first
    // Initial data fetch (progress is hydrated from localStorage via state initializers)
    const loadData = async () => {
      try {
        // Check and reset expired plans FIRST to avoid showing stale data
        await checkAndResetPlans();

        await Promise.all([
          fetchPlans(),
          fetchMilestones(),
          fetchRecentOrders()
        ]);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();

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
    } catch { }
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

  const checkAndResetPlans = async () => {
    try {
      const response = await fetch('/api/reset-plans', { method: 'POST' });
      const result = await response.json();
      if (result.success && result.resetPlans?.length > 0) {
        console.log('Plans reset:', result.resetPlans);
        // Refresh all data after reset
        fetchPlans();
        fetchRecentOrders(); // This will clear live participants for reset plans
      }
    } catch (error) {
      console.error('Error checking/resetting plans:', error);
    }
  };

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
      .select(`
        *,
        profile:profiles!user_id(full_name, first_name, last_name),
        plan:game_plans!plan_id(last_reset_date)
      `)
      .eq("payment_status", "completed")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching orders:", error);
    } else {
      // Filter orders to only show those from the current cycle
      // An order belongs to current cycle if its cycle_start_date matches the plan's last_reset_date
      const currentCycleOrders = (data || []).filter((order: any) => {
        // Must have both dates to be included
        if (!order.plan?.last_reset_date || !order.cycle_start_date) {
          return false; // Exclude orders without proper cycle tracking
        }
        // Compare dates (both are ISO strings from Supabase)
        return order.cycle_start_date === order.plan.last_reset_date;
      });

      const grouped: Record<number, Order[]> = {};
      currentCycleOrders.forEach((order) => {
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
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8 px-1 sm:px-0">
          {plans.map((plan) => {
            // Debug: Log progress data
            console.log(`Plan ${plan.id}: current_amount=${plan.current_amount}, goal_amount=${plan.goal_amount}`);

            const progressDataPct = getProgressPercentage(
              plan.current_amount || 0,
              plan.goal_amount || 1
            );
            const planMilestones = milestones[plan.id] || [];

            // Deduplicate milestones based on reward_name to handle potential DB duplicates
            const uniquePlanMilestones = planMilestones.filter((milestone, index, self) =>
              index === self.findIndex((m) => m.reward_name === milestone.reward_name)
            );

            // If no milestones present for a plan, provide defaults requested by user
            const defaultMilestones = [
              {
                id: `d-${plan.id}-cash`,
                amount: plan.goal_amount * 0.1,
                reward_name: "cash",
                image_url: "/cash.png",
                price: 500,
                plan_id: plan.id,
                created_at: new Date().toISOString(),
              },
              {
                id: `d-${plan.id}-camera`,
                amount: plan.goal_amount * 0.3,
                reward_name: "small camera",
                image_url: "/smallcamera.jpg",
                price: 2000,
                plan_id: plan.id,
                created_at: new Date().toISOString(),
              },
              {
                id: `d-${plan.id}-phone`,
                amount: plan.goal_amount * 0.6,
                reward_name: "phone",
                image_url: "/phone.png",
                price: 15000,
                plan_id: plan.id,
                created_at: new Date().toISOString(),
              },
              {
                id: `d-${plan.id}-17promax`,
                amount: plan.goal_amount * 1.0,
                reward_name: "17 Pro Max",
                image_url: "/iphone17.webp",
                price: 50000,
                plan_id: plan.id,
                created_at: new Date().toISOString(),
              },
            ] as unknown as Milestone[];

            const displayMilestones = uniquePlanMilestones.length
              ? uniquePlanMilestones
              : (defaultMilestones as Milestone[]);
            const planOrders = recentOrders[plan.id] || [];
            // Use only real progress from database (current_amount / goal_amount)
            const progress = progressDataPct;
            const rupeesProgress = plan.current_amount || 0;

            // Debug: Log calculated progress
            console.log(`Plan ${plan.id}: progress=${progress}%, rupeesProgress=${rupeesProgress}`);
            // End date handling (ensure 15 days window visual; if no end_date, derive one)
            // End date handling (ensure 15 days window visual; if no end_date or ended, derive one)
            let endDate = plan.end_date ? new Date(plan.end_date) : new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);
            if (endDate.getTime() < Date.now()) {
              endDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);
            }
            const now = new Date();
            const msLeft = endDate.getTime() - now.getTime();
            const daysLeft = Math.ceil(msLeft / (24 * 60 * 60 * 1000));
            const ended = msLeft <= 0;

            return (
              <div
                key={plan.id}
                className="border-1 border-black rounded-lg p-6 bg-white relative"
              >


                {/* Header Section - Separated with background */}
                <div className="bg-green-50 -mx-6 -mt-6 mb-8 p-4 border-b border-green-100 rounded-t-lg overflow-hidden">

                  {/* Confetti animation */}
                  <ConfettiSprinkles />

                  {/* End Date - moved to top right */}
                  <div className="absolute top-2 right-2 flex items-center text-gray-600 text-sm whitespace-nowrap bg-white/70 px-2 py-1 rounded-md shadow">
                    <Calendar className="w-4 h-4 mr-1 shrink-0" />
                    <span>
                      {ended ? "Ended" : `Ends: ${formatDate(endDate.toISOString())}`}
                    </span>
                  </div>

                  {/* Title on LEFT */}
                  <h2
                    className="text-3xl font-extrabold mb-4 mt-4 text-left text-gray-800 tracking-wider uppercase"
                    style={{ textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                  >
                    {plan.reward_title}
                  </h2>

                  {/* Plan Image CENTERED */}
                  <div className="w-full flex justify-center mt-2 mb-1">
                    <div className="relative w-40 h-48 rounded-lg overflow-hidden">
                      <Image
                        src={plan.image_url || getPlanImage(plan.reward_title)}
                        alt={plan.reward_title}
                        fill
                        className="object-contain p-2"
                      />
                    </div>
                  </div>

                </div>


                {/* Tube Progress - Centered */}
                <ProgressBar
                  planId={plan.id}
                  goalAmount={plan.goal_amount}
                  progress={progress}
                  milestones={displayMilestones}
                  formatPKR={formatPKR}
                  participantCount={planOrders.length}
                />

                {/* Purchase Notification - Shows most recent purchase */}
                {
                  planOrders.length > 0 && (
                    <div className="mb-4 animate-fade-in">
                      <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <p className="text-sm text-green-800">
                          <span className="font-semibold">
                            {planOrders[0].profile?.full_name ||
                              (planOrders[0].profile?.first_name && planOrders[0].profile?.last_name
                                ? `${planOrders[0].profile.first_name} ${planOrders[0].profile.last_name}`.trim()
                                : planOrders[0].name)}
                          </span>
                          {' '}just entered this plan!
                        </p>
                      </div>
                    </div>
                  )
                }


                {/* Live Participants Section - Moved Below */}
                <div className="mt-4">
                  <h3 className="text-lg font-bold mb-3">
                    Live Participants
                  </h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {planOrders.map((order) => {
                      // Use profile name if available, otherwise fallback to order name
                      const displayName = order.profile?.full_name ||
                        (order.profile?.first_name && order.profile?.last_name
                          ? `${order.profile.first_name} ${order.profile.last_name}`.trim()
                          : order.name);

                      return (
                        <div key={order.id} className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-100 shadow-sm">
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mr-3 shrink-0">
                            <User className="w-5 h-5 text-gray-500" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-800">{displayName}</p>
                            <p className="text-xs text-green-600">just bought</p>
                          </div>
                        </div>
                      );
                    })}
                    {planOrders.length === 0 && (
                      <p className="text-gray-400 text-sm text-center py-4">
                        No participants yet
                      </p>
                    )}
                  </div>
                </div>

                {/* Winner announcement placeholder after end */}
                {
                  ended && (
                    <div className="mt-3 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-amber-800 text-sm">
                      Winner will be announced shortly.
                    </div>
                  )
                }

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
                  className="mt-4 block w-full bg-green-600 hover:bg-red-600 text-white text-center py-2 rounded-lg font-semibold transition-colors"
                >
                  Enter for {plan.price} Rs
                </Link>
              </div>
            );

          })}
        </div>
      )}

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
    </div >
  );
}

