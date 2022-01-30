import '../_core/core.js';
import { getHeight, getWidth, normalizeIcon, setHeight, setOuterBorderHeight, setOuterBorderWidth, setWidth } from '../_core/lib.js';
import { Draggable } from '../draggable/draggable.js';

const svgTriangleUp = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 10"><path d="M0 10L10 0l10 10z"/></svg>`;
const svgTriangleDown = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 10"><path d="M0 0l10 10L20 0z"/></svg>`;
const svgTriangleLeft = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 20"><path d="M10 0L20 10H0L10 0Z" transform="translate(0 20) rotate(-90)"/></svg>`;
const svgTriangleRight = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 20"><path d="M10 0L20 10H0L10 0Z" transform="translate(10) rotate(90)"/></svg>`;

export class Resizable {
   static id = 'azui-resizable';
   static settings = {
      minWidth: 0,
      maxWidth: Number.MAX_SAFE_INTEGER,
      minHeight: 0,
      maxHeight: Number.MAX_SAFE_INTEGER,
      aspectRatio: true,
      handleSize: 4,
      handles: 'all', //n, e, s, w, ne, se, sw, nw, all
      moveOnResize: true,
      hideHandles: false,
      hideCollapseButton: false,
      onDoubleClick: function (event) {
         // console.log(event.target);
      },
      create: function (event) {
         // console.log('create');
      },
      start: function (event) {
         // console.log('start');
      },
      resize: function (event, handle, by) {
         // console.log('resize', handle, by);
      },
      stop: function (event) {
         // console.log('stop');
      },
      collapse: function (event, button, wh) {
         // console.log(this, event, ui, wh);
      },
   };
   init() {

      const me = this;
      const dom = this.dom;
      const settings = this.settings;

      let position = getComputedStyle(dom)['position'];
      if (position !== 'absolute' && position !== 'fixed') {
         position = 'relative';
         dom.style['position'] = position;
      }
      me.position = position;

      const parseHandles = function () {
         const h = {
            n: false,
            e: false,
            s: false,
            w: false,
            ne: false,
            se: false,
            sw: false,
            nw: false
         };
         const ah = settings.handles.split(',').map(item => item.trim());
         if (ah.includes('all')) {
            h.n = true;
            h.e = true;
            h.s = true;
            h.w = true;
            h.ne = true;
            h.se = true;
            h.sw = true;
            h.nw = true;
         } else {
            if (ah.includes('n')) {
               h.n = true;
            }
            if (ah.includes('e')) {
               h.e = true;
            }
            if (ah.includes('s')) {
               h.s = true;
            }
            if (ah.includes('w')) {
               h.w = true;
            }
            if (ah.includes('ne')) {
               h.ne = true;
            }
            if (ah.includes('se')) {
               h.se = true;
            }
            if (ah.includes('sw')) {
               h.sw = true;
            }
            if (ah.includes('nw')) {
               h.nw = true;
            }
         }

         return h;
      };
      const h = parseHandles();
      // console.log(h);

      me.style;
      let mx = 0;
      let my = 0; // position of this element, and mouse x, y coordinate

      // element handles
      const eh = {};
      me.handles = eh;

      const getCursor = d => {
         if (d === 'e' || d === 'w') {
            return 'ew-resize';
         } else if (d === 'n' || d === 's') {
            return 'ns-resize';
         } else if (d === 'ne' || d === 'sw') {
            return 'nesw-resize';
         } else if (d === 'se' || d === 'nw') {
            return 'nwse-resize';
         }
      };
      const createDraggingHandles = function () {
         let inHandle = false;
         let inButton = false;

         const createCollapseButton = function (direction) {
            const collapseButton = document.createElement('div');
            collapseButton.addEventListener('mouseenter', function (e) {
               inButton = true;
               e.currentTarget.parentNode.classList.remove('active');
               e.currentTarget.classList.add('active');
            });
            collapseButton.addEventListener('mouseleave', function (e) {
               inButton = false;
               e.currentTarget.classList.remove('active');
               if (inHandle) {
                  e.currentTarget.parentNode.classList.add('active');
               }
            });

            collapseButton.classList.add('collapseButton');

            if (direction === 'n' || direction === 's') {
               collapseButton.classList.add('collapseButtonH');
               collapseButton.addEventListener('click', function (e) {
                  me.collapseY(e, collapseButton);
               });

               const collapseIconDown = normalizeIcon(svgTriangleDown);
               collapseIconDown.classList.add('collapseIcon', 'collapseIconDown');
               collapseButton.appendChild(collapseIconDown);

               const collapseIconUp = normalizeIcon(svgTriangleUp);
               collapseIconUp.classList.add('collapseIcon', 'collapseIconUp');
               collapseButton.appendChild(collapseIconUp);
            } else if (direction === 'w' || direction === 'e') {
               collapseButton.classList.add('collapseButtonV');
               collapseButton.addEventListener('click', function (e) {
                  me.collapseX(e, collapseButton);
               });

               const collapseIconRight = normalizeIcon(svgTriangleRight);
               collapseIconRight.classList.add('collapseIcon', 'collapseIconRight');
               collapseButton.appendChild(collapseIconRight);

               const collapseIconLeft = normalizeIcon(svgTriangleLeft);
               collapseIconLeft.classList.add('collapseIcon', 'collapseIconLeft');
               collapseButton.appendChild(collapseIconLeft);
            }
            return collapseButton;
         };

         Object.keys(h).map(d => {
            if (h[d]) {
               const eld = document.createElement('div');
               eld.classList.add('handle');
               eld.style['z-index'] = Number.MAX_SAFE_INTEGER;
               eld.style['cursor'] = getCursor(d);
               eld.style['position'] = 'absolute';
               if (settings.hideHandles) {
                  eld.style['opacity'] = 0;
               } else if (!settings.hideCollapseButton) {
                  if (d.length === 1) {
                     // exclude corner handles
                     const collapseButton = createCollapseButton(d);
                     eld.appendChild(collapseButton);
                  }
                  eld.addEventListener('mouseenter', function (e) {
                     inHandle = true;
                     const ct = e.currentTarget;
                     setTimeout(() => {
                        if (!inButton) {
                           ct.classList.add('active');
                        }
                     });
                  });
                  eld.addEventListener('mouseleave', function (e) {
                     inHandle = false;
                     e.currentTarget.classList.remove('active');
                  });
               }
               dom.appendChild(eld);
               if (settings.onDoubleClick) {
                  // az.ui(DoubleClick, eld, {
                  //   onDoubleClick: settings.onDoubleClick
                  // });
               }
               eh[d] = eld;
            }
         });

         // console.log(eh);

         me._resetHandles();

         const onCreate = function (event) {
            if (settings.create.call(me, event) === false) {
               return false;
            }
            mx = event.touches ? event.touches[0].clientX : event.clientX;
            my = event.touches ? event.touches[0].clientY : event.clientY;

            me.setup();
            event.preventDefault(); // prevent text from selecting and mobile screen view port from moving around.
            // console.log('create');
         };

         const onStart = function (event) {
            if (settings.start.call(me, event) === false) {
               return false;
            }

            const w = getWidth(me.dom);
            const h = getHeight(me.dom);
            // setWidth(me.dom, w);
            // setHeight(me.dom, h);

            if (h > 0) {
               me.dom.setAttribute('azCollapseHeight', h);
            }
            if (w > 0) {
               me.dom.setAttribute('azCollapseWidth', w);
            }

            this.dom.classList.add('active');
            // event.preventDefault();
         };

         const onStop = function (event) {
            if (settings.stop.call(dom, event) === false) {
               return false;
            }
            this.dom.classList.remove('active');

            setTimeout(() => {
               me._resetHandles();
               me._resetCollapseIconStyle();
            });
            // console.log('stop');
         };

         if (h.n) {
            az.ui(Draggable, eh.n, {
               axis: 'y',
               create: onCreate,
               start: onStart,
               drag: function (event) {
                  // const nmx = event.touches ? event.touches[0].clientX : event.clientX;
                  const nmy = event.touches ? event.touches[0].clientY : event.clientY;
                  const by = {
                     dy: nmy - my
                  };

                  if (settings.resize.call(me, event, eh.n, by) === false) {
                     return false;
                  }

                  me.moveN(by.dy);
                  // console.log(event.type);
                  event.preventDefault();
                  return false;
               },
               stop: onStop
            });
            me.dom.style['padding-top'] = settings.handleSize + 'px';
         }
         if (h.e) {
            az.ui(Draggable, eh.e, {
               axis: 'x',
               create: onCreate,
               start: onStart,
               drag: function (event) {
                  const nmx = event.touches ? event.touches[0].clientX : event.clientX;
                  // const nmy = event.touches ? event.touches[0].clientY : event.clientY;

                  const by = {
                     dx: nmx - mx
                  };

                  if (settings.resize.call(me, event, eh.e, by) === false) {
                     return false;
                  }

                  me.moveE(by.dx);

                  event.preventDefault();
                  return false;
               },
               stop: onStop
            });
            me.dom.style['padding-right'] = settings.handleSize + 'px';
         }
         if (h.s) {
            az.ui(Draggable, eh.s, {
               axis: 'y',
               create: onCreate,
               start: onStart,
               drag: function (event) {
                  // const nmx = event.touches ? event.touches[0].clientX : event.clientX;
                  const nmy = event.touches ? event.touches[0].clientY : event.clientY;

                  const by = {
                     dy: nmy - my
                  };

                  if (settings.resize.call(me, event, eh.s, by) === false) {
                     return false;
                  }

                  me.moveS(by.dy);

                  event.preventDefault();
                  return false;
               },
               stop: onStop
            });
            me.dom.style['padding-bottom'] = settings.handleSize + 'px';
         }
         if (h.w) {
            az.ui(Draggable, eh.w, {
               axis: 'x',
               create: onCreate,
               start: onStart,
               drag: function (event) {
                  const nmx = event.touches ? event.touches[0].clientX : event.clientX;
                  // const nmy = event.touches ? event.touches[0].clientY : event.clientY;

                  const by = {
                     dx: nmx - mx
                  };

                  if (settings.resize.call(me, event, eh.w, by) === false) {
                     return false;
                  }

                  me.moveW(by.dx);

                  event.preventDefault();
                  return false;
               },
               stop: onStop
            });
            me.dom.style['padding-left'] = settings.handleSize + 'px';
         }

         h.ne && az.ui(Draggable, eh.ne, {
            create: onCreate,
            start: onStart,
            drag: function (event) {
               const nmx = event.touches ? event.touches[0].clientX : event.clientX;
               const nmy = event.touches ? event.touches[0].clientY : event.clientY;

               const dx = nmx - mx;
               const dy = nmy - my;

               const by = {
                  dx,
                  dy
               };

               if (settings.resize.call(me, event, eh.ne, by) === false) {
                  return false;
               }

               me.moveN(by.dy);
               if (me._aspectRatio) {
                  me.moveE(-by.dy * me._aspectRatio);
               } else {
                  me.moveE(by.dx);
               }

               event.preventDefault();
               return false;
            },
            stop: onStop
         });
         h.se && az.ui(Draggable, eh.se, {
            create: onCreate,
            start: onStart,
            drag: function (event) {
               const nmx = event.touches ? event.touches[0].clientX : event.clientX;
               const nmy = event.touches ? event.touches[0].clientY : event.clientY;

               const dx = nmx - mx;
               const dy = nmy - my;

               const by = {
                  dx,
                  dy
               };

               if (settings.resize.call(me, event, eh.se, by) === false) {
                  return false;
               }

               me.moveS(by.dy);
               if (me._aspectRatio) {
                  me.moveE(by.dy * me._aspectRatio);
               } else {
                  me.moveE(by.dx);
               }

               event.preventDefault();
               return false;
            },
            stop: onStop
         });

         h.sw && az.ui(Draggable, eh.sw, {
            create: onCreate,
            start: onStart,
            drag: function (event) {
               const nmx = event.touches ? event.touches[0].clientX : event.clientX;
               const nmy = event.touches ? event.touches[0].clientY : event.clientY;

               const dx = nmx - mx;
               const dy = nmy - my;

               const by = {
                  dx,
                  dy
               };

               if (settings.resize.call(me, event, eh.sw, by) === false) {
                  return false;
               }

               me.moveS(by.dy);
               if (me._aspectRatio) {
                  me.moveW(-by.dy * me._aspectRatio);
               } else {
                  me.moveW(by.dx);
               }

               event.preventDefault();
               return false;
            },
            stop: onStop
         });
         h.nw && az.ui(Draggable, eh.nw, {
            create: onCreate,
            start: onStart,
            drag: function (event) {
               const nmx = event.touches ? event.touches[0].clientX : event.clientX;
               const nmy = event.touches ? event.touches[0].clientY : event.clientY;

               const dx = nmx - mx;
               const dy = nmy - my;

               const by = {
                  dx,
                  dy
               };

               if (settings.resize.call(me, event, eh.nw, by) === false) {
                  return false;
               }

               me.moveN(by.dy);
               if (me._aspectRatio) {
                  me.moveW(by.dy * me._aspectRatio);
               } else {
                  me.moveW(by.dx);
               }

               event.preventDefault();
               return false;
            },
            stop: onStop
         });
      };

      createDraggingHandles();
      setTimeout(() => {
         me._resetCollapseIconStyle();
      });
   }

