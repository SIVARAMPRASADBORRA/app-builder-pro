import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabaseClient";
import { GeneratedItinerary } from "@/types";
import SkeletonLoader from "@/components/SkeletonLoader";
import Navbar from "@/components/Navbar";
import { ArrowRight, Sparkles } from "lucide-react";
import { toast } from "sonner";

const durationChips = ["2 days", "3 days", "5 days", "7 days"];
const budgetChips = ["Budget-friendly", "Mid-range", "Luxury"];
const vibeChips = ["Adventure", "Relaxation", "Culture"];

const CreateTripPage = () => {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const appendChip = (text: string) => {
    setPrompt((prev) => (prev ? `${prev}, ${text.toLowerCase()}` : text.toLowerCase()));
  };

  const handleGenerate = async () => {
    if (prompt.length < 10) return;
    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("generate-itinerary", {
        body: { prompt },
      });

      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);

      const itinerary = data as GeneratedItinerary;
      navigate("/trip/preview", { state: { itinerary, originalPrompt: prompt } });
    } catch (err: any) {
      console.error("Generation error:", err);
      setError(err.message || "Failed to generate itinerary. Please try again.");
      toast.error("Failed to generate itinerary");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto max-w-2xl px-4 py-12">
        {loading ? (
          <SkeletonLoader />
        ) : (
          <div className="animate-fade-in space-y-6">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-4">
                <Sparkles className="h-3.5 w-3.5" />
                AI Itinerary Generator
              </div>
              <h1 className="text-2xl md:text-3xl font-bold">Describe your dream trip</h1>
              <p className="text-muted-foreground mt-2">
                Tell us where, how long, and what you love — AI does the rest.
              </p>
            </div>

            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your ideal trip… e.g., 3 days in Goa, love beaches and seafood, budget-friendly"
              className="min-h-[140px] text-base resize-none"
            />

            <div className="space-y-3">
              <ChipGroup label="Duration" chips={durationChips} onSelect={appendChip} />
              <ChipGroup label="Budget" chips={budgetChips} onSelect={appendChip} />
              <ChipGroup label="Vibe" chips={vibeChips} onSelect={appendChip} />
            </div>

            {error && (
              <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
                {error}
                <Button variant="outline" size="sm" className="ml-3" onClick={() => setError(null)}>
                  Try Again
                </Button>
              </div>
            )}

            <Button
              onClick={handleGenerate}
              disabled={prompt.length < 10}
              size="lg"
              className="w-full text-base active:scale-95 transition-transform"
            >
              Generate My Trip <ArrowRight className="ml-2 h-4 w-4" />
            </Button>

            {prompt.length > 0 && prompt.length < 10 && (
              <p className="text-xs text-muted-foreground text-center">
                Please enter at least 10 characters to generate
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const ChipGroup = ({ label, chips, onSelect }: { label: string; chips: string[]; onSelect: (v: string) => void }) => (
  <div className="flex flex-wrap items-center gap-2">
    <span className="text-xs font-medium text-muted-foreground w-16">{label}</span>
    {chips.map((chip) => (
      <button
        key={chip}
        onClick={() => onSelect(chip)}
        className="rounded-full border bg-card px-3 py-1 text-xs font-medium hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors active:scale-95"
      >
        {chip}
      </button>
    ))}
  </div>
);

export default CreateTripPage;
