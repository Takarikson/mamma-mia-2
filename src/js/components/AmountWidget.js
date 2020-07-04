import { select, settings } from '../settings.js';

import { BaseWidget } from './BaseWidget.js';

export class AmountWidget extends BaseWidget { // informujemy że klasa jest rozszerzeniem klasy BW czyli będzie z niej dziedziczyć
  constructor(wrapper) {
    super(wrapper, settings.amountWidget.defaultValue); // wywołanie f super zawsze na początku constructora - to konstruktor klasy BaseWidget. Właśnie dlatego podaliśmy mu dwa argumenty: element który jest wrapperem widgetu, oraz domyślną wartość odczytaną z obiektu settings.

    const thisWidget = this;

    thisWidget.getElements();
    thisWidget.initActions();
  }

  getElements() {
    const thisWidget = this;

    thisWidget.dom.input = thisWidget.dom.wrapper.querySelector(select.widgets.amount.input);
    thisWidget.dom.linkDecrease = thisWidget.dom.wrapper.querySelector(select.widgets.amount.linkDecrease);
    thisWidget.dom.linkIncrease = thisWidget.dom.wrapper.querySelector(select.widgets.amount.linkIncrease);
  }

  isValid(newValue) { // metoda nieco nadpisana wzgledem isValid z BW; dla AW setter z BW będzie korzystał z tej nadpisanej wersji
    return !isNaN(newValue) && newValue >= settings.amountWidget.defaultMin && newValue <= settings.amountWidget.defaultMax;
  }

  initActions() {

    const thisWidget = this;

    thisWidget.dom.input.addEventListener('change', function () {
      thisWidget.value = thisWidget.dom.input.value;
    });

    thisWidget.dom.linkDecrease.addEventListener('click', function (event) {
      event.preventDefault();
      thisWidget.value = --thisWidget.dom.input.value;
    });

    thisWidget.dom.linkIncrease.addEventListener('click', function (event) {
      event.preventDefault();
      thisWidget.value = ++thisWidget.dom.input.value;
    });
  }

  renderValue() {
    const thisWidget = this;

    thisWidget.dom.input.value = thisWidget.value;
  }

} // zamkniecie klasy AmountWidget
