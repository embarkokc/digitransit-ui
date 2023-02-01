import PropTypes from 'prop-types';
import React from 'react';
import { matchShape, routerShape } from 'found';

export const SettingsDrawer = ({ children, open, className }) => {
  if (open) {
    return <div className={className}>{children}</div>;
  }
  return null;
};

SettingsDrawer.propTypes = {
  open: PropTypes.bool.isRequired,
  className: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};

SettingsDrawer.contextTypes = {
  config: PropTypes.object.isRequired,
  intl: PropTypes.object.isRequired,
  router: routerShape.isRequired,
  match: matchShape.isRequired,
};

export default SettingsDrawer;
