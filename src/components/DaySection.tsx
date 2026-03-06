import { Day, Activity } from "@/types";
import ActivityCard from "@/components/ActivityCard";
import { Button } from "@/components/ui/button";
import { Plus, DollarSign } from "lucide-react";
import { DndContext, closestCenter, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";

interface DaySectionProps {
  day: Day;
  onUpdateActivities: (dayNumber: number, activities: Activity[]) => void;
  onEditActivity: (activity: Activity, dayNumber: number) => void;
  onDeleteActivity: (activity: Activity, dayNumber: number) => void;
  onAddActivity: (dayNumber: number) => void;
}

const DaySection = ({ day, onUpdateActivities, onEditActivity, onDeleteActivity, onAddActivity }: DaySectionProps) => {
  const sortedActivities = [...day.activities].sort((a, b) => a.order_index - b.order_index);
  const dayCost = sortedActivities.reduce((sum, a) => sum + (a.estimated_cost || 0), 0);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sortedActivities.findIndex(
      (a) => (a.id || a.order_index.toString()) === active.id
    );
    const newIndex = sortedActivities.findIndex(
      (a) => (a.id || a.order_index.toString()) === over.id
    );

    const reordered = arrayMove(sortedActivities, oldIndex, newIndex).map((a, i) => ({
      ...a,
      order_index: i,
    }));

    onUpdateActivities(day.day_number, reordered);
  };

  return (
    <div className="space-y-3 animate-fade-in">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-base">
          Day {day.day_number} {day.title && <span className="text-muted-foreground font-normal">— {day.title}</span>}
        </h3>
        {dayCost > 0 && (
          <span className="flex items-center gap-1 text-xs font-medium text-accent">
            <DollarSign className="h-3 w-3" /> ~${dayCost.toFixed(0)}
          </span>
        )}
      </div>

      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext
          items={sortedActivities.map((a) => a.id || a.order_index.toString())}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {sortedActivities.map((activity) => (
              <ActivityCard
                key={activity.id || activity.order_index}
                activity={activity}
                onEdit={(a) => onEditActivity(a, day.day_number)}
                onDelete={(a) => onDeleteActivity(a, day.day_number)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <Button
        variant="outline"
        size="sm"
        onClick={() => onAddActivity(day.day_number)}
        disabled={sortedActivities.length >= 10}
        className="w-full border-dashed"
      >
        <Plus className="h-4 w-4 mr-1" />
        Add Activity {sortedActivities.length >= 10 && "(max 10)"}
      </Button>
    </div>
  );
};

export default DaySection;
