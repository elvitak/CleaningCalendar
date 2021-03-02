import { CleaningCalendar } from "./cleaningCalendar";
import { deleteEventFromGoogleCalendar, findOrCreateCalendar, handleSignin, handleSignout, insertEventToGoogleCalendar, listEventsFromGoogleCalendar, loadGapi, updateEventInGoogleCalendar } from "./gcal-api";
import { RRule, RRuleSet, rrulestr, Weekday, Frequency } from 'rrule'

/// <reference types="gapi.client.calendar" />

const today = new Date();
// const fv: string = (document.getElementById("f") as HTMLInputElement).value;
// const frequency = Frequency[fv as keyof typeof Frequency];
console.log(Frequency.YEARLY.toString());
// (document.getElementById("asdasd") as HTMLOptionElement).value = Frequency.YEARLY.toString();
const rule = new RRule({
  freq: 2,
  interval: 3,
  byweekday: [0, RRule.FR],
  // dtstart: new Date(Date.UTC(2012, 1, 1, 10, 30)),
  until: new Date(today.getFullYear() + 3, today.getMonth(), today.getDate())
});

console.log(rule.toString());

let currentCalendar: CleaningCalendar | undefined = undefined;

function drawEventList() {
  const ulEvents = document.getElementById("eventList")!;

  while (ulEvents.firstChild) {
    ulEvents.removeChild(ulEvents.firstChild);
  }

  // To avoid multiple copies of `get events`, create const with result.
  const currentEvents = currentCalendar!.events;
  for (let i = 0; i < currentEvents.length; i++) {
    const listItem = document.createElement("li");
    const iEvent = currentEvents[i];
    listItem.classList.add("list-group-item", "d-flex", "justify-content-between", "align-items-center");
    listItem.innerHTML = iEvent.summary || "Unknown";
    if (currentEvents[i].description !== undefined) {
      listItem.innerHTML += " Notes:" + iEvent.description;
    }
    listItem.innerHTML += ` <span class="badge">(
      <button type="button" name="editBtn" class="btn btn-default" aria-label="Edit"><i class="fas fa-edit"></i></button>
      <button type="button" name="deleteBtn" class="btn btn-default" aria-label="Delete"><i class="far fa-trash-alt"></i></button>
      )</span>`;
    listItem.querySelector("button[name='editBtn']")?.addEventListener("click", () => editEvent(iEvent));
    listItem.querySelector("button[name='deleteBtn']")?.addEventListener("click", () => deleteEvent(iEvent));
    ulEvents.appendChild(listItem);
  }
}

function handleCleaningEventSave(event: Event) {
  event.preventDefault();
  const eventId = (document.getElementById("eventId") as HTMLInputElement).value;
  const title = (document.getElementById("title") as HTMLInputElement).value;
  const frequency = (document.getElementById("frequency") as HTMLSelectElement).value;
  let rruleString: string = "";
  if (frequency === "WEEKLY") {
    const interval = (document.getElementById("interval") as HTMLInputElement).valueAsNumber;

    const fieldsWeekday = document.getElementsByName("weekday") as NodeListOf<HTMLInputElement>;
    const weekdays = [];
    for (let i = 0; i < fieldsWeekday.length; i++) {
      if (fieldsWeekday[i].checked) {
        weekdays.push(parseInt(fieldsWeekday[i].value));
      }
    }
    const rrule = new RRule({
      freq: RRule.WEEKLY,
      interval: interval,
      byweekday: weekdays,
      until: new Date(today.getFullYear() + 3, today.getMonth(), today.getDate())
    });
    rruleString = rrule.toString();
    console.log(rruleString);
  }
  const notes = (document.getElementById("notes") as HTMLTextAreaElement).value;
  if (eventId !== "") {
    updateEventInGoogleCalendar(currentCalendar!.id, eventId, title, rruleString, notes)
      .then(updatedEvent => currentCalendar!.editEvent(updatedEvent))
      .then(() => drawEventList());
  } else {
    insertEventToGoogleCalendar(currentCalendar!.id, title, rruleString, notes)
      .then(insertedEvent => currentCalendar!.addEvent(insertedEvent))
      .then(() => drawEventList());
  }
  (document.getElementById("cleaningEventForm") as HTMLFormElement).reset();
}

const loadingScreen = document.getElementById("loadingScreen")!;
const loginScreen = document.getElementById("loginScreen")!;
const mainScreen = document.getElementById("mainScreen")!;
const weekly = document.getElementById("weekly")!;
const monthly = document.getElementById("monthly")!;
const yearly = document.getElementById("yearly")!;
const intervalWeek = document.getElementById("intervalWeek")!;
const intervalMonth = document.getElementById("intervalMonth")!;
const intervalYear = document.getElementById("intervalYear")!;

function handleIsSignedInChange(isSignedIn: boolean): void {
  loadingScreen.classList.add("d-none");

  if (isSignedIn) {
    loginScreen.classList.add("d-none");
    mainScreen.classList.remove("d-none");
    findOrCreateCalendar().then(id => {
      currentCalendar = new CleaningCalendar(id);
      return id;
    }).then(id => {
      return listEventsFromGoogleCalendar(id)
        .then(events => currentCalendar!.events = events);
    }).then(() => drawEventList());
  } else {
    loginScreen.classList.remove("d-none");
    mainScreen.classList.add("d-none");
  }
}

(document.getElementById("frequency") as HTMLSelectElement)
  .addEventListener("change", handleFrequencyChange);

function handleFrequencyChange(this: HTMLSelectElement) {
  const frequencyType = this.value;

  intervalWeek.classList.toggle("d-none", frequencyType !== "WEEKLY");
  intervalMonth.classList.toggle("d-none", frequencyType !== "MONTHLY");
  intervalYear.classList.toggle("d-none", frequencyType !== "YEARLY");
  weekly.classList.toggle("d-none", frequencyType !== "WEEKLY");
  monthly.classList.toggle("d-none", frequencyType !== "MONTHLY");
  yearly.classList.toggle("d-none", frequencyType !== "YEARLY");
}


function preloadDates() {
  const datesOfMonth = document.getElementById("listOfMonthDates");
  for (let i = 1; i <= 31; i++) {
    let option = document.createElement("option") as HTMLOptionElement;
    option.value = i.toString();
    datesOfMonth?.appendChild(option);
  }
}

function preloadMonths() {
  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
  const monthFirstOption = document.getElementById("monthFirstOption")!;
  const monthSecondOption = document.getElementById("monthSecondOption")!;

  for (let i = 0; i < monthNames.length; i++) {
    let option = document.createElement("option") as HTMLOptionElement;
    option.value = i.toString();
    option.text = monthNames[i];

    monthFirstOption.appendChild(option.cloneNode(true));
    monthSecondOption.appendChild(option.cloneNode(true));
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

preloadDates();
preloadMonths();

function deleteEvent(event: gapi.client.calendar.Event) {
  if (window.confirm(`Do you really want to delete ${event.summary}`)) {
    deleteEventFromGoogleCalendar(currentCalendar!.id, event.id!)
      .then(() => currentCalendar!.deleteEvent(event))
      .then(() => drawEventList());
  }
}

function editEvent(event: gapi.client.calendar.Event) {
  (document.getElementById("title") as HTMLInputElement).value = event.summary || "";
  (document.getElementById("frequency") as HTMLInputElement).value = event.recurrence?.[0] || "";
  (document.getElementById("notes") as HTMLTextAreaElement).value = event.description || "";
  (document.getElementById("eventId") as HTMLInputElement).value = event.id || "";
}
