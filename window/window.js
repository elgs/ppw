import * as icons from '../icons.js';
import { isOutside, isTouchDevice, matches, parseDOMElement, siblings } from '../azdom.js';
import { Docker } from '../docker/docker.js';
import { Resizable } from '../resizable/resizable.js';
import { Draggable } from '../draggable/draggable.js';
import { DoubleClick } from '../doubleclick/doubleclick.js';
import { ContextMenu } from '../contextmenu/contextmenu.js';

export class Window {
   static id = 'azui-window';
   static settings = {
      width: 400, // width: Width of `window`.
      height: 300, // height: Height of `window`.
      headerHeight: 36, // headerHeight: Header height of `window`.
      icon: '', // icon: An icon place at the top left corner of the window and the docker bar. It supports unicode icons or svg strings.
      showMinimizeButton: true, // showMinimizeButton: Whether to show the minimize button or not.
      showMaximizeButton: true, // showMaximizeButton: Whether to show the maximize button or not.
      showCloseButton: true, // showCloseButton: Whether to show close button or not.
      showSlideButton: true, // showSlideButton: Whether to show slide button or not.
      showButtonInDocker: true, // showButtonInDocker: Whether to show button in docker or not.
      title: 'azUI', // title: Title of the window.
      snapToEdge: true // snapToEdge: Whether to snap to container or not when dragging cursor is close to the container border.
   };

