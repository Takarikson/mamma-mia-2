import {select, classNames, templates} from '../settings.js';
import {utils} from '../utils.js';
import {AmountWidget} from './AmountWidget.js';

export class Product {
  constructor(id, data) {
    const thisProduct = this;
    thisProduct.id = id;
    thisProduct.data = data; // data to są wszystkie właściwości produktu - gdzie w kodzie, w którym pliku znajduje się informacja ze ten obiekt data to dokładnie dataSource.products z data.js???

    thisProduct.renderInMenu();
    thisProduct.getElements();
    thisProduct.initAccordion();
    thisProduct.initOrderForm();
    thisProduct.initAmountWidget();
    thisProduct.processOrder();
    //console.log('new Product:', thisProduct);
  }

  renderInMenu() { // odpowiada za wyświetlanie produktów w menu
    const thisProduct = this;

    /* generate HTML based on template */ // generuje kod produktu
    const generatedHTML = templates.menuProduct(thisProduct.data);

    /*create elment using utils.createElementFromHTML */ // elem DOM czyli obiekt wygenerowany przez przeglądarkę na podstawie kodu HTML
    thisProduct.element = utils.createDOMFromHTML(generatedHTML); // element DOM zapisany jest jako właściwość instancji by był do niego dostap w innych w innych metodach

    /* find menu container */
    const menuContainer = document.querySelector(select.containerOf.menu);

    /* add element to menu */
    menuContainer.appendChild(thisProduct.element);
  }

  // dlaczego w renderInMenu nie ma pętli jakiejś która by szła przez wszystkie skoro generuje to wszystkie produkty???
  // odp na powyższe: renderInMenu jest uruchamia w konstruktorze klasy, to przy tworzeniu każdej nowej instancji dla danego produktu, od razu renderuje się on na stronie.

  getElements() { // odniesienia do poszczególnych elementów DOM stworzonych na podstawie szablonu handlebars; metoda która w jednym miejscu odnajduje poszczególne elementy w kontenerze produktu
    const thisProduct = this; // czyli te wszystkie lementy powstały dzieki zastosowaniu handlebara w renderInMenu linia 100???

    thisProduct.accordionTrigger = thisProduct.element.querySelector(select.menuProduct.clickable);
    thisProduct.form = thisProduct.element.querySelector(select.menuProduct.form);
    thisProduct.formInputs = thisProduct.form.querySelectorAll(select.all.formInputs);
    thisProduct.cartButton = thisProduct.element.querySelector(select.menuProduct.cartButton);
    thisProduct.priceElem = thisProduct.element.querySelector(select.menuProduct.priceElem);
    thisProduct.imageWrapper = thisProduct.element.querySelector(select.menuProduct.imageWrapper);
    thisProduct.amountWidgetElem = thisProduct.element.querySelector(select.menuProduct.amountWidget);
  }

  initAccordion() { // odpowaiada za wyswietlanie pełnych opcji produktu po kliknięciu; nadaje i odbiera klasę active
    const thisProduct = this;

    /* find the clickable trigger (the element that should react to clicking) */ // przeniesiony do f getElement
    // const accordionTrigger = thisProduct.element.querySelector(select.menuProduct.clickable);

    /* START: click event listener to trigger */
    thisProduct.accordionTrigger.addEventListener('click', function() {

      /* prevent default action for event */
      event.preventDefault();

      /* toggle active class on element of thisProduct */
      thisProduct.element.classList.toggle('active'); // thisProduct.element to element bieżącego produktu czyli tego który wybieramy

      /* find all active products */
      const activeProducts = document.querySelectorAll('article.active');

      /* START LOOP: for each active product */
      for (let activeProduct of activeProducts) {
        /* START: if the active product isn't the element of thisProduct */
        if (activeProduct != thisProduct.element) {
          /* remove class active for the active product */
          activeProduct.classList.remove('active');
          /* END: if the active product isn't the element of thisProduct */
        }
        /* END LOOP: for each active product */
      }
      /* END: click event listener to trigger */
    });
  }

