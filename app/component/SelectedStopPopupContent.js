import PropTypes from 'prop-types';
import React from 'react';
import { matchShape, routerShape } from 'found';
import MarkerPopupBottom from './map/MarkerPopupBottom';
import { redirectToItinerarySearch } from '../util/mapPopupUtils';
import Icon from './Icon';

const SelectedStopPopupContent = ({ stop }, { router, match }) => {
  const { location } = match;
  // this implementation follows mapRoutingButton.js
  const onSelectLocation = (item, itemRole) => {
    redirectToItinerarySearch(location, router, itemRole, item);
  };
  // EMBARK: Bike stations should not be labeled as Stop. As stop has no type,
  // we recur to pathname to detect if selected stop is bike station :-/
  const { pathname } = location;
  const stopHeader = pathname.startsWith('/bikestations')
    ? 'Bike station'
    : `Stop ${stop.code}`;

  return (
    <div className="origin-popup">
      <div className="origin-popup-header">
        <div className="selected-stop-header">{stopHeader}</div>
      </div>
      <div>
        <div className="origin-popup-name">
          <div className="selected-stop-popup">
            <p className="card-code">{stop.name}</p>
            {stop.desc && <span className="description">{stop.desc}</span>}
            {stop.wheelchairBoarding === 'POSSIBLE' && (
              <Icon img="icon-icon_wheelchair" className="inline-icon" />
            )}
            {stop.alerts?.length > 0 && (
              <Icon img="icon-icon_caution" className="caution inline-icon" />
            )}
          </div>
          <MarkerPopupBottom
            location={stop}
            locationPopup="origindestination"
            onSelectLocation={onSelectLocation}
          />
        </div>
        <div className="shade-to-white" />
      </div>
    </div>
  );
};

SelectedStopPopupContent.propTypes = {
  stop: PropTypes.object.isRequired,
};

SelectedStopPopupContent.contextTypes = {
  router: routerShape.isRequired,
  match: matchShape.isRequired,
};

SelectedStopPopupContent.displayName = 'SelectedStopPopupContent';

export default SelectedStopPopupContent;