   setup() {
      const me = this;
      const dom = me.dom;
      const settings = me.settings;
      me.style = getComputedStyle(dom);
      if (me.position === 'relative') {
         me.thisTop = parseInt(me.style.top || 0);
         me.thisLeft = parseInt(me.style.left || 0);
      } else {
         // child outer border to parent inner border
         me.thisTop = dom.offsetTop - parseInt(me.style['margin-top']) || 0;
         me.thisLeft = dom.offsetLeft - parseInt(me.style['margin-left'] || 0);
      }

      // outer border to outer border
      me.thisWidth = dom.offsetWidth;
      me.thisHeight = dom.offsetHeight;

      me.yToMax = settings.maxHeight - me.thisHeight;
      me.yToMin = me.thisHeight - settings.minHeight;
      me.xToMax = settings.maxWidth - me.thisWidth;
      me.xToMin = me.thisWidth - settings.minWidth;

      if (settings.aspectRatio === true) {
         me._aspectRatio = (dom.offsetWidth * 1.0) / (dom.offsetHeight * 1.0);
      }
   }

   moveY(by, n) {
      const me = this;
      if (by > me.yToMin) {
         by = me.yToMin;
      } else if (-by > me.yToMax) {
         by = -me.yToMax;
      }
      if (me.settings.moveOnResize) {
         const borderTop = parseInt(me.style['border-top-width']);
         const borderBottom = parseInt(me.style['border-bottom-width']);
         const paddingTop = parseInt(me.style['padding-top']);
         const paddingBottom = parseInt(me.style['padding-bottom']);
         if (me.thisHeight - by >= borderTop + borderBottom + paddingTop + paddingBottom) {
            if (n) {
               me.dom.style.top = me.thisTop + by + 'px';
            }
            setOuterBorderHeight(me.dom, me.thisHeight - by, me.style);
         }
      } else {
         setOuterBorderHeight(me.dom, me.thisHeight - by, me.style);
      }
   }

   moveX(by, w) {
      const me = this;
      if (by > me.xToMin) {
         by = me.xToMin;
      } else if (-by > me.xToMax) {
         by = -me.xToMax;
      }
      if (me.settings.moveOnResize) {
         const borderLeft = parseInt(me.style['border-left-width']);
         const borderRight = parseInt(me.style['border-right-width']);
         const paddingLeft = parseInt(me.style['padding-left']);
         const paddingRight = parseInt(me.style['padding-right']);
         if (me.thisWidth - by >= borderLeft + borderRight + paddingLeft + paddingRight) {
            if (w) {
               me.dom.style.left = me.thisLeft + by + 'px';
            }
            setOuterBorderWidth(me.dom, me.thisWidth - by, me.style);
         }
      } else {
         setOuterBorderWidth(me.dom, me.thisWidth - by, me.style);
      }
   }

   moveN(by) {
      this.moveY(by, true);
   }
   moveE(by) {
      this.moveX(-by, false);
   }
   moveS(by) {
      this.moveY(-by, false);
   }
   moveW(by) {
      this.moveX(by, true);
   }

   collapseX(event, ui) {
      const me = this;
      const w = getWidth(me.dom);
      me.dom.style.transition = 'all .2s ease-in';
      if (w > 0) {
         me.dom.setAttribute('azCollapseWidth', w);
         setWidth(me.dom, 0);
         me.settings.collapse.call(me, event, ui, w);
      } else {
         const storedW = me.dom.getAttribute('azCollapseWidth') * 1;
         setWidth(me.dom, storedW);
         me.settings.collapse.call(me, event, ui, -storedW);
      }
      setTimeout(() => {
         me.dom.style.transition = '';
         me._resetCollapseIconStyle();
      }, 200);
   }

