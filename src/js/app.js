import {
  settings,
  select,
  classNames,
  templates
} from './settings.js';
import Product from './components/Product.js';
import Cart from './components/Cart.js';
import Booking from './components/Booking.js';

const app = {
  initPages: function () {
    const thisApp = this;
    /*wszystkie kontenery podstron (section.id=booking i order) ktore wyszukiwane sa w drzewie DOM*/
    thisApp.pages = document.querySelector(select.containerOf.pages).children;
    thisApp.navLinks = document.querySelectorAll(select.nav.links);
    thisApp.orderLink = document.querySelector(select.homeLinks.order);
    console.log('order', thisApp.orderLink);

    thisApp.bookingLink = document.querySelector(select.homeLinks.booking);

    const idFromHash = window.location.hash.replace('#/', '');

    let pageMatchingHash = thisApp.pages[0].id;

    for (let page of thisApp.pages) {
      if (page.id == idFromHash) {
        pageMatchingHash = page.id;
        break;
      }
    }
    thisApp.activatePage(pageMatchingHash);

    for (let link of thisApp.navLinks) {
      link.addEventListener('click', function (event) {
        const clickedElement = this;
        event.preventDefault();

        /* get page id from href attribute */
        const id = clickedElement.getAttribute('href').replace('#', '');
        /* run thisApp.activatePage with that id */
        thisApp.activatePage(id);
        /* change URL hash */
        window.location.hash = '#/' + id;
      });
    }
    /* Order */
    thisApp.orderLink.addEventListener('click', function (event) {
      const orderId = 'order';
      event.preventDefault();

      thisApp.activatePage(orderId);
      window.location.hash = '/' + orderId;
    });
    /* Booking */
    thisApp.bookingLink.addEventListener('click', function (event) {
      const bookingId = 'booking';
      event.preventDefault();

      thisApp.activatePage(bookingId);
      window.location.hash = '/' + bookingId;
    });


  },

  activatePage: function (pageId) {
    const thisApp = this;
    /* add class "active" to matching pages, remove from non-matching */
    for (let page of thisApp.pages) {
      page.classList.toggle(classNames.pages.active, page.id == pageId);
    }
    /* add class "active" to matching links, remove from non-matching */
    for (let link of thisApp.navLinks) {
      link.classList.toggle(
        classNames.nav.active,
        link.getAttribute('href') == '#' + pageId
      );
    }
  },
  initBooking: function () {
    const thisApp = this;
    thisApp.bookingTable = document.querySelector(select.containerOf.booking);
    thisApp.booking = new Booking(thisApp.bookingTable);
  },

  initCarousel: function () {
    // eslint-disable-next-line no-undef
    $('.quote-wrapper').slick({

      dots: true,
      arrows: false,
      autoplay: true,
      autoplaySpeed: 3000,


    });
  },
  initMenu: function () {
    const thisApp = this;
    // console.log('thisApp.data', thisApp.data);

    for (let productData in thisApp.data.products) {
      new Product(thisApp.data.products[productData].id, thisApp.data.products[productData]);
    }
  },

  initData: function () {
    const thisApp = this;

    thisApp.data = {};
    const url = settings.db.url + '/' + settings.db.product;

    fetch(url)
      .then(function (rawResponse) {
        return rawResponse.json();
      })
      .then(function (parsedResponse) {
        console.log('parsedResponse', parsedResponse);
        /* save parsedResponse as thisApp.data.products */
        thisApp.data.products = parsedResponse;
        /* execute initMenu method */
        thisApp.initMenu();
      });
    console.log('thisApp.data', JSON.stringify(thisApp.data));

  },

  init: function () {
    const thisApp = this;
    console.log('*** App starting ***');
    console.log('thisApp:', thisApp);
    console.log('classNames:', classNames);
    console.log('settings:', settings);
    console.log('templates:', templates);

    thisApp.initPages();
    thisApp.initData();
    thisApp.initCart();
    thisApp.initBooking();
    thisApp.initCarousel();
  },
  initCart: function () {
    const thisApp = this;

    const cartElem = document.querySelector(select.containerOf.cart);
    thisApp.cart = new Cart(cartElem);

    thisApp.productList = document.querySelector(select.containerOf.menu);
    thisApp.productList.addEventListener('add-to-cart', function (event) {
      app.cart.add(event.detail.product);
    });
  }
};

app.init();
