import { templates, select, settings, classNames } from '../settings.js';
import { utils } from '../utils.js';
import { AmountWidget } from './AmountWidget.js';
import { DatePicker } from './DatePicker.js';
import { HourPicker } from './HourPicker.js';

export class Booking {
  constructor(bookingElement) {
    const thisBooking = this;

    thisBooking.render(bookingElement);
    thisBooking.initWidgets();
    thisBooking.getData();
  }

  render(bookingElement) {
    const thisBooking = this;

    const generatedHTML = templates.bookingWidget();

    thisBooking.dom = {};
    thisBooking.dom.wrapper = bookingElement;

    thisBooking.dom.wrapper.innerHTML = generatedHTML; // zawartość wrappera zamienia na kod wygenerowany z szblonu

    thisBooking.dom.peopleAmount = document.querySelector(select.booking.peopleAmount);
    thisBooking.dom.hoursAmount = document.querySelector(select.booking.hoursAmount);

    thisBooking.dom.datePicker = thisBooking.dom.wrapper.querySelector(select.widgets.datePicker.wrapper);
    thisBooking.dom.hourPicker = thisBooking.dom.wrapper.querySelector(select.widgets.hourPicker.wrapper);

    thisBooking.dom.tables = thisBooking.dom.wrapper.querySelectorAll(select.booking.tables);

  }

  initWidgets() {
    const thisBooking = this;

    thisBooking.peopleAmount = new AmountWidget(thisBooking.dom.peopleAmount);
    thisBooking.hoursAmount = new AmountWidget(thisBooking.dom.hoursAmount);
    thisBooking.datePicker = new DatePicker(thisBooking.dom.datePicker);
    thisBooking.hourPicker = new HourPicker(thisBooking.dom.hourPicker);

    thisBooking.dom.wrapper.addEventListener('updated', function () {
      thisBooking.updateDOM();
    });
  }


  getData() {
    const thisBooking = this;

    const startEndDates = {};
    startEndDates[settings.db.dateStartParamKey] = utils.dateToStr(thisBooking.datePicker.minDate); //dataToStr: zmiana ciągu znaków na datę np. 2020-05-15
    startEndDates[settings.db.dateEndParamKey] = utils.dateToStr(thisBooking.datePicker.maxDate);

    const endDate = {};
    endDate[settings.db.dateEndParamKey] = startEndDates[settings.db.dateEndParamKey];

    const params = {
      booking: utils.queryParams(startEndDates), // zmiana pary klucz-wartość z obiektu w ciąg znaków
      eventsCurrent: settings.db.notRepeatParam + '&' + utils.queryParams(startEndDates),
      eventsRepeat: settings.db.repeatParam + '&' + utils.queryParams(endDate),
    };

    //console.log('getData params', params);

    const urls = {
      booking: settings.db.url + '/' + settings.db.booking + '?' + params.booking, // pełne adresy zapytan tylko bez http by nadawały się też do https(szyfrowane)
      eventsCurrent: settings.db.url + '/' + settings.db.event + '?' + params.eventsCurrent,
      eventsRepeat: settings.db.url + '/' + settings.db.event + '?' + params.eventsRepeat,
    };

    //console.log('getData urls', urls);
    Promise.all([ // wysyłamy zapytanie pod trzy adresy
      fetch(urls.booking),
      fetch(urls.eventsCurrent),
      fetch(urls.eventsRepeat),
    ])
      .then(function ([bookingsResponse, eventsCurrentResponse, eventsRepeatResponse]) {
        return Promise.all([ // parsujemy odpowiedzi trzech zapytań /
          bookingsResponse.json(),
          eventsCurrentResponse.json(),
          eventsRepeatResponse.json(),
        ]);
      })
      .then(function ([bookings, eventsCurrent, eventsRepeat]) {
        thisBooking.parseData(bookings, eventsCurrent, eventsRepeat);
      });
  }

  parseData(bookings, eventsCurrent, eventsRepeat) {
    const thisBooking = this;

    thisBooking.booked = {};
    //console.log('arg eventsCurrent', eventsCurrent);

    for (let event of eventsCurrent) {
      //console.log('single event', event);
      thisBooking.makeBooked(event.date, event.hour, event.duration, event.table);
    }

    for (let event of bookings) {
      //console.log('booking', event);
      thisBooking.makeBooked(event.date, event.hour, event.duration, event.table);
    }
    for (let event of eventsRepeat) {
      //console.log('event repeat', event);
      if (event.repeat == 'daily') {
        for (let date = thisBooking.datePicker.minDate; date <= thisBooking.datePicker.maxDate; date = utils.addDays(date, 1)) {
          thisBooking.makeBooked(utils.dateToStr(date), event.hour, event.duration, event.table);
        }
      }
      if (event.repeat == 'weekly') {
        for (
          let date = thisBooking.datePicker.minDate;
          date <= thisBooking.datePicker.maxDate;
          date = utils.addDays(date, 7)
        ) {
          thisBooking.makeBooked(utils.dateToStr(date), event.hour, event.duration, event.table);
        }
      }
    }
    console.log('all bookings', thisBooking.booked);

    thisBooking.updateDOM();
  }
  makeBooked(date, hour, duration, table) {
    const thisBooking = this;

    if (typeof thisBooking.booked[date] == 'undefined') {
      thisBooking.booked[date] = {};
    }

    const bookedTime = utils.hourToNumber(hour);

    for (let hourBlock = bookedTime; hourBlock < bookedTime + duration; hourBlock += 0.5) {
      if (typeof thisBooking.booked[date][hourBlock] == 'undefined') {
        thisBooking.booked[date][hourBlock] = [];
      }

      thisBooking.booked[date][hourBlock].push(table);

    }
  }



  updateDOM() {
    console.log('show me updateDOM');

    const thisBooking = this;

    thisBooking.date = thisBooking.datePicker.value;
    thisBooking.hour = utils.hourToNumber(thisBooking.hourPicker.value);

    for (let table of thisBooking.dom.tables) {
      let tableId = table.getAttribute(settings.booking.tableIdAttribute);
      if (!isNaN(tableId)) {
        tableId = parseInt(tableId);
      }
      //console.log('tableId', tableId);

      if (
        typeof thisBooking.booked[thisBooking.date] != 'undefined' &&
        typeof thisBooking.booked[thisBooking.date][thisBooking.hour] != 'undefined' &&
        thisBooking.booked[thisBooking.date][thisBooking.hour].includes(tableId)
      ) {
        table.classList.add(classNames.booking.tableBooked);
        console.log('booked' + tableId);
      } else {
        table.classList.remove(classNames.booking.tableBooked);
        console.log('not booked' + tableId);
      }
    }

  }


}

