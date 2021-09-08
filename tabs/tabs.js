import * as icons from '../icons.js';
import { getDocScrollLeft, getDocScrollTop, isTouchDevice, matches, nextAll, normalizeIcon, parseDOMElement, remove, siblings } from '../azdom.js';
import { ContextMenu } from '../contextmenu/contextmenu.js';
import { Sortable } from '../sortable/sortable.js';
import { Draggable } from '../draggable/draggable.js';
import { Droppable } from '../droppable/droppable.js';
import { Resizable } from '../resizable/resizable.js';

let _tabId = 0;

const _getTabId = elemId => {
   return elemId
      .split('-')
      .splice(1, Number.MAX_SAFE_INTEGER)
      .join('-');
};

const getTabContextMenu = closable => [{
   // icon: icons.svgClose,
   title: 'Close tab',
   disabled: !closable,
   action: function (e, target) {
      const currentTabNode = target.closest('.azTabs');
      const currentTabs = az.ui(Tabs, currentTabNode);
      currentTabs.remove(_getTabId(target.getAttribute('tab-id')));
      return false;
   }
}, {
   // icon: icons.svgClose,
   title: 'Close other tabs',
   disabled: !closable,
   action: function (e, target) {
      const currentTabNode = target.closest('.azTabs');
      const currentTabs = az.ui(Tabs, currentTabNode);
      siblings(target, '.azTabLabel').forEach(function (element) {
         if (matches(element, '.azClosable')) {
            currentTabs.remove(_getTabId(element.getAttribute('tab-id')));
         }
      });
      return false;
   }
}, {
   // icon: icons.svgClose,
   title: 'Close tabs to the right',
   disabled: !closable,
   action: function (e, target) {
      const currentTabNode = target.closest('.azTabs');
      const currentTabs = az.ui(Tabs, currentTabNode);
      nextAll(target, '.azTabLabel').forEach(function (element) {
         if (matches(element, '.azClosable')) {
            currentTabs.remove(_getTabId(element.getAttribute('tab-id')));
         }
      });
      return false;
   }
},
   null,
{
   // icon: icons.svgClose,
   title: 'Close All',
   disabled: !closable,
   action: function (e, target) {
      const currentTabNode = target.closest('.azTabs');
      const currentTabs = az.ui(Tabs, currentTabNode);
      siblings(target, '.azTabLabel').forEach(function (element) {
         if (matches(element, '.azClosable')) {
            currentTabs.remove(_getTabId(element.getAttribute('tab-id')));
         }
      });
      currentTabs.remove(_getTabId(target.getAttribute('tab-id')));
      return false;
   }
}];

export class Tabs {
   static id = 'azui-tabs';
   static settings = {
      headerHeight: 36,
      draggable: true,
      resizable: true,
      detachable: true,
      closeOnEmpty: true
   };

   static z = 0;

