import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Event {
  id: string;
  title: string;
  description: string;
  date: Date;
  type: "earnings" | "economic" | "news";
  time?: string;
}

interface UpcomingEventsProps {
  events?: Event[];
  className?: string;
  isLoading?: boolean;
}

export const UpcomingEvents: React.FC<UpcomingEventsProps> = ({
  events = [],
  className,
  isLoading = false,
}) => {
  // Sample events data
  const sampleEvents: Event[] = [
    {
      id: "1",
      title: "AAPL Earnings Report",
      description: "Q2 2023 Earnings Release",
      date: new Date(2023, 4, 15),
      type: "earnings",
      time: "After Market Close",
    },
    {
      id: "2",
      title: "Federal Reserve Meeting",
      description: "FOMC Statement & Press Conference",
      date: new Date(2023, 4, 17),
      type: "economic",
      time: "2:00 PM ET",
    },
    {
      id: "3",
      title: "GDP Report",
      description: "Q1 2023 Advanced Estimate",
      date: new Date(2023, 4, 20),
      type: "economic",
      time: "8:30 AM ET",
    },
  ];
  
  const displayEvents = events.length ? events : sampleEvents;
  
  const formatDate = (date: Date) => {
    return {
      month: date.toLocaleString('default', { month: 'short' }).toUpperCase(),
      day: date.getDate(),
    };
  };
  
  const getEventBadge = (type: string) => {
    switch (type) {
      case "earnings":
        return <Badge variant="outline" className="bg-info bg-opacity-10 text-info">Earnings</Badge>;
      case "economic":
        return <Badge variant="outline" className="bg-warning bg-opacity-10 text-warning">Economic</Badge>;
      case "news":
        return <Badge variant="outline" className="bg-primary bg-opacity-10 text-primary">News</Badge>;
      default:
        return null;
    }
  };
  
  return (
    <Card className={className}>
      <CardHeader className="p-4 border-b border-neutral-200 dark:border-neutral-700">
        <CardTitle className="font-semibold">Upcoming Events</CardTitle>
      </CardHeader>
      
      <CardContent className="p-0 divide-y divide-neutral-200 dark:divide-neutral-700">
        {displayEvents.map((event) => {
          const { month, day } = formatDate(event.date);
          
          return (
            <div key={event.id} className="p-3 hover:bg-neutral-50 dark:hover:bg-neutral-750">
              <div className="flex">
                <div className="mr-3 text-center">
                  <div className="px-2 py-1 bg-neutral-100 dark:bg-neutral-700 rounded-t-md">
                    <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">{month}</span>
                  </div>
                  <div className="px-2 py-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-b-md">
                    <span className="text-lg font-semibold">{day}</span>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium">{event.title}</h4>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">{event.description}</p>
                  <div className="mt-1 flex items-center">
                    {getEventBadge(event.type)}
                    {event.time && (
                      <span className="ml-2 text-xs text-neutral-500 dark:text-neutral-400">{event.time}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default UpcomingEvents;
