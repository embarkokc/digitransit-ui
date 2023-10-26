import PropTypes from 'prop-types';
import React from 'react';
import cx from 'classnames';
import Duration from './Duration';
import WalkDistance from './WalkDistance';
import SecondaryButton from './SecondaryButton';
import TicketInformation from './TicketInformation.okc';

const ItinerarySummary = ({
  itinerary,
  walking,
  biking,
  driving,
  futureText,
  isMultiRow,
  isMobile,
}) => {
  const printItinerary = e => {
    e.stopPropagation();
    window.print();
  };

  const faresUrl = it => {
    const transitLegs = it.legs.filter(leg => leg.transitLeg === true);
    return transitLegs.length > 0 ? transitLegs[0].route.agency.faresUrl : null;
  };
  return (
    <div className="itinerary-summary">
      {!isMobile && <div className="divider-top" />}
      <div className="itinerary-summary-info-row">
        <Duration
          duration={itinerary.duration}
          className="duration--itinerary-summary okc-icon-button"
          startTime={itinerary.startTime}
          endTime={itinerary.endTime}
          futureText={futureText}
          multiRow={isMultiRow}
        />
        <TicketInformation
          fares={itinerary.fares}
          faresUrl={faresUrl(itinerary)}
        />
      </div>
      <div className="itinerary-summary-info-row">
        {walking && walking.distance > 0 && (
          <WalkDistance
            className="distance--itinerary-summary"
            walkDistance={walking.distance}
            walkDuration={walking.duration}
            mode="walk"
          />
        )}
        {biking && biking.distance > 0 && (
          <WalkDistance
            className="distance--itinerary-summary"
            icon="icon_cyclist"
            walkDistance={biking.distance}
            walkDuration={biking.duration}
            mode="bike"
          />
        )}
        {driving && driving.distance > 0 && (
          <WalkDistance
            className="distance--itinerary-summary driving-summary"
            icon="icon_car-withoutBox"
            walkDistance={driving.distance}
            walkDuration={driving.duration}
            mode="car"
          />
        )}
      </div>
      <div className="itinerary-summary-info-row">
        <SecondaryButton
          ariaLabel="print"
          buttonName="print"
          buttonClickAction={printItinerary}
          buttonIcon="icon-icon_print"
          className="okc-icon-button"
          smallSize
        />
      </div>

      <div className={cx('divider-bottom')} />
    </div>
  );
};

ItinerarySummary.description = () =>
  "Displays itinerary summary row; itinerary's duration and walk distance";

ItinerarySummary.propTypes = {
  itinerary: PropTypes.object.isRequired,
  walking: PropTypes.object,
  biking: PropTypes.object,
  driving: PropTypes.object,
  futureText: PropTypes.string,
  isMultiRow: PropTypes.bool,
  isMobile: PropTypes.bool,
};

ItinerarySummary.defaultTypes = {
  walking: {},
  biking: {},
  driving: {},
  futureText: '',
  isMultiRow: false,
  isMobile: false,
};

ItinerarySummary.displayName = 'ItinerarySummary';

export default ItinerarySummary;
