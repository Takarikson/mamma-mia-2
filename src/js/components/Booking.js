import { templates, select, settings, classNames } from '../settings.js';
import utils from '../utils.js';
import AmountWidget from './AmountWidget.js';
import DatePicker from './DatePicker.js';
import HourPicker from './HourPicker.js';
export class Booking {
  constructor(element) {
    const thisBooking = this;
    thisBooking.render(element);
    thisBooking.initWidgets();
    thisBooking.getData();
    thisBooking.selectTable();

  }

  getData() {
    const thisBooking = this;

    const starDateParam = settings.db.dateStartParamKey + '=' + utils.dateToStr(thisBooking.datePicker.minDate);
    const endDateParam = settings.db.dateEndParamKey + '=' + utils.dateToStr(thisBooking.datePicker.maxDate);

    const params = {
      booking: [
        starDateParam,
        endDateParam,
      ],
      eventsCurrent: [
        settings.db.notRepeatParam,
        starDateParam,
        endDateParam,
      ],
      eventsRepeat: [
        settings.db.repeatParam,
        endDateParam,
      ],
    };

    // console.log('getData params', params);

    const urls = {
      booking: settings.db.url + '/' + settings.db.booking
        + '?' + params.booking.join('&'), //włąsciwość będzie zawierać adres endpointu API który zwróci listę rezeerwacji
      eventsCurrent: settings.db.url + '/' + settings.db.event
        + '?' + params.eventsCurrent.join('&'), //zwróci listę wydarzeń jednorazowych
      eventsRepeat: settings.db.url + '/' + settings.db.event + '?'
        + params.eventsRepeat.join('&'), //zwróci listę wydarzeń cyklicznych
    };

    // console.log('getData urls', urls);

    //funkcja fetch która połączy się z serwerem API (pobranie rezerwacji)
    Promise.all([
      fetch(urls.booking),
      fetch(urls.eventsCurrent),
      fetch(urls.eventsRepeat),
    ])
      .then(function (allResponses) {
        const bookingsResponse = allResponses[0];
        const eventsCurrentResponse = allResponses[1];
        const eventsRepeatResponse = allResponses[2];
        return Promise.all([
          bookingsResponse.json(), //konwertowanie odpowiedzi z formatu json
          eventsCurrentResponse.json(),
          eventsRepeatResponse.json(),
        ]);
      })
      .then(function ([bookings, eventsCurrent, eventsRepeat]) { //odpowiedź z serwera po przerobieniu json na tablice lub obiekt
        // console.log(bookings);
        // console.log(eventsCurrent);
        // console.log(eventsRepeat);
        thisBooking.parseData(bookings, eventsCurrent, eventsRepeat);
      });
  }

