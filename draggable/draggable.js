import * as azdom from '../azdom.js';

export class Draggable {
   static id = 'azui-draggable';
   static settings = {
      // the handle this element is dragged on. It could be a DOM element, or a string of css selector, defaults to the element itself.
      handle: false,
      // the axis this element could be dragged along with, possible values are 'x', 'y', defaults to both directions.
      axis: false,
      // the continer element this element is constrained to. It could be a DOM element, or a string of css selector, defaults to false.
      containment: false,
      // distance in pixels dragged before this element actually starts to move.
      resist: false,
      // the degree of opacity the element is while dragging, default to false.
      opacity: false,
      // distance in pixels within which the element will snap to another's edge.
      snapDistance: 0,
      // the distance in pixels the gap is kept between snapped elements, defaults to 3.
      snapGap: 1,
      sortContainer: null,
      create: function (event) {
         // console.log('create');
      },
      start: function (event) {
         // console.log('start');
      },
      drag: function (event) {
         // console.log('drag');
      },
      stop: function (event) {
         // console.log('stop');
      }
   };

   init() {
      this.onmousedown = this.onmousedown.bind(this);
      this.onmousemove = this.onmousemove.bind(this);
      this.onmouseup = this.onmouseup.bind(this);

      const me = this;

      const dom = me.dom;
      me.dropTargetStates = {};
      me.position = getComputedStyle(dom).position;
      if (me.position !== 'absolute' && me.position !== 'fixed') {
         dom.style.position = 'relative';
      }
      me.position = getComputedStyle(dom).position;

      me.savedZIndex;

      me.detachedX = false;
      me.detachedY = false;

      me.dropTargets = null;
      me.mouseX0 = 0; // original mouse position
      me.mouseY0 = 0;
      me.containerBoundaries = null;
      me.mouseX = 0; // current mouse position
      me.mouseY = 0;
      me.mouseLX = 0; // last mouse position
      me.mouseLY = 0;
      me.mouseDX = 0; // mouse moved distance
      me.mouseDY = 0;
      me.mouseEX = 0; // mouse moved distance adjustment, usually snap sets these values
      me.mouseEY = 0;
      me.N = 0; // parent inner scroll bar to self outer margin
      me.E = 0;
      me.S = 0;
      me.W = 0;
      me.width = 0;
      me.height = 0;
      // me n, e, s, w, parent n, e ,s, w, contaner n, e, s, w
      me.scrollN;
      me.scrollE;
      me.scrollS;
      me.scrollW; // scrolled distance
      me.parentScrollN;
      me.parentScrollE;
      me.parentScrollS;
      me.parentScrollW; // parent scrolled distance
      me.containerScrollN;
      me.containerScrollE;
      me.containerScrollS;
      me.containerScrollW; // container scrolled distance

      me.containerBorderN = 0;
      me.containerBorderE = 0;
      me.containerBorderS = 0;
      me.containerBorderW = 0; // container borders
      me.containerPaddingN = 0;
      me.containerPaddingE = 0;
      me.containerPaddingS = 0;
      me.containerPaddingW = 0; // container paddings
      me.parentBorderN = 0;
      me.parentBorderE = 0;
      me.parentBorderS = 0;
      me.parentBorderW = 0; // offset parent borders
      me.parentPaddingN = 0;
      me.parentPaddingE = 0;
      me.parentPaddingS = 0;
      me.parentPaddingW = 0; // offset parent paddings
      me.marginN = 0;
      me.marginE = 0;
      me.marginS = 0;
      me.marginW = 0; // me margin
      me.resisted = false;
      me.started = false;

      if (azdom.isTouchDevice()) {
         me.dom.addEventListener('touchstart', me.onmousedown);
      }
      me.dom.addEventListener('mousedown', me.onmousedown);
   }