   init() {
      const me = this;
      const dom = this.dom;
      const settings = me.settings;

      if (!settings.showMinimizeButton) {
         settings.showButtonInDocker = false;
      }

      dom.style['position'] = 'absolute';

      const dockers = siblings(dom, '.azDocker');
      if (dockers.length === 0) {
         const dockerElem = document.createElement('div');
         dom.parentNode.appendChild(dockerElem);
         me.docker = az.ui(Docker, dockerElem, null, true);
      } else {
         const dockerElem = dockers[0];
         me.docker = az.ui(Docker, dockerElem, null, false);
      }

      this.headerIcons = {};

      const initHeader = function () {
         settings.showSlideButton && addHeaderIcon('slideup', icons.svgArrowUp, 'Hide', false, 'right', me.slideup);
         settings.showSlideButton && addHeaderIcon('slidedown', icons.svgArrowDown, 'Show', true, 'right', me.slidedown);
         settings.showMinimizeButton &&
            addHeaderIcon('minimize', icons.svgWindowMin, 'Minimize', false, 'right', me.minimize);
         (settings.showMinimizeButton || settings.showMaximizeButton) &&
            addHeaderIcon('restore', icons.svgWindowNormal, 'Restore', true, 'right', me.restore);
         settings.showMaximizeButton &&
            addHeaderIcon('maximize', icons.svgWindowMax, 'Maximize', false, 'right', me.maximize);
         settings.showCloseButton && addHeaderIcon('close', icons.svgClose, 'Close', false, 'right', me.close);
      };

      const setHeaderIcon = function (icon) {
         header.querySelector('.left span.icon').innerHTML = icon;
      };

      const setHeaderTitle = function (title) {
         header.querySelector('.left span.title').innerHTML = title;
      };

      const addHeaderIcon = function (key, icon, toolTip, hidden, position, callback) {
         const iconSpan = document.createElement('span');
         iconSpan.classList.add('azHeaderIcon');
         if (hidden) {
            iconSpan.style.display = 'none';
         }
         iconSpan.appendChild(parseDOMElement(icon)[0]);
         iconSpan.addEventListener('click', function (event) {
            if (callback) {
               callback.call(me);
            }
         });
         me.headerIcons[key] = iconSpan;
         header.querySelector('.' + position).appendChild(iconSpan);
      };
      // const removeHeaderIcon = function (key) {
      //     remove(me.headerIcons[key]);
      // };
      // const showHeaderIcon = function (key) {
      //     me.headerIcons[key].style.display = 'inline-block';
      // };
      // const hideHeaderIcon = function (key) {
      //     me.headerIcons[key].style.display = 'none';
      // };

      const content = document.createElement('div');
      content.classList.add('azWindowContent');
      Array.prototype.slice.call(dom.children).map(el => {
         content.appendChild(el);
      });
      dom.appendChild(content);

      const header = document.createElement('div');
      header.style['height'] = settings.headerHeight + 'px';
      header.classList.add('azWindowHeader');
      header.appendChild(
         parseDOMElement('<div class="left"><span class="icon"></span><span class="title"></span></div>')[0]
      );
      header.appendChild(parseDOMElement('<div class="center"></div>')[0]);
      header.appendChild(parseDOMElement('<div class="right"></div>')[0]);
      setHeaderIcon(settings.icon);
      setHeaderTitle(settings.title);
      // az.ui(InlineEdit(header.querySelector('.left span.title'));
      initHeader();
      // header.prependTo(dom);
      dom.insertBefore(header, dom.firstChild);

      const mouseDownTouchStartEventListener = function (event) {
         // console.log(event.type);
         me.activate(true);
      };
      me.dom.addEventListener('mousedown', mouseDownTouchStartEventListener);

      if (isTouchDevice()) {
         me.dom.addEventListener('touchstart', mouseDownTouchStartEventListener);
      }

      let pb;

      az.ui(Resizable, dom, {
         minHeight: settings.headerHeight * 2,
         minWidth: 240,
         hideHandles: true,
         start: function (event, ui) {
            pb = dom.parentNode.getBoundingClientRect();
         },
         resize: function (event, ui) {
            if (isOutside(event.pageX || event.touches[0].pageX, event.pageY || event.touches[0].pageY, pb)) {
               return false;
            }
         }
      });

      let _top, _left, _bottom, _right, _width, _height;
      const createGhost = (pos, top, left, bottom, right, width, height) => {
         _top = top;
         _left = left;
         _bottom = bottom;
         _right = right;
         _width = width;
         _height = height;

         if (!me.ghost) {
            const styles = getComputedStyle(me.dom);

            const ghost = document.createElement(`div`);
            ghost.style.position = 'absolute';
            ghost.style.left = styles.left;
            ghost.style.top = styles.top;
            ghost.style.height = styles.height;
            ghost.style.width = styles.width;
            ghost.style.border = '1px solid red';
            ghost.style['background-color'] = 'tomato';
            ghost.style.opacity = 0.2;
            ghost.style.margin = 0;
            ghost.style.padding = 0;
            ghost.style['z-index'] = Number.MAX_SAFE_INTEGER;
            ghost.style.transition = 'all .1s ease-in';

            dom.parentNode.appendChild(ghost);
            me.ghost = ghost;
            me.ghostPos = pos;

            setTimeout(() => {
               ghost.style.left = left;
               ghost.style.top = top;
               ghost.style.right = right;
               ghost.style.bottom = bottom;
               ghost.style.height = height;
               ghost.style.width = width;
            });
         } else if (me.ghostPos !== pos) {
            removeGhost();
            createGhost(pos, top, left, bottom, right, width, height);
         }
      };

      const removeGhost = (app = false) => {
         if (me.ghost) {
            if (app) {
               // record ghost position
               me.docker.snap(me.dockId, true);
               me.dom.style.left = _left;
               me.dom.style.top = _top;
               me.dom.style.right = _right;
               me.dom.style.bottom = _bottom;
               me.dom.style.height = _height;
               me.dom.style.width = _width;
               me.ghost.remove();
               // resize window to ghost position
            } else {
               me.ghost.remove();
            }
            me.ghostPos = null;
            me.ghost = null;
         }
      };

      az.ui(Draggable, dom, {
         handle: header,
         snapDistance: 8,
         create: function (event, ui) {
            const target = event.target;
            // console.log(target, event.currentTarget);
            pb = dom.parentNode.getBoundingClientRect();
            if (
               isTouchDevice() &&
               matches(target, '.azWindowHeader,.azWindowHeader *:not(.azHeaderIcon,.azHeaderIcon *)')
            ) {
               // prevent title from being selected on context menu, the :not() select is to allow icons to be correctly touched.
               event.preventDefault();
            }
            if (matches(target, '.azHeaderIcon,.azHeaderIcon *') || matches(target, 'input')) {
               return false; // don't drag when clicking on icons
            }
         },
         start: function (event, ui) {
            me.docker.storeState(me.dockId);
         },
         drag: function (event, ui) {
            const cursorX = event.touches ? event.touches[0].pageX : event.pageX;
            const cursorY = event.touches ? event.touches[0].pageY : event.pageY;
            // console.log(cursorX, cursorY, pb);
            if (settings.snapToEdge) {
               const triggerDistanceCorner = 20;
               const triggerDistanceSide = 15;
               if (
                  Math.abs(cursorX - pb.left) < triggerDistanceCorner &&
                  Math.abs(cursorY - pb.top) < triggerDistanceCorner
               ) {
                  // console.log('nw');
                  createGhost('nw', 0, 0, '', '', '50%', '50%');
               } else if (
                  Math.abs(cursorX - pb.left) < triggerDistanceCorner &&
                  Math.abs(cursorY - pb.bottom) < triggerDistanceCorner
               ) {
                  // console.log('sw');
                  createGhost('sw', '', 0, 0, '', '50%', '50%');
               } else if (
                  Math.abs(cursorX - pb.right) < triggerDistanceCorner &&
                  Math.abs(cursorY - pb.bottom) < triggerDistanceCorner
               ) {
                  // console.log('se');
                  createGhost('se', '', '', 0, 0, '50%', '50%');
               } else if (
                  Math.abs(cursorX - pb.right) < triggerDistanceCorner &&
                  Math.abs(cursorY - pb.top) < triggerDistanceCorner
               ) {
                  // console.log('ne');
                  createGhost('ne', 0, '', '', 0, '50%', '50%');
               } else if (Math.abs(cursorX - pb.left) < triggerDistanceSide) {
                  // console.log('w');
                  createGhost('w', 0, 0, '', '', '50%', '100%');
               } else if (Math.abs(cursorY - pb.bottom) < triggerDistanceSide) {
                  // console.log('s');
                  createGhost('s', '', 0, 0, '', '100%', '50%');
               } else if (Math.abs(cursorX - pb.right) < triggerDistanceSide) {
                  // console.log('e');
                  createGhost('e', 0, '', '', 0, '50%', '100%');
               } else if (Math.abs(cursorY - pb.top) < triggerDistanceSide) {
                  // console.log('n');
                  createGhost('n', 0, 0, '', '', '100%', '50%');
               } else {
                  removeGhost();
               }
               // prevent text selection on snap.
               event.preventDefault();
            }
            if (isOutside(cursorX, cursorY, pb)) {
               return false;
            }
         },
         stop: function (event, ui) {
            removeGhost(!!me.ghost);
         }
      });

      az.ui(DoubleClick, header, {
         onDoubleClick: function (event) {
            // console.log(event.target);
            if (matches(event.target, 'span.azHeaderIcon,span.azHeaderIcon *')) {
               return;
            }
            const state = me.docked.getAttribute('state');
            if (state === 'normal') {
               me.maximize();
            } else {
               me.restore();
            }
         }
      });

      dom.style['left'] = me.docker.x + 'px';
      dom.style['top'] = me.docker.y + 'px';
      dom.style['height'] = settings.height + 'px';
      dom.style['width'] = settings.width + 'px';
      dom.style['z-index'] = me.docker.z;
      // dom.style['grid-template-rows'] = `${settings.headerHeight}px 1fr`;
      me.docker.x += settings.headerHeight;
      me.docker.y += settings.headerHeight;

      me.docked = me.docker.dock(dom, settings);
      me.dockId = dom.getAttribute('az-dock-ref');
      // console.log(me.docked, me.dockId);

      const cm = az.ui(ContextMenu, header, {
         items: me.docker.getContextMenuItems.call(me.docker, me.dockId, settings)
      });

      me.dom.addEventListener('activated', e => {
         me.activate(false);
      });
      me.dom.addEventListener('inactivated', e => {
         me.inactivate(false);
      });
      me.dom.addEventListener('undocked', e => {
         me.close(false);
      });

      // me.dom.addEventListener('minimized', 'minimized', e => {});
      settings.showMaximizeButton &&
         me.dom.addEventListener('maximized', e => {
            settings.showSlideButton && (me.headerIcons['slidedown'].style.display = 'none');
            settings.showSlideButton && (me.headerIcons['slideup'].style.display = 'none');
            me.headerIcons['maximize'].style.display = 'none';
            settings.showMinimizeButton && (me.headerIcons['minimize'].style.display = 'inline-block');
            me.headerIcons['restore'].style.display = 'inline-block';
         });
      (settings.showMaximizeButton || settings.showMinimizeButton) &&
         me.dom.addEventListener('normalized', e => {
            settings.showSlideButton && (me.headerIcons['slidedown'].style.display = 'none');
            settings.showSlideButton && (me.headerIcons['slideup'].style.display = 'inline-block');
            settings.showMaximizeButton && (me.headerIcons['maximize'].style.display = 'inline-block');
            settings.showMinimizeButton && (me.headerIcons['minimize'].style.display = 'inline-block');
            me.headerIcons['restore'].style.display = 'none';
         });
      settings.showSlideButton &&
         me.dom.addEventListener('slidup', e => {
            me.headerIcons['slideup'].style.display = 'none';
            me.headerIcons['slidedown'].style.display = 'inline-block';
            me.dom.style.transition = 'all .25s ease-in';
            me.dom.style.height = me.settings.headerHeight + 'px';
            setTimeout(() => {
               me.dom.style.transition = '';
            }, 250);
         });
      settings.showSlideButton &&
         me.dom.addEventListener('sliddown', e => {
            me.headerIcons['slideup'].style.display = 'inline-block';
            me.headerIcons['slidedown'].style.display = 'none';
         });
   }

