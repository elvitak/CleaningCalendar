import { CleaningCalendar } from "./cleaningCalendar";
import { deleteEventFromGoogleCalendar, findOrCreateCalendar, handleSignin, handleSignout, insertEventToGoogleCalendar, listEventsFromGoogleCalendar, loadGapi, updateEventInGoogleCalendar } from "./gcal-api";
import { RRule, RRuleSet, rrulestr, Weekday, Frequency } from 'rrule'
import { jobs } from "googleapis/build/src/apis/jobs";

/// <reference types="gapi.client.calendar" />

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

function readWeeklyRrule(): string {
  const interval = (document.getElementById("interval") as HTMLInputElement).valueAsNumber;

  const fieldsWeekday = document.getElementsByName("weekday") as NodeListOf<HTMLInputElement>;
  const weekdays = [];
  for (let i = 0; i < fieldsWeekday.length; i++) {
    if (fieldsWeekday[i].checked) {
      weekdays.push(parseInt(fieldsWeekday[i].value));
    }
  }
  // const today = new Date();
  const rrule = new RRule({
    freq: RRule.WEEKLY,
    interval: interval,
    byweekday: weekdays
    // until: new Date(today.getFullYear() + 3, today.getMonth(), today.getDate())
  });
  return rrule.toString();
}

function readMonthlyRule(): string {
  const interval = (document.getElementById("interval") as HTMLInputElement).valueAsNumber;
  const onSpecificDay = (document.getElementById("onSpecificDay") as HTMLInputElement).valueAsNumber;
  const montlyFirstChoice = document.getElementById("montlyFirstChoice") as HTMLInputElement;
  const monthlySecondChoice = document.getElementById("monthlySecondChoice") as HTMLInputElement;
  const weekCount = parseInt((document.getElementById("weekCountForMonthly") as HTMLSelectElement).value);
  const byweekday = parseInt((document.getElementById("weekdayMonthly") as HTMLSelectElement).value);

  //const today = new Date();
  if (montlyFirstChoice.checked) {
    const rrule = new RRule({
      freq: RRule.MONTHLY,
      interval: interval,
      bymonthday: onSpecificDay
      //until: new Date(today.getFullYear() + 3, today.getMonth(), today.getDate())
    });
    return rrule.toString();
  }
  if (monthlySecondChoice.checked) {
    const rrule = new RRule({
      freq: RRule.MONTHLY,
      interval: interval,
      bysetpos: weekCount,
      byweekday: byweekday
    });
    return rrule.toString();
  }
}

function readYearlyRule(): string {
  const yearlyFirstChoice = document.getElementById("yearlyFirstChoice") as HTMLInputElement;
  const yearlySecondChoice = document.getElementById("yearlySecondChoice") as HTMLInputElement;
  const interval = (document.getElementById("interval") as HTMLInputElement).valueAsNumber;
  const bymonthFirstOption = parseInt((document.getElementById("monthFirstOption") as HTMLSelectElement).value);
  const dateOfTheMonth = (document.getElementById("dateOfTheMonth") as HTMLInputElement).valueAsNumber;
  const weekCount = parseInt((document.getElementById("weekCountForYearly") as HTMLSelectElement).value);
  const byweekday = parseInt((document.getElementById("weekdayYearly") as HTMLSelectElement).value);
  const bymonthSecondOption = parseInt((document.getElementById("monthSecondOption") as HTMLSelectElement).value);

  if (yearlyFirstChoice.checked) {
    const rrule = new RRule({
      freq: RRule.YEARLY,
      interval: interval,
      bymonth: bymonthFirstOption,
      bymonthday: dateOfTheMonth
    });
    return rrule.toString();
  }
  if (yearlySecondChoice.checked) {
    const rrule = new RRule({
      freq: RRule.YEARLY,
      interval: interval,
      bysetpos: weekCount,
      byweekday: byweekday,
      bymonth: bymonthSecondOption
    });
    return rrule.toString();
  }
}

function handleCleaningEventSave(event: Event) {
  event.preventDefault();
  const eventId = (document.getElementById("eventId") as HTMLInputElement).value;
  const title = (document.getElementById("title") as HTMLInputElement).value;
  const frequency = (document.getElementById("frequency") as HTMLSelectElement).value;
  let rruleString: string = "";
  if (frequency === "WEEKLY") {
    rruleString = readWeeklyRrule();
  } else if (frequency === "MONTHLY") {
    rruleString = readMonthlyRule();
  } else {
    rruleString = readYearlyRule();
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
    option.value = (i + 1).toString();
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
  (document.getElementById("notes") as HTMLTextAreaElement).value = event.description || "";
  (document.getElementById("eventId") as HTMLInputElement).value = event.id || "";

  const rrule = RRule.fromString(event.recurrence![0]);
  const frequency = Frequency[rrule.options.freq!];
  (document.getElementById("frequency") as HTMLSelectElement).value = frequency;
  (document.getElementById("interval") as HTMLInputElement).valueAsNumber = rrule.options.interval;

  // (document.getElementById("frequency") as HTMLSelectElement).dispatchEvent(new Event('change'));
  handleFrequencyChange.apply(document.getElementById("frequency") as HTMLSelectElement);

  if (frequency === "WEEKLY") {
    fillInWeeklyRule(rrule);
  }
  if (frequency === "MONTHLY") {
    filInMonthlyRule(rrule);
  }
  if (frequency === "YEARLY") {
    fillInYearlyRule(rrule);
  }
}

function fillInWeeklyRule(rrule: RRule) {
  const elementsWeekday = document.getElementsByName("weekday") as NodeListOf<HTMLInputElement>;
  for (let i = 0; i < elementsWeekday.length; i++) {
    elementsWeekday[i].checked = rrule.options.byweekday.includes(i);
  }
}

function filInMonthlyRule(rrule: RRule) {
  if (rrule.options.bymonthday.length > 0) {
    (document.getElementById("montlyFirstChoice") as HTMLInputElement).checked = true;
    (document.getElementById("onSpecificDay") as HTMLInputElement).valueAsNumber = rrule.options.bymonthday[0];
  }
  if (rrule.options.byweekday.length > 0) {
    (document.getElementById("monthlySecondChoice") as HTMLInputElement).checked = true;
    (document.getElementById("weekCountForMonthly") as HTMLSelectElement).value = rrule.options.bysetpos[0].toString();
    (document.getElementById("weekdayMonthly") as HTMLSelectElement).value = rrule.options.byweekday[0].toString();
  }
}

function fillInYearlyRule(rrule: RRule) {
  if (rrule.options.bymonth.length > 0) {
    (document.getElementById("yearlyFirstChoice") as HTMLInputElement).checked = true;
    (document.getElementById("dateOfTheMonth") as HTMLInputElement).valueAsNumber = rrule.options.bymonthday[0];
    (document.getElementById("monthFirstOption") as HTMLSelectElement).value = rrule.options.bymonth[0].toString();

  }
  if (rrule.options.byweekday.length > 0) {
    (document.getElementById("yearlySecondChoice") as HTMLInputElement).checked = true;
    (document.getElementById("weekCountForYearly") as HTMLSelectElement).value = rrule.options.bysetpos[0].toString();
    (document.getElementById("weekdayYearly") as HTMLSelectElement).value = rrule.options.byweekday[0].toString();
    (document.getElementById("monthSecondOption") as HTMLSelectElement).value = rrule.options.bymonth[0].toString();
  }
}