   onmousemove(e) {
      const me = this;
      const dom = me.dom;
      const settings = me.settings;
      // console.log(e.type, e.currentTarget, me);
      if (!me.dom) {
         return;
      }
      if (!me.started) {
         if (settings.start.call(me, e) === false) {
            return false;
         }

         me.setContainment(settings.containment);
         // console.log(settings.containment);

         // me.style['cursor', 'pointer');
         if (settings.opacity) {
            dom.style.opacity = settings.opacity;
         }
         me.started = true;

         const dts = me.dropTargets;
         dts.map(dt => {
            // const dropId = dt.getAttribute('drop-id');
            const ps = azdom.getPositionState(dom, dt.dt, e);
            if (az.dom.dndEvent.dragged & dt.interestedDropEvents) {
               dt.dt.dispatchEvent(
                  new CustomEvent('dragged', {
                     detail: {
                        source: dom,
                        target: dt.dt,
                        state: ps
                     }
                  })
               );
            }
         });
      }

      me.mouseLX = me.mouseX;
      me.mouseLY = me.mouseY;
      me.mouseX = e.touches ? e.touches[0].pageX : e.pageX;
      me.mouseY = e.touches ? e.touches[0].pageY : e.pageY;
      me.mouseDX = me.mouseX - me.mouseX0;
      me.mouseDY = me.mouseY - me.mouseY0;

      if (settings.drag.call(me, e) === false) {
         return false;
      }

      if (settings.snapDistance > 0) {
         // snap(initDiff, direction, allowOverlapOnMovingDirection = false, gap = 0, snapWhileSliding = false)
         me.snap(me._initDiffParent, 'top', true) || me.snap(me._initDiffParent, 'bottom', true);
         me.snap(me._initDiffParent, 'left', true) || me.snap(me._initDiffParent, 'right', true);

         for (const initDiffSibling of me._initDiffSiblings) {
            if (me.snap(initDiffSibling, 'topR', false, settings.snapGap) || me.snap(initDiffSibling, 'bottomR', false, -settings.snapGap)) {
               // snapped and slide on moving direction and snap to edge of other direction
               me.snap(initDiffSibling, 'left', false, 0, true) || me.snap(initDiffSibling, 'right', false, 0, true);
               break;
            } else if (me.snap(initDiffSibling, 'leftR', false, settings.snapGap) || me.snap(initDiffSibling, 'rightR', false, -settings.snapGap)) {
               // snapped and slide on moving direction and snap to edge of other direction
               me.snap(initDiffSibling, 'top', false, 0, true) || me.snap(initDiffSibling, 'bottom', false, 0, true);
               break;
            }
         }
      }

      me.mouseDX += me.mouseEX;
      me.mouseDY += me.mouseEY;

      if (!me.resisted && Math.abs(me.mouseDX) < settings.resist && Math.abs(me.mouseDY) < settings.resist) {
         return;
      }
      me.resisted = true;

      for (const dt of me.dropTargets) {
         const oldPs = me.dropTargetStates[dt.dropId];
         const ps = azdom.getPositionState(dom, dt.dt, e);
         me.dropTargetStates[dt.dropId] = ps;
         if (oldPs !== undefined && oldPs !== ps) {
            const states = Object.keys(az.dom.dndState);
            for (const state of states) {
               const nState = ps & az.dom.dndState[state];
               const oState = oldPs & az.dom.dndState[state];
               if (nState !== oState) {
                  const eventName = state + (!!nState ? '_in' : '_out');
                  if (az.dom.dndEvent[eventName] & dt.interestedDropEvents) {
                     dt.dt.dispatchEvent(
                        new CustomEvent(eventName, {
                           detail: {
                              source: dom,
                              target: dt.dt,
                              previousState: oldPs,
                              state: ps,
                              originalEvent: e
                           }
                        })
                     );
                     // because states are mutually exclusive, so break;
                     break;
                  }
               }
            }
         }
      }
      // me.dom.style['background-color'] = 'red';

      if (settings.axis === 'x') {
         me.moveX(me.mouseDX);
      } else if (settings.axis === 'y') {
         me.moveY(me.mouseDY);
      } else {
         me.moveX(me.mouseDX);
         me.moveY(me.mouseDY);
      }
   }

