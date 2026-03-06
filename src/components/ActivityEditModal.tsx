import { Activity } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";

interface ActivityEditModalProps {
  activity: Activity | null;
  open: boolean;
  onClose: () => void;
  onSave: (activity: Activity) => void;
}

const emptyActivity: Activity = {
  name: "",
  description: "",
  location: "",
  latitude: null,
  longitude: null,
  start_time: "",
  end_time: "",
  order_index: 0,
  notes: "",
  estimated_cost: null,
};

const ActivityEditModal = ({ activity, open, onClose, onSave }: ActivityEditModalProps) => {
  const [form, setForm] = useState<Activity>(emptyActivity);

  useEffect(() => {
    if (activity) {
      setForm(activity);
    } else {
      setForm(emptyActivity);
    }
  }, [activity, open]);

  const handleChange = (field: keyof Activity, value: string | number | null) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    if (!form.name.trim()) return;
    onSave(form);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{activity?.id ? "Edit Activity" : "Add Activity"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input id="name" value={form.name} onChange={(e) => handleChange("name", e.target.value)} placeholder="Visit Baga Beach" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="start_time">Start Time</Label>
              <Input id="start_time" type="time" value={form.start_time} onChange={(e) => handleChange("start_time", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_time">End Time</Label>
              <Input id="end_time" type="time" value={form.end_time} onChange={(e) => handleChange("end_time", e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input id="location" value={form.location} onChange={(e) => handleChange("location", e.target.value)} placeholder="Baga Beach, Goa" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={form.description} onChange={(e) => handleChange("description", e.target.value)} placeholder="A brief description…" rows={2} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" value={form.notes} onChange={(e) => handleChange("notes", e.target.value)} placeholder="Tips or insider advice…" rows={2} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cost">Estimated Cost (USD)</Label>
            <Input
              id="cost"
              type="number"
              min="0"
              step="0.01"
              value={form.estimated_cost ?? ""}
              onChange={(e) => handleChange("estimated_cost", e.target.value ? parseFloat(e.target.value) : null)}
              placeholder="0.00"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!form.name.trim()}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ActivityEditModal;
