import { CleaningCalendar } from "./cleaningCalendar";

describe("CleaningCalendar", () => {
  it("should be empty after initialization", () => {
    const cc = new CleaningCalendar("some-id-1");
    expect(cc.id).toEqual("some-id-1");
    expect(cc.events).toEqual([]);
  });

  it("should add new events", () => {
    const cc = new CleaningCalendar("");

    const testEvent1 = {
      id: "event-id-1",
      summary: "Test Event 1",
      description: "Test Event data",
      recurrence: ["RRULE:..."]
    };
    cc.addEvent(testEvent1);
    expect(cc.events).toEqual([testEvent1]);

    const testEvent2 = {
      id: "event-id-2",
      summary: "Test Event 2",
      description: "Test Event data for second event",
      recurrence: ["RRULE:...really does not matter at this time..."]
    }
    cc.addEvent(testEvent2);
    expect(cc.events).toEqual([testEvent1, testEvent2]);
  });

  it("should delete event", () => {
    const cc = new CleaningCalendar("");

    const testEvent1 = {
      id: "event-id-1",
      summary: "Test Event 1",
      description: "Test Event data",
      recurrence: ["RRULE:..."]
    };
    cc.addEvent(testEvent1);

    const testEvent2 = {
      id: "event-id-2",
      summary: "Test Event 2",
      description: "Test Event data for second event",
      recurrence: ["RRULE:...really does not matter at this time..."]
    }
    cc.addEvent(testEvent2);

    cc.deleteEvent(testEvent1);
    expect(cc.events).toEqual([testEvent2]);

    cc.deleteEvent(testEvent2);
    expect(cc.events).toEqual([]);
  });

  it("should update event", () => {
    const cc = new CleaningCalendar("");

    const testEvent1 = {
      id: "event-id-1",
      summary: "Test Event 1",
      description: "Test Event data",
      recurrence: ["RRULE:..."]
    };
    cc.addEvent(testEvent1);

    const testEvent2 = {
      id: "event-id-2",
      summary: "Test Event 2",
      description: "Test Event data for second event",
      recurrence: ["RRULE:...really does not matter at this time..."]
    }
    cc.addEvent(testEvent2);

    const updatedTestEvent1 = {
      id: "event-id-1",
      summary: "Test Event 1 updated",
      description: "Test Event data updated",
      recurrence: ["RRULE:...updated"]
    };
    cc.editEvent(updatedTestEvent1);
    expect(cc.events).toEqual([updatedTestEvent1, testEvent2]);
  });

  it("should set events", () => {
    const cc = new CleaningCalendar("");

    const testEvent1 = {
      id: "event-id-1",
      summary: "Test Event 1",
      description: "Test Event data",
      recurrence: ["RRULE:..."]
    };
    const testEvent2 = {
      id: "event-id-2",
      summary: "Test Event 2",
      description: "Test Event data for second event",
      recurrence: ["RRULE:...really does not matter at this time..."]
    }
    cc.events = [testEvent1, testEvent2];

    expect(cc.events).toEqual([testEvent1, testEvent2]);
  })
});
