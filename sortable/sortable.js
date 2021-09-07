import { Draggable } from '../draggable/draggable.js';
import { Droppable } from '../droppable/droppable.js';
import { diffPositionInnerBorder, getDocScrollLeft, getDocScrollTop, getHeight, getWidth, index, insertAfter, insertBefore, matches, position, remove, setHeight, setWidth, siblings, swapElement } from '../azdom.js';

export class Sortable {
   static id = 'azui-sortable';
   static settings = {
      placeholder: true,
      showPlaceHolder: false,
      detachable: false,
      align: 'x', // or y
      create: function (event, ui) {
         // console.log('create');
      },
      start: function (event, ui) {
         // console.log('start');
      },
      sort: function (event, data) {
         // console.log('sort', data);
      },
      stop: function (event, data) {
         // console.log('stop', data);
      },
      add: function (event, data) {
         // console.log('add', data);
      },
   };

   init() {

      const me = this;
      const settings = me.settings;
      const dom = me.dom;
      this.z = 0;

      if (settings.detachable) {
         az.ui(Droppable, dom, {
            interestedDropEvents: az.dom.dndEvent.pointer_in | az.dom.dndEvent.pointer_out,
            sortContainer: me,
            pointer_in: function (e) {
               // console.log('pointer in fired');
               const source = e.detail.source;
               if (!source.classList.contains('azSortableItem')) {
                  return;
               }

               source.classList.add('az-sortable-moving');

               const draggable = az.ui(Draggable, source);
               const droppable = az.ui(Droppable, source);
               if (draggable.settings.sortContainer.settings.placeholder !== me.settings.placeholder) {
                  return;
               }
               draggable.settings.sortContainer = me;
               droppable.settings.sortContainer = me;
               const detachedContainer = draggable.detachedContainer;
               if (!detachedContainer) {
                  return;
               }
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

               setTimeout(() => {
                  // don't trigger on target center event until 50ms later.
                  source.classList.remove('az-sortable-moving');
                  source.style.visibility = 'visible';
               }, 50);
            },
            pointer_out: function (e) {
               // console.log('pointer out fired');
               if (!me.selected) {
                  return;
               }
               const source = e.detail.source;
               if (!source.classList.contains('azSortableItem')) {
                  return;
               }
               // console.log(me.selected);
               const draggable = az.ui(Draggable, me.selected);
               draggable.detachedX = true;
               draggable.detachedY = true;

               draggable.detachedContainer = me;
            }
         });
      }

      const items = Array.prototype.filter.call(dom.children, n => matches(n, '.azSortableItem:not(.az-placeholder)'));
      items.forEach(item => {
         az.ui(Draggable, item, me.dragConfig);
         az.ui(Droppable, item, me.dropConfig);
      });
   }

