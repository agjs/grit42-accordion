import React, { useState } from 'react';
import className from 'classnames';

import { push as Menu } from 'react-burger-menu';

import './style.scss';

export default React.memo((props) => {
  const [sidebarHidden, setSidebarHidden] = useState(false);
  const [sidebarRight, setSidebarRight] = useState(false);

  const onKeyDown = (event) => {
    event.stopPropagation();

    if (event.ctrlKey && event.keyCode === 39) {
      setSidebarRight(true);
    }

    if (event.ctrlKey && event.keyCode === 37) {
      setSidebarRight(false);
    }

    switch (event.keyCode) {
      case 37:
        return setSidebarHidden(true);

      case 39:
        return setSidebarHidden(false);

      default:
        return null;
    }
  };

  return (
    <div id="grit42-sidebar-layout" className={className('grit42-sidebar-layout', props.className)}>
      <Menu
        outerContainerId={'grit42-sidebar-layout'}
        pageWrapId={'grit42-sidebar-layout__content'}
        customBurgerIcon={false}
        customCrossIcon={false}
        right={sidebarRight}
        noOverlay
        disableOverlayClick
        width={'30%'}
        isOpen={!sidebarHidden}
        customOnKeyDown={onKeyDown}
        menuClassName={className('grit42-sidebar-layout__sidebar', {
          'grit42-sidebar-layout__sidebar--hidden': sidebarHidden,
        })}
      >
        {props.sidebar}
      </Menu>
      <div
        id="grit42-sidebar-layout__content"
        className={className('grit42-sidebar-layout__content', {
          'grit42-sidebar-layout__content--full': sidebarHidden,
        })}
      >
        {props.content}
      </div>
    </div>
  );
});
