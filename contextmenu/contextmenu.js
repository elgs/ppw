import '../_core/core.js';
import { getDocScrollLeft, getDocScrollTop, getHeight, getWidth, index, isOutside, isTouchDevice, matches, normalizeIcon, parseDOMElement, resolveFunction } from '../_core/lib.js';

import { RightClick } from '../rightclick/rightclick.js';

export class ContextMenu {
   static id = 'azui-contextmenu';
   static settings = {
      onContextMenu: function (e) { },
      start: function (e) { },
      onDismiss: function (e) { },
      items: null,
      target: null
   };

   init() {

      const me = this;
      const dom = this.dom;
      const settings = this.settings;

      if (!settings.items) {
         return;
      }

      let highlightIndex = -1;

      const navigateMenu = function () {
         // console.log(me.menu);
         if (!me.menu) {
            return;
         }
         const selected = Array.prototype.filter.call(me.menu.children, n => matches(n, '.azMenuItem'))[highlightIndex];
         // console.log(selected.innerHTML);
         // const selected = menu.children('.azMenuItem').eq(highlightIndex);
         Array.prototype.filter
            .call(me.menu.children, n => matches(n, '.azMenuItem'))
            .forEach(el => {
               el.classList.remove('selected');
            });
         // menu.children('.azMenuItem').removeClass('selected');
         selected.classList.add('selected');
      };

      const dismissMenu = e => {
         if (e.type === 'touchstart') {
            const pb = me.menu.getBoundingClientRect();
            if (isOutside(e.touches ? e.touches[0].pageX : e.pageX, e.touches ? e.touches[0].pageY : e.pageY, pb)) {
               me.menu?.remove();
               settings.onDismiss(e);
            } else {
               document.addEventListener('touchstart', dismissMenu, {
                  once: true
               });
            }
         } else {
            me.menu?.remove();
            settings.onDismiss(e);
         }
      };

      const createMenuItem = function (item, menu) {
         if (!item) {
            const separator = parseDOMElement('<div>&nbsp;</div>')[0];
            separator.classList.add('azMenuSeparator');
            return separator;
         }

         const hidden = resolveFunction(item.hidden);
         if (hidden === true) {
            return null;
         }

         const menuItem = document.createElement('div');
         menuItem.classList.add('azMenuItem');
         const disabled = resolveFunction(item.disabled);
         if (disabled) {
            menuItem.classList.add('disabled');
         }

         const icon = item.icon || '';
         const iconDiv = normalizeIcon(icon);
         iconDiv.classList.add('icon');
         menuItem.appendChild(iconDiv);

         const title = item.title || '';
         const titleDiv = normalizeIcon(title);
         titleDiv.classList.add('title');
         menuItem.appendChild(titleDiv);
         // iconDiv.innerHTML = icon;
         // titleDiv.innerHTML = title;
         if (!disabled) {
            menuItem.addEventListener('click', e => {
               if (item.action.call(menuItem, e, settings.target || dom) === false) {
                  // menu.blur();
                  dismissMenu(e);
               }
               e.stopPropagation();
            });
         }

         menuItem.addEventListener('mouseenter', e => {
            highlightIndex = index(e.currentTarget, '.azMenuItem');
            navigateMenu();
         });

         return menuItem;
      };

      const onContextMenu = function (e) {
         dismissMenu(e);
         // console.log(e.target);
         // console.log(e.currentTarget);
         const menu = document.createElement('div');
         me.menu = menu;
         menu.classList.add('azui', 'azContextMenuPopup');
         menu.style['z-index'] = Number.MAX_SAFE_INTEGER;
         highlightIndex = -1;

         const onKeyDown = e => {
            // prevent browser scroll
            e.preventDefault();
            // console.log(e.keyCode);

            if (e.key === 'Escape') {
               // esc
               menu.blur();
            } else if (e.key === 'ArrowUp') {
               // up
               --highlightIndex;
               highlightIndex = highlightIndex < 0 ? 0 : highlightIndex;
               navigateMenu();
            } else if (e.key === 'ArrowDown') {
               // down
               const menuLength = me.menu.querySelectorAll('.azMenuItem').length;
               // console.log(menuLength);
               ++highlightIndex;
               highlightIndex = highlightIndex >= menuLength - 1 ? menuLength - 1 : highlightIndex;
               // console.log(highlightIndex);
               navigateMenu();
            } else if (e.key === 'Enter' || e.key === ' ') {
               console.log('asdfasdf');
               // enter
               const selected = Array.prototype.filter.call(me.menu.children, n => matches(n, '.azMenuItem'))[
                  highlightIndex
               ];
               // console.log(selected.innerHTML);
               selected.click();
            }
         };

         menu.setAttribute('tabindex', 0);
         document.documentElement.appendChild(menu);
         if (!isTouchDevice()) {
            menu.addEventListener('blur', e => {
               setTimeout(() => {
                  dismissMenu(e);
               });
            }, { once: true });
         }
         menu.addEventListener('keydown', onKeyDown);
         menu.focus({
            preventScroll: true
         });

         // $('<div>&nbsp;</div>').addClass('azMenuIconSeparator').appendTo($menu);

         const items = resolveFunction(settings.items);
         let lastItem = null;
         items.map((item, index) => {
            const menuItem = createMenuItem(item, menu);
            lastItem = menuItem;
            let append = !!menuItem;
            if (append && matches(menuItem, '.azMenuSeparator') && !!lastItem) {
               append = false;
            }
            // console.log(menuItem, append);
            if (append) {
               menu.appendChild(menuItem);
            }
         });

         // console.log(getWidth(menu), getHeight(menu));
         const menuPosition = calcContextMenuPosition(
            e.touches ? e.touches[0].clientX : az.cursor.x ?? e.clientX,
            e.touches ? e.touches[0].clientY : az.cursor.y ?? e.clientY,
            getWidth(menu),
            getHeight(menu)
         );
         // console.log(menuPosition);
         menu.style['position'] = 'absolute';
         menu.style['left'] = menuPosition.x + 'px';
         menu.style['top'] = menuPosition.y + 'px';

         if (isTouchDevice()) {
            document.addEventListener('touchstart', dismissMenu, {
               once: true
            });
         }

         if (!isTouchDevice()) {
            e.preventDefault(); // prevent browser context menu
         }
      };

      me.rightClick = az.ui(RightClick, dom, {
         onRightClick: function (e) {
            if (settings.start(e) === false) {
               return false;
            }
            onContextMenu(e);
            settings.onContextMenu(e);
         }
      });
   }
}

const calcContextMenuPosition = function (mx, my, mw, mh) {
   // console.log(mx, my);
   // mouse x, y, menu width, height
   const buf = 20;
   const m2p = 5;
   let x = 0;
   let y = 0;

   // const bw = getWidth(document.body);
   // const bh = getHeight(document.body);

   const bw = window.innerWidth;
   const bh = window.innerHeight;

   // console.log(mx, my, mw, mh, bw, bh, document.body.scrollTop, document.body.scrollLeft);
   if (mx + mw + buf < bw) {
      // console.log('enough on right');
      x = mx + m2p + getDocScrollLeft();
   } else if (mx > mw + buf) {
      // console.log('enough on left');
      x = mx - mw - m2p + getDocScrollLeft();
   }
   if (my + mh + buf < bh) {
      // console.log('enough on bottom');
      y = my + m2p + getDocScrollTop();
   } else if (my > mh + buf) {
      // console.log('enough on top');
      y = my - mh - m2p + getDocScrollTop();
   }
   return {
      x,
      y
   };
};