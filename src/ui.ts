export class UI {
  eventList: HTMLElement = document.getElementById("eventList")!;
  interval: HTMLInputElement = document.getElementById("interval") as HTMLInputElement;
  weekday: HTMLInputElement[] = Array.from(document.getElementsByName("weekday") as NodeListOf<HTMLInputElement>);
  onSpecificDay: HTMLInputElement = document.getElementById("onSpecificDay") as HTMLInputElement;
  montlyFirstChoice: HTMLInputElement = document.getElementById("montlyFirstChoice") as HTMLInputElement;
  monthlySecondChoice = document.getElementById("monthlySecondChoice") as HTMLInputElement;
  weekCountForMonthly: HTMLSelectElement = document.getElementById("weekCountForMonthly") as HTMLSelectElement;
  weekdayMonthly: HTMLSelectElement = document.getElementById("weekdayMonthly") as HTMLSelectElement;
  yearlyFirstChoice: HTMLInputElement = document.getElementById("yearlyFirstChoice") as HTMLInputElement;
  yearlySecondChoice = document.getElementById("yearlySecondChoice") as HTMLInputElement;
  monthFirstOption: HTMLSelectElement = document.getElementById("monthFirstOption") as HTMLSelectElement;
  dateOfTheMonth: HTMLInputElement = document.getElementById("dateOfTheMonth") as HTMLInputElement;
  weekCountForYearly: HTMLSelectElement = document.getElementById("weekCountForYearly") as HTMLSelectElement;
  weekdayYearly: HTMLSelectElement = document.getElementById("weekdayYearly") as HTMLSelectElement;
  monthSecondOption: HTMLSelectElement = document.getElementById("monthSecondOption") as HTMLSelectElement;
  eventId: HTMLInputElement = document.getElementById("eventId") as HTMLInputElement;
  title: HTMLInputElement = document.getElementById("title") as HTMLInputElement;
  frequency: HTMLSelectElement = document.getElementById("frequency") as HTMLSelectElement;
  notes: HTMLTextAreaElement = document.getElementById("notes") as HTMLTextAreaElement;
  loadingScreen = document.getElementById("loadingScreen")!;
  loginScreen = document.getElementById("loginScreen")!;
  mainScreen = document.getElementById("mainScreen")!;
  weekly = document.getElementById("weekly")!;
  monthly = document.getElementById("monthly")!;
  yearly = document.getElementById("yearly")!;
  intervalWeek = document.getElementById("intervalWeek")!;
  intervalMonth = document.getElementById("intervalMonth")!;
  intervalYear = document.getElementById("intervalYear")!;
  cleaningEventForm = document.getElementById("cleaningEventForm") as HTMLFormElement;
  listOfMonthDates = document.getElementById("listOfMonthDates");
  monthlyRadio = document.getElementsByName("monthlyRadio");
  yearlyRadios = document.getElementsByName("yearlyRadios");
  weeklyFrequency: HTMLFieldSetElement = document.getElementById("weeklyFrequency") as HTMLFieldSetElement;
  monthlyFrequency: HTMLFieldSetElement = document.getElementById("monthlyFrequency") as HTMLFieldSetElement;
  yearlyFrequency: HTMLFieldSetElement = document.getElementById("yearlyFrequency") as HTMLFieldSetElement;
  alertSaved: HTMLDivElement = document.getElementById("alertSaved") as HTMLDivElement;
  alertRemoved: HTMLDivElement = document.getElementById("alertRemoved") as HTMLDivElement;

  clearEventList() {
    while (this.eventList.firstChild) {
      this.eventList.removeChild(this.eventList.firstChild);
    }
  }

  resetFormValidations() {
    // depending on frequency type, different blocks are shown
    const frequencyType = this.frequency.value;
    this.intervalWeek.classList.toggle("d-none", frequencyType !== "WEEKLY");
    this.intervalMonth.classList.toggle("d-none", frequencyType !== "MONTHLY");
    this.intervalYear.classList.toggle("d-none", frequencyType !== "YEARLY");
    this.weekly.classList.toggle("d-none", frequencyType !== "WEEKLY");
    this.monthly.classList.toggle("d-none", frequencyType !== "MONTHLY");
    this.yearly.classList.toggle("d-none", frequencyType !== "YEARLY");

    this.weeklyFrequency.disabled = (frequencyType !== "WEEKLY");
    this.monthlyFrequency.disabled = (frequencyType !== "MONTHLY");
    this.yearlyFrequency.disabled = (frequencyType !== "YEARLY");

    // at least one weekday is checked

    let isChecked = false;
    for (let i = 0; i < this.weekday.length; i++) {
      if (this.weekday[i].checked) {
        isChecked = true;
      }
    }
    for (let j = 0; j < this.weekday.length; j++) {
      this.weekday[j].required = !isChecked;
    }

    // Monthly radio choice. Which one is required and which one is not.
    if (this.montlyFirstChoice.checked) {
      this.onSpecificDay.required = true;
      this.weekCountForMonthly.required = false;
      this.weekdayMonthly.required = false;
    } else { // montlySecondChoice
      this.onSpecificDay.required = false;
      this.weekCountForMonthly.required = true;
      this.weekdayMonthly.required = true;
    }

    // yearly radio choice. Which one is required and which one is not.

    if (this.yearlyFirstChoice.checked) {
      this.monthFirstOption.required = true;
      this.dateOfTheMonth.required = true;
      this.weekCountForYearly.required = false;
      this.weekdayYearly.required = false;
      this.monthSecondOption.required = false;
    } else {
      this.monthFirstOption.required = false;
      this.dateOfTheMonth.required = false;
      this.weekCountForYearly.required = true;
      this.weekdayYearly.required = true;
      this.monthSecondOption.required = true;
    }
  }

  clearForm() {
    this.cleaningEventForm.classList.remove("was-validated");
    this.cleaningEventForm.reset();
    this.resetFormValidations();
  }
}
