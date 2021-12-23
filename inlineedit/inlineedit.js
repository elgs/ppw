import * as icons from '../icons.js';
import { insertAfter } from '../azdom.js';
import { DoubleClick } from '../doubleclick/doubleclick.js';
import { Select } from '../select/select.js';

export class InlineEdit {
   static id = 'azui-inlineedit';
   static settings = {
      type: 'text', // number, select
      allowNewItems: true,
      options: [],
      value: null,
      create: function (event, ui) {
         // console.log('create', ui);
      },
      start: function (event, ui) {
         // console.log('start', ui);
      },
      edit: function (event, ui) {
         // console.log('edit', ui.value);
      },
      cancel: function (event, ui) {
         // console.log('cancel', ui);
      },
      done: function (event, ui) {
         // console.log('done', ui);
      }
   };

   init() {
      const me = this;
      const dom = this.dom;
      const settings = this.settings;

      me.active = false;

      if (settings.create(null, this) === false) {
         return false;
      }

      me.cancel = function (e) {
         if (!me.active) {
            return;
         }

         const editor = me.editor;
         const v = editor.value;
         if (settings.cancel(e, v) === false) {
            return false;
         }
         editor.parentNode.remove();
         dom.style.display = '';
         me.active = false;
      };

      me.done = function (e) {
         if (!me.active) {
            return;
         }

         const editor = me.editor;
         const v = editor.value;
         if (settings.done(e, v) === false) {
            return false;
         }
         if (v) {
            dom.textContent = v;
         } else {
            dom.innerHTML = '&nbsp;';
         }
         editor.parentNode.remove();
         dom.style.display = '';
         me.active = false;
      };

      me.edit = function (e) {
         if (me.active) {
            return;
         }
         // const clickedElem = this;
         // me.each(function () {
         // const clicked = clickedElem === node;
         const originalValue = dom.textContent.trim();
         const editorWrapper = document.createElement('div');
         editorWrapper.classList.add('azui', 'azui-inlineeditorwrapper');

         const dirtySign = document.createElement('div');
         dirtySign.classList.add('dirtySign');
         dirtySign.style.display = 'none';
         // $editor.on('blur', cancel);

         const _checkDirty = function (editor) {
            // console.log(originalValue, editor.value);
            const dirty = originalValue !== editor.value;
            if (dirty) {
               dirtySign.style.display = '';
            } else {
               dirtySign.style.display = 'none';
            }
         };

         if (settings.type === 'select') {
            const select = az.ui(Select, editorWrapper, {
               items: settings.options,
               allowNewItems: settings.allowNewItems,
               select: e => _checkDirty(select.selectInput)
            });
            editorWrapper.appendChild(dirtySign);
            select.dom.addEventListener('done', function (e) {
               me.done(e);
            });
            select.dom.addEventListener('cancel', function (e) {
               me.cancel(e);
            });
            select.selectInput.classList.add('azInlineEditorInput');
            me.editor = select.selectInput;
            // editorWrapper.value = originalValue;
            select.selectInput.value = originalValue;
            // if (clicked) {
            setTimeout(() => {
               select.selectInput.focus();
            });
            // }
         } else {
            editorWrapper.appendChild(dirtySign);
            const editor = document.createElement('input');
            me.editor = editor;
            editor.setAttribute('type', 'text');
            editor.setAttribute('size', 1);
            editor.classList.add('azInlineEditorInput');
            editor.value = originalValue;
            editorWrapper.appendChild(editor);

            editor.addEventListener('keyup', function (event) {
               // console.log('keyup');
               if (event.key === 'Enter') {
                  me.done(event);
               } else if (event.key === 'Escape') {
                  me.cancel(event);
               } else {
                  if (settings.edit(event, this.value) === false) {
                     return false;
                  }
                  _checkDirty(editor);
               }
            });

            editor.addEventListener('keydown', function (event) {
               // console.log('keydown');
               if (settings.type === 'number') {
                  if (event.key === 'ArrowUp') {
                     editor.value = editor.value * 1 + 1;
                  } else if (event.key === 'ArrowDown') {
                     editor.value = editor.value * 1 - 1;
                  }
               }
               _checkDirty(editor);
            });

            if (settings.type === 'number') {
               // put a pair of up/down arrow button to increase/decrease the input number;
               const svgUp = icons.svgTriangleUp;
               const svgDown = icons.svgTriangleDown;

               const upButton = document.createElement('div');
               upButton.innerHTML = svgUp;
               upButton.classList.add('numberButton');
               upButton.classList.add('upButton');
               editorWrapper.appendChild(upButton);

               const downButton = document.createElement('div');
               downButton.innerHTML = svgDown;
               downButton.classList.add('numberButton');
               downButton.classList.add('downButton');
               editorWrapper.appendChild(downButton);

               upButton.addEventListener('click', function (event) {
                  event.stopPropagation();
                  editor.value = editor.value * 1 + 1;
                  _checkDirty(editor);
               });
               downButton.addEventListener('click', function (event) {
                  event.stopPropagation();
                  editor.value = editor.value * 1 - 1;
                  _checkDirty(editor);
               });
            }

            editor.addEventListener('touchmove', function (event) {
               // prevent view port from moving around while moving cursor on a mobile screen.
               event.stopPropagation();
            });
            // if (clicked) {
            setTimeout(() => {
               editor.focus();
               editor.setSelectionRange(0, 9999);
            });
            // }
         }
         dom.style.display = 'none';
         insertAfter(editorWrapper, dom);
         me.active = true;
         settings.start(e, dom);
         return false;
      };

      az.ui(DoubleClick, dom, {
         onDoubleClick: me.edit
      });
   }
}