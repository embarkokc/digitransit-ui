import PropTypes from 'prop-types';
import React from 'react';

const PopupHeader = ({ header, subHeader, children }, { intl }) => {
  return (
    <div className="location-popup-wrapper">
      <div className="location-address">{header}</div>
      {(children || subHeader) && (
        <div className="location-place">
          {!subHeader
            ? intl.formatMessage({ id: 'zone', defaultMessage: 'Zone' })
            : subHeader}
          {children}
        </div>
      )}
    </div>
  );
};

PopupHeader.propTypes = {
  header: PropTypes.string,
  subHeader: PropTypes.string,
  children: PropTypes.node,
};

PopupHeader.contextTypes = {
  intl: PropTypes.object.isRequired,
};

export default PopupHeader;
