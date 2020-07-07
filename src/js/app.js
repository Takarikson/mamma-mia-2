import { Product } from './components/Product.js';
import { Cart } from './components/Cart.js';
import { Booking } from './components/Booking.js';
import { select, settings, classNames } from './settings.js';

const app = {
  initMenu: function () {
    const thisApp = this;
    //console.log('thisApp.data:', thisApp.data);

    for (let productData in thisApp.data.products) {
      new Product(thisApp.data.products[productData].id, thisApp.data.products[productData]);
    }
  },
  initCart: function () {
    const thisApp = this;

    const cartElem = document.querySelector(select.containerOf.cart);
    thisApp.cart = new Cart(cartElem);

    thisApp.productList = document.querySelector(select.containerOf.menu);

    thisApp.productList.addEventListener('add-to-cart', function (event) {
      app.cart.add(event.detail.product);
    });
  },

  initData: function () {
    const thisApp = this;
    thisApp.data = {};

    const url = settings.db.url + '/' + settings.db.product; // w stałej zapisany adres endpointa

    fetch(url) // wysyłamy zapytanie do serwera pod podany adres endpointu
      .then(function (rawResponse) {
        return rawResponse.json(); // odpowiedż z serwera
      })
      .then(function (parsedResponse) { // otrzymaną odpowiedż konwertujemy z JSON na tablicę // kod w tej f wykona sie dopiero jak otrzyma odp z serwera
        //console.log('parsedResponse', parsedResponse);

        /* save parsedResponse as thisApp.data.products */
        thisApp.data.products = parsedResponse;

        /* execute initMenu method */
        thisApp.initMenu();
      });

    //console.log('thisApp.data', JSON.stringify(thisApp.data));
  },
  initCarousel() {
    const carouselArray = [];

    carouselArray[0] = {
      title: 'Perfect Food', text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.', author: '- Julia Roberts',
    };
    carouselArray[1] = {
      title: 'Amaizing service', text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.', author: '- Pamela Anderson',
    };
    carouselArray[2] = {
      title: 'Best coffee', text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.', author: '- Brad Pitt',
    };

    let i = 0;
    const dots = document.querySelectorAll('.carousel-dots i');
    function changeSlide() {
      const title = document.querySelector('.review-title');
      const text = document.querySelector('.review-text');
      const name = document.querySelector('.review-author');

      for (let dot of dots) {
        if (dot.id == 'dot-' + (i + 1)) {
          dot.classList.add('active');
        } else {
          dot.classList.remove('active');
        }
        title.innerHTML = carouselArray[i].title;
        text.innerHTML = carouselArray[i].text;
        name.innerHTML = carouselArray[i].author;
      }

      if (i < carouselArray.length - 1) {
        i++;
      } else {
        i = 0;
      }
    }
    changeSlide();

    setInterval(() => {
      changeSlide();
    }, 3000);
  },
  init: function () {
    const thisApp = this;
    //console.log('*** App starting ***');
    //console.log('thisApp:', thisApp);
    //console.log('classNames:', classNames);
    //console.log('settings:', settings);
    //console.log('templates:', templates);

    thisApp.initPages();
    thisApp.initData();
    // wywołanie f initMenu przenosimy na górę do f (parsedResponse) która wykonuje się dopiero po otrzymaniu odp z serwera // czyli wykona sie gdy skrpt otrzyma już liste produktów
    thisApp.initCart();
    thisApp.initBooking();
  },

  initPages: function () {
    const thisApp = this;

    thisApp.pages = Array.from(document.querySelector(select.containerOf.pages).children);

    thisApp.navLinks = Array.from(document.querySelectorAll(select.nav.links));

    let pagesMatchingHash = [];

    if (window.location.hash.length > 2) {
      const idFromHash = window.location.hash.replace('#/', '');

      pagesMatchingHash = thisApp.pages.filter(function (page) {
        return page.id == idFromHash; // metoda filter zwraca nową tablicę zawierajacą tylko elementy spełniające warunek
      });
    }

    thisApp.activatePage(pagesMatchingHash.length ? pagesMatchingHash[0].id : thisApp.pages[0].id);

    for (let link of thisApp.navLinks) {
      link.addEventListener('click', function (event) {
        const clickedElement = this;
        event.preventDefault();
        /* get page id from href */
        let pageId = clickedElement.getAttribute('href');
        pageId = pageId.replace('#', '');

        /* activate page */
        thisApp.activatePage(pageId);

      });
    }

  },

  activatePage: function (pageId) {
    const thisApp = this;

    for (let link of thisApp.navLinks) {
      link.classList.toggle(classNames.nav.active, link.getAttribute('href') == '#' + pageId);
    }

    for (let page of thisApp.pages) {
      page.classList.toggle(classNames.pages.active, page.getAttribute('id') == pageId);
    }
    window.location.hash = '#/' + pageId;
  },

  initBooking: function () {
    const thisApp = this;

    const bookingElement = document.querySelector(select.containerOf.booking);
    thisApp.booking = new Booking(bookingElement);

  }

};

app.init();
