import { CleaningCalendar } from "./cleaningCalendar";
import { deleteEventFromGoogleCalendar, findOrCreateCalendar, handleSignin, handleSignout, insertEventToGoogleCalendar, listEventsFromGoogleCalendar, loadGapi, updateEventInGoogleCalendar } from "./gcal-api";
import { RRule, RRuleSet, rrulestr, Weekday, Frequency } from 'rrule'
import { UI } from "./ui";

/// <reference types="gapi.client.calendar" />

let currentCalendar: CleaningCalendar | undefined = undefined;
const ui: UI = new UI();

function drawEventList() {
  ui.clearEventList();

  // To avoid multiple copies of `get events`, create const with result.
  const currentEvents = currentCalendar!.events;
  for (let i = 0; i < currentEvents.length; i++) {
    const listItem = document.createElement("li");
    const iEvent = currentEvents[i];
    const rrule = RRule.fromString(iEvent.recurrence![0]);
    const nextEventDate = rrule.after(new Date()).toDateString();
    const ruleText = rrule.toText(
    );

    listItem.classList.add("list-group-item", "list-group-item-action");

    listItem.innerHTML = `
        <div class="d-flex w-100 justify-content-between">
          <h5 class="mb-1">${iEvent.summary || "Unknown"}</h5>
          <small>
            <button type="button" name="editBtn" class="btn btn-default" aria-label="Edit"><i class="fas fa-edit"></i></button>
            <button type="button" name="deleteBtn" class="btn btn-default" aria-label="Delete"><i class="far fa-trash-alt"></i></button>
          </small>
        </div>
        <p class="mb-1">${ruleText} <small>(next: ${nextEventDate})</small></p>
        ${iEvent.description ? `<small>${iEvent.description}</small>` : ""}
    `;

    listItem.querySelector("button[name='editBtn']")?.addEventListener("click", () => editEvent(iEvent));
    listItem.querySelector("button[name='deleteBtn']")?.addEventListener("click", () => deleteEvent(iEvent));
    ui.eventList.appendChild(listItem);
  }
}

function readWeeklyRrule(): RRule {
  const interval = ui.interval.valueAsNumber;
  const weekdays = [];
  for (let i = 0; i < ui.workdays.length; i++) {
    if (ui.workdays[i].checked) {
      weekdays.push(parseInt(ui.workdays[i].value));
    }
  }
  const rrule = new RRule({
    freq: RRule.WEEKLY,
    interval: interval,
    byweekday: weekdays
  });
  return rrule;
}

function readMonthlyRule(): RRule {
  const interval = ui.interval.valueAsNumber;
  const onSpecificDay = ui.onSpecificDay.valueAsNumber;
  const montlyFirstChoice = ui.montlyFirstChoice;
  const weekCount = parseInt(ui.weekCountForMonthly.value);
  const byweekday = parseInt(ui.weekdayMonthly.value);

  if (montlyFirstChoice.checked) {
    const rrule = new RRule({
      freq: RRule.MONTHLY,
      interval: interval,
      bymonthday: onSpecificDay
    });
    return rrule;
  } else {
    //if (monthlySecondChoice.checked) {
    const rrule = new RRule({
      freq: RRule.MONTHLY,
      interval: interval,
      bysetpos: weekCount,
      byweekday: byweekday
    });
    return rrule;
  }
}

function readYearlyRule(): RRule {
  const interval = ui.interval.valueAsNumber;
  const bymonthFirstOption = parseInt(ui.monthFirstOption.value);
  const dateOfTheMonth = ui.dateOfTheMonth.valueAsNumber;
  const weekCount = parseInt(ui.weekCountForYearly.value);
  const byweekday = parseInt(ui.weekdayYearly.value);
  const bymonthSecondOption = parseInt(ui.monthSecondOption.value);

  if (ui.yearlyFirstChoice.checked) {
    const rrule = new RRule({
      freq: RRule.YEARLY,
      interval: interval,
      bymonth: bymonthFirstOption,
      bymonthday: dateOfTheMonth
    });
    return rrule;
  } else {
    //if (yearlySecondChoice.checked) {
    const rrule = new RRule({
      freq: RRule.YEARLY,
      interval: interval,
      bysetpos: weekCount,
      byweekday: byweekday,
      bymonth: bymonthSecondOption
    });
    return rrule;
  }
}

