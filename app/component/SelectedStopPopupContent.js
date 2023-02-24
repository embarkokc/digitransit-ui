import PropTypes from 'prop-types';
import React from 'react';

const SelectedStopPopupContent = ({ stop }) => (
  <div className="origin-popup">
    <div className="origin-popup-header">
      <div className="selected-stop-header">Stop {stop.code}</div>
    </div>
    <div>
      <div className="origin-popup-name">
        <div className="selected-stop-popup">
          <p className="card-code">{stop.name}</p>
          <span className="description">{stop.desc}</span>
        </div>
      </div>
      <div className="shade-to-white" />
    </div>
  </div>
);

SelectedStopPopupContent.propTypes = {
  stop: PropTypes.object.isRequired,
};

SelectedStopPopupContent.displayName = 'SelectedStopPopupContent';

export default SelectedStopPopupContent;
