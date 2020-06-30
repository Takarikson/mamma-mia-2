import { templates, select } from '../settings.js';
import { AmountWidget } from './AmountWidget.js';


export class Booking {
  constructor(bookingElem) {
    const thisBooking = this;

    thisBooking.render(bookingElem);
    thisBooking.initWidgets();

  }

  render(bookingElem) {
    const thisBooking = this;

    const generatedHTML = templates.bookingWidget();

    thisBooking.dom = {};
    thisBooking.dom.wrapper = bookingElem;
    thisBooking.dom.wrapper.innerHTML = generatedHTML; // zawartość wrappera zamienia na kod wygenerowany z szblonu
    thisBooking.dom.peopleAmount = document.querySelector(select.booking.peopleAmount);
    thisBooking.dom.hoursAmount = document.querySelector(select.booking.hoursAmount);


  }

  initWidgets() {
    const thisBooking = this;

    thisBooking.peopleAmount = new AmountWidget(thisBooking.dom.peopleAmount);
    thisBooking.hoursAmount = new AmountWidget(thisBooking.dom.hoursAmount);

  }
}
