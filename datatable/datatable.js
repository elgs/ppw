import '../_core/core.js';
import * as icons from '../_core/icons.js';
import {
   getWidth,
   index,
   insertAfter,
   insertBefore,
   isTouchDevice,
   parseDOMElement,
   setOuterBorderWidth,
   setWidth,
   textWidth,
   getHeight,
   diffPosition,
   siblings,
   empty
} from '../_core/lib.js';
import { Resizable } from '../resizable/resizable.js';
import { ContextMenu } from '../contextmenu/contextmenu.js';
import { Sortable } from '../sortable/sortable.js';
import { DoubleClick } from '../doubleclick/doubleclick.js';
import { InlineEdit } from '../inlineedit/inlineedit.js';
import { Pager } from '../pager/pager.js';

const normalizeCol = col => {
   if (typeof col === 'object') {
      return col;
   } else if (typeof col === 'function') {
      return col();
   } else {
      return {
         text: col
      };
   }
};

export class DataTable {
   static id = 'azui-datatable';
   static settings = {
      pageNumber: 1,
      pageSize: 25,
      sortColumnKey: false,
      sortDirection: false,
      selectMode: false, // volatile, sticky,
      rowContextMenu: false
   };

   init() {
      const me = this;
      const dom = this.dom;
      const settings = this.settings;

      // empty(dom);

      me.totalSize = 0;

      const refresh = function (pageData, totalSize, pageNumber) {
         me.lastSelectedRowNum = 0;
         me.lastSelectedColKey = 0;
         me.totalSize = totalSize;
         settings.pageNumber = pageNumber;

         if (me.pager) {
            me.pager.settings.totalSize = totalSize;
            me.pager.settings.pageNumber = pageNumber;
         }

         empty(tbody);

         me.rows = pageData.map((row, index) => {
            const tr = document.createElement('div');
            tr.classList.add('tr');
            tr.setAttribute('tr-num', index);
            tbody.appendChild(tr);

            settings.columns.map(col => {
               const cell = parseDOMElement(`<span class='cell'>${row[col.key]}</span>`)[0];
               const td = document.createElement('div');
               td.classList.add('td');
               td.setAttribute('col-key', col.key);
               td.appendChild(cell);

               const ie = az.ui(InlineEdit, cell, {
                  type: col.type,
                  allowNewItems: col.allowNewItems,
                  options: col.options,
                  start: function (event, ui) {
                     me.activeEditor = ie.editor;
                  },
                  cancel: (event, ui) => {
                     me.activeEditor = null;
                     tbody.focus({
                        preventScroll: true
                     });
                  },
                  done: (event, ui) => {
                     if (event?.detail?.originalEvent?.type === 'mousedown') {
                        // prevent other row from being selected when clicking on inline dropdown
                        me.noSelect = true;
                     }
                     me.activeEditor = null;
                     tbody.focus({
                        preventScroll: true
                     });
                  }
               });
               if (col.hidden) {
                  td.style.display = 'none';
               }
               tr.appendChild(td);

               if (col.width) {
                  setOuterBorderWidth(td, col.width);
               }
            });

            // sorting
            if (settings.sortDirection) {
               const th = thead.querySelector(`.th[col-key="${settings.sortColumnKey}"]`);
               thead.querySelectorAll('.azThSort').forEach(el => {
                  el.style['display'] = 'none';
               });
               th.querySelectorAll(settings.sortDirection === 'asc' ? '.azThSortUp' : '.azThSortDown').forEach(el => {
                  el.style['display'] = 'inline-block';
               });
            }
            return tr;
         });
      };

      const rowSelected = e => {
         if (me.noSelect) {
            me.noSelect = false;
            return;
         }
         if (e.type === 'mouseup' && e.button !== 0) {
            return;
         }

         setTimeout(() => {
            const tr = e.target.closest('div.tr');
            const td = e.target.closest('div.td');
            if (!tr || !td) {
               return;
            }

            const trNum = tr.getAttribute('tr-num') * 1;
            const colKey = td.getAttribute('col-key') * 1;

            // console.log('shift:', e.shiftKey);
            // console.log('ctrl:', e.ctrlKey);
            // console.log('alt:', e.altKey);
            // console.log('meta:', e.metaKey);

            const ctrlOrCmdPressed = e.ctrlKey || e.metaKey;
            const shiftPressed = e.shiftKey;

            const shiftPress = () => {
               if (me.lastSelectedRowNum <= trNum) {
                  for (let i = me.lastSelectedRowNum; i < trNum; ++i) {
                     me.rows[i + 1].classList.toggle('selected');
                  }
               } else {
                  for (let i = me.lastSelectedRowNum; i > trNum; --i) {
                     me.rows[i - 1].classList.toggle('selected');
                  }
               }
               window.getSelection().removeAllRanges();
            };

            if (settings.selectMode === 'sticky') {
               if (shiftPressed) {
                  shiftPress();
               } else {
                  tr.classList.toggle('selected');
               }
            } else if (settings.selectMode === 'volatile') {
               if (shiftPressed) {
                  shiftPress();
               } else if (ctrlOrCmdPressed) {
                  tr.classList.toggle('selected');
               } else {
                  me.rows.map(tr => {
                     tr.classList.remove('selected');
                  });
                  tr.classList.add('selected');
               }
            }
            me.lastSelectedRowNum = trNum;
            me.lastSelectedColKey = colKey;
            me.selectedCell = td.querySelector('span.cell');
            // console.log(me.selectedCell.innerHTML);
         });
      };

      const onKeyDown = e => {
         // console.log(e.keyCode);

         if (e.key === 'Escape') {
            // esc
            e.preventDefault();
            me.rows[me.lastSelectedRowNum].classList.remove('selected');
         } else if (e.key === 'ArrowLeft') {
            // left
            if (document.activeElement === me.activeEditor) {
               return;
            }
            e.preventDefault();
            me.pager.update(--settings.pageNumber);
            e.currentTarget.scrollTop = 0;
         } else if (e.key === 'ArrowUp') {
            // up
            if (document.activeElement === me.activeEditor) {
               return;
            }
            e.preventDefault();
            me.rows[me.lastSelectedRowNum].classList.remove('selected');
            me.lastSelectedRowNum = --me.lastSelectedRowNum < 0 ? 0 : me.lastSelectedRowNum;
            me.rows[me.lastSelectedRowNum].classList.add('selected');

            // const tbodyHeight = getHeight(e.currentTarget);
            const rowHeight = me.rows[me.lastSelectedRowNum].offsetHeight;
            const topDiff = diffPosition(me.rows[me.lastSelectedRowNum], e.currentTarget).top;
            if (topDiff < 0) {
               // scroll down rowHeight
               e.currentTarget.scrollTop -= rowHeight;
            }
         } else if (e.key === 'ArrowRight') {
            // right
            if (document.activeElement === me.activeEditor) {
               return;
            }
            e.preventDefault();
            me.pager.update(++settings.pageNumber);
            e.currentTarget.scrollTop = 0;
         } else if (e.key === 'ArrowDown') {
            // down
            if (document.activeElement === me.activeEditor) {
               return;
            }
            e.preventDefault();
            if (me.rows[me.lastSelectedRowNum + 1]) {
               me.rows[me.lastSelectedRowNum].classList.remove('selected');
               me.lastSelectedRowNum =
                  ++me.lastSelectedRowNum >= settings.pageSize ? settings.pageSize - 1 : me.lastSelectedRowNum;

               me.rows[me.lastSelectedRowNum].classList.add('selected');

               const tbodyHeight = getHeight(e.currentTarget);
               const rowHeight = me.rows[me.lastSelectedRowNum].offsetHeight;
               const topDiff = diffPosition(me.rows[me.lastSelectedRowNum], e.currentTarget).top;
               if (rowHeight + topDiff > tbodyHeight) {
                  // scroll down rowHeight
                  e.currentTarget.scrollTop += rowHeight;
               }
            }
         } else if (e.key === 'Enter') {
            // enter
            e.preventDefault();
         }
      };

      const thead = document.createElement('div');
      thead.classList.add('thead');
      dom.appendChild(thead);

      const tbody = document.createElement('div');
      tbody.classList.add('tbody');

      if (settings.selectMode) {
         tbody.addEventListener('mouseup', rowSelected);
         if (isTouchDevice()) {
            tbody.addEventListener('touchend', rowSelected);
         }
      }

      tbody.setAttribute('tabindex', 0);
      tbody.addEventListener('keydown', onKeyDown);

      dom.appendChild(tbody);

      const tfoot = document.createElement('div');
      tfoot.classList.add('tfoot');
      dom.appendChild(tfoot);

      const totalWidth = settings.columns.reduce((a, c) => a + (c.width || 100), 0);

      setWidth(dom, 2 + totalWidth);

      settings.columns = settings.columns.map((col, index) => {
         const ncol = normalizeCol(col);
         // yes, not !==
         if (ncol.key != '0') {
            ncol.key = ncol.key || index;
         }
         return ncol;
      });

      settings.columns.map(col => {
         const sortUp = parseDOMElement(icons.svgTriangleUp)[0];
         sortUp.classList.add('azThSort', 'azThSortUp');
         const sortDown = parseDOMElement(icons.svgTriangleDown)[0];
         sortDown.classList.add('azThSort', 'azThSortDown');
         const th = document.createElement('div');
         th.classList.add(`th`, `azSortableItem`);
         th.innerHTML = col.text;
         th.appendChild(sortUp);
         th.appendChild(sortDown);
         th.setAttribute('col-key', col.key);
         if (col.hidden) {
            th.style.display = 'none';
            // console.log(col.key);
         }
         thead.appendChild(th);
         if (col.width) {
            setOuterBorderWidth(th, col.width);
         }
      });

      // resizing columns
      thead.querySelectorAll('.th').forEach(el => {
         az.ui(Resizable, el, {
            handles: 'e',
            minWidth: 100,
            hideHandles: true,
            handleSize: 6,
            // maxWidth: 400,
            create: function (e) {
               const target = this;
               target.setAttribute('widthOnCreate', getWidth(target));
            },
            stop: function (e) {
               const target = this;
               // console.log(index(target));
               const woc = target.getAttribute('widthOnCreate') * 1;
               target.removeAttribute('widthOnCreate');
               const dw = getWidth(target) - woc;
               const newWidth = getWidth(dom) + dw;
               setWidth(dom, newWidth);
               const tds = tbody.querySelectorAll(`div.td:nth-of-type(${index(target) + 1})`);
               tds.forEach(el => {
                  setWidth(el, getWidth(el) + dw);
               });
               settings.columns[index(target)].width = tds[0].offsetWidth;
            },
            onDoubleClick: function (event) {
               const th = event.target.parentNode;
               const idx = index(th);
               const tds = tbody.querySelectorAll(`div.td:nth-of-type(${idx + 1})`);
               let maxWidth = 0;
               tds.forEach(el => {
                  maxWidth = Math.max(textWidth(el), maxWidth);
               });
               maxWidth = Math.max(80, maxWidth) + 15;
               const newWidth = getWidth(dom) + maxWidth - getWidth(tds[0]);
               setWidth(dom, newWidth);
               tds.forEach(el => {
                  setOuterBorderWidth(el, maxWidth);
               });
               setOuterBorderWidth(th, maxWidth);
               settings.columns[idx].width = tds[0].offsetWidth;

               // prevent sorting
               event.stopPropagation();
            }
         });
      });

      const sortCmItems = [
         {
            icon: icons.svgTriangleUp,
            title: 'Sort Ascending',
            action: function (e, target) {
               settings.sortDirection = 'desc';
               sortAll(target.getAttribute('col-key'));
               return false;
            }
         },
         {
            icon: icons.svgTriangleDown,
            title: 'Sort Descending',
            action: function (e, target) {
               settings.sortDirection = 'asc';
               sortAll(target.getAttribute('col-key'));
               return false;
            }
         }
      ];
      const colCmItems = () => {
         return settings.columns.map(col => {
            return {
               icon: function () {
                  const cb = parseDOMElement(`<input type="checkbox" ${col.hidden ? '' : 'checked="checked"'}>`)[0];
                  cb.addEventListener('click', function (e) {
                     e.preventDefault();
                  });
                  return cb;
               },
               title: function () {
                  return col.text;
               },
               action: function (e, target) {
                  const cb = e.currentTarget.querySelector('span.icon>input[type=checkbox]');
                  setTimeout(() => {
                     // neglect the effect of e.preventDefault in the icon function;
                     cb.checked = !cb.checked;
                     if (cb.checked) {
                        dom.querySelectorAll(`[col-key="${col.key}"]`).forEach(el => {
                           el.style.display = '';
                        });
                        col.hidden = false;
                     } else {
                        dom.querySelectorAll(`[col-key="${col.key}"]`).forEach(el => {
                           el.style.display = 'none';
                        });
                        col.hidden = true;
                     }
                  });
               }
            };
         });
      };

      thead.querySelectorAll('.th').forEach(el => {
         az.ui(ContextMenu, el, {
            items: () => [...sortCmItems, null, ...colCmItems()]
         });
      });

      const indexOfColumn = colKey => {
         for (let i = 0; i < settings.columns.length; ++i) {
            // yes, not ===
            if (colKey == settings.columns[i].key) {
               return i;
            }
         }
         return -1;
      };

      // moving columns
      az.ui(Sortable, thead, {
         placeholder: false,
         stop: function (e, data) {
            if (!data.source || !data.target) {
               return;
            }

            // console.log(data.source, data.target);
            const sourceColKey = data.source.getAttribute('col-key');
            const targetColKey = data.target.getAttribute('col-key');
            // console.log(sourceColKey, targetColKey);

            const sourceIndex = indexOfColumn(sourceColKey);
            const targetIndex = indexOfColumn(targetColKey);

            settings.columns.splice(targetIndex, 0, settings.columns.splice(sourceIndex, 1)[0]);
            tbody.querySelectorAll('div.tr').forEach(tr => {
               const std = tr.querySelector(`div.td[col-key='${sourceColKey}']`);
               const ttd = tr.querySelector(`div.td[col-key='${targetColKey}']`);
               // console.log(std, ttd, sourceIndex, targetIndex);
               if (sourceIndex < targetIndex) {
                  insertAfter(std, ttd);
               } else {
                  insertBefore(std, ttd);
               }
            });
            // console.log(settings.columns);
         }
      });

      const sortAll = function (colKey) {
         const column = settings.columns.find(column => column.key == colKey);
         const sortKey = column.key;
         if (sortKey !== settings.sortColumnKey || settings.sortDirection === 'desc') {
            settings.sortDirection = 'asc';
         } else {
            settings.sortDirection = 'desc';
         }
         settings.sortColumnKey = sortKey;

         settings.loadData(
            settings.pageNumber,
            settings.pageSize,
            settings.sortColumnKey,
            settings.sortDirection,
            refresh
         );
      };

      thead.querySelectorAll('.th').forEach(el => {
         az.ui(DoubleClick, el, {
            onDoubleClick: function (e) {
               // console.log(this);
               sortAll(this.getAttribute('col-key'));
            }
         });
      });

      const thSelected = e => {
         if (e.type === 'touchend') {
            // prevent mouseup from being triggered on touch device.
            e.preventDefault();
         }

         if (e.type === 'mouseup' && e.button !== 0) {
            return;
         }

         siblings(e.currentTarget, '.th').forEach(s => {
            s.classList.remove('active');
         });
         e.currentTarget.classList.add('active');
      };

      thead.querySelectorAll('.th').forEach(el => {
         el.addEventListener('mouseup', thSelected);
         if (isTouchDevice()) {
            el.addEventListener('touchend', thSelected);
         }
      });

      settings.loadData(settings.pageNumber, settings.pageSize, settings.sortColumnKey, settings.sortDirection, refresh);

      az.ui(ContextMenu, tbody, {
         items: settings.rowContextMenu,
         preventDefault: e => e.target.tagName.toLowerCase() === 'span',
         onDismiss: e => {
            // if context menu is activate by menu key, tbody will lose focus, causing next menu key press not activating the context menu
            tbody.focus({
               preventScroll: true
            });
         }
      });

      me.pager = az.ui(Pager, tfoot, {
         pageSize: settings.pageSize,
         totalSize: me.totalSize,
         pageNumber: settings.pageNumber,
         onPageChange: function (pageNumber, pageSize) {
            settings.pageSize = pageSize;
            settings.pageNumber = pageNumber;
            settings.loadData(pageNumber, pageSize, settings.sortColumnKey, settings.sortDirection, refresh);
         }
      });
   }
}