   init() {

      const me = this;
      const dom = me.dom;
      const settings = me.settings;


      // dom.style['grid-template-rows'] = `${settings.headerHeight}px 1fr`;

      me.createHeaderClicked = function (cm) {
         return function (event) {
            if (event.type === 'touchend') {
               // event.preventDefault();
               if (cm.rightClick.triggered) {
                  return;
               }
            }

            const currentTabNode = event.target.closest('.azTabs');
            const currentTabs = az.ui(Tabs, currentTabNode);
            if (event.button === 2 || cm.on || me.sorted) {
               return;
            }
            // console.log(event.button);
            const tabId = _getTabId(event.currentTarget.getAttribute('tab-id'));
            if (!event.target.classList.contains('close') && !event.target.parentNode.classList.contains('close')) {
               currentTabs.activate(tabId, true);
            }
         };
      };
      me.closeClicked = function (event) {
         const currentTabNode = event.target.closest('.azTabs');
         const currentTabs = az.ui(Tabs, currentTabNode);
         // console.log(event.currentTarget.parentNode.getAttribute('tab-id'));
         const tabId = _getTabId(event.currentTarget.parentNode.getAttribute('tab-id'));
         currentTabs.remove(tabId);
         event.stopPropagation();
      };

      me.applyEvents = el => {
         const closable = matches(el, '.azClosable');
         const cm = az.ui(ContextMenu, el, {
            items: getTabContextMenu(closable)
         });
         const headerClicked = me.createHeaderClicked(cm);
         el.addEventListener('mouseup', headerClicked);
         el.addEventListener('touchend', headerClicked);
      };

      let tabHeaderContainer = dom.querySelector('div.azTabHeader');
      if (!tabHeaderContainer) {
         tabHeaderContainer = document.createElement('div');
         tabHeaderContainer.classList.add('azTabHeader');
         dom.appendChild(tabHeaderContainer);
      }
      const tabLabelList = dom.querySelectorAll('div.azTabLabel'); // a list
      const tabLabels = document.createElement('div');
      tabLabels.classList.add('azTabLabels');
      tabHeaderContainer.appendChild(tabLabels);

      tabLabelList.forEach(el => {
         me.applyEvents(el);
         el.style.height = settings.headerHeight + 'px';

         if (matches(el, '.azClosable')) {
            const iconDiv = document.createElement('div');
            iconDiv.classList.add('close');
            iconDiv.appendChild(parseDOMElement(icons.svgClose)[0]);
            iconDiv.addEventListener('click', me.closeClicked);
            el.appendChild(iconDiv);
         }
         tabLabels.appendChild(el);
      });
      me.activateByIndex(0);

      // me.dragging = false;
      me.sortable = az.ui(Sortable, tabLabels, {
         detachable: settings.detachable,
         create: (e, target) => {
            if (matches(e.target, '.close,.close *')) {
               return false; // don't drag when clicking on icons
            }
            if (e.type === 'touchstart') {
               // prevent tab window from moving around while being dragged.
               e.preventDefault();
            }
         },
         // start: (e, data) => {
         //     me.dragging = true;
         // },
         sort: (e, data) => {
            me.sorted = true;
         },
         stop: (e, data) => {
            me.sorted = false;
            const tabId = _getTabId(data.source.getAttribute('tab-id'));
            if (data.detached) {
               const x = data.boundingClientRect.left + getDocScrollLeft();
               const y = data.boundingClientRect.top + getDocScrollTop();
               me.spawn(tabId, x, y);
            } else {
               const contentNode = me.dom.querySelector('[tab-id=azTabContent-' + tabId + ']');

               const targetTabsNode = data.source.closest('.azTabs');

               if (targetTabsNode !== me.dom) {
                  targetTabsNode.appendChild(contentNode);

                  const targetTabs = az.ui(Tabs, targetTabsNode);
                  targetTabs.activate(tabId);

                  const tabHeader = data.source; //.closest('.azTabLabel#azTabHeader-' + tabId);
                  // const isActive = matches(tabHeader, '.active');
                  const headers = me.dom.querySelectorAll('.azTabLabel');
                  if (headers.length) {
                     const active = tabHeader.parentNode.querySelector('.active');
                     if (!active) {
                        me.activateByIndex(0);
                     }
                     // me.showHideScrollers();
                     me.fitTabWidth();
                  } else if (settings.closeOnEmpty) {
                     remove(me.dom);
                  }
               }
            }
         },
         add: (e, elem) => {
            const draggable = az.ui(Draggable, elem);
            draggable.detachedX = false;
            draggable.detachedY = false;

            // draggable.stopHook = function () {
            //    // draggable and droppable need to be in the same sortable in order to
            //    // share the same place holder, improvement?
            //    az.ui(Droppable, elem, me.sortable.dropConfig, true);
            //    az.ui(Draggable, elem, me.sortable.dragConfig, true);
            // };
            me.dom.style['z-index'] = ++Tabs.z;
            me.fitTabWidth();
         }
      });

      tabHeaderContainer.style['height'] = settings.headerHeight + 'px';

      if (settings.draggable) {
         az.ui(Draggable, dom, {
            handle: '.azTabHeader',
            snapDistance: 8,
            create: function (event, ui) {
               me.dom.style['z-index'] = ++Tabs.z;
               // console.log(event.target.classList.contains('azTabHeader'));
               // console.log(event.target.classList);
            }
         });
      }
      if (settings.resizable) {
         az.ui(Resizable, dom, {
            hideHandles: true,
            minHeight: settings.headerHeight * 2,
            minWidth: 240,
            resize: e => {
               me.fitTabWidth();
            }
         });
      }

      const mouseDownTouchStartEventListener = function (event) {
         me.dom.style['z-index'] = ++Tabs.z;
      };
      me.dom.addEventListener('mousedown', mouseDownTouchStartEventListener);

      if (isTouchDevice()) {
         me.dom.addEventListener('touchstart', mouseDownTouchStartEventListener);
      }
   }