   onmouseup(e) {
      const me = this;
      const dom = this.dom;
      const settings = this.settings;
      if (me.started && settings.stop.call(me, e) === false) {
         return false;
      }
      me.started = false;
      me.resisted = false;
      dom.style['z-index'] = me.savedZIndex;

      // me.style['cursor', 'default');
      if (settings.opacity) {
         dom.style.opacity = 1;
      }

      if (azdom.isTouchDevice()) {
         document.removeEventListener('touchmove', me.onmousemove);
         document.removeEventListener('touchend', me.onmouseup);
         document.removeEventListener('touchcancel', me.onmouseup);
      }
      document.removeEventListener('mousemove', me.onmousemove);
      document.removeEventListener('mouseup', me.onmouseup);
      document.removeEventListener('mouseleave', me.onmouseup);

      const dts = me.dropTargets;
      dts.map(dt => {
         // const dropId = dt.getAttribute('drop-id');
         const ps = azdom.getPositionState(dom, dt.dt, e);
         if (az.dom.dndEvent.dropped & dt.interestedDropEvents) {
            dt.dt.dispatchEvent(
               new CustomEvent('dropped', {
                  detail: {
                     source: dom,
                     target: dt.dt,
                     state: ps
                  }
               })
            );
         }
      });
      me.dropTargets = null;
   }

   onmousedown(e) {
      const me = this;
      const dom = me.dom;
      const settings = me.settings;

      // if (e.type === 'touchstart') {
      //     // e.preventDefault();
      // }
      if (e.type === 'mousedown' && e.button !== 0) {
         return;
      }

      // the reson cannot do it is that scroll content on mobile device becomes not possible
      // client can use this in create() if needed.
      // if (e.type === 'touchstart') {
      //     e.preventDefault();
      // }

      // the reason not to use stopPropation is to allow other events to bubble through, like click to increase z-index.
      // e.stopPropagation(); // no no

      // only move the me.dom, not any of it's ancestors.
      if (e.target.closest(`.${Draggable.id}`) !== dom) {
         return;
      }

      me.mouseX = me.mouseX0 = e.touches ? e.touches[0].pageX : e.pageX;
      me.mouseY = me.mouseY0 = e.touches ? e.touches[0].pageY : e.pageY;
      me.mouseEX = 0;
      me.mouseEY = 0;

      if (settings.create?.call(me, e) === false) {
         return;
      }

      if (settings.snapDistance > 0) {
         me._initDiffParent = azdom.diffPosition(dom, dom.parentNode);

         me._initDiffSiblings = azdom.siblings(dom, `.${Draggable.id}`).filter(o => {
            const bcr = o.getBoundingClientRect();
            return bcr.height > 0 && bcr.width > 0;
         }).map(o => {
            return azdom.diffPosition(dom, o);
         });
      }

      const bcr = me.dom.getBoundingClientRect();
      me.originalBpr = {
         top: bcr.top + azdom.getDocScrollTop(),
         left: bcr.left + azdom.getDocScrollLeft()
      };

      if (settings.handle) {
         let handle = settings.handle;
         if (typeof settings.handle === 'string') {
            handle = dom.querySelector(settings.handle);
         }
         if (handle) {
            const hb = handle.getBoundingClientRect();
            if (azdom.isOutside(me.mouseX0, me.mouseY0, hb)) {
               return;
            }
         }
      }

      me.savedZIndex = getComputedStyle(dom)['z-index'];
      dom.style['z-index'] = Number.MAX_SAFE_INTEGER;

      if (azdom.isTouchDevice()) {
         document.addEventListener('touchmove', me.onmousemove);
         document.addEventListener('touchend', me.onmouseup);
         document.addEventListener('touchcancel', me.onmouseup);
      }
      document.addEventListener('mousemove', me.onmousemove);
      document.addEventListener('mouseup', me.onmouseup);
      document.addEventListener('mouseleave', me.onmouseup);

      me.dropTargets = [...document.querySelectorAll('.azui-droppable')]
         .filter(dt => dt !== dom)
         .map(dt => {
            return {
               dt,
               dropId: dt.getAttribute('azui-droppable'),
               interestedDropEvents: dt.getAttribute('az-interested-drop-events') * 1
            };
         });

      const dts = me.dropTargets;
      dts.map(dt => {
         const ps = azdom.getPositionState(dom, dt.dt, e);
         me.dropTargetStates[dt.dropId] = ps;
      });
   }

