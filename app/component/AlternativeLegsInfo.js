import PropTypes from 'prop-types';
import cx from 'classnames';
import { FormattedMessage } from 'react-intl';
import React from 'react';
import Icon from './Icon';
import { isKeyboardSelectionEvent } from '../util/browser';
import { localizeTime } from '../util/timeUtils';

const AlternativeLegsInfo = ({ legs, showAlternativeLegs, toggle }) => {
  const message =
    (showAlternativeLegs && (
      <FormattedMessage
        className="alternative-leg-info"
        id="itinerary-hide-alternative-legs"
        defaultMessage="Hide alternative legs"
      />
    )) ||
    (legs.length > 1 ? (
      <FormattedMessage
        className="alternative-leg-info"
        id="alternative-legs"
        values={{
          leg1: legs[0].route.shortName,
          leg2: legs[1].route.shortName,
          startTime1: (
            <span
              className={cx({ realtime: legs[0].realTime })}
              style={{ fontWeight: 500 }}
            >
              {localizeTime(legs[0].startTime)}
            </span>
          ),
          startTime2: (
            <span
              className={cx({ realtime: legs[1].realTime })}
              style={{ fontWeight: 500 }}
            >
              {localizeTime(legs[1].startTime)}
            </span>
          ),
        }}
        defaultMessage="Also {leg1} at {startTime1} and {leg2} at {startTime2}"
      />
    ) : (
      <FormattedMessage
        className="alternative-leg-info"
        id="alternative-legs-single"
        values={{
          leg1: legs[0].route.shortName,
          startTime1: (
            <span
              className={cx({ realtime: legs[0].realTime })}
              style={{ fontWeight: 500 }}
            >
              {localizeTime(legs[0].startTime)}
            </span>
          ),
        }}
        defaultMessage="Also {leg1} at {startTime1}"
      />
    ));

  return legs ? (
    <div
      role="button"
      tabIndex="0"
      className={cx(
        'alternative-legs-info-container',
        'alternative-legs-clickable',
        'cursor-pointer',
        { open: showAlternativeLegs },
      )}
      onClick={() => toggle()}
      onKeyPress={e => {
        if (isKeyboardSelectionEvent(e)) {
          e.stopPropagation();
          toggle();
        }
      }}
    >
      <div className="alternative-legs-information">
        {message}
        <Icon
          img="icon-icon_arrow-collapse--right"
          className="itinerary-search-icon"
        />
      </div>
    </div>
  ) : null;
};

AlternativeLegsInfo.propTypes = {
  legs: PropTypes.array.isRequired,
  showAlternativeLegs: PropTypes.bool.isRequired,
  toggle: PropTypes.func.isRequired,
};
export default AlternativeLegsInfo;