   collapseY(event, ui) {
      const me = this;
      const h = getHeight(me.dom);
      me.dom.style.transition = 'all .2s ease-in';
      if (h > 0) {
         me.dom.setAttribute('azCollapseHeight', h);
         setHeight(me.dom, 0);
         me.settings.collapse.call(me, event, ui, h);
      } else {
         const storedH = me.dom.getAttribute('azCollapseHeight') * 1;
         setHeight(me.dom, storedH);
         me.settings.collapse.call(me, event, ui, -storedH);
      }
      setTimeout(() => {
         me.dom.style.transition = '';
         me._resetCollapseIconStyle();
      }, 200);
   }

   _resetCollapseIconStyle() {
      const me = this;
      if (me.settings.hideHandles || me.settings.hideCollapseButton) {
         return;
      }

      const w = getWidth(me.dom);
      const h = getHeight(me.dom);

      if (me.handles.n) {
         const up = me.handles.n.querySelector('span.collapseIconUp');
         const down = me.handles.n.querySelector('span.collapseIconDown');
         if (h > 0) {
            up.style.display = 'none';
            down.style.display = 'flex';
         } else {
            up.style.display = 'flex';
            down.style.display = 'none';
         }
      }
      if (me.handles.e) {
         const left = me.handles.e.querySelector('span.collapseIconLeft');
         const right = me.handles.e.querySelector('span.collapseIconRight');
         if (w > 0) {
            left.style.display = 'flex';
            right.style.display = 'none';
         } else {
            left.style.display = 'none';
            right.style.display = 'flex';
         }
      }
      if (me.handles.s) {
         const up = me.handles.s.querySelector('span.collapseIconUp');
         const down = me.handles.s.querySelector('span.collapseIconDown');
         if (h > 0) {
            up.style.display = 'flex';
            down.style.display = 'none';
         } else {
            up.style.display = 'none';
            down.style.display = 'flex';
         }
      }
      if (me.handles.w) {
         const left = me.handles.w.querySelector('span.collapseIconLeft');
         const right = me.handles.w.querySelector('span.collapseIconRight');
         if (w > 0) {
            left.style.display = 'none';
            right.style.display = 'flex';
         } else {
            left.style.display = 'flex';
            right.style.display = 'none';
         }
      }
   }

