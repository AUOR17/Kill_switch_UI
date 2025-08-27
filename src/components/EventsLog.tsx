import React from "react";
import type { EventMsg } from "../types";

export default function EventsLog({ events }: { events: EventMsg[] }) {
  return (
    <div className="card">
      <div className="card-title">Events</div>
      <div className="events">
        {events.map((e, i) => (
          <div key={i} className={`event ${e.level ?? "info"}`}>
            <div className="event-meta">
              {new Date(e.ts).toLocaleString()} • {e.type.toUpperCase()}
            </div>
            <div className="event-msg">{e.message}</div>
            {e.level && <span className={`tag ${e.level}`}>{e.level}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