   setContainment(containment) {
      const me = this;
      const dom = this.dom;
      const nodeStyles = getComputedStyle(dom);

      let container;
      if (containment) {
         if (typeof containment === 'string') {
            if (containment === 'parent') {
               container = dom.parentNode;
            } else if (containment === 'document') {
               // me.containerScrollN = -document.documentElement.scrollLeft;
               // me.containerScrollW = -document.documentElement.scrollTop;
               me.containerScrollW = -azdom.getDocScrollLeft();
               me.containerScrollN = -azdom.getDocScrollTop();
               me.containerScrollS = azdom.getDocHeight();
               me.containerScrollE = azdom.getDocWidth();
            } else if (containment === 'window') {
               me.containerScrollN = 0;
               me.containerScrollW = 0;
               me.containerScrollS = window.innerHeight;
               me.containerScrollE = window.innerWidth;
            } else {
               container = document.querySelector(containment);
            }
         } else if (Array.isArray(containment)) {
            me.containerScrollW = containment[0];
            me.containerScrollN = containment[1];
            me.containerScrollE = containment[2];
            me.containerScrollS = containment[3];
         } else if (typeof containment === 'object') {
            if (containment instanceof NodeList) {
               container = containment[0];
            } else if (containment instanceof Node) {
               container = containment;
               // console.log(containment);
            }
         }

         if (container && typeof container === 'object') {
            const containerStyles = getComputedStyle(container);
            me.containerBorderN = parseInt(containerStyles['border-top-width']);
            me.containerBorderE = parseInt(containerStyles['border-right-width']);
            me.containerBorderS = parseInt(containerStyles['border-bottom-width']);
            me.containerBorderW = parseInt(containerStyles['border-left-width']);

            const containerBoundaries = container.getBoundingClientRect();
            me.containerBoundaries = containerBoundaries;
            me.containerScrollN = containerBoundaries.top + azdom.getDocScrollTop();
            me.containerScrollE = containerBoundaries.right + azdom.getDocScrollLeft();
            me.containerScrollS = containerBoundaries.bottom + azdom.getDocScrollTop();
            me.containerScrollW = containerBoundaries.left + azdom.getDocScrollLeft();

            me.containerPaddingN = parseInt(containerStyles['padding-top']);
            me.containerPaddingE = parseInt(containerStyles['padding-right']);
            me.containerPaddingS = parseInt(containerStyles['padding-bottom']);
            me.containerPaddingW = parseInt(containerStyles['padding-left']);
         }
      }

      const parent = dom.offsetParent || document.body;
      const parentStyles = getComputedStyle(parent);
      const pp = parentStyles['position'];
      if (pp !== 'relative' && pp !== 'absolute' && pp !== 'fixed') {
         parent.style['position'] = 'relative';
      }

      const pb = parent.getBoundingClientRect();
      me.parentScrollN = pb.top + azdom.getDocScrollTop();
      me.parentScrollE = pb.right + azdom.getDocScrollLeft();
      me.parentScrollS = pb.bottom + azdom.getDocScrollTop();
      me.parentScrollW = pb.left + azdom.getDocScrollLeft();

      me.parentBorderN = parseInt(parentStyles['border-top-width']);
      me.parentBorderE = parseInt(parentStyles['border-right-width']);
      me.parentBorderS = parseInt(parentStyles['border-bottom-width']);
      me.parentBorderW = parseInt(parentStyles['border-left-width']);

      me.parentPaddingN = parseInt(parentStyles['padding-top']);
      me.parentPaddingE = parseInt(parentStyles['padding-right']);
      me.parentPaddingS = parseInt(parentStyles['padding-bottom']);
      me.parentPaddingW = parseInt(parentStyles['padding-left']);

      me.marginN = parseInt(nodeStyles['margin-top']);
      me.marginE = parseInt(nodeStyles['margin-right']);
      me.marginS = parseInt(nodeStyles['margin-bottom']);
      me.marginW = parseInt(nodeStyles['margin-left']);

      const mebcr = me.dom.getBoundingClientRect();
      me.scrollN = mebcr.top + azdom.getDocScrollTop();
      me.scrollE = mebcr.right + azdom.getDocScrollLeft();
      me.scrollS = mebcr.bottom + azdom.getDocScrollTop();
      me.scrollW = mebcr.left + azdom.getDocScrollLeft();

      if (nodeStyles['position'] === 'relative') {
         me.W = parseInt(nodeStyles['left'] === 'auto' ? '0' : nodeStyles['left']);
         me.E = parseInt(nodeStyles['right'] === 'auto' ? '0' : nodeStyles['right']);
         me.N = parseInt(nodeStyles['top'] === 'auto' ? '0' : nodeStyles['top']);
         me.S = parseInt(nodeStyles['bottom'] === 'auto' ? '0' : nodeStyles['bottom']);
      } else if (nodeStyles['position'] === 'absolute') {
         me.W = me.scrollW - me.parentScrollW - me.marginW - me.parentBorderW;
         me.N = me.scrollN - me.parentScrollN - me.marginN - me.parentBorderN;
         me.E = -me.scrollE + me.parentScrollE - me.marginE - me.parentBorderE;
         me.S = -me.scrollS + me.parentScrollS - me.marginS - me.parentBorderS;
      } else if (nodeStyles['position'] === 'fixed') {
         me.W = me.scrollW - me.marginW - azdom.getDocScrollLeft();
         me.N = me.scrollN - me.marginN - azdom.getDocScrollTop();
      }

      me.width = mebcr.width;
      me.height = mebcr.height;
   }