   // method:start
   children() {
      //  Get child windows.
      // return: Returns an array of child windows with class '.azWindowContent>.azWindow'.
      // method:end
      const children = this.dom.querySelectorAll('.azWindowContent>.azWindow');
      return [...children].map(el => {
         return az.ui(Window, el);
      });
   }

   // method:start
   activate(notify = false) {
      //  Activate the window.
      // notify: Whether notify the docker or not.
      // method:end

      // two way notification
      const me = this;

      // event:start
      // beforeactivate: Fires before the window is activated.
      // elem: The DOM of the window, event.detail.elem.
      // event:end
      me.dom.dispatchEvent(
         new CustomEvent('beforeactivate', {
            detail: {
               elem: me.dom
            }
         })
      );

      siblings(me.dom, '.azWindow').forEach(el => {
         el.classList.remove('active');
         el.classList.add('inactive');
      });

      this.dom.classList.remove('inactive');
      this.dom.classList.add('active');

      me.dom.style['z-index'] = ++me.docker.z;

      if (notify) {
         me.docker.activate(this.dockId, false);
      }

      // event:start
      // afteractivate: Fires after the window is activated.
      // elem: The DOM of the window, event.detail.elem.
      // event:end
      me.dom.dispatchEvent(
         new CustomEvent('afteractivate', {
            detail: {
               elem: me.dom
            }
         })
      );
   }