   add(elem, cursorX = Number.MAX_SAFE_INTEGER, cursorY = Number.MAX_SAFE_INTEGER) {
      const me = this;
      const dom = me.dom;
      const settings = me.settings;

      if (settings.add.call(this, elem) === false) {
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

      az.ui(Draggable, elem, me.dragConfig);
      az.ui(Droppable, elem, me.dropConfig);

   }

   dragConfig = {
      containment: this.dom,
      resist: 5,
      create: this.onDragCreate,
      start: this.onDragStart,
      stop: this.onDragStop,
      sortContainer: this,
   };

   dropConfig = {
      interestedDropEvents: az.dom.dndEvent.target_center_in | az.dom.dndEvent.target_center_out,
      target_center_in: this.onOverTargetCenter,
      target_center_out: this.onLeaveTargetCenter,
      sortContainer: this,
   };

   onDragCreate(e) {
      if (this.settings.sortContainer.settings.create.call(this.settings.sortContainer, e) === false) {
         return false;
      }
   };

   onDragStart(e) {
      const sortContainerSettings = this.settings.sortContainer.settings;
      this.settings.sortContainer.selected = this.dom;
      if (sortContainerSettings.start.call(this.settings.sortContainer, e) === false) {
         return false;
      }
      this.dom.style['z-index'] = ++this.settings.sortContainer.z;
      this.dom.classList.add('azSortableSelected');

      if (sortContainerSettings.placeholder) {
         this.settings.sortContainer.ph = this.dom.cloneNode(false);
         this.settings.sortContainer.ph.removeAttribute('id');
         this.settings.sortContainer.ph.classList.add('az-placeholder');
         if (!sortContainerSettings.showPlaceHolder) {
            this.settings.sortContainer.ph.style['visibility'] = 'hidden';
         }
         // console.log(target, this.ph);

         const w = getWidth(this.dom);
         const h = getHeight(this.dom);
         const offsetTop = position(this.dom).top + this.dom.scrollTop;
         const offsetLeft = position(this.dom).left + this.dom.scrollLeft;
         // console.log(offsetTop, offsetLeft);
         this.settings.sortContainer.ph.style['background-color'] = 'red';

         this.dom.style.position = 'absolute';
         this.dom.style.top = offsetTop + 'px';
         this.dom.style.left = offsetLeft + 'px';
         this.dom.style.right = 'auto';
         this.dom.style.bottom = 'auto';
         setWidth(this.dom, w);
         setHeight(this.dom, h);
         // insert me.ph before me.selected
         insertBefore(this.settings.sortContainer.ph, this.dom);
      } else {
         this.dom.classList.add('azSortableDeny');
      }
   }

   onOverTargetCenter(e) {
      // console.log('on over target center!');
      const settings = this.settings.sortContainer.settings;
      const data = e.detail;
      if (!data.source.classList.contains('azSortableItem') || data.source.classList.contains('az-sortable-moving')) {
         return;
      }

      if (settings.sort.call(this.settings.sortContainer, e, data) === false) {
         return false;
      }
      if (settings.placeholder) {
         if (this.settings.sortContainer.ph) {
            // console.log('ph:', this.settings.sortContainer.dom);
            // console.log('target:', data.target);
            swapElement(this.settings.sortContainer.ph, data.target);
         }
         // console.log(data.target);
      } else if (this.settings.sortContainer.selected) {
         siblings(data.target).forEach(el => el.classList.remove('azSortableDropAfter', 'azSortableDropBefore'));
         data.target.classList.add(index(this.settings.sortContainer.selected) < index(data.target) ? 'azSortableDropAfter' : 'azSortableDropBefore');
         this.settings.sortContainer.selected.classList.remove('azSortableDeny');
         this.settings.sortContainer.selected.classList.add('azSortableAllow');
         this.settings.sortContainer.ph = data.target;
      }
   }

   onLeaveTargetCenter(e) {
      // console.log('on leave target center!');
      const settings = this.settings.sortContainer.settings;
      const data = e.detail;
      if (!data.source.classList.contains('azSortableItem')) {
         return;
      }
      if (settings.sort.call(this.settings.sortContainer, e, data, this.settings.sortContainer) === false) {
         return false;
      }
      if (!settings.placeholder && this.settings.sortContainer.selected) {
         siblings(this.settings.sortContainer.selected).forEach(el => el.classList.remove('azSortableDropAfter', 'azSortableDropBefore'));
         this.settings.sortContainer.selected.classList.remove('azSortableAllow');
         this.settings.sortContainer.selected.classList.add('azSortableDeny');
         this.settings.sortContainer.ph = null;
      }
   }

   onDragStop(e) {
      // console.log('on drag stop');
      const sortContainerSettings = this.settings.sortContainer.settings;
      const data = {
         source: this.settings.sortContainer.selected,
         target: this.settings.sortContainer.ph,
         boundingClientRect: this.dom.getBoundingClientRect(),
         detached: this.detachedX || this.detachedY
      };
      if (this.settings.sortContainer.selected) {
         this.settings.sortContainer.selected.classList.remove('azSortableSelected');
         this.settings.sortContainer.selected.classList.remove('azSortableAllow');
         this.settings.sortContainer.selected.classList.remove('azSortableDeny');
         if (this.settings.sortContainer.ph) {
            if (sortContainerSettings.placeholder) {
               this.settings.sortContainer.selected.style.width = '';
               this.settings.sortContainer.selected.style.height = '';
               insertBefore(this.settings.sortContainer.selected, this.settings.sortContainer.ph);
               remove(this.settings.sortContainer.ph);
               this.dom.style.position = 'relative';
            } else {
               this.settings.sortContainer.ph.classList.remove('azSortableDropBefore');
               this.settings.sortContainer.ph.classList.remove('azSortableDropAfter');
               if (index(this.settings.sortContainer.selected) < index(this.settings.sortContainer.ph)) {
                  insertAfter(this.settings.sortContainer.selected, this.settings.sortContainer.ph);
               } else {
                  insertBefore(this.settings.sortContainer.selected, this.settings.sortContainer.ph);
               }
            }
            this.settings.sortContainer.ph = null;
         }
         this.settings.sortContainer.selected = null;
      }
      // console.log(me.selected, target, me.ph);
      this.dom.style.top = '';
      this.dom.style.left = '';
      this.dom.style.right = '';
      this.dom.style.bottom = '';

      if (sortContainerSettings.stop.call(this.settings.sortContainer, e, data) === false) {
         return false;
      }
   }
}
