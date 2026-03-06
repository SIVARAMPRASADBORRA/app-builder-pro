import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { Trip } from "@/types";
import Navbar from "@/components/Navbar";
import TripCard from "@/components/TripCard";
import { Button } from "@/components/ui/button";
import { Plus, Plane } from "lucide-react";
import { toast } from "sonner";

const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [trips, setTrips] = useState<(Trip & { activityCount: number })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadTrips();
  }, [user]);

  const loadTrips = async () => {
    try {
      const { data, error } = await supabase
        .from("trips")
        .select("id, title, destination, start_date, end_date, num_days, created_at, description")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get activity counts
      const tripsWithCounts = await Promise.all(
        (data || []).map(async (trip: any) => {
          const { data: daysData } = await supabase
            .from("days")
            .select("id")
            .eq("trip_id", trip.id);

          let activityCount = 0;
          if (daysData && daysData.length > 0) {
            const dayIds = daysData.map((d: any) => d.id);
            const { count } = await supabase
              .from("activities")
              .select("*", { count: "exact", head: true })
              .in("day_id", dayIds);
            activityCount = count || 0;
          }

          return { ...trip, activityCount } as Trip & { activityCount: number };
        })
      );

      setTrips(tripsWithCounts);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load trips");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (tripId: string) => {
    try {
      const { error } = await supabase.from("trips").delete().eq("id", tripId);
      if (error) throw error;
      setTrips((prev) => prev.filter((t) => t.id !== tripId));
      toast.success("Trip deleted");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete trip");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">My Trips</h1>
          <Button onClick={() => navigate("/create-trip")} className="active:scale-95 transition-transform">
            <Plus className="h-4 w-4 mr-1" /> New Trip
          </Button>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl border bg-card p-6 space-y-3">
                <div className="h-8 w-8 rounded bg-muted animate-pulse" />
                <div className="h-4 w-2/3 rounded bg-muted animate-pulse" />
                <div className="h-3 w-1/2 rounded bg-muted animate-pulse" />
              </div>
            ))}
          </div>
        ) : trips.length === 0 ? (
          <div className="text-center py-20 animate-fade-in">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <Plane className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-lg font-semibold mb-2">No trips yet!</h2>
            <p className="text-muted-foreground mb-6">Start planning your first adventure.</p>
            <Button onClick={() => navigate("/create-trip")}>
              <Plus className="h-4 w-4 mr-1" /> Create Trip
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
            {trips.map((trip) => (
              <TripCard
                key={trip.id}
                trip={trip}
                activityCount={trip.activityCount}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