   // method:start
   inactivate(notify = false) {
      //  Inactivate the window.
      // notify: Whether notify the docker or not.
      // method:end
      // two way notification
      const me = this;

      // event:start
      // beforeinactivate: Fires before the window is inactivated.
      // elem: The DOM of the window, event.detail.elem.
      // event:end
      me.dom.dispatchEvent(
         new CustomEvent('beforeinactivate', {
            detail: {
               elem: me.dom
            }
         })
      );

      this.dom.classList.remove('active');
      this.dom.classList.add('inactive');
      if (notify) {
         me.docker.inactivate(this.dockId, false);
      }

      // event:start
      // afterinactivate: Fires after the window is inactivated.
      // elem: The DOM of the window, event.detail.elem.
      // event:end
      me.dom.dispatchEvent(
         new CustomEvent('afterinactivate', {
            detail: {
               elem: me.dom
            }
         })
      );
   }

   // method:start
   close(notify = false) {
      /*  
          Close the window. 
          <pre><code> 
          const abc = '123'; 
          const def = function(){};
          </code></pre>
          */
      // notify: Whether notify the docker or not.
      // method:end
      // two way notification
      const me = this;

      // event:start
      // beforeclose: Fires before the window is closed.
      // elem: The DOM of the window, event.detail.elem.
      // event:end
      me.dom.dispatchEvent(
         new CustomEvent('beforeclose', {
            detail: {
               elem: me.dom
            }
         })
      );

      this.children().forEach(child => {
         child.docker.undock(child.dockId, true);
      });
      this.dom.remove();
      if (notify) {
         me.docker.undock(this.dockId, false);
      }

      // event:start
      // afterclose: Fires after the window is closed.
      // elem: The DOM of the window, event.detail.elem.
      // event:end
      me.dom.dispatchEvent(
         new CustomEvent('afterclose', {
            detail: {
               elem: me.dom
            }
         })
      );
   }