   moveX(by) {
      const me = this;
      if (me.position === 'absolute') {
         me.moveAbsoluteX(by);
      } else if (me.position === 'relative') {
         me.moveRelativeX(by);
      } else if (me.position === 'fixed') {
         me.moveFixedX(by);
      }
   }

   moveY(by) {
      const me = this;
      if (me.position === 'absolute') {
         me.moveAbsoluteY(by);
      } else if (me.position === 'relative') {
         me.moveRelativeY(by);
      } else if (me.position === 'fixed') {
         me.moveFixedY(by);
      }
   }

   moveAbsoluteX(dx) {
      const me = this;
      if (me.containerScrollW === undefined || me.detachedX) {
         me.dom.style.right = 'auto';
         me.dom.style.left = me.W + dx + 'px';
      } else {
         if (-dx > me.scrollW - me.containerScrollW - me.containerBorderW - me.containerPaddingW - me.marginW) {
            // console.log('hit left wall');
            const di = me.containerScrollW + me.containerBorderW + me.containerPaddingW - (me.parentScrollW + me.parentBorderW + me.parentPaddingW);
            me.dom.style.right = 'auto';
            me.dom.style.left = me.parentPaddingW + di + 'px';
         } else if (dx > me.containerScrollE - me.scrollE - me.containerBorderE - me.containerPaddingE - me.marginE) {
            // console.log('hit right wall');
            const di = me.containerScrollE - me.containerBorderE - me.containerPaddingE - (me.parentScrollE - me.parentBorderE - me.parentPaddingE);
            me.dom.style.left = 'auto';
            me.dom.style.right = me.parentPaddingE - di + 'px';
         } else {
            me.dom.style.right = 'auto';
            me.dom.style.left = me.W + dx + 'px';
         }
      }
   }

   moveAbsoluteY(dy) {
      const me = this;
      if (me.containerScrollN === undefined || me.detachedY) {
         me.dom.style.bottom = 'auto';
         me.dom.style.top = me.N + dy + 'px';
      } else {
         if (-dy > me.scrollN - me.containerScrollN - me.containerBorderN - me.containerPaddingN - me.marginN) {
            // console.log('hit ceiling');
            const di = me.containerScrollN + me.containerBorderN + me.containerPaddingN - (me.parentScrollN + me.parentBorderN + me.parentPaddingN);
            me.dom.style.bottom = 'auto';
            me.dom.style.top = me.parentPaddingN + di + 'px';
         } else if (dy > me.containerScrollS - me.scrollS - me.containerBorderS - me.containerPaddingS - me.marginS) {
            // console.log('hit floor');
            const di = me.containerScrollS - me.containerBorderS - me.containerPaddingS - (me.parentScrollS - me.parentBorderS - me.parentPaddingS);
            me.dom.style.top = 'auto';
            me.dom.style.bottom = me.parentPaddingS - di + 'px';
         } else {
            me.dom.style.bottom = 'auto';
            me.dom.style.top = me.N + dy + 'px';
         }
      }
   }

