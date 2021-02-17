/// <reference types="gapi" />
/// <reference types="gapi.auth2" />
/// <reference types="gapi.client" />
/// <reference types="gapi.client.calendar" />
import { gapi } from "gapi-script";


const CLEANING_CALENDAR_SUMMARY = "Managed: Cleaning Calendar";

// Client ID and API key from the Developer Console
// Add corresponding env variables to .env file in project root directory.
const CLIENT_ID = process.env.GCAL_CLIENT_ID;
const API_KEY = process.env.GCAL_API_KEY;

// Array of API discovery doc URLs for APIs used by the quickstart
const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"];

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
const SCOPES = "https://www.googleapis.com/auth/calendar";

/**
 *  Sign in the user.
 */
export function handleSignin() {
  gapi.auth2.getAuthInstance().signIn();
}

/**
 *  Sign out the user.
 */
export function handleSignout() {
  gapi.auth2.getAuthInstance().signOut();
}


export async function findOrCreateCalendar(): Promise<string> {
  return gapi.client.calendar.calendarList.list({ showHidden: true })
    .then(response => {
      const allCalendars = response.result.items!;
      const cleaningCalendar = allCalendars.filter(x => x.summary === CLEANING_CALENDAR_SUMMARY);
      if (cleaningCalendar.length === 0) {
        console.log(`Could not find cleaning calendar with summary ${CLEANING_CALENDAR_SUMMARY}, creating...`);

        return gapi.client.calendar.calendars.insert({ resource: { summary: CLEANING_CALENDAR_SUMMARY } })
          .then(createResponse => {
            const id = createResponse.result.id!;
            console.log(`Created a new cleaning calendar with ID ${id}.`);
            return id;
          });
      } else {
        const firstCalendar = cleaningCalendar[0];
        const id: string = firstCalendar.id!;
        console.log(`Found existing cleaning calendar with ID ${id}`);
        return id;
      }
    });
}

export async function listEventsFromCalendar(id: string): Promise<gapi.client.calendar.Event[]> {
  return gapi.client.calendar.events.list({
    calendarId: id,
    timeMin: (new Date()).toISOString(),
    maxResults: 100,
    fields: "items(id, summary, description, start, end, recurrence)"
  }).then(response => {
    return response.result.items!;
  });
}

export async function insertEvent(
  calendarId: string, title: string, rrule: string, notes: string
): Promise<gapi.client.calendar.Event> {

  // TODO: Get from the user input.
  const date = new Date().toISOString().substring(0, 10);
  const cleaningEvent: gapi.client.calendar.Event = {
    summary: title,
    description: notes,
    start: { date: date },
    end: { date: date },
    recurrence: [rrule]
  }

  return gapi.client.calendar.events.insert({
    calendarId: calendarId,
    resource: cleaningEvent
  }).then(response => response.result);
}

export async function deleteEventFromGoogleCalendar(calendarId: string, eventId: string): Promise<object> {
  return gapi.client.calendar.events.delete({
    calendarId: calendarId,
    eventId: eventId
  });
}

export async function updateEventInGoogleCalendar(calendarId: string, eventId: string, title: string, rrule: string, notes: string): Promise<gapi.client.calendar.Event> {
  const date = new Date().toISOString().substring(0, 10);
  const cleaningEvent: gapi.client.calendar.Event = {
    summary: title,
    description: notes,
    start: { date: date },
    end: { date: date },
    recurrence: [rrule],
  }

  return gapi.client.calendar.events.update({
    calendarId: calendarId,
    eventId: eventId,
    resource: cleaningEvent
  }).then(response => response.result);
}

/**
 *  Load the auth2 library and API client library.
 */
export function loadGapi(isSignedInChangeHandler: (isSignedIn: boolean) => void) {
  function whenGapiLoadHasCompleted(): void {
    gapi.client.init({
      apiKey: API_KEY,
      clientId: CLIENT_ID,
      discoveryDocs: DISCOVERY_DOCS,
      scope: SCOPES
    }).then(() => {
      // Listen for sign-in state changes.
      gapi.auth2.getAuthInstance().isSignedIn.listen(isSignedInChangeHandler);

      // Handle the initial sign-in state.
      isSignedInChangeHandler(gapi.auth2.getAuthInstance().isSignedIn.get());
    });
  }

  gapi.load('client:auth2', whenGapiLoadHasCompleted);
}
