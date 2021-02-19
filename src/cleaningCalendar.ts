/// <reference types="gapi.client.calendar" />

export class CleaningCalendar {
  private _id: string;
  private _events: gapi.client.calendar.Event[] = [];

  constructor(id: string) {
    this._id = id;
  }

  addEvent(ev: gapi.client.calendar.Event): void {
    this._events.push(ev);
  }

  deleteEvent(ev: gapi.client.calendar.Event): void {
    this._events = this._events.filter(x => x.id !== ev.id);
  }

  editEvent(ev: gapi.client.calendar.Event): void {
    const eventIndex = this._events.findIndex(x => x.id === ev.id);
    this._events[eventIndex] = ev;
  }

  get id(): string {
    return this._id;
  }


  get events(): gapi.client.calendar.Event[] {
    //make a copy of event
    return [...this._events];
  }

  set events(evs: gapi.client.calendar.Event[]) {
    this._events = evs;
  }
}
