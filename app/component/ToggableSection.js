import PropTypes from 'prop-types';
import React, { useState } from 'react';
import Icon from './Icon';

function ToggableSection({ children }) {
  const [collapsed, setCollapsed] = useState(true);

  const header = React.Children.toArray(children)[0];
  const content = React.Children.toArray(children);
  content.shift();

  return (
    <div className="toggableSection">
      <div className="toggableHeader">
        {header}
        <div
          className="displayToggle"
          role="button"
          tabIndex={0}
          onKeyPress={() => {
            setCollapsed(!collapsed);
          }}
          onClick={() => {
            setCollapsed(!collapsed);
          }}
        >
          <Icon
            height={0.5}
            width={0.5}
            img={`icon-icon_arrow-${collapsed ? 'down' : 'up'}`}
          />
        </div>
      </div>
      {collapsed || content}
    </div>
  );
}
ToggableSection.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
  ]).isRequired,
};

export default ToggableSection;