  initOrderForm() { // uruchamiana raz dla każdego produktu; odpowiedzialna za dodanie listenerów eventu do formularza, kontrolek, guzika dodania do koszyka; gdy będą kliknięte wywoła f przelicz zamówienie na nowo
    const thisProduct = this;

    thisProduct.form.addEventListener('submit', function(event) {
      event.preventDefault();
      thisProduct.processOrder();
    });

    for (let input of thisProduct.formInputs) {
      input.addEventListener('change', function() {
        thisProduct.processOrder();
      });
    }

    thisProduct.cartButton.addEventListener('click', function(event) {
      event.preventDefault();
      thisProduct.processOrder();
      thisProduct.addToCart();
    });

  }

  processOrder() {
    const thisProduct = this;
    //console.log('processOrder');

    /* read all data from the form (using utils.serializeFormToObject) and save it to const formData */ // ta f serialize pokazuje które opcje są wybrane
    const formData = utils.serializeFormToObject(thisProduct.form);
    //console.log('formData', formData);

    thisProduct.params = {};

    /* set variable price to equal thisProduct.data.price */
    let price = thisProduct.data.price;

    /* START LOOP: for each paramId in thisProduct.data.params */
    for (let paramId in thisProduct.data.params) {

      /* save the element in thisProduct.data.params with key paramId as const param */
      const param = thisProduct.data.params[paramId];

      /* START LOOP: for each optionId in param.options */
      for (let optionId in param.options) {

        /* save the element in param.options with key optionId as const option */
        const option = param.options[optionId];

        const optionSelected = formData.hasOwnProperty(paramId) && formData[paramId].indexOf(optionId) > -1;
        // czy istnieje formData[paramId] jeśli tak to wykona się dalszy kod (po &&) czy ta tablica zawiera klucz równy wartości optionId

        /* START IF: if option is selected and option is not default */
        if (optionSelected && !option.default) {

          /* add price of option to variable price */
          price += option.price;

          /* END IF: if option is selected and option is not default */
          /* START ELSE IF: if option is not selected and option is default */
        } else if (!optionSelected && option.default) {

          /* deduct price of option from price */
          price -= option.price;

        }
        /* END ELSE IF: if option is not selected and option is default */
        // blok if/else - obrazki
        const optionImages = thisProduct.imageWrapper.querySelectorAll('.' + paramId + '-' + optionId);

        if (optionSelected) {
          if (!thisProduct.params[paramId]) { // jeśli parametr nie został dodany do parametrów
            thisProduct.params[paramId] = {
              label: param.label,
              options: {},
            };
          }
          thisProduct.params[paramId].options[optionId] = option.label; // do obiektu options dodajemy zaznaczoną opcję - klucz option, wartosc label

          for (let image of optionImages) {
            image.classList.add(classNames.menuProduct.imageVisible);
          }
        } else {
          for (let image of optionImages) {
            image.classList.remove(classNames.menuProduct.imageVisible);
          }
        }

      }
    } /* END LOOP: for each optionId in param.options */

    /* END LOOP: for each paramId in thisProduct.data.params */
    /* multiply price by amount */
    thisProduct.priceSingle = price;
    thisProduct.price = thisProduct.priceSingle * thisProduct.amountWidget.value;

    /* set the contents of thisProduct.priceElem to be the value of variable price */
    thisProduct.priceElem.innerHTML = thisProduct.price;

    //console.log('thisProduct.params', thisProduct.params);
  } // zamknięcie processOrder

  initAmountWidget() {
    const thisProduct = this;

    thisProduct.amountWidget = new AmountWidget(thisProduct.amountWidgetElem);

    thisProduct.amountWidgetElem.addEventListener('updated', function() {
      thisProduct.processOrder();
    });
  }

  addToCart() {
    const thisProduct = this;

    thisProduct.name = thisProduct.data.name;
    thisProduct.amount = thisProduct.amountWidget.value;

    const event = new CustomEvent('add-to-cart', {
      bubbles: true,
      detail: {
        product: thisProduct,
      },
    });

    thisProduct.element.dispatchEvent(event);
  }

} // ten nawias powinien zamykać klasę Product