   // method:start
   slideup() {
      //  Slide up the window.
      // method:end
      const me = this;

      // event:start
      // beforeslideup: Fires before the window is slid up.
      // elem: The DOM of the window, event.detail.elem.
      // event:end
      me.dom.dispatchEvent(
         new CustomEvent('beforeslideup', {
            detail: {
               elem: me.dom
            }
         })
      );
      this.docker.slideup(this.dockId, true);

      // event:start
      // afterslideup: Fires after the window is slid up.
      // elem: The DOM of the window, event.detail.elem.
      // event:end
      me.dom.dispatchEvent(
         new CustomEvent('afterslideup', {
            detail: {
               elem: me.dom
            }
         })
      );
   }

   // method:start
   slidedown() {
      //  Slide down the window.
      // method:end
      const me = this;

      // event:start
      // beforeslidedown: Fires before the window is slid down.
      // elem: The DOM of the window, event.detail.elem.
      // event:end
      me.dom.dispatchEvent(
         new CustomEvent('beforeslidedown', {
            detail: {
               elem: me.dom
            }
         })
      );
      this.docker.slidedown(this.dockId, true);

      // event:start
      // afterslidedown: Fires after the window is slid down.
      // elem: The DOM of the window, event.detail.elem.
      // event:end
      me.dom.dispatchEvent(
         new CustomEvent('afterslidedown', {
            detail: {
               elem: me.dom
            }
         })
      );
   }

   // method:start
   minimize() {
      //  Minimize the window.
      // method:end
      const me = this;

      // event:start
      // beforeminimize: Fires before the window is minimized.
      // elem: The DOM of the window, event.detail.elem.
      // event:end
      me.dom.dispatchEvent(
         new CustomEvent('beforeminimize', {
            detail: {
               elem: me.dom
            }
         })
      );
      this.docker.minimize(this.dockId, true);

      // event:start
      // afterminimize: Fires after the window is minimized.
      // elem: The DOM of the window, event.detail.elem.
      // event:end
      me.dom.dispatchEvent(
         new CustomEvent('afterminimize', {
            detail: {
               elem: me.dom
            }
         })
      );
   }

   // method:start
   maximize() {
      //  Maximize the window.
      // method:end
      const me = this;

      // event:start
      // beforemaximize: Fires before the window is maximized.
      // elem: The DOM of the window, event.detail.elem.
      // event:end
      me.dom.dispatchEvent(
         new CustomEvent('beforemaximize', {
            detail: {
               elem: me.dom
            }
         })
      );
      this.docker.maximize(this.dockId, true);

      // event:start
      // aftermaximize: Fires after the window is maximized.
      // elem: The DOM of the window, event.detail.elem.
      // event:end
      me.dom.dispatchEvent(
         new CustomEvent('aftermaximize', {
            detail: {
               elem: me.dom
            }
         })
      );
   }

   // method:start
   restore() {
      //  Restore the window.
      // method:end
      const me = this;

      // event:start
      // beforerestore: Fires before the window is restored.
      // elem: The DOM of the window, event.detail.elem.
      // event:end
      me.dom.dispatchEvent(
         new CustomEvent('beforerestore', {
            detail: {
               elem: me.dom
            }
         })
      );
      this.docker.normalize(this.dockId, true);

      // event:start
      // afterrestore: Fires after the window is restored.
      // elem: The DOM of the window, event.detail.elem.
      // event:end
      me.dom.dispatchEvent(
         new CustomEvent('afterrestore', {
            detail: {
               elem: me.dom
            }
         })
      );
   }
}
