export class UI {
  eventList: HTMLElement = document.getElementById("eventList")!;
  interval: HTMLInputElement = document.getElementById("interval") as HTMLInputElement;
  workdays: NodeListOf<HTMLInputElement> = document.getElementsByName("weekday") as NodeListOf<HTMLInputElement>;
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
  weekday = document.getElementsByName("weekday") as NodeListOf<HTMLInputElement>;
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
}