   moveFixedX(dx) {
      const me = this;
      if (me.containerScrollW === undefined || me.detachedX) {
         me.dom.style.right = 'auto';
         me.dom.style.left = me.W + dx + 'px';
      } else {
         if (-dx > me.scrollW - me.containerScrollW - me.containerBorderW - me.containerPaddingW - me.marginW) {
            // console.log('hit left wall');
            me.dom.style.right = 'auto';
            me.dom.style.left = me.containerScrollW + me.containerBorderW + me.containerPaddingW + 'px';
         } else if (dx > me.containerScrollE - me.scrollE - me.containerBorderE - me.containerPaddingE - me.marginE) {
            // console.log('hit right wall');
            me.dom.style.right = 'auto';
            me.dom.style.left = me.containerScrollE - me.containerBorderE - me.containerPaddingE - me.width - me.marginW - me.marginE + 'px';
         } else {
            me.dom.style.right = 'auto';
            me.dom.style.left = me.W + dx + 'px';
         }
      }
   }

   moveFixedY(dy) {
      const me = this;
      if (me.containerScrollN === undefined || me.detachedY) {
         me.dom.style.bottom = 'auto';
         me.dom.style.top = me.N + dy + 'px';
      } else {
         if (-dy > me.scrollN - me.containerScrollN - me.containerBorderN - me.containerPaddingN - me.marginN) {
            // console.log('hit ceiling');
            me.dom.style.bottom = 'auto';
            me.dom.style.top = me.containerScrollN + me.containerBorderN + me.containerPaddingN + 'px';
         } else if (dy > me.containerScrollS - me.scrollS - me.containerBorderS - me.containerPaddingS - me.marginS) {
            // console.log('hit floor');
            me.dom.style.bottom = 'auto';
            me.dom.style.top = me.containerScrollS - me.containerBorderS - me.containerPaddingS - me.height - me.marginN - me.marginS + 'px';
         } else {
            me.dom.style.bottom = 'auto';
            me.dom.style.top = me.N + dy + 'px';
         }
      }
   }

   moveRelativeX(dx) {
      const me = this;
      if (me.containerScrollW === undefined || me.detachedX) {
         me.dom.style.right = 'auto';
         me.dom.style.left = me.W + dx + 'px';
      } else {
         if (-dx > me.scrollW - me.containerScrollW - me.containerBorderW - me.containerPaddingW - me.marginW) {
            // console.log('hit left wall');
            me.dom.style.right = 'auto';
            me.dom.style.left = -(me.scrollW - me.containerScrollW - me.containerBorderW - me.containerPaddingW - me.marginW) + me.W + 'px';
         } else if (dx > me.containerScrollE - me.scrollE - me.containerBorderE - me.containerPaddingE - me.marginE) {
            // console.log('hit right wall');
            me.dom.style.left = 'auto';
            me.dom.style.right = -(me.containerScrollE - me.scrollE - me.containerBorderE - me.containerPaddingE - me.marginE) + me.E + 'px';
         } else {
            me.dom.style.right = 'auto';
            me.dom.style.left = me.W + dx + 'px';
         }
      }
   }

   moveRelativeY(dy) {
      const me = this;
      if (me.containerScrollN === undefined || me.detachedY) {
         me.dom.style.bottom = 'auto';
         me.dom.style.top = me.N + dy + 'px';
      } else {
         if (-dy > me.scrollN - me.containerScrollN - me.containerBorderN - me.containerPaddingN - me.marginN) {
            // console.log('hit ceiling');
            me.dom.style.bottom = 'auto';
            me.dom.style.top = -(me.scrollN - me.containerScrollN - me.containerBorderN - me.containerPaddingN - me.marginN) + me.N + 'px';
         } else if (dy > me.containerScrollS - me.scrollS - me.containerBorderS - me.containerPaddingS - me.marginS) {
            // console.log('hit floor');
            me.dom.style.top = 'auto';
            me.dom.style.bottom = -(me.containerScrollS - me.scrollS - me.containerBorderS - me.containerPaddingS - me.marginS) + me.S + 'px';
         } else {
            me.dom.style.bottom = 'auto';
            me.dom.style.top = me.N + dy + 'px';
         }
      }
   }

