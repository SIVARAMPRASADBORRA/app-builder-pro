import { Activity } from "@/types";
import { GripVertical, Pencil, Trash2, MapPin, Clock, DollarSign } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";

interface ActivityCardProps {
  activity: Activity;
  onEdit: (activity: Activity) => void;
  onDelete: (activity: Activity) => void;
}

const ActivityCard = ({ activity, onEdit, onDelete }: ActivityCardProps) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: activity.id || activity.order_index.toString() });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group rounded-xl border bg-card p-4 hover:shadow-md transition-shadow duration-200"
    >
      <div className="flex gap-3">
        <button
          {...attributes}
          {...listeners}
          className="mt-1 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-semibold text-sm">{activity.name}</h4>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <button
                onClick={() => onEdit(activity)}
                className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-muted-foreground">
            {activity.start_time && activity.end_time && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {activity.start_time} – {activity.end_time}
              </span>
            )}
            {activity.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {activity.location}
              </span>
            )}
            {activity.estimated_cost != null && activity.estimated_cost > 0 && (
              <span className="flex items-center gap-1 text-accent font-medium">
                <DollarSign className="h-3 w-3" />
                ~${activity.estimated_cost.toFixed(0)}
              </span>
            )}
          </div>

          {activity.description && (
            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{activity.description}</p>
          )}

          {activity.notes && (
            <p className="text-xs italic text-muted-foreground/70 mt-1">💡 {activity.notes}</p>
          )}
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="mt-3 pt-3 border-t flex items-center gap-2 text-sm animate-fade-in">
          <span className="text-muted-foreground">Delete this activity?</span>
          <button
            onClick={() => { onDelete(activity); setShowDeleteConfirm(false); }}
            className="font-medium text-destructive hover:underline"
          >
            Yes
          </button>
          <button
            onClick={() => setShowDeleteConfirm(false)}
            className="font-medium text-muted-foreground hover:underline"
          >
            No
          </button>
        </div>
      )}
    </div>
  );
};

export default ActivityCard;
