import '../_core/core.js';
import * as icons from '../_core/icons.js';
import { empty, getDocScrollLeft, getDocScrollTop, index, isTouchDevice, matches } from '../_core/lib.js';

export class Select {
   static id = 'azui-select';
   static settings = {
      items: [],
      allowNewItems: true,
      select: e => { }
   };

   init() {
      const me = this;
      const dom = me.dom;

      const settings = this.settings;

      empty(dom);

      const showDropdown = function (e, initialize = false) {
         // console.log('show');
         // alert(e.currentTarget.outerHTML);
         // console.log(e.currentTarget);
         const createMenuItem = function (item) {
            if (!item) {
               const sep = document.createElement('div');
               sep.textContent('&nbsp;');
               sep.classList.add('azMenuSeparator');
            }
            const title = item.title;
            const titleDiv = document.createElement('div');
            titleDiv.classList.add('title');
            const menuItem = document.createElement('div');
            menuItem.classList.add('azMenuItem');
            menuItem.appendChild(titleDiv);
            titleDiv.textContent = title;
            const onSelect = function (e) {
               if (e.type === 'touchstart') {
                  // prevent mousedown from being triggered on touch device.
                  e.preventDefault();
               }
               me.selectInput.value = title;
               dom.dispatchEvent(
                  new CustomEvent('done', {
                     detail: {
                        value: me.selectInput.value,
                        originalEvent: e,
                     }
                  })
               );
            };
            // menuItem.addEventListener('click', onSelect);

            menuItem.addEventListener('mousedown', onSelect);
            if (isTouchDevice()) {
               menuItem.addEventListener('touchstart', onSelect);
            }

            const onMouseEnter = function (e) {
               highlightIndex = index(e.currentTarget, '.azMenuItem');
               navigateDropdown();
            };
            menuItem.addEventListener('mouseenter', onMouseEnter);
            return menuItem;
         };

         me.menu = document.createElement('div');
         me.menu.classList.add('azui', 'azSelectMenu');
         me.menu.style['display'] = 'none';
         me.menu.style['z-index'] = 1000;
         highlightIndex = -1;
         let empty = true;

         // $('<div>&nbsp;</div>').addClass('azMenuIconSeparator').appendTo($menu);

         if (typeof settings.items === 'function') {
            settings.items = settings.items();
         }

         settings.items.map((item, index) => {
            if (typeof item === 'function') {
               const title = item();
               item = {
                  key: title,
                  title
               };
            } else if (item === null || item === undefined || typeof item === 'object') {
               // unchanged.
            } else {
               item = {
                  key: item,
                  title: item
               };
            }
            // console.log(item);
            if (initialize || item.title.toLowerCase().includes(me.selectInput.value.toLowerCase())) {
               me.menu.appendChild(createMenuItem(item));
               empty = false;

               // highlight the selected
               if (initialize && item.title === me.selectInput.value) {
                  highlightIndex = index;
                  navigateDropdown();
               }
            }
         });

         if (!empty) {
            document.documentElement.appendChild(me.menu);
            dropdownShown = true;

            document.addEventListener('mousedown', dismissDropdown);

            if (isTouchDevice()) {
               document.addEventListener('touchstart', dismissDropdown);
            }

            const meBcr = dom.getBoundingClientRect();
            setTimeout(() => {
               const menuBcr = me.menu.getBoundingClientRect();
               // console.log(meBcr);
               let top = meBcr.bottom + getDocScrollTop() + 1;
               if (top + menuBcr.height > window.innerHeight) {
                  top = meBcr.top - menuBcr.height + getDocScrollTop() - 1;
               }
               me.menu.style['left'] = meBcr.left + getDocScrollLeft() + 'px';
               me.menu.style['top'] = top + 'px';
               me.menu.style['width'] = meBcr.width - 1 + 'px';
            });
            me.menu.style['display'] = 'block';
         }

         setTimeout(() => {
            me.selectInput.focus();
         });

         e?.stopPropagation();
      };

      let dropdownShown = false;
      let highlightIndex = -1;

      const navigateDropdown = function () {
         // console.log(e.keyCode);
         if (!me.menu) {
            return;
         }
         const selected = Array.prototype.filter.call(me.menu.children, n => matches(n, '.azMenuItem'))[highlightIndex];
         // const selected = menu.children('.azMenuItem').eq(highlightIndex);
         Array.prototype.filter
            .call(me.menu.children, n => matches(n, '.azMenuItem'))
            .forEach(el => {
               el.classList.remove('selected');
            });
         // menu.children('.azMenuItem').removeClass('selected');
         selected.classList.add('selected');
      };

      const dismissDropdown = function (e) {
         // console.log('off');
         // if (e.target === me.selectInput) {
         // return;
         // }
         me.menu.remove();

         document.removeEventListener('mousedown', dismissDropdown);

         if (isTouchDevice()) {
            document.removeEventListener('touchstart', dismissDropdown);
         }

         dropdownShown = false;

         e?.stopPropagation();
      };

      const toggleDropdown = function (e) {
         // console.log(dropdownShown, e.type, e.button, e);
         if (e.type === 'mousedown' && e.button !== 0) {
            return;
         }
         if (e.type === 'touchstart') {
            // prevent mouse event to trigger on touch device
            e.preventDefault();
         }
         if (!dropdownShown) {
            showDropdown(e, true);
         } else {
            dismissDropdown(e);
         }
      };

      const onInputKeyUp = function (e) {
         // console.log(me.selectInput.value.trim().length);
         // console.log(e.keyCode, me.selectInput.value.trim().length);
         e.stopPropagation();
         if (e.key === 'Escape') {
            // esc key is pressed
            if (dropdownShown) {
               dismissDropdown(e);
            } else {
               dom.dispatchEvent(
                  new CustomEvent('cancel', {
                     detail: {
                        value: me.selectInput.value
                     }
                  })
               );
            }
         } else if (e.key === 'ArrowUp') {
            // up
            --highlightIndex;
            highlightIndex = highlightIndex < 0 ? 0 : highlightIndex;
            navigateDropdown();
         } else if (e.key === 'ArrowDown') {
            // if key code is down arrow key, triggered full dropdown
            if (!dropdownShown) {
               showDropdown(e, true);
            } else {
               const menuLength = me.menu.querySelectorAll('.azMenuItem').length;
               ++highlightIndex;
               highlightIndex = highlightIndex >= menuLength - 1 ? menuLength - 1 : highlightIndex;
               navigateDropdown();
            }
         } else if (e.key === 'Enter') {
            if (me.settings.allowNewItems) {
               if (dropdownShown) {
                  const selected = Array.prototype.filter.call(me.menu.children, n => matches(n, '.azMenuItem'))[
                     highlightIndex
                  ];
                  if (selected) {
                     me.selectInput.value = selected.textContent;
                  }
                  dismissDropdown(e);
               }
            } else {
               if (dropdownShown) {
                  const selected = Array.prototype.filter.call(me.menu.children, n => matches(n, '.azMenuItem'))[
                     highlightIndex
                  ];
                  if (selected) {
                     me.selectInput.value = selected.textContent;
                  } else {
                     return;
                  }
                  dismissDropdown(e);
               } else {
                  return;
               }
            }

            // submit
            dom.dispatchEvent(
               new CustomEvent('done', {
                  detail: {
                     value: me.selectInput.value
                  }
               })
            );
         } else if (me.selectInput.value.trim().length >= 0) {
            // if input.val().trim().length>0, trigger filtered dropdown
            settings.select(e);
            if (dropdownShown) {
               dismissDropdown(e);
            }
            showDropdown(e);
         }
      };

      me.selectInput = document.createElement('input');
      me.selectInput.setAttribute('type', 'text');
      me.selectInput.classList.add('azSelectInput');
      dom.appendChild(me.selectInput);

      me.selectInput.addEventListener('keydown', e => {
         e.stopPropagation();
      });
      me.selectInput.addEventListener('keyup', onInputKeyUp);

      const dropdownButton = document.createElement('div');
      dropdownButton.innerHTML = icons.svgTriangleDown;
      dropdownButton.classList.add('azSelectdropdownButton');
      dom.appendChild(dropdownButton);

      if (isTouchDevice()) {
         dropdownButton.addEventListener('touchstart', toggleDropdown);
      }
      dropdownButton.addEventListener('mousedown', toggleDropdown);
   }
}
