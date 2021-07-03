import { Draggable } from '../draggable/draggable.js';
import { Droppable } from '../droppable/droppable.js';
import { diffPositionInnerBorder, getDocScrollLeft, getDocScrollTop, getHeight, getWidth, index, insertAfter, insertBefore, matches, position, remove, setHeight, setWidth, siblings, swapElement } from '../azdom.js';

export class Sortable {
   static id = 'azui-sortable';
   constructor(dom, options) {
      const me = this;
      const settings = {
         placeholder: true,
         showPlaceHolder: false,
         detachable: false,
         align: 'x', // or y
         create: function (event, ui, me) {
            // console.log('create', ui);
         },
         start: function (event, ui, me) {
            // console.log('start', ui);
         },
         sort: function (event, data, me) {
            // console.log('sort', data);
         },
         stop: function (event, data, me) {
            // console.log('stop', data);
         },
         add: function (event, data, me) {
            // console.log('add', data);
         },
         ...options
      };

      this.settings = settings;
      this.dom = dom;

      this.z = 0;


      if (settings.detachable) {
         az.ui(Droppable, dom, {
            interestedDropEvents: az.dom.dndEvent.pointer_in | az.dom.dndEvent.pointer_out,
            pointer_in: function (e) {
               // console.log('pointer in fired');
               const source = e.detail.source;
               if (!source.classList.contains('azSortableItem')) {
                  return;
               }

               source.classList.add('az-sortable-moving');

               const draggable = az.ui(Draggable, source);
               const droppable = az.ui(Droppable, source);
               const detachedContainer = draggable.detachedContainer;
               // if (!detachedContainer) {
               //   return;
               // }
               me.selected = source;
               const phs = siblings(source, '.az-placeholder');
               if (phs.length > 0) {
                  me.ph = phs[0];
               }
               const ptrEvt = e.detail.originalEvent;
               const cursorX = ptrEvt.pageX ?? ptrEvt.touches[0].pageX;
               const cursorY = ptrEvt.pageY ?? ptrEvt.touches[0].pageY;

               // otherwise, the dragged in elem flickers on drag in.
               source.style.visibility = 'hidden';
               me.add(source, cursorX, cursorY);

               if (me.ph) {
                  const diffContainer = diffPositionInnerBorder(me.dom, detachedContainer.dom);
                  // console.log(me.dom, detachedContainer.dom);

                  draggable.mouseX0 += diffContainer.left;
                  draggable.mouseY0 += diffContainer.top;
                  // console.log(draggable.mouseX0, draggable.mouseY0);

                  insertBefore(me.ph, source);
               } else {
                  // console.log(draggable.originalBpr);
                  me.selected.style.top = '';
                  me.selected.style.left = '';
                  me.selected.style.right = '';
                  me.selected.style.bottom = '';

                  const bcr = me.selected.getBoundingClientRect();
                  const bpr = {
                     top: bcr.top + getDocScrollTop(),
                     left: bcr.left + getDocScrollLeft()
                  };

                  const diffDraggable = {
                     top: bpr.top - draggable.originalBpr.top,
                     left: bpr.left - draggable.originalBpr.left
                  };

                  draggable.mouseX0 += diffDraggable.left;
                  draggable.mouseY0 += diffDraggable.top;
                  draggable.setContainment(me.dom);
                  // console.log(diffDraggable);
                  // console.log(draggable.mouseX0, draggable.mouseY0);
                  draggable.originalBpr = bpr;
               }

               draggable.detachedX = false;
               draggable.detachedY = false;

               draggable.stopHook = function () {
                  // draggable and droppable need to be in the same sortable in order to share the same place holder, improvement?
                  draggable.settings = {
                     ...draggable.settings,
                     ...me.getDragConfig(me),
                  };
                  droppable.settings = {
                     ...droppable.settings,
                     ...me.getDropConfig(me),
                  };
               };

               setTimeout(() => {
                  // don't trigger on target center event until 50ms later.
                  source.classList.remove('az-sortable-moving');
                  source.style.visibility = 'visible';
               }, 50);
            },
            pointer_out: function (e) {
               // console.log('pointer out fired');
               const source = e.detail.source;
               if (!source.classList.contains('azSortableItem')) {
                  return;
               }
               // console.log(me.selected);
               const draggable = az.ui(Draggable, me.selected);
               draggable.detachedX = true;
               draggable.detachedY = true;

               draggable.detachedContainer = me;

               draggable.stopHook = null;
            }
         });
      }

      const items = Array.prototype.filter.call(dom.children, n => matches(n, '.azSortableItem:not(.az-placeholder)'));
      items.forEach(item => {
         az.ui(Draggable, item, me.getDragConfig(me));
         az.ui(Droppable, item, me.getDropConfig(me));
      });
   }

   add(elem, cursorX = Number.MAX_SAFE_INTEGER, cursorY = Number.MAX_SAFE_INTEGER) {
      const me = this;
      const dom = me.dom;
      const settings = me.settings;

      if (settings.add(null, elem, me) === false) {
         return false;
      }

      const items = Array.prototype.filter.call(dom.children, n => matches(n, '.azSortableItem:not(.az-placeholder)'));

      let nearestItem = null;
      let direction = true;
      let distance = Number.MAX_SAFE_INTEGER;
      items.map(item => {
         const bcr = item.getBoundingClientRect();
         const x = bcr.left + getDocScrollLeft() + bcr.width / 2;
         const y = bcr.top + getDocScrollTop() + bcr.height / 2;
         const dx = cursorX - x;
         const dy = cursorY - y;
         const d = dx * dx + dy * dy;
         if (d < distance) {
            distance = d;
            nearestItem = item;

            if (settings.align === 'x') {
               direction = dx >= 0;
            } else if (settings.align === 'y') {
               direction = dy >= 0;
            }
         }
      });

      if (!nearestItem) {
         dom.appendChild(elem);
      } else {
         if (direction) {
            insertAfter(elem, nearestItem);
         } else {
            insertBefore(elem, nearestItem);
         }
      }

      elem.classList.add('azSortableItem');

      // do nothing if initialized, initialize if not initialized.
      az.ui(Draggable, elem, me.getDragConfig(me));
      az.ui(Droppable, elem, me.getDropConfig(me));

   }

