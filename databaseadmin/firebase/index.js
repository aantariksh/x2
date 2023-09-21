// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.16.0/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/9.16.0/firebase-auth.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAKSYkvLSpqrZDbHn-azk_DRKSbx1FaO1M",
  authDomain: "race2vegas-4.firebaseapp.com",
  databaseURL: "https://race2vegas-4-default-rtdb.firebaseio.com",
  projectId: "race2vegas-4",
  storageBucket: "race2vegas-4.appspot.com",
  messagingSenderId: "903946672933",
  appId: "1:903946672933:web:16a68a68e2174bd57dd8cc"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth();
window.auth = auth

const loginForm = document.getElementById("login-form");
if (loginForm) {
  loginForm.addEventListener("submit", function (event) {
    event.preventDefault();
    const formProps = new FormData(event.target);
    const formData = Object.fromEntries(formProps);
    signInWithEmailAndPassword(auth, formData.email, formData.password)
      .then(() => (location.href = "/databaseadmin/index.html"))
      .catch(() => failMessage());
  });
}

window.logOut = () => signOut(auth);

onAuthStateChanged(auth, (user) => {
  const index = "/databaseadmin/index";
  const masterboard = "/databaseadmin/masterboard";
  const currentPage = location.pathname;

  if (user) {
    // if (user.uid != "hoG4YEiGewW13k1h7ZY0N4PjT7s2") signOut(auth);
    if (currentPage.startsWith(index)) {
      location.pathname = masterboard + ".html";
    }
  } else {
    if (!currentPage.startsWith(index)) {
      location.pathname = index + ".html";
    }
  }
});

export function failMessage() {
  Swal.fire({
    icon: "error",
    title: "Oops...",
    text: "Login Failed",
  }).then(() => location.reload());
}

// Load Navbar from dedicated HTML file
if (!window.location.pathname.split('/').includes('index')) {
  fetch('navbar.html')
    .then(res => res.text())
    .then(text => {
        let container = document.getElementById('navbarPlaceholder');
        container?.insertAdjacentHTML( 'beforeBegin', text );
        identifyCurrentPage()
    })
}

// Current Page
function identifyCurrentPage() {
  const pageName = window.location.pathname.split('/').pop();
  var elements = document.querySelectorAll(`a[href="${pageName}"]`);
  if (elements && elements.length) {
    elements[0].classList.add('active');
  }
}

// Download functions
function downloadCSV(downloadName='data') {
  const table = document.querySelector('.table');
  if (!table) {
      console.error("Table element not found.");
      return;
  }  

  var rows = table.querySelectorAll('tr');
  var csvContent = "";
  
  rows.forEach(function(row) {
      var rowData = [];
      row.querySelectorAll('td, th').forEach(function(cell) {
          rowData.push(cell.textContent.trim());
      });
      csvContent += rowData.join(',') + "\r\n";
  });
  
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
  const blobUrl = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.setAttribute("href", blobUrl);
  link.setAttribute("download", downloadName + ".csv");

  link.click();

  URL.revokeObjectURL(blobUrl);
}
window.downloadCSV = downloadCSV


/**
 * List.Js
*/

function togglePaginationButtonDisable(button, disabled) {
  button.disabled = disabled;
  button.classList[disabled ? 'add' : 'remove']('disabled');
};

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }


function camelize(str) {
  var text = str.replace(/[-_\s.]+(.)?/g, function (_, c) {
    return c ? c.toUpperCase() : '';
  });
  return "".concat(text.substr(0, 1).toLowerCase()).concat(text.substr(1));
};

function getData(el, data) {
  try {
    return JSON.parse(el.dataset[camelize(data)]);
  } catch (e) {
    return el.dataset[camelize(data)];
  }
};

