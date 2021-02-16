import { deleteEventFromGoogleCalendar, findOrCreateCalendar, handleSignin, handleSignout, insertEvent, listEventsFromCalendar, loadGapi } from "./gcal-api";
/// <reference types="gapi.client.calendar" />

class CleaningCalendar {
  id: string;
  events: gapi.client.calendar.Event[] = [];

  constructor(id: string) {
    this.id = id;
  }
}

let currentCalendar: CleaningCalendar | undefined = undefined;

function drawEventList() {
  let element = document.getElementById("eventList");
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }

  const ulEvents = document.getElementById("eventList")!;
  for (let i = 0; i < currentCalendar!.events.length; i++) {
    const listItem = document.createElement("li");
    const iEvent = currentCalendar!.events[i];
    listItem.classList.add("list-group-item", "d-flex", "justify-content-between", "align-items-center");
    listItem.innerHTML = iEvent.summary || "Unknown";
    if (currentCalendar!.events[i].description !== undefined) {
      listItem.innerHTML += " Notes:" + iEvent.description;
    }
    listItem.innerHTML += ` <span class="badge">(
      <button type="button" name="editBtn" class="btn btn-default" aria-label="Edit"><i class="fas fa-edit"></i></button>
      <button type="button" name="deleteBtn" class="btn btn-default" aria-label="Delete"><i class="far fa-trash-alt"></i></button>
      )</span>`;
    listItem.querySelector("button[name='editBtn']")?.addEventListener("click", function () { editEvent(iEvent); });
    listItem.querySelector("button[name='deleteBtn']")?.addEventListener("click", function () { deleteEvent(iEvent); });
    ulEvents.appendChild(listItem);
  }
}

function handleCleaningEventSave(event: Event) {
  event.preventDefault();
  const title = (document.getElementById("title") as HTMLInputElement).value;
  const rrule = (document.getElementById("frequency") as HTMLInputElement).value; //RRULE:FREQ=MONTHLY;BYSETPOS=1;BYDAY=SU;INTERVAL=3
  const notes = (document.getElementById("floatingTextarea") as HTMLTextAreaElement).value;
  insertEvent(currentCalendar!.id, title, rrule, notes)
    .then(event => currentCalendar!.events.push(event))
    .then(() => drawEventList());
  document.getElementById("cleaningEventForm")!.reset();
}

const loadingScreen = document.getElementById("loadingScreen")!;
const loginScreen = document.getElementById("loginScreen")!;
const mainScreen = document.getElementById("mainScreen")!;


function handleIsSignedInChange(isSignedIn: boolean): void {
  loadingScreen.classList.add("d-none");

  if (isSignedIn) {
    loginScreen.classList.add("d-none");
    mainScreen.classList.remove("d-none");
    findOrCreateCalendar().then(id => {
      currentCalendar = new CleaningCalendar(id);
      return id;
    }).then(id => {
      return listEventsFromCalendar(id)
        .then(events => {
          currentCalendar!.events = events;
        });
    }).then(() => drawEventList());
  } else {
    loginScreen.classList.remove("d-none");
    mainScreen.classList.add("d-none");
  }
}


loadGapi(handleIsSignedInChange);

// Event Listeners for Login/Logout
document.getElementById("singInBtn")!
  .addEventListener("click", handleSignin);
document.getElementById("singOutBtn")!
  .addEventListener("click", handleSignout);

//Event Listener for save button
document.getElementById("cleaningEventForm")!
  .addEventListener("submit", handleCleaningEventSave);

function deleteEvent(event: gapi.client.calendar.Event) {
  if (window.confirm(`Do you really want to delete ${event.summary}`)) {
    let rootEventId: string;
    if (event.recurringEventId === undefined) {
      rootEventId = event.id!;
    } else {
      rootEventId = event.recurringEventId!;
    }
    // const rootEventId = event.recurringEventId || event.id!;
    deleteEventFromGoogleCalendar(currentCalendar!.id, rootEventId)
      .then(() => {
        currentCalendar!.events = currentCalendar!.events.filter(x => x !== event)
      })
      .then(() => drawEventList());
  }
}

function editEvent(event: gapi.client.calendar.Event) {
  //console.log("edit strada");
  //console.table(event);
}
