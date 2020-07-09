import {
  select,
  settings,
  templates,
  classNames
} from '../settings.js';
import {
  utils
} from '../utils.js';
import CartProduct from '../components/CartProduct.js';

class Cart {

  constructor(element) {
    const thisCart = this;

    thisCart.products = [];
    thisCart.deliveryFee = settings.cart.defaultDeliveryFee;

    thisCart.getElements(element);

    thisCart.initActions();

    console.log('new Cart', thisCart);

    /* - pokazywanie i ukrywanie koszyka - done
       - dodawanie i usuwanie produktów,
       - podliczanie ceny zamówienia. */

    //  górna belka koszyka wyświetla łączną kwotę zamówienia oraz liczbę produktów w koszyku.
  }
  getElements(element) {
    const thisCart = this;

    thisCart.dom = {};

    thisCart.dom.wrapper = element;
    thisCart.dom.toggleTrigger = thisCart.dom.wrapper.querySelector(select.cart.toggleTrigger);
    thisCart.dom.productList = document.querySelector(select.cart.productList);
    thisCart.renderTotalsKeys = ['totalNumber', 'totalPrice', 'subtotalPrice', 'deliveryFee'];
    thisCart.dom.form = thisCart.dom.wrapper.querySelector(select.cart.form);
    thisCart.dom.phone = thisCart.dom.wrapper.querySelector(select.cart.phone);
    thisCart.dom.address = thisCart.dom.wrapper.querySelector(select.cart.address);

    for (let key of thisCart.renderTotalsKeys) {
      thisCart.dom[key] = thisCart.dom.wrapper.querySelectorAll(select.cart[key]);
    }
  }
  initActions() {
    const thisCart = this;

    thisCart.dom.toggleTrigger.addEventListener('click', function (event) {
      event.preventDefault();
      thisCart.dom.wrapper.classList.toggle(classNames.cart.wrapperActive);

    });

    thisCart.dom.productList.addEventListener('updated', function () {
      thisCart.update();
    });

    thisCart.dom.productList.addEventListener('remove', function () {
      thisCart.remove(event.detail.cartProduct);
    });

    thisCart.dom.form.addEventListener('submit', function (event) {
      event.preventDefault();
      thisCart.sendOrder();
    });
  }
  add(menuProduct) {
    const thisCart = this;
    /* właściwość data, a tutaj musimy do szablonu przekazać cały obiekt produktu. */

    /* generate HTML based on template */
    const generatedHTML = templates.cartProduct(menuProduct);
    /* create element generatedDOM */
    const generatedDOM = utils.createDOMFromHTML(generatedHTML);
    /* find cart container */
    const cartContainer = thisCart.dom.productList;
    /* add element to cart */
    cartContainer.appendChild(generatedDOM);

    console.log('adding product', menuProduct);

    thisCart.products.push(new CartProduct(menuProduct, generatedDOM));

    console.log('thisCart.products', thisCart.products);
    thisCart.update();
  }
  update() {
    const thisCart = this;
    thisCart.totalNumber = 0;
    thisCart.subtotalPrice = 0;
    for (let thisCartProd of thisCart.products) {
      thisCart.subtotalPrice += thisCartProd.price;
      thisCart.totalNumber += thisCartProd.amount;
    }
    if (thisCart.subtotalPrice > 0) {
      thisCart.totalPrice = thisCart.subtotalPrice + thisCart.deliveryFee;
    } else {
      thisCart.totalPrice = 0;
    }
    console.log('totalNumber', thisCart.totalNumber);
    console.log('subtotalPrice', thisCart.subtotalPrice);
    console.log('totalPrice', thisCart.totalPrice);

    for (let key of thisCart.renderTotalsKeys) {
      for (let elem of thisCart.dom[key]) {
        elem.innerHTML = thisCart[key];
      }
    }
  }
  remove(cartProduct) {
    const thisCart = this;
    const index = thisCart.products.indexOf(cartProduct);

    thisCart.products.splice(index, 1);
    cartProduct.dom.wrapper.remove();
    thisCart.update();

  }
  sendOrder() {
    const thisCart = this;
    const url = settings.db.url + '/' + settings.db.order;

    const payload = {
      address: thisCart.dom.address.value,
      phone: thisCart.dom.phone.value,
      totalNumber: thisCart.totalNumber,
      subtotalPrice: thisCart.subtotalPrice,
      deliveryFee: thisCart.deliveryFee,
      totalPrice: thisCart.totalPrice,
      products: [],
    };
    for (let cartProd of thisCart.products) {
      payload.products.push(cartProd.getData());
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

      });
  }
}
export default Cart;