function listInit() {
  if (window.List) {
    var lists = document.querySelectorAll('[data-list]');

    if (lists.length) {
      lists.forEach(function (el) {
        var options = getData(el, 'list');

        if (options.pagination) {
          options = _objectSpread(_objectSpread({}, options), {}, {
            pagination: _objectSpread({
              item: '<li><button class=\'page btn btn-sm btn-outline-primary me-1\' type=\'button\'></button></li>'
            }, options.pagination)
          });
        }

        var paginationButtonNext = el.querySelector('[data-list-pagination="next"]');
        var paginationButtonPrev = el.querySelector('[data-list-pagination="prev"]');
        var viewAll = el.querySelector('[data-list-view="*"]');
        var viewLess = el.querySelector('[data-list-view="less"]');
        var listInfo = el.querySelector('[data-list-info]');
        var listFilter = document.querySelector('[data-list-filter]');
        var list = new window.List(el, options); //-------fallback-----------

        list.on('updated', function (item) {
          var fallback = el.querySelector('.fallback') || document.getElementById(options.fallback);

          if (fallback) {
            if (item.matchingItems.length === 0) {
              fallback.classList.remove('d-none');
            } else {
              fallback.classList.add('d-none');
            }
          }
        }); // ---------------------------------------

        var totalItem = list.items.length;
        var itemsPerPage = list.page;
        var btnDropdownClose = list.listContainer.querySelector('.btn-close');
        var pageQuantity = Math.ceil(totalItem / itemsPerPage);
        var numberOfcurrentItems = list.visibleItems.length;
        var pageCount = 1;
        btnDropdownClose && btnDropdownClose.addEventListener('search.close', function () {
          list.fuzzySearch('');
        });

        var updateListControls = function updateListControls() {
          listInfo && (listInfo.innerHTML = "".concat(list.i, " to ").concat(numberOfcurrentItems, " of ").concat(totalItem));
          paginationButtonPrev && togglePaginationButtonDisable(paginationButtonPrev, pageCount === 1);
          paginationButtonNext && togglePaginationButtonDisable(paginationButtonNext, pageCount === pageQuantity);

          if (pageCount > 1 && pageCount < pageQuantity) {
            togglePaginationButtonDisable(paginationButtonNext, false);
            togglePaginationButtonDisable(paginationButtonPrev, false);
          }
        }; // List info


        updateListControls();

        if (paginationButtonNext) {
          paginationButtonNext.addEventListener('click', function (e) {
            e.preventDefault();
            pageCount += 1;
            var nextInitialIndex = list.i + itemsPerPage;
            nextInitialIndex <= list.size() && list.show(nextInitialIndex, itemsPerPage);
            numberOfcurrentItems += list.visibleItems.length;
            updateListControls();
          });
        }

        if (paginationButtonPrev) {
          paginationButtonPrev.addEventListener('click', function (e) {
            e.preventDefault();
            pageCount -= 1;
            numberOfcurrentItems -= list.visibleItems.length;
            var prevItem = list.i - itemsPerPage;
            prevItem > 0 && list.show(prevItem, itemsPerPage);
            updateListControls();
          });
        }

        var toggleViewBtn = function toggleViewBtn() {
          viewLess.classList.toggle('d-none');
          viewAll.classList.toggle('d-none');
        };

        if (viewAll) {
          viewAll.addEventListener('click', function () {
            list.show(1, totalItem);
            pageQuantity = 1;
            pageCount = 1;
            numberOfcurrentItems = totalItem;
            updateListControls();
            toggleViewBtn();
          });
        }

        if (viewLess) {
          viewLess.addEventListener('click', function () {
            list.show(1, itemsPerPage);
            pageQuantity = Math.ceil(totalItem / itemsPerPage);
            pageCount = 1;
            numberOfcurrentItems = list.visibleItems.length;
            updateListControls();
            toggleViewBtn();
          });
        } // numbering pagination


        if (options.pagination) {
          el.querySelector('.pagination').addEventListener('click', function (e) {
            if (e.target.classList[0] === 'page') {
              pageCount = Number(e.target.innerText);
              updateListControls();
            }
          });
        }

        if (options.filter) {
          var key = options.filter.key;
          listFilter.addEventListener('change', function (e) {
            list.filter(function (item) {
              if (e.target.value === '') {
                return true;
              }

              return item.values()[key].toLowerCase().includes(e.target.value.toLowerCase());
            });
          });
        }
      });
    }
  }
};
window.listInit = listInit;