   // allowOverlapOnMovingDirection true when snapping to parent
   // snapWhileSliding true when sliding on snapped border and further snap to other direction's edges
   snap(initDiff, direction, allowOverlapOnMovingDirection = false, gap = 0, snapWhileSliding = false) {
      const me = this;
      const settings = me.settings;

      const DETACHED = 0;
      const SNAPPED = 1;
      const DETACHING = 2;

      let movingDirection, otherDirection;
      if (direction === 'top' || direction === 'bottom' || direction === 'topR' || direction === 'bottomR') {
         movingDirection = 'Y';
         otherDirection = 'X';
      } else if (direction === 'left' || direction === 'right' || direction === 'leftR' || direction === 'rightR') {
         movingDirection = 'X';
         otherDirection = 'Y';
      }
      if (!movingDirection || !otherDirection) {
         throw 'Invalid direction: ' + direction;
      }

      if (allowOverlapOnMovingDirection || snapWhileSliding || me.overlap(initDiff, otherDirection)) {
         const currentDiff = initDiff[direction] + me[`mouseD${movingDirection}`] + me[`mouseE${movingDirection}`] - gap;
         const mouseMoved = me[`mouse${movingDirection}`] - me[`mouseL${movingDirection}`];
         const doSnap = ((mouseMoved > 0 && currentDiff >= 0 && currentDiff < settings.snapDistance) || (mouseMoved < 0 && currentDiff <= 0 && currentDiff > -settings.snapDistance));
         // if (direction === 'rightR')
         //   console.log(currentDiff, mouseMoved, doSnap, 'x', initDiff[`_snapState${direction}`], 'y');
         if (doSnap || initDiff[`_snapState${direction}`] === SNAPPED) {
            if (initDiff[`_snapState${direction}`] === SNAPPED) {
               const held = me[`mouse${movingDirection}`] - initDiff[`_mouseSnappedAt${direction}`];
               // if (direction === 'left' || direction === 'right')
               //   console.log('held', direction, held);
               if (Math.abs(held) >= settings.snapDistance) {
                  initDiff[`_snapState${direction}`] = DETACHING;
                  delete initDiff[`_mouseSnappedAt${direction}`];
                  me[`mouseE${movingDirection}`] -= held;
                  // if (direction === 'rightR')
                  //   console.log(direction, 'detaching', 'held:', held);
                  return DETACHING;
               } else {
                  me[`mouseD${movingDirection}`] = -initDiff[direction] - me[`mouseE${movingDirection}`] + gap;
                  // if (snapWhileSliding)
                  //   console.log(direction, 'snapped');
                  return SNAPPED;
               }
            } else if (initDiff[`_snapState${direction}`] !== DETACHING) {
               // if (snapWhileSliding)
               //   console.log(direction, initDiff[`_snapState${direction}`]);
               initDiff[`_snapState${direction}`] = SNAPPED;
               me[`mouseD${movingDirection}`] = -initDiff[direction] - me[`mouseE${movingDirection}`] + gap;
               initDiff[`_mouseSnappedAt${direction}`] = me[`mouse${movingDirection}`];
               // if (snapWhileSliding)
               //   console.log(direction, 'touched');
               return SNAPPED;
            }
         } else if (initDiff[`_snapState${direction}`] !== DETACHED && mouseMoved !== 0) {
            initDiff[`_snapState${direction}`] = DETACHED;
            // if (direction === 'rightR')
            //   console.log(direction, 'detached');
            return DETACHED;
         }
      } else if (initDiff[`_snapState${direction}`] !== DETACHED) {
         // slide out without detaching
         // console.log('slide out');
         initDiff[`_snapState${direction}`] = DETACHED;
         if (initDiff[`_mouseSnappedAt${direction}`]) {
            const held = me[`mouse${movingDirection}`] - initDiff[`_mouseSnappedAt${direction}`];
            me[`mouseE${movingDirection}`] -= held;
            delete initDiff[`_mouseSnappedAt${direction}`];
         }
      }
   }

   overlap(initDiff, coor) {
      const me = this;
      let directions;
      if (coor === 'Y') {
         directions = ['topR', 'bottomR'];
      } else if (coor === 'X') {
         directions = ['leftR', 'rightR'];
      }
      if (!directions) {
         throw 'Invalid coordinate: ' + coor;
      }

      const distance = me[`mouseD${coor}`];
      const ret = (initDiff[directions[0]] + distance) * (initDiff[directions[1]] + distance) < 0;
      return ret;
   }
}