function handleCleaningEventSave(this: HTMLFormElement, event: Event) {
  event.preventDefault();
  event.stopPropagation();

  if (!this.checkValidity()) {
    this.classList.add("was-validated");
    return;
  }

  const eventId = ui.eventId.value;
  const title = ui.title.value;
  let rrule: RRule;
  if (ui.frequency.value === "WEEKLY") {
    rrule = readWeeklyRrule();
  } else if (ui.frequency.value === "MONTHLY") {
    rrule = readMonthlyRule();
  } else {
    rrule = readYearlyRule();
  }

  const notes = ui.notes.value;

  const afterDate = new Date();
  afterDate.setDate(afterDate.getDate() - 1);
  const startDate = rrule.after(afterDate).toISOString().substring(0, 10);

  if (eventId !== "") {
    updateEventInGoogleCalendar(currentCalendar!.id, eventId, title, rrule.toString(), notes, startDate)
      .then(updatedEvent => currentCalendar!.editEvent(updatedEvent))
      .then(() => drawEventList())
      .finally(() => {
        this.classList.remove("was-validated");
        ui.cleaningEventForm.reset();
        ui.alertSaved.classList.remove("visually-hidden");
        ui.alertSaved.scrollIntoView();
        setTimeout(() => ui.alertSaved.classList.add("visually-hidden"), 3000);
      });
  } else {
    insertEventToGoogleCalendar(currentCalendar!.id, title, rrule.toString(), notes, startDate)
      .then(insertedEvent => currentCalendar!.addEvent(insertedEvent))
      .then(() => drawEventList())
      .finally(() => {
        this.classList.remove("was-validated");
        ui.cleaningEventForm.reset();
        ui.alertSaved.classList.remove("visually-hidden");
        ui.alertSaved.scrollIntoView();
        setTimeout(() => ui.alertSaved.classList.add("visually-hidden"), 3000);
      });
  }
}

function handleIsSignedInChange(isSignedIn: boolean): void {
  ui.loadingScreen.classList.add("d-none");

  if (isSignedIn) {
    ui.loginScreen.classList.add("d-none");
    ui.mainScreen.classList.remove("d-none");
    findOrCreateCalendar().then(id => {
      currentCalendar = new CleaningCalendar(id);
      return id;
    }).then(id => {
      return listEventsFromGoogleCalendar(id)
        .then(events => currentCalendar!.events = events);
    }).then(() => drawEventList());
  } else {
    ui.loginScreen.classList.remove("d-none");
    ui.mainScreen.classList.add("d-none");
  }
}

ui.frequency.addEventListener("change", handleFrequencyChange);

function handleFrequencyChange(this: HTMLSelectElement) {
  const frequencyType = this.value;

  ui.intervalWeek.classList.toggle("d-none", frequencyType !== "WEEKLY");
  ui.intervalMonth.classList.toggle("d-none", frequencyType !== "MONTHLY");
  ui.intervalYear.classList.toggle("d-none", frequencyType !== "YEARLY");
  ui.weekly.classList.toggle("d-none", frequencyType !== "WEEKLY");
  ui.monthly.classList.toggle("d-none", frequencyType !== "MONTHLY");
  ui.yearly.classList.toggle("d-none", frequencyType !== "YEARLY");

  if (frequencyType === "WEEKLY") {
    ui.weeklyFrequency.disabled = false;
    ui.monthlyFrequency.disabled = true;
    ui.yearlyFrequency.disabled = true;
  } else if (frequencyType === "MONTHLY") {
    ui.weeklyFrequency.disabled = true;
    ui.monthlyFrequency.disabled = false;
    ui.yearlyFrequency.disabled = true;
  } else if (frequencyType === "YEARLY") {
    ui.weeklyFrequency.disabled = true;
    ui.monthlyFrequency.disabled = true;
    ui.yearlyFrequency.disabled = false;
  }
}


function preloadDates() {
  for (let i = 1; i <= 31; i++) {
    let option = document.createElement("option") as HTMLOptionElement;
    option.value = i.toString();
    ui.listOfMonthDates?.appendChild(option);
  }
}

function preloadMonths() {
  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

  for (let i = 0; i < monthNames.length; i++) {
    let option = document.createElement("option") as HTMLOptionElement;
    option.value = (i + 1).toString();
    option.text = monthNames[i];

    ui.monthFirstOption.appendChild(option.cloneNode(true));
    ui.monthSecondOption.appendChild(option.cloneNode(true));
  }
}

loadGapi(handleIsSignedInChange);

// Event Listeners for Login/Logout
document.getElementById("singInBtn")!
  .addEventListener("click", handleSignin);
document.getElementById("singOutBtn")!
  .addEventListener("click", handleSignout);

//Event Listener for save button
ui.cleaningEventForm.addEventListener("submit", handleCleaningEventSave);

