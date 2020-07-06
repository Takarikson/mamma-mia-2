import {select, settings, classNames, templates} from '../settings.js';
import {utils} from '../utils.js';
import {CartProduct} from './CartProduct.js';

export class Cart {
  constructor(element) {
    const thisCart = this;

    thisCart.products = [];

    thisCart.deliveryFee = settings.cart.defaultDeliveryFee;

    thisCart.getElements(element);
    thisCart.initActions();


    //console.log('new Cart', thisCart);
  }

  getElements(element) {
    const thisCart = this;

    thisCart.dom = {};

    thisCart.dom.wrapper = element;

    thisCart.dom.toggleTrigger = thisCart.dom.wrapper.querySelector(select.cart.toggleTrigger); // ?

    thisCart.dom.productList = document.querySelector(select.cart.productList); // ? z tym miałam problem

    thisCart.renderTotalsKeys = ['totalNumber', 'totalPrice', 'subtotalPrice', 'deliveryFee']; // Tworzymy tutaj tablicę, która zawiera cztery stringi (ciągi znaków). Każdy z nich jest kluczem w obiekcie select.cart

    for (let key of thisCart.renderTotalsKeys) { //  Wykorzystamy tę tablicę, aby szybko stworzyć cztery właściwości obiektu thisCart.dom o tych samych kluczach. Każda z nich będzie zawierać kolekcję elementów znalezionych za pomocą odpowiedniego selektora.
      thisCart.dom[key] = thisCart.dom.wrapper.querySelectorAll(select.cart[key]);
    }

    thisCart.dom.form = thisCart.dom.wrapper.querySelector(select.cart.form);

    thisCart.dom.phone = document.querySelector(select.cart.phone);
    thisCart.dom.address = document.querySelector(select.cart.address);
  }

  initActions() {
    const thisCart = this;

    thisCart.dom.toggleTrigger.addEventListener('click', function() {
      thisCart.dom.wrapper.classList.toggle(classNames.cart.wrapperActive);
    });

    thisCart.dom.productList.addEventListener('updated', function() {
      thisCart.update();
    });

    thisCart.dom.productList.addEventListener('remove', function() {
      thisCart.remove(event.detail.cartProduct);
    });

    thisCart.dom.form.addEventListener('submit', function() {
      event.preventDefault();
      thisCart.sendOrder();
    });
  }

  add(menuProduct) {
    const thisCart = this;

    const generatedHTML = templates.cartProduct(menuProduct);

    const generatedDOM = utils.createDOMFromHTML(generatedHTML);

    thisCart.dom.productList.appendChild(generatedDOM);

    //console.log('adding product', menuProduct);

    thisCart.products.push(new CartProduct(menuProduct, generatedDOM));
    //console.log('thisCart.products', thisCart.products);

    thisCart.update();
  }

  update() {
    const thisCart = this;

    thisCart.totalNumber = 0;
    thisCart.subtotalPrice = 0;

    for (let thisCartProduct of thisCart.products) {
      thisCart.subtotalPrice = thisCart.subtotalPrice + thisCartProduct.price;
      thisCart.totalNumber = thisCart.totalNumber + thisCartProduct.amount;

    }

    thisCart.totalPrice = thisCart.subtotalPrice + thisCart.deliveryFee;

    for (let key of thisCart.renderTotalsKeys) {
      for (let elem of thisCart.dom[key]) {
        elem.innerHTML = thisCart[key]; // dla każdego z elementów ustawiamy właściwość która ma taki sam klucz
      }
    }

  }

  remove(cartProduct) {
    const thisCart = this;

    const index = thisCart.products.indexOf(cartProduct);

    thisCart.products.splice(index, 1); // usuwamy element o tym indeksie z tablicy thisCart.products

    cartProduct.dom.wrapper.remove();

    thisCart.update();
  }

  sendOrder() {
    const thisCart = this;

    const url = settings.db.url + '/' + settings.db.order; // adres endpointu zamówienia

    const payload = { // ładunek - dane wysyłane do serwera
      phone: thisCart.dom.phone,
      address: thisCart.dom.address,
      totalPrice: thisCart.totalPrice,
      totalNumber: thisCart.totalNumber,
      subtotalPrice: thisCart.subtotalPrice,
      deliveryFee: thisCart.deliveryFee,
      products: [], // pusta tablica
    };

    for (let singleProduct of thisCart.products) {
      singleProduct.getData();
      console.log(singleProduct);

      payload.products.push(singleProduct); // zwrucony wynik dodany do tablicy payload.products
      console.log(payload.products);

    }

    const options = { // opcje które skonfigurują zapytanie
      method: 'POST', // zmiana domyślnej metody GEt na POST czyli wysylanie
      headers: { // zmiana nagłówka by serwer wiedział że wysyłamy dane w frmacie json
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload), // body czyli treść kt wysyłamy // metoda JSON.stringify kt konwertuje obiekt payload na ciąg znaków w formacie json
    };

    fetch(url, options)
      .then(function(response) {
        return response.json();
      }).then(function(parsedResponse) {
        console.log('parsedResponse', parsedResponse);
      });
  }

} // zamkniecie Cart
