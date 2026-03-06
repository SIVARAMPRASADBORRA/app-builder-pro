export interface Activity {
  id?: string;
  day_id?: string;
  name: string;
  description: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  start_time: string;
  end_time: string;
  order_index: number;
  notes: string;
  estimated_cost: number | null;
}

export interface Day {
  id?: string;
  trip_id?: string;
  day_number: number;
  title: string;
  date: string | null;
  activities: Activity[];
}

export interface Trip {
  id?: string;
  user_id?: string;
  title: string;
  destination: string;
  description: string;
  num_days: number;
  start_date: string | null;
  end_date: string | null;
  created_at?: string;
  updated_at?: string;
  days?: Day[];
}

export interface GeneratedItinerary {
  trip_title: string;
  destination: string;
  days: {
    day_number: number;
    title: string;
    activities: Omit<Activity, 'id' | 'day_id' | 'order_index'>[];
  }[];
}
