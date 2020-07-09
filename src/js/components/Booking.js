import {
  templates,
  select,
  settings,
  classNames
} from '../settings.js';
import {
  utils
} from '../utils.js';
import AmountWidget from './AmountWidget.js';
import DatePicker from './DatePicker.js';
import HourPicker from './HourPicker.js';

class Booking {
  constructor(elBooking) {
    const thisBooking = this;
    thisBooking.render(elBooking);
    thisBooking.initWidgets();
    thisBooking.getData();
    thisBooking.selectTable();
    console.log('thisBooking', thisBooking);
  }
  getData() {
    const thisBooking = this;
    const startDateParam = settings.db.dateStartParamKey + '=' + utils.dateToStr(thisBooking.datePicker.minDate);
    const endDateParam = settings.db.dateEndParamKey + '=' + utils.dateToStr(thisBooking.datePicker.maxDate);
    const params = {
      booking: [
        startDateParam,
        endDateParam
      ],
      eventsCurrent: [
        settings.db.notRepeatParam,
        startDateParam,
        endDateParam,

      ],
      eventsRepeat: [
        settings.db.repeatParam,
        endDateParam,

      ],
    };
    console.log('getData prarams', params);
    const urls = {
      //adres endpointu - zwroci liste rezerwacji
      booking: settings.db.url + '/' + settings.db.booking +
        '?' + params.booking.join('&'),
      //adres endpointu zwroci liste wydarzen jednorazowych
      eventsCurrent: settings.db.url + '/' + settings.db.event +
        '?' + params.eventsCurrent.join('&'),
      //adres endpointu zwroci liste wydarzen cyklicznych
      eventsRepeat: settings.db.url + '/' + settings.db.event +
        '?' + params.eventsRepeat.join('&'),

    };
    console.log('getData urls', urls);
    // laczenie z API - pobranie rezerwacji
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
          bookingsResponse.json(),
          eventsCurrentResponse.json(),
          eventsRepeatResponse.json(),
        ]);
      })
      .then(function ([bookings, eventsCurrent, eventsRepeat]) {
        // console.log('bookings', bookings);
        // console.log('eventsRepeat', eventsRepeat);
        // console.log('eventsCurrent', eventsCurrent);
        thisBooking.parseData(bookings, eventsCurrent, eventsRepeat);
      });
  }

  parseData(bookings, eventsCurrent, eventsRepeat) {
    const thisBooking = this;

    thisBooking.booked = {}; //tu beda inf o zajetych stolikach

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

    console.log('thisBooking.booked', thisBooking.booked);
    thisBooking.updateDOM();
  }
  makeBooked(date, hour, duration, table) {
    const thisBooking = this;

    if (typeof thisBooking.booked[date] == 'undefined') {
      thisBooking.booked[date] = {};
    }

    const startHour = utils.hourToNumber(hour);

    for (let hourBlock = startHour; hourBlock < startHour + duration; hourBlock += 0.5) {

      if (typeof thisBooking.booked[date][hourBlock] == 'undefined') {
        thisBooking.booked[date][hourBlock] = [];
      }
      thisBooking.booked[date][hourBlock].push(table);
    }
  }

  updateDOM() {
    const thisBooking = this;
    //wartosci wybrane przez użytkownika
    thisBooking.date = thisBooking.datePicker.value;
    thisBooking.hour = utils.hourToNumber(thisBooking.hourPicker.value);
    //allAvailable oznacza ze wszystkie stoliki tego dnia i o danej godzinie sa dostepne
    let allAvailable = false;

    if (
      typeof thisBooking.booked[thisBooking.date] == 'undefined' ||
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
        !allAvailable &&
        thisBooking.booked[thisBooking.date][thisBooking.hour].includes(tableId)
      ) {
        table.classList.add(classNames.booking.tableBooked);
      } else {
        table.classList.remove(classNames.booking.tableBooked);
      }
    }
    thisBooking.rangeSliderColor();
  }

  selectTable() {
    const thisBooking = this;
    for (let table of thisBooking.dom.tables) {
      table.addEventListener('click', function () {
        table.classList.add(classNames.booking.tableBooked);
        let tableSelectedId = parseInt(table.getAttribute(settings.booking.tableIdAttribute));
        console.log('tableSelected', tableSelectedId);
        thisBooking.tableSelected = tableSelectedId;
      });
    }

  }

  sendReservation() {
    const thisBooking = this;
    const url = settings.db.url + '/' + settings.db.booking;

    const payload = {
      date: thisBooking.datePicker.value,
      hour: thisBooking.hourPicker.value,
      table: thisBooking.tableSelected,
      duration: thisBooking.hoursAmount.value,
      ppl: thisBooking.peopleAmount.value,
      starters: [],
      phone: thisBooking.dom.phone.value,
      address: thisBooking.dom.address.value,
    };
    console.log('payload', payload);

    for (let starter of thisBooking.dom.starters) {
      if (starter.checked === true) {
        payload.starters.push(starter.value);
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
        thisBooking.getData();
      });
  }
  render(elBooking) {
    const thisBooking = this;
    /* generate HTML based on template */
    const generatedHTML = templates.bookingWidget();
    /* generate object */
    thisBooking.dom = {};

    thisBooking.dom.wrapper = elBooking;

    /* create element generatedDOM */
    const generatedDOM = utils.createDOMFromHTML(generatedHTML);
    /* add element to thisBooking.dom.wrapper */
    thisBooking.dom.wrapper.appendChild(generatedDOM);

    thisBooking.dom.peopleAmount = thisBooking.dom.wrapper.querySelector(select.booking.peopleAmount);
    thisBooking.dom.hoursAmount = thisBooking.dom.wrapper.querySelector(select.booking.hoursAmount);
    thisBooking.dom.datePicker = thisBooking.dom.wrapper.querySelector(select.widgets.datePicker.wrapper);
    thisBooking.dom.hourPicker = thisBooking.dom.wrapper.querySelector(select.widgets.hourPicker.wrapper);
    thisBooking.dom.tables = thisBooking.dom.wrapper.querySelectorAll(select.booking.tables);
    thisBooking.dom.phone = thisBooking.dom.wrapper.querySelector(select.booking.bookingPhone);
    thisBooking.dom.address = thisBooking.dom.wrapper.querySelector(select.booking.bookingAddress);
    thisBooking.dom.starters = thisBooking.dom.wrapper.querySelectorAll(select.booking.starters);
    thisBooking.dom.form = thisBooking.dom.wrapper.querySelector(select.booking.bookingForm);

  }
  rangeSliderColor() {
    const thisBooking = this;
    const rangeSlider = document.querySelector('.rangeSlider');
    let percentage = 0;
    const colorGrad = [];
    for (let i = 12; i < 24; i += 0.5) {
      percentage += 100 / 24;
      if ((typeof thisBooking.booked[thisBooking.datePicker.value][i] == 'undefined') || thisBooking.booked[thisBooking.datePicker.value][i].length == 1) {
        let color = `green ${percentage}%`;
        colorGrad.push(color);
        console.log('thisBooking.booked[thisBooking.datePicker.value][i]', thisBooking.booked[thisBooking.datePicker.value][i]);
      } else if (thisBooking.booked[thisBooking.datePicker.value][i].length == 2) {
        let color = `orange ${percentage}%`;
        colorGrad.push(color);
        console.log('thisBooking.booked[thisBooking.datePicker.value][i]', thisBooking.booked[thisBooking.datePicker.value][i]);
      } else {
        let color = `red ${percentage}%`;
        colorGrad.push(color);
        console.log('thisBooking.booked[thisBooking.datePicker.value][i]', thisBooking.booked[thisBooking.datePicker.value][i]);
      }
    }
    const linearGrad = colorGrad.join();
    const gradient = `linear-gradient(to right, ${linearGrad})`;
    rangeSlider.style.backgroundImage = gradient;
  }

  initWidgets() {
    const thisBooking = this;

    thisBooking.peopleAmount = new AmountWidget(thisBooking.dom.peopleAmount);
    thisBooking.hoursAmount = new AmountWidget(thisBooking.dom.hoursAmount);
    thisBooking.datePicker = new DatePicker(thisBooking.dom.datePicker);
    thisBooking.hourPicker = new HourPicker(thisBooking.dom.hourPicker);

    thisBooking.dom.datePicker.addEventListener('updated', function () {
      thisBooking.updateDOM();
    });
    thisBooking.dom.hourPicker.addEventListener('updated', function () {
      thisBooking.updateDOM();
    });
    thisBooking.dom.form.addEventListener('submit', function (event) {
      event.preventDefault();
      thisBooking.sendReservation();
      // thisBooking.getData();
    });
  }
}
export default Booking;
