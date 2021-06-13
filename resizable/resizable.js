import { getHeight, getWidth, normalizeIcon, setHeight, setOuterHeight, setOuterWidth, setWidth } from '../../azdom/utils.js';
import { Draggable } from '../draggable/draggable.js';

const svgTriangleUp = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 10"><path d="M0 10L10 0l10 10z"/></svg>`;
const svgTriangleDown = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 10"><path d="M0 0l10 10L20 0z"/></svg>`;
const svgTriangleLeft = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 20"><path d="M10 0L20 10H0L10 0Z" transform="translate(0 20) rotate(-90)"/></svg>`;
const svgTriangleRight = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 20"><path d="M10 0L20 10H0L10 0Z" transform="translate(10) rotate(90)"/></svg>`;

export class Resizable {

  azInit(options) {
    const settings = {
      minWidth: 0,
      maxWidth: Number.MAX_SAFE_INTEGER,
      minHeight: 0,
      maxHeight: Number.MAX_SAFE_INTEGER,
      aspectRatio: false,
      handleSize: 4,
      handles: 'all', //n, e, s, w, ne, se, sw, nw, all
      moveOnResize: true,
      hideHandles: false,
      hideCollapseButton: false,
      onDoubleClick: function (event) {
        // console.log(event.target);
      },
      create: function (event, ui) {
        // console.log('create', ui);
      },
      start: function (event, ui) {
        // console.log('start', ui);
      },
      resize: function (event, ui) {
        // console.log('resize', ui);
      },
      stop: function (event, ui) {
        // console.log('stop', ui);
      },
      collapse: function (event, ui, wh) {
        // console.log(this, event, ui, wh);
      },
      ...options
    };

    const me = this;
    const node = this.node;

    me.settings = settings;

    let position = getComputedStyle(node)['position'];
    if (position !== 'absolute' && position !== 'fixed') {
      position = 'relative';
      node.style['position'] = position;
    }

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

    let thisAspectRatio;
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
          // eld.style['position'] = 'absolute';
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
          node.appendChild(eld);
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

      const onCreate = function (event, elem) {
        if (settings.create.call(node, event, elem) === false) {
          return false;
        }
        mx = event.touches ? event.touches[0].clientX : event.clientX;
        my = event.touches ? event.touches[0].clientY : event.clientY;

        const styles = getComputedStyle(node);
        if (position === 'relative') {
         me.thisTop = parseInt(styles.top || 0);
         me.thisLeft = parseInt(styles.left || 0);
        } else {
          // child outer border to parent inner border
          const marginTop = parseInt(styles['margin-top']) || 0;
          const marginLeft = parseInt(styles['margin-left']) || 0;
          me.thisTop = node.offsetTop - marginTop;
          me.thisLeft = node.offsetLeft - marginLeft;
        }

        // outer border to outer border
        me.thisWidth = node.offsetWidth;
        me.thisHeight = node.offsetHeight;

        me.yToMax = settings.maxHeight - me.thisHeight;
        me.yToMin = me.thisHeight - settings.minHeight;
        me.xToMax = settings.maxWidth - me.thisWidth;
        me.xToMin = me.thisWidth - settings.minWidth;

        thisAspectRatio = (me.thisHeight * 1.0) / (me.thisWidth * 1.0);
        event.preventDefault(); // prevent text from selecting and mobile screen view port from moving around.
        // console.log('create');
      };

      const onStart = function (event, elem) {
        if (settings.start.call(node, event, elem) === false) {
          return false;
        }

        const w = getWidth(me.node);
        const h = getHeight(me.node);
        // setWidth(me.node, w);
        // setHeight(me.node, h);

        if (h > 0) {
          me.node.setAttribute('azCollapseHeight', h);
        }
        if (w > 0) {
          me.node.setAttribute('azCollapseWidth', w);
        }

        elem.classList.add('active');
        // event.preventDefault();
      };

      const onStop = function (event, elem) {
        if (settings.stop.call(node, event, elem) === false) {
          return false;
        }
        elem.classList.remove('active');

        setTimeout(() => {
          me._resetHandles();
          me._resetCollapseIconStyle();
        });
        // console.log('stop');
      };

      const checkAspectRatio = function () {
        if (!settings.aspectRatio) {
          return;
        }
        let ar;
        if (settings.aspectRatio === true) {
          ar = thisAspectRatio;
        } else if (typeof settings.aspectRatio === 'number') {
          ar = settings.aspectRatio;
        } else {
          return;
        }
        if (getOuterHeight(node) / getOuterWidth(node) > ar) {
          setOuterWidth(node, getOuterHeight(node) / ar);
        } else if (getOuterHeight(node) / getOuterWidth(node) < ar) {
          setOuterHeight(node, getOuterWidth(node) * ar);
        }
      };
      const checkAll = function () {
        checkAspectRatio();
      };

      h.n && az.ui(Draggable, eh.n, {
        axis: 'y',
        create: onCreate,
        start: onStart,
        drag: function (event, elem) {
          // const nmx = event.touches ? event.touches[0].clientX : event.clientX;
          const nmy = event.touches ? event.touches[0].clientY : event.clientY;
          const by = {
            dy: nmy - my
          };

          if (settings.resize.call(node, event, eh.n, by) === false) {
            return false;
          }

          me.moveN(by.dy);
          checkAll();
          // console.log(event.type);
          event.preventDefault();
          return false;
        },
        stop: onStop
      });
      h.e && az.ui(Draggable, eh.e, {
        axis: 'x',
        create: onCreate,
        start: onStart,
        drag: function (event, elem) {
          const nmx = event.touches ? event.touches[0].clientX : event.clientX;
          // const nmy = event.touches ? event.touches[0].clientY : event.clientY;

          const by = {
            dx: nmx - mx
          };

          if (settings.resize.call(node, event, eh.e, by) === false) {
            return false;
          }

          me.moveE(by.dx);
          checkAll();
          event.preventDefault();
          return false;
        },
        stop: onStop
      });
      h.s && az.ui(Draggable, eh.s, {
        axis: 'y',
        create: onCreate,
        start: onStart,
        drag: function (event, elem) {
          // const nmx = event.touches ? event.touches[0].clientX : event.clientX;
          const nmy = event.touches ? event.touches[0].clientY : event.clientY;

          const by = {
            dy: nmy - my
          };

          if (settings.resize.call(node, event, eh.s, by) === false) {
            return false;
          }

          me.moveS(by.dy);
          checkAll();
          event.preventDefault();
          return false;
        },
        stop: onStop
      });
      h.w && az.ui(Draggable, eh.w, {
        axis: 'x',
        create: onCreate,
        start: onStart,
        drag: function (event, elem) {
          const nmx = event.touches ? event.touches[0].clientX : event.clientX;
          // const nmy = event.touches ? event.touches[0].clientY : event.clientY;

          const by = {
            dx: nmx - mx
          };

          if (settings.resize.call(node, event, eh.w, by) === false) {
            return false;
          }

          me.moveW(by.dx);
          checkAll();
          event.preventDefault();
          return false;
        },
        stop: onStop
      });

      h.ne && az.ui(Draggable, eh.ne, {
        create: onCreate,
        start: onStart,
        drag: function (event, elem) {
          const nmx = event.touches ? event.touches[0].clientX : event.clientX;
          const nmy = event.touches ? event.touches[0].clientY : event.clientY;

          const dx = nmx - mx;
          const dy = nmy - my;

          const by = {
            dx,
            dy
          };

          if (settings.resize.call(node, event, eh.ne, by) === false) {
            return false;
          }

          me.moveN(by.dy);
          me.moveE(by.dx);
          checkAll();
          event.preventDefault();
          return false;
        },
        stop: onStop
      });
      h.se && az.ui(Draggable, eh.se, {
        create: onCreate,
        start: onStart,
        drag: function (event, elem) {
          const nmx = event.touches ? event.touches[0].clientX : event.clientX;
          const nmy = event.touches ? event.touches[0].clientY : event.clientY;

          const dx = nmx - mx;
          const dy = nmy - my;

          const by = {
            dx,
            dy
          };

          if (settings.resize.call(node, event, eh.se, by) === false) {
            return false;
          }

          me.moveS(by.dy);
          me.moveE(by.dx);
          checkAll();
          event.preventDefault();
          return false;
        },
        stop: onStop
      });

      h.sw && az.ui(Draggable, eh.sw, {
        create: onCreate,
        start: onStart,
        drag: function (event, elem) {
          const nmx = event.touches ? event.touches[0].clientX : event.clientX;
          const nmy = event.touches ? event.touches[0].clientY : event.clientY;

          const dx = nmx - mx;
          const dy = nmy - my;

          const by = {
            dx,
            dy
          };

          if (settings.resize.call(node, event, eh.sw, by) === false) {
            return false;
          }

          me.moveS(by.dy);
          me.moveW(by.dx);
          checkAll();
          event.preventDefault();
          return false;
        },
        stop: onStop
      });
      h.nw && az.ui(Draggable, eh.nw, {
        create: onCreate,
        start: onStart,
        drag: function (event, elem) {
          const nmx = event.touches ? event.touches[0].clientX : event.clientX;
          const nmy = event.touches ? event.touches[0].clientY : event.clientY;

          const dx = nmx - mx;
          const dy = nmy - my;

          const by = {
            dx,
            dy
          };

          if (settings.resize.call(node, event, eh.nw, by) === false) {
            return false;
          }

          me.moveN(by.dy);
          me.moveW(by.dx);
          checkAll();
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

  moveN(by) {
    const me = this;
    if (by > me.yToMin) {
      by = me.yToMin;
    } else if (-by > me.yToMax) {
      by = -me.yToMax;
    }
    if (me.settings.moveOnResize) {
      const styles = getComputedStyle(me.node);
      const borderTop = parseInt(styles['border-top-width']);
      const borderBottom = parseInt(styles['border-bottom-width']);
      const paddingTop = parseInt(styles['padding-top']);
      const paddingBottom = parseInt(styles['padding-bottom']);
      if (me.thisHeight - by >= borderTop + borderBottom + paddingTop + paddingBottom) {
         me.node.style.top = me.thisTop + by + 'px';
      }
    }
    setOuterHeight(me.node, me.thisHeight - by);
  }
  moveE(by) {
    const me = this;
    if (by > me.xToMax) {
      by = me.xToMax;
    } else if (-by > me.xToMin) {
      by = -me.xToMin;
    }
    setOuterWidth(me.node, me.thisWidth + by);
  }
  moveS(by) {
    const me = this;
    if (by > me.yToMax) {
      by = me.yToMax;
    } else if (-by > me.yToMin) {
      by = -me.yToMin;
    }
    setOuterHeight(me.node, me.thisHeight + by);
  }
  moveW(by) {
    const me = this;
    if (-by > me.xToMax) {
      by = -me.xToMax;
    } else if (by > me.xToMin) {
      by = me.xToMin;
    }
    if (me.settings.moveOnResize) {
      const styles = getComputedStyle(me.node);
      const borderLeft = parseInt(styles['border-left-width']);
      const borderRight = parseInt(styles['border-right-width']);
      const paddingLeft = parseInt(styles['padding-left']);
      const paddingRight = parseInt(styles['padding-right']);
      if (me.thisWidth - by >= borderLeft + borderRight + paddingLeft + paddingRight) {
         me.node.style.left = me.thisLeft + by + 'px';
      }
    }
    setOuterWidth(me.node, me.thisWidth - by);
  }

  collapseX(event, ui) {
    const me = this;
    console.log(me);
    const w = getWidth(me.node);
    me.node.style.transition = 'all .2s ease-in';
    if (w > 0) {
      me.node.setAttribute('azCollapseWidth', w);
      setWidth(me.node, 0);
      me.settings.collapse.call(me.node, event, ui, w);
    } else {
      const storedW = me.node.getAttribute('azCollapseWidth') * 1;
      setWidth(me.node, storedW);
      me.settings.collapse.call(me.node, event, ui, -storedW);
    }
    setTimeout(() => {
      me.node.style.transition = '';
      me._resetCollapseIconStyle();
    }, 200);
  }

  collapseY(event, ui) {
    const me = this;
    const h = getHeight(me.node);
    me.node.style.transition = 'all .2s ease-in';
    if (h > 0) {
      me.node.setAttribute('azCollapseHeight', h);
      setHeight(me.node, 0);
      me.settings.collapse.call(me.node, event, ui, h);
    } else {
      const storedH = me.node.getAttribute('azCollapseHeight') * 1;
      setHeight(me.node, storedH);
      me.settings.collapse.call(me.node, event, ui, -storedH);
    }
    setTimeout(() => {
      me.node.style.transition = '';
      me._resetCollapseIconStyle();
    }, 200);
  }

  _resetCollapseIconStyle() {
    const me = this;
    if (me.settings.hideHandles || me.settings.hideCollapseButton) {
      return;
    }

    const w = getWidth(me.node);
    const h = getHeight(me.node);

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
