export class BaseWidget {
  constructor(wrapperElement, initialValue) {
    const thisWidget = this;

    thisWidget.dom = {}; //tworzymy obiekt
    thisWidget.dom.wrapper = wrapperElement; // zapisujemy w nim właściwosć wrapper której wartością ma byc argument wrapperElement
    thisWidget.correctValue = initialValue; // we własciwosci thisWidget.correctValue zapisujemy wartosć argumentu initialValue
  }

  get value() { // uruchomi się przy próbie odczytania wartości
    const thisWidget = this;

    return thisWidget.correctValue;
  }

  set value(assignedValue) { // uruchomi sie przy próbie zmiany wartości value
    const thisWidget = this;

    const newValue = thisWidget.parseValue(assignedValue); // parseValue ma konwertować liczbę z tekstu wpisanego w inpucie na liczbę

    if (newValue != thisWidget.correctValue && thisWidget.isValid(newValue)) {
      thisWidget.correctValue = newValue;
      thisWidget.announce();
    }
    thisWidget.renderValue();
  }

  parseValue(newValue) { // jeśli jej się nie uda zwraca NaN
    return parseInt(newValue);
  }

  isValid(newValue) {
    return !isNaN(newValue); // prawda oznacza to nie jest NaN
  }

  renderValue() {
    //const thisWidget = this;
    //console.log('widget value:', thisWidget.value);
  }

  announce() {
    const thisWidget = this;

    const event = new CustomEvent('updated', {
      bubbles: true // dzieki właściwości bubles którą włączyliśmy po wykonaniu eventu na jakimś elemencie będzie on przekazywany rodzicowi i rodzicowi rodzica aż do body, document i window
    });
    thisWidget.dom.wrapper.dispatchEvent(event); // dom.wrapper to element na którym wywołujemy event
  }

} // zamkniecie klasy BaseWidget