   fitTabWidth() {
      const me = this;
      const dom = me.dom;
      const nodeWidth = parseInt(getComputedStyle(dom)['width']);
      const tabLabels = dom.querySelectorAll('.azTabLabel:not(.az-placeholder)');
      const newWidth = Math.min((nodeWidth - (me.settings.draggable ? 40 : 0)) / tabLabels.length, 150);
      tabLabels.forEach(tabLabel => {
         // console.log(tabLabel);
         if (newWidth < 60) {
            tabLabel.querySelector('.icon').style['display'] = 'none';
            tabLabel.style['grid-template-columns'] = '0 1fr 30px';
         } else {
            tabLabel.querySelector('.icon').style['display'] = '';
            tabLabel.style['grid-template-columns'] = '30px 1fr 30px';
         }
         tabLabel.style['width'] = newWidth + 'px';
      });
   }

   spawn(tabId, x = 10, y = 10) {
      const me = this;
      const dom = me.dom;
      const tabHeader = document.querySelector('.azTabLabel[tab-id=azTabHeader-' + tabId + ']');
      const tabContent = document.querySelector('[tab-id=azTabContent-' + tabId + ']');
      const isActive = matches(tabHeader, '.active');

      const parentBcr = dom.parentNode.getBoundingClientRect();
      const parentX = parentBcr.left + getDocScrollLeft();
      const parentY = parentBcr.top + getDocScrollTop();
      const parentStyle = getComputedStyle(dom.parentNode);
      const parentBorderTop = parseInt(parentStyle['border-top-width']);
      const parentBorderLeft = parseInt(parentStyle['border-left-width']);
      if (
         parentStyle.position !== 'relative' &&
         parentStyle.position !== 'absolute' &&
         parentStyle.position !== 'fixed'
      ) {
         dom.parentNode.style.position = 'relative';
      }

      const nodeStyle = getComputedStyle(dom);
      // console.log(nodeStyle.width, nodeStyle.height);
      const newTabsElem = document.createElement('div');
      newTabsElem.style.width = nodeStyle.width;
      newTabsElem.style.height = nodeStyle.height;
      newTabsElem.style.position = nodeStyle.position;
      newTabsElem.style.top = y - parentY - parentBorderTop + 'px';
      newTabsElem.style.left = x - parentX - parentBorderLeft + 'px';
      dom.parentNode.appendChild(newTabsElem);
      const newTabs = az.ui(Tabs, newTabsElem, {});

      // const newLabels = newNode.querySelector('div.azTabHeader>.azTabLabels');
      // console.log(tabHeader, newLabels);
      // newLabels.appendChild(tabHeader);
      tabContent.style['display'] = 'block';
      newTabs.add(null, tabHeader, tabContent);
      // remove(tabHeader);

      const headers = dom.querySelectorAll('.azTabLabel');
      if (headers.length) {
         if (isActive) {
            me.activateByIndex(0);
         }
         // me.showHideScrollers();
         me.fitTabWidth();
      } else if (me.settings.closeOnEmpty) {
         remove(dom);
      }
   }

