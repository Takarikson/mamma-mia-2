export class BaseWidget {
  constructor(wrapperElement, initialValue) {
    const thisWidget = this;

    thisWidget.dom = {}; //tworzymy obiekt
    thisWidget.dom.wrapper = wrapperElement; // zapisujemy w nim właściwosć wrapper której wartością ma byc argument wrapperElement
    thisWidget.correctValue = initialValue; // we własciwosci thisWidget.correctValue zapisujemy wartosć argumentu initialValue
  }
  get value() {
    const thisWidget = this;

    return thisWidget.correctValue;
  }

  set value(assignedValue) {
    const thisWidget = this;

    const newValue = thisWidget.parseValue(assignedValue);

    if (newValue != thisWidget.correctValue && thisWidget.isValid(newValue)) {
      thisWidget.correctValue = newValue;
      thisWidget.announce();
    }
    thisWidget.renderValue();
  }
}