   getDragConfig(me) {
      return {
         containment: me.dom,
         resist: 5,
         create: this.onDragCreate.bind(me),
         start: this.onDragStart.bind(me),
         stop: this.onDragStop.bind(me),
      };
   }

   getDropConfig(me) {
      return {
         interestedDropEvents: az.dom.dndEvent.target_center_in | az.dom.dndEvent.target_center_out,
         target_center_in: this.onOverTargetCenter.bind(me),
         target_center_out: this.onLeaveTargetCenter.bind(me),
      };
   };

   onDragCreate(e, target) {
      if (this.settings.create(e, target, this) === false) {
         return false;
      }
   };

   onDragStart(e, target) {
      const settings = this.settings;
      const dom = this.dom;
      this.selected = target;
      if (settings.start(e, this.selected, this) === false) {
         return false;
      }
      target.style['z-index'] = ++this.z;
      this.selected.classList.add('azSortableSelected');

      if (settings.placeholder) {
         this.ph = target.cloneNode(false);
         this.ph.removeAttribute('id');
         this.ph.classList.add('az-placeholder');
         if (!settings.showPlaceHolder) {
            // me.ph.style['visibility'] = 'hidden';
         }
         // console.log(target, me.ph);

         const w = getWidth(this.selected);
         const h = getHeight(this.selected);
         const offsetTop = position(this.selected).top + dom.scrollTop;
         const offsetLeft = position(this.selected).left + dom.scrollLeft;
         // console.log(offsetTop, offsetLeft);
         this.ph.style['background-color'] = 'red';

         target.style.position = 'absolute';
         target.style.top = offsetTop + 'px';
         target.style.left = offsetLeft + 'px';
         target.style.right = 'auto';
         target.style.bottom = 'auto';
         setWidth(this.selected, w);
         setHeight(this.selected, h);
         // insert me.ph before me.selected
         insertBefore(this.ph, this.selected);
      } else {
         this.selected.classList.add('azSortableDeny');
      }
   };

   onOverTargetCenter(e) {
      // console.log('on over target center!');
      const settings = this.settings;
      const data = e.detail;
      if (!data.source.classList.contains('azSortableItem') || data.source.classList.contains('az-sortable-moving')) {
         return;
      }

      if (settings.sort(e, data, this) === false) {
         return false;
      }
      console.log('a', this.dom, data.target);
      if (settings.placeholder) {
         if (this.ph) {
            console.log('b');
            // console.log('me.ph:', me.ph);
            // console.log('target:', data.target);
            swapElement(this.ph, data.target);
         }
         // console.log(data.target);
      } else if (this.selected) {
         siblings(data.target).forEach(el => el.classList.remove('azSortableDropAfter', 'azSortableDropBefore'));
         data.target.classList.add(index(this.selected) < index(data.target) ? 'azSortableDropAfter' : 'azSortableDropBefore');
         this.selected.classList.remove('azSortableDeny');
         this.selected.classList.add('azSortableAllow');
         this.ph = data.target;
      }
   };

   onLeaveTargetCenter(e) {
      // console.log('on leave target center!');
      const settings = this.settings;
      const me = this;
      const data = e.detail;
      if (!data.source.classList.contains('azSortableItem')) {
         return;
      }
      if (settings.sort(e, data, me) === false) {
         return false;
      }
      if (!settings.placeholder) {
         siblings(me.selected).forEach(el => el.classList.remove('azSortableDropAfter', 'azSortableDropBefore'));
         me.selected.classList.remove('azSortableAllow');
         me.selected.classList.add('azSortableDeny');
         me.ph = null;
      }
   };

   onDragStop(e, target, draggable) {
      // console.log(me.selected, target, me.ph);
      // console.log('on drag stop');
      const settings = this.settings;
      const me = this;
      const data = {
         source: me.selected,
         target: me.ph,
         boundingClientRect: target.getBoundingClientRect(),
         detached: draggable.detachedX || draggable.detachedY
      };
      if (me.selected) {
         me.selected.classList.remove('azSortableSelected');
         me.selected.classList.remove('azSortableAllow');
         me.selected.classList.remove('azSortableDeny');
         if (me.ph) {
            if (settings.placeholder) {
               me.selected.style.width = '';
               me.selected.style.height = '';
               insertBefore(me.selected, me.ph);
               remove(me.ph);
               target.style.position = 'relative';
            } else {
               me.ph.classList.remove('azSortableDropBefore');
               me.ph.classList.remove('azSortableDropAfter');
               if (index(me.selected) < index(me.ph)) {
                  insertAfter(me.selected, me.ph);
               } else {
                  insertBefore(me.selected, me.ph);
               }
            }
            me.ph = null;
         }
         me.selected = null;
      }
      // console.log(me.selected, target, me.ph);
      target.style.top = '';
      target.style.left = '';
      target.style.right = '';
      target.style.bottom = '';

      if (settings.stop(e, data, me) === false) {
         return false;
      }

      if (draggable.stopHook) {
         setTimeout(() => {
            draggable.stopHook();
            draggable.stopHook = null;
         });
      }
   };

}
