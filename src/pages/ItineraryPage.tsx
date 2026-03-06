import { useState, useEffect, useCallback } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { Day, Activity, GeneratedItinerary, Trip } from "@/types";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import DaySection from "@/components/DaySection";
import ActivityEditModal from "@/components/ActivityEditModal";
import SkeletonLoader from "@/components/SkeletonLoader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Sparkles, MapPin, Layers, DollarSign } from "lucide-react";
import { toast } from "sonner";

const ItineraryPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const isPreview = id === "preview";
  const routerState = location.state as { itinerary?: GeneratedItinerary; originalPrompt?: string } | null;

  const [title, setTitle] = useState("");
  const [destination, setDestination] = useState("");
  const [description, setDescription] = useState("");
  const [days, setDays] = useState<Day[]>([]);
  const [loading, setLoading] = useState(!isPreview);
  const [saving, setSaving] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [activeDay, setActiveDay] = useState("1");

  // AI refinement
  const [showRefine, setShowRefine] = useState(false);
  const [refinePrompt, setRefinePrompt] = useState("");
  const [refining, setRefining] = useState(false);

  // Activity edit modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [editingDayNumber, setEditingDayNumber] = useState<number>(1);

  // Load from preview state
  useEffect(() => {
    if (isPreview && routerState?.itinerary) {
      const it = routerState.itinerary;
      setTitle(it.trip_title);
      setDestination(it.destination);
      setDescription(routerState.originalPrompt || "");
      setDays(
        it.days.map((d) => ({
          day_number: d.day_number,
          title: d.title,
          date: null,
          activities: d.activities.map((a, i) => ({
            ...a,
            order_index: i,
            latitude: a.latitude ?? null,
            longitude: a.longitude ?? null,
            estimated_cost: a.estimated_cost ?? null,
          })),
        }))
      );
    }
  }, [isPreview, routerState]);

  // Load saved trip
  useEffect(() => {
    if (!isPreview && id) {
      loadTrip(id);
    }
  }, [id, isPreview]);

  const loadTrip = async (tripId: string) => {
    setLoading(true);
    try {
      const { data: trip, error: tripError } = await supabase
        .from("trips")
        .select("*")
        .eq("id", tripId)
        .single();

      if (tripError) throw tripError;

      const { data: daysData, error: daysError } = await supabase
        .from("days")
        .select("*")
        .eq("trip_id", tripId)
        .order("day_number");

      if (daysError) throw daysError;

      const dayIds = daysData.map((d: any) => d.id);
      const { data: activitiesData, error: actError } = await supabase
        .from("activities")
        .select("*")
        .in("day_id", dayIds)
        .order("order_index");

      if (actError) throw actError;

      setTitle(trip.title);
      setDestination(trip.destination || "");
      setDescription(trip.description || "");
      setDays(
        daysData.map((d: any) => ({
          ...d,
          activities: (activitiesData || []).filter((a: any) => a.day_id === d.id),
        }))
      );
    } catch (err) {
      console.error(err);
      toast.error("Failed to load trip");
    } finally {
      setLoading(false);
    }
  };

  const totalActivities = days.reduce((sum, d) => sum + d.activities.length, 0);
  const totalCost = days.reduce(
    (sum, d) => sum + d.activities.reduce((s, a) => s + (a.estimated_cost || 0), 0),
    0
  );

  const handleSaveTrip = async () => {
    if (!user) return;
    setSaving(true);

    try {
      // Insert trip
      const { data: tripData, error: tripError } = await supabase
        .from("trips")
        .insert({
          user_id: user.id,
          title,
          destination,
          description,
          num_days: days.length,
          start_date: null,
          end_date: null,
        })
        .select()
        .single();

      if (tripError) throw tripError;

      // Insert days
      for (const day of days) {
        const { data: dayData, error: dayError } = await supabase
          .from("days")
          .insert({
            trip_id: tripData.id,
            day_number: day.day_number,
            title: day.title,
            date: day.date,
          })
          .select()
          .single();

        if (dayError) throw dayError;

        // Insert activities
        if (day.activities.length > 0) {
          const { error: actError } = await supabase.from("activities").insert(
            day.activities.map((a, i) => ({
              day_id: dayData.id,
              name: a.name,
              description: a.description,
              location: a.location,
              latitude: a.latitude,
              longitude: a.longitude,
              start_time: a.start_time || null,
              end_time: a.end_time || null,
              order_index: i,
              notes: a.notes,
              estimated_cost: a.estimated_cost,
            }))
          );
          if (actError) throw actError;
        }
      }

      toast.success("Trip saved successfully!");
      navigate(`/trip/${tripData.id}`, { replace: true });
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to save trip");
    } finally {
      setSaving(false);
    }
  };

  const handleRefine = async () => {
    if (!refinePrompt.trim()) return;
    setRefining(true);

    try {
      const currentItinerary: GeneratedItinerary = {
        trip_title: title,
        destination,
        days: days.map((d) => ({
          day_number: d.day_number,
          title: d.title,
          activities: d.activities,
        })),
      };

      const { data, error } = await supabase.functions.invoke("generate-itinerary", {
        body: {
          prompt: description,
          currentItinerary,
          refinementInstruction: refinePrompt,
        },
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      const refined = data as GeneratedItinerary;
      setTitle(refined.trip_title);
      setDestination(refined.destination);
      setDays(
        refined.days.map((d) => ({
          day_number: d.day_number,
          title: d.title,
          date: null,
          activities: d.activities.map((a, i) => ({
            ...a,
            order_index: i,
            latitude: a.latitude ?? null,
            longitude: a.longitude ?? null,
            estimated_cost: a.estimated_cost ?? null,
          })),
        }))
      );

      toast.success("Itinerary refined!");
      setRefinePrompt("");
      setShowRefine(false);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to refine");
    } finally {
      setRefining(false);
    }
  };

  const handleUpdateActivities = useCallback(
    (dayNumber: number, activities: Activity[]) => {
      setDays((prev) =>
        prev.map((d) => (d.day_number === dayNumber ? { ...d, activities } : d))
      );

      // If saved mode, persist order
      if (!isPreview && id) {
        activities.forEach(async (a) => {
          if (a.id) {
            await supabase.from("activities").update({ order_index: a.order_index }).eq("id", a.id);
          }
        });
      }
    },
    [isPreview, id]
  );

  const handleEditActivity = (activity: Activity, dayNumber: number) => {
    setEditingActivity(activity);
    setEditingDayNumber(dayNumber);
    setEditModalOpen(true);
  };

  const handleAddActivity = (dayNumber: number) => {
    setEditingActivity(null);
    setEditingDayNumber(dayNumber);
    setEditModalOpen(true);
  };

  const handleDeleteActivity = async (activity: Activity, dayNumber: number) => {
    setDays((prev) =>
      prev.map((d) =>
        d.day_number === dayNumber
          ? { ...d, activities: d.activities.filter((a) => a !== activity) }
          : d
      )
    );

    if (!isPreview && activity.id) {
      await supabase.from("activities").delete().eq("id", activity.id);
    }

    toast.success("Activity deleted");
  };

  const handleSaveActivity = async (updated: Activity) => {
    setDays((prev) =>
      prev.map((d) => {
        if (d.day_number !== editingDayNumber) return d;

        if (editingActivity) {
          // Edit existing
          return {
            ...d,
            activities: d.activities.map((a) =>
              a === editingActivity || a.id === editingActivity.id ? updated : a
            ),
          };
        } else {
          // Add new
          return {
            ...d,
            activities: [...d.activities, { ...updated, order_index: d.activities.length }],
          };
        }
      })
    );

    // Persist if saved mode
    if (!isPreview && id) {
      const day = days.find((d) => d.day_number === editingDayNumber);
      if (editingActivity?.id) {
        await supabase.from("activities").update({
          name: updated.name,
          description: updated.description,
          location: updated.location,
          start_time: updated.start_time || null,
          end_time: updated.end_time || null,
          notes: updated.notes,
          estimated_cost: updated.estimated_cost,
        }).eq("id", editingActivity.id);
      } else if (day?.id) {
        await supabase.from("activities").insert({
          day_id: day.id,
          name: updated.name,
          description: updated.description,
          location: updated.location,
          start_time: updated.start_time || null,
          end_time: updated.end_time || null,
          order_index: day.activities.length,
          notes: updated.notes,
          estimated_cost: updated.estimated_cost,
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto max-w-3xl px-4 py-12">
          <SkeletonLoader />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto max-w-3xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <div className="flex items-start justify-between gap-4 mb-2">
            {editingTitle ? (
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => setEditingTitle(false)}
                onKeyDown={(e) => e.key === "Enter" && setEditingTitle(false)}
                autoFocus
                className="text-2xl font-bold border-none p-0 h-auto focus-visible:ring-0"
              />
            ) : (
              <h1
                className="text-2xl md:text-3xl font-bold cursor-pointer hover:text-primary/80 transition-colors"
                onClick={() => setEditingTitle(true)}
              >
                {title}
              </h1>
            )}

            <div className="flex gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRefine(!showRefine)}
              >
                <Sparkles className="h-4 w-4 mr-1" /> Modify with AI
              </Button>
              {isPreview && (
                <Button size="sm" onClick={handleSaveTrip} disabled={saving}>
                  <Save className="h-4 w-4 mr-1" /> {saving ? "Saving…" : "Save Trip"}
                </Button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {destination && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" /> {destination}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Layers className="h-3.5 w-3.5" /> {totalActivities} activities
            </span>
            {totalCost > 0 && (
              <span className="flex items-center gap-1 text-accent font-medium">
                <DollarSign className="h-3.5 w-3.5" /> ~${totalCost.toFixed(0)} total
              </span>
            )}
          </div>
        </div>

        {/* AI Refinement */}
        {showRefine && (
          <div className="mb-6 rounded-xl border bg-card p-4 space-y-3 animate-fade-in">
            <p className="text-sm font-medium">How would you like to modify the itinerary?</p>
            <Textarea
              value={refinePrompt}
              onChange={(e) => setRefinePrompt(e.target.value)}
              placeholder="e.g., Make Day 2 more relaxing, add more food spots…"
              rows={2}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleRefine} disabled={refining || !refinePrompt.trim()}>
                {refining ? "Refining…" : "Apply Changes"}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowRefine(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Day Tabs */}
        <Tabs value={activeDay} onValueChange={setActiveDay}>
          <TabsList className="mb-6 w-full justify-start overflow-x-auto">
            {days.map((d) => (
              <TabsTrigger key={d.day_number} value={d.day_number.toString()} className="min-w-fit">
                Day {d.day_number}
              </TabsTrigger>
            ))}
          </TabsList>

          {days.map((day) => (
            <TabsContent key={day.day_number} value={day.day_number.toString()}>
              <DaySection
                day={day}
                onUpdateActivities={handleUpdateActivities}
                onEditActivity={handleEditActivity}
                onDeleteActivity={handleDeleteActivity}
                onAddActivity={handleAddActivity}
              />
            </TabsContent>
          ))}
        </Tabs>
      </div>

      <ActivityEditModal
        activity={editingActivity}
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSave={handleSaveActivity}
      />
    </div>
  );
};

export default ItineraryPage;