   _resetHandles() {
      const me = this;
      const handleSize = me.settings.handleSize;
      if (me.handles.n) {
         me.handles.n.style['top'] = 0;
         me.handles.n.style['bottom'] = '';
         me.handles.n.style['right'] = '';
         me.handles.n.style['left'] = 0;
         me.handles.n.style['height'] = handleSize + 'px';
         me.handles.n.style['width'] = '100%';
      }

      if (me.handles.e) {
         me.handles.e.style['right'] = 0;
         me.handles.e.style['left'] = '';
         me.handles.e.style['bottom'] = '';
         me.handles.e.style['top'] = 0;
         me.handles.e.style['width'] = handleSize + 'px';
         me.handles.e.style['height'] = '100%';
      }

      if (me.handles.s) {
         me.handles.s.style['bottom'] = 0;
         me.handles.s.style['top'] = '';
         me.handles.s.style['right'] = '';
         me.handles.s.style['left'] = 0;
         me.handles.s.style['height'] = handleSize + 'px';
         me.handles.s.style['width'] = '100%';
      }
      if (me.handles.w) {
         me.handles.w.style['left'] = 0;
         me.handles.w.style['right'] = '';
         me.handles.w.style['bottom'] = '';
         me.handles.w.style['top'] = 0;
         me.handles.w.style['width'] = handleSize + 'px';
         me.handles.w.style['height'] = '100%';
      }

      if (me.handles.ne) {
         me.handles.ne.style['left'] = '';
         me.handles.ne.style['right'] = 0;
         me.handles.ne.style['bottom'] = '';
         me.handles.ne.style['top'] = 0;
         me.handles.ne.style['width'] = handleSize + 'px';
         me.handles.ne.style['height'] = handleSize + 'px';
      }
      if (me.handles.se) {
         me.handles.se.style['left'] = '';
         me.handles.se.style['right'] = 0;
         me.handles.se.style['bottom'] = 0;
         me.handles.se.style['top'] = '';
         me.handles.se.style['width'] = handleSize + 'px';
         me.handles.se.style['height'] = handleSize + 'px';
      }
      if (me.handles.sw) {
         me.handles.sw.style['left'] = 0;
         me.handles.sw.style['right'] = '';
         me.handles.sw.style['bottom'] = 0;
         me.handles.sw.style['top'] = '';
         me.handles.sw.style['width'] = handleSize + 'px';
         me.handles.sw.style['height'] = handleSize + 'px';
      }
      if (me.handles.nw) {
         me.handles.nw.style['left'] = 0;
         me.handles.nw.style['right'] = '';
         me.handles.nw.style['bottom'] = '';
         me.handles.nw.style['top'] = 0;
         me.handles.nw.style['width'] = handleSize + 'px';
         me.handles.nw.style['height'] = handleSize + 'px';
      }
   }
}