  //funkcja sprawdzająca czy o wybranej przez klienta godzinie nie ma już innej rezerwacji
  parseData(bookings, eventsCurrent, eventsRepeat) {
    const thisBooking = this;

    thisBooking.booked = {}; //obiekt w którym są zapisane inf o zajętych stolikach

    for (let item of bookings) {
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    for (let item of eventsCurrent) {
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }


    const minDate = thisBooking.datePicker.minDate;
    const maxDate = thisBooking.datePicker.maxDate;

    for (let item of eventsRepeat) {
      if (item.repeat == 'daily') {
        for (let loopDate = minDate; loopDate <= maxDate; loopDate = utils.addDays(loopDate, 1)) {
          thisBooking.makeBooked(utils.dateToStr(loopDate), item.hour, item.duration, item.table);
        }
      }
    }

    // console.log('thisBooking.booked', thisBooking.booked);

    thisBooking.updateDOM();
  }
  makeBooked(date, hour, duration, table) {
    const thisBooking = this;

    if (typeof thisBooking.booked[date] == 'undefined') {
      thisBooking.booked[date] = {};
    }

    const startHour = utils.hourToNumber(hour);

    for (let hourBlock = startHour; hourBlock < startHour + duration; hourBlock += 0.5) {
      // console.log('loop', hourBlock);

      if (typeof thisBooking.booked[date][hourBlock] == 'undefined') {
        thisBooking.booked[date][hourBlock] = [];
      }

      thisBooking.booked[date][hourBlock].push(table);
    }
  }

  updateDOM() {
    const thisBooking = this;

    thisBooking.date = thisBooking.datePicker.value;
    thisBooking.hour = utils.hourToNumber(thisBooking.hourPicker.value);

    let allAvailable = false;

    if (
      typeof thisBooking.booked[thisBooking.date] == 'undefined'
      ||
      typeof thisBooking.booked[thisBooking.date][thisBooking.hour] == 'undefined'
    ) {
      allAvailable = true;
    }


    for (let table of thisBooking.dom.tables) {

      let tableId = table.getAttribute(settings.booking.tableIdAttribute);
      if (!isNaN(tableId)) {
        tableId = parseInt(tableId);
      }

      if (
        !allAvailable
        &&
        thisBooking.booked[thisBooking.date][thisBooking.hour].includes(tableId)
      ) {
        table.classList.add(classNames.booking.tableBooked);
      } else {
        table.classList.remove(classNames.booking.tableBooked);
      }
    }
  }

  selectTable() {
    const thisBooking = this;
    thisBooking.date = thisBooking.datePicker.value;
    thisBooking.hour = utils.hourToNumber(thisBooking.hourPicker.value);

    for (let table of thisBooking.dom.tables) {
      console.log('table: ', table);
      table.addEventListener('click', function () {
        const tableId = table.getAttribute(settings.booking.tableIdAttribute);
        const tableBooked = table.classList.contains(classNames.booking.tableBooked);

        let tableBookedId = thisBooking.booked[thisBooking.date][thisBooking.hour];
        console.log(tableBookedId);
        if (!isNaN(tableBookedId)) {
          tableBookedId = parseInt(tableBookedId);
        }

        if (!tableBooked) {
          table.classList.add(classNames.booking.tableBooked);
          //console.log('table selected: ', tableId);
        } else if (tableBooked && tableId != tableBookedId) {
          table.classList.remove(classNames.booking.tableBooked);
          //console.log('available again: ', tableId);
        }
      });
    }
  }

  sendReservation() {
    const thisBooking = this;

    const url = settings.db.url + '/' + settings.db.booking;

    const payload = {
      date: thisBooking.datePicker.value,
      hour: thisBooking.hourPicker.value,
      table: {},
      ppl: thisBooking.peopleAmount.value,
      duration: thisBooking.hoursAmount.value,
      starters: [],
      phone: thisBooking.dom.phone.value,
      address: thisBooking.dom.address.value,
    };
    // console.log(payload);

    for (let starter of thisBooking.dom.starters) {
      if (starter.checked == true) {
        payload.starters.push(starter.value);
        console.log(starter.value);
      }
    }

    for (let table of thisBooking.dom.tables) {
      const tableBooked = table.classList.contains(classNames.booking.tableSelected);
      if (tableBooked) {
        thisBooking.tableId = table.getAttribute(settings.booking.tableIdAttribute);
        thisBooking.tableId = parseInt(thisBooking.tableId);
        payload.table = thisBooking.tableId;
        console.log(payload.table);
      }
    }

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    };

    fetch(url, options)
      .then(function (response) {
        return response.json();
      }).then(function (parsedResponse) {
        console.log('parsedResponse', parsedResponse);
        thisBooking.makeBooked(
          payload.date,
          payload.hour,
          payload.duration,
          payload.table
        );
        console.log('bookingi: ', thisBooking.booked[payload.date]);
      });

  }


  render(element) {
    const thisBooking = this;

    const generatHTML = templates.bookingWidget();
    thisBooking.dom = {}; //stworzenie pustego obiektu
    thisBooking.dom.wrapper = element; //zapisanie do obiektu właściwości wrapper równą otrzymanemu argumentowi
    thisBooking.dom.wrapper.innerHTML = generatHTML;
    thisBooking.dom.peopleAmount = thisBooking.dom.wrapper.querySelector(select.booking.peopleAmount);
    thisBooking.dom.hoursAmount = thisBooking.dom.wrapper.querySelector(select.booking.hoursAmount);
    thisBooking.dom.datePicker = thisBooking.dom.wrapper.querySelector(select.widgets.datePicker.wrapper);
    thisBooking.dom.hourPicker = thisBooking.dom.wrapper.querySelector(select.widgets.hourPicker.wrapper);
    thisBooking.dom.tables = thisBooking.dom.wrapper.querySelectorAll(select.booking.tables);
    thisBooking.dom.form = thisBooking.dom.wrapper.querySelector(select.booking.bookingForm);
    console.log(thisBooking.dom.form);
    thisBooking.dom.submitButton = thisBooking.dom.wrapper.querySelector(select.booking.bookTable);
    thisBooking.dom.phone = thisBooking.dom.wrapper.querySelector(select.booking.bookPhone);
    thisBooking.dom.address = thisBooking.dom.wrapper.querySelector(select.booking.bookAddress);
    thisBooking.dom.starters = thisBooking.dom.wrapper.querySelectorAll(
      select.booking.starters
    );
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

    thisBooking.dom.submitButton.addEventListener('click', function () {
      // event.preventDefault();
      thisBooking.sendReservation();
      console.log('reservation done!!!');
    });
  }
}
export default Booking;
