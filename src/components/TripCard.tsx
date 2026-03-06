import { Trip } from "@/types";
import { useNavigate } from "react-router-dom";
import { MapPin, Calendar, Layers, Trash2 } from "lucide-react";

interface TripCardProps {
  trip: Trip;
  activityCount: number;
  onDelete: (id: string) => void;
}

const vibeEmojis = ["🏖️", "🏔️", "🌆", "🎭", "🍜", "🌴", "🗺️", "🎪"];

const TripCard = ({ trip, activityCount, onDelete }: TripCardProps) => {
  const navigate = useNavigate();
  const emoji = vibeEmojis[Math.abs(hashCode(trip.destination || trip.title)) % vibeEmojis.length];

  const dateRange = trip.start_date && trip.end_date
    ? `${formatDate(trip.start_date)} – ${formatDate(trip.end_date)}`
    : "No dates set";

  return (
    <div
      className="group relative rounded-2xl border bg-card p-6 hover:shadow-md transition-all duration-200 cursor-pointer"
      onClick={() => navigate(`/trip/${trip.id}`)}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (window.confirm("Delete this trip? This cannot be undone.")) {
            onDelete(trip.id!);
          }
        }}
        className="absolute top-4 right-4 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" />
      </button>

      <div className="text-3xl mb-3">{emoji}</div>
      <h3 className="font-bold text-base mb-1 line-clamp-1">{trip.title}</h3>

      <div className="space-y-1.5 text-xs text-muted-foreground">
        {trip.destination && (
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3 w-3" /> {trip.destination}
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <Calendar className="h-3 w-3" /> {dateRange}
        </div>
        <div className="flex items-center gap-1.5">
          <Layers className="h-3 w-3" /> {trip.num_days} days · {activityCount} activities
        </div>
      </div>
    </div>
  );
};

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default TripCard;