   add(icon, title, content, closable = true, activate = true, tabId = null, trigger = false) {
      const me = this;

      if (tabId) {
         const labels = [...me.dom.querySelectorAll('div.azTabLabel')];
         for (const el of labels) {
            const elId = _getTabId(el.getAttribute('tab-id'));
            if (elId === tabId) {
               me.activate(tabId);
               return true;
            }
         }
      }

      tabId = tabId || randGen(8);

      const iconDiv = document.createElement('div');
      iconDiv.classList.add('icon');
      iconDiv.appendChild(normalizeIcon(icon || ''));

      let headerNode;
      if (typeof title === 'string') {
         const titleDiv = document.createElement('div');
         titleDiv.classList.add('title');
         titleDiv.appendChild(normalizeIcon(title));
         headerNode = document.createElement('div');
         // headerNode.classList.add('azTabLabel');
         headerNode.appendChild(iconDiv);
         headerNode.appendChild(titleDiv);

         if (closable) {
            const closeDiv = document.createElement('div');
            closeDiv.classList.add('close');
            closeDiv.appendChild(parseDOMElement(icons.svgClose)[0]);
            headerNode.appendChild(closeDiv);
            headerNode.classList.add('azClosable');
         }
      } else {
         headerNode = title;
      }

      headerNode.classList.add('azTabLabel');
      headerNode.style.height = me.settings.headerHeight + 'px';
      headerNode.setAttribute('tab-id', 'azTabHeader-' + tabId);

      const closeDiv = headerNode.querySelector('.close');
      if (closeDiv) {
         closeDiv.addEventListener('click', me.closeClicked);
      }

      me.sortable.add(headerNode);

      const contentNode = document.createElement('div');
      if (content && typeof content === 'string') {
         contentNode.innerHTML = content;
      } else {
         contentNode.appendChild(content);
      }
      contentNode.setAttribute('tab-id', 'azTabContent-' + tabId);
      contentNode.classList.add('azTabContent');
      contentNode.style['display'] = 'none';
      me.dom.appendChild(contentNode);

      me.applyEvents(headerNode);

      // me.showHideScrollers();
      me.fitTabWidth();
      if (activate === true) {
         me.activate(tabId, trigger);
      }
      return tabId;
   }

   remove(tabId) {
      const me = this;
      const dom = me.dom;
      const tab = dom.querySelector('.azTabLabel[tab-id=azTabHeader-' + tabId + ']');
      const isActive = matches(tab, '.active');
      remove(tab);
      remove(dom.querySelector('[tab-id=azTabContent-' + tabId + ']'));
      const headers = dom.querySelectorAll('.azTabLabel');
      if (headers.length) {
         if (isActive) {
            me.activateByIndex(0);
         }
         me.fitTabWidth();
      } else if (me.settings.closeOnEmpty) {
         remove(dom);
      }
   }
   activate(tabId, trigger = false) {
      const me = this;
      const dom = me.dom;
      let activated = false;

      if (trigger) {
         // @doc:event:start
         // @doc:willActivate: fires before a `tab` is activated.
         // @doc:tabId: tabId
         // @doc:event:end
         dom.dispatchEvent(
            new CustomEvent('willActivate', {
               detail: {
                  tabId
               }
            })
         );
      }

      dom.querySelectorAll('div.azTabContent').forEach(el => {
         const elId = _getTabId(el.getAttribute('tab-id'));
         if (elId === tabId) {
            el.style['display'] = 'block';
         } else {
            el.style['display'] = 'none';
         }
      });
      dom.querySelectorAll('div.azTabLabel').forEach(el => {
         const elId = _getTabId(el.getAttribute('tab-id'));
         if (elId === tabId) {
            el.classList.add('active');
            activated = true;
         } else {
            el.classList.remove('active');
         }
      });

      if (trigger && activated) {
         // @doc:event:start
         // @doc:didActivate: fires after a `tab` is activated.
         // @doc:tabId: tabId
         // @doc:event:end
         dom.dispatchEvent(
            new CustomEvent('didActivate', {
               detail: {
                  tabId
               }
            })
         );
      }

      return activated;
   }
   activateByIndex(tabIndex, trigger = false) {
      const me = this;
      const dom = me.dom;
      let activated = false;

      let tabId;
      dom.querySelectorAll('div.azTabContent').forEach((el, index) => {
         if (index === tabIndex) {
            if (trigger) {
               tabId = _getTabId(el.getAttribute('tab-id'));
               dom.dispatchEvent(
                  new CustomEvent('willActivate', {
                     detail: {
                        tabId
                     }
                  })
               );
            }
            el.style['display'] = 'block';
         } else {
            el.style['display'] = 'none';
         }
      });
      dom.querySelectorAll('div.azTabLabel').forEach((el, index) => {
         if (index === tabIndex) {
            el.classList.add('active');
            activated = true;
         } else {
            el.classList.remove('active');
         }
      });
      if (trigger && activated) {
         dom.dispatchEvent(
            new CustomEvent('didActivate', {
               detail: {
                  tabId
               }
            })
         );
      }
      return activated;
   }
}