//Event Listener for checked/unchecked weekdays
ui.weekday.forEach(elementWeekday =>
  elementWeekday.addEventListener("change", atLeastOneDayIsChecked));

//Event Listener for monthly radio choices
ui.monthlyRadio.forEach(radio =>
  radio.addEventListener("change", monthlyRadioChoice));

//Event Listener for yearly radio choices
ui.yearlyRadios.forEach(radio =>
  radio.addEventListener("change", yearlyRadiosChoice));

preloadDates();
preloadMonths();

function deleteEvent(event: gapi.client.calendar.Event) {
  if (window.confirm(`Do you really want to delete ${event.summary}`)) {
    deleteEventFromGoogleCalendar(currentCalendar!.id, event.id!)
      .then(() => currentCalendar!.deleteEvent(event))
      .then(() => drawEventList())
      .then(() => {
        ui.alertRemoved.classList.remove("visually-hidden");
        ui.alertRemoved.scrollIntoView();
        setTimeout(() => ui.alertRemoved.classList.add("visually-hidden"), 3000);
      })
  }
}

function editEvent(event: gapi.client.calendar.Event) {
  ui.cleaningEventForm.classList.remove("was-validated");
  ui.cleaningEventForm.scrollIntoView();
  ui.title.value = event.summary || "";
  ui.notes.value = event.description || "";
  ui.eventId.value = event.id || "";

  const rrule = RRule.fromString(event.recurrence![0]);
  const frequency = Frequency[rrule.options.freq!];
  ui.frequency.value = frequency;
  ui.interval.valueAsNumber = rrule.options.interval;

  handleFrequencyChange.apply(ui.frequency);

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
  const elementsWeekday = ui.weekday;
  for (let i = 0; i < elementsWeekday.length; i++) {
    elementsWeekday[i].checked = rrule.options.byweekday.includes(i);
  }
}

function filInMonthlyRule(rrule: RRule) {
  if (rrule.options.bymonthday.length > 0) {
    ui.montlyFirstChoice.checked = true;
    ui.onSpecificDay.valueAsNumber = rrule.options.bymonthday[0];
  }
  if (rrule.options.byweekday.length > 0) {
    ui.monthlySecondChoice.checked = true;
    ui.weekCountForMonthly.value = rrule.options.bysetpos[0].toString();
    ui.weekdayMonthly.value = rrule.options.byweekday[0].toString();
  }
}

function fillInYearlyRule(rrule: RRule) {
  if (rrule.options.bymonth.length > 0) {
    ui.yearlyFirstChoice.checked = true;
    ui.dateOfTheMonth.valueAsNumber = rrule.options.bymonthday[0];
    ui.monthFirstOption.value = rrule.options.bymonth[0].toString();

  }
  if (rrule.options.byweekday.length > 0) {
    ui.yearlySecondChoice.checked = true;
    ui.weekCountForYearly.value = rrule.options.bysetpos[0].toString();
    ui.weekdayYearly.value = rrule.options.byweekday[0].toString();
    ui.monthSecondOption.value = rrule.options.bymonth[0].toString();
  }
}

function atLeastOneDayIsChecked() {
  const elementsWeekday = ui.weekday;
  let isChecked = false;
  for (let i = 0; i < elementsWeekday.length; i++) {
    if (elementsWeekday[i].checked) {
      isChecked = true;
    }
  }
  for (let j = 0; j < elementsWeekday.length; j++) {
    elementsWeekday[j].required = !isChecked;
  }
}

function monthlyRadioChoice(this: HTMLInputElement) {
  if (this.id === "montlyFirstChoice") {
    ui.onSpecificDay.required = true;
    ui.weekCountForMonthly.required = false;
    ui.weekdayMonthly.required = false;
  } else { // this.id === "montlySecondChoice"
    ui.onSpecificDay.required = false;
    ui.weekCountForMonthly.required = true;
    ui.weekdayMonthly.required = true;
  }
}

function yearlyRadiosChoice(this: HTMLInputElement) {
  if (this.id === "yearlyFirstChoice") {
    ui.monthFirstOption.required = true;
    ui.dateOfTheMonth.required = true;
    ui.weekCountForYearly.required = false;
    ui.weekdayYearly.required = false;
    ui.monthSecondOption.required = false;
  } else {
    ui.monthFirstOption.required = false;
    ui.dateOfTheMonth.required = false;
    ui.weekCountForYearly.required = true;
    ui.weekdayYearly.required = true;
    ui.monthSecondOption.required = true;
  }
}
