import cx from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import Link from 'found/Link';
import { localizeTime } from '../util/timeUtils';
import ZoneIcon from './ZoneIcon';
import { PREFIX_STOPS } from '../util/path';
import Icon from './Icon';

function IntermediateLeg(
  {
    color,
    mode,
    name,
    stopCode,
    arrivalTime,
    realTime,
    focusFunction,
    gtfsId,
    showCurrentZoneDelimiter,
    showZoneLimits,
    previousZoneId,
    currentZoneId,
    nextZoneId,
    isCanceled,
    isLastPlace,
  },
  { config },
) {
  const modeClassName = mode.toLowerCase();
  const isDualZone = currentZoneId && (previousZoneId || nextZoneId);
  const isTripleZone = currentZoneId && previousZoneId && nextZoneId;

  /* eslint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */
  return (
    <div
      style={{ width: '100%' }}
      className={cx(
        'row itinerary-row',
        showZoneLimits && {
          'zone-dual': isDualZone && !isTripleZone,
          'zone-triple': isTripleZone,
          'zone-previous': currentZoneId && previousZoneId,
        },
      )}
      onClick={e => focusFunction(e)}
    >
      <div className="small-2 columns itinerary-time-column">
        {showZoneLimits &&
          currentZoneId &&
          gtfsId &&
          config.feedIds.includes(gtfsId.split(':')[0]) && (
            <div className="time-column-zone-icons-container intermediate-leg">
              {previousZoneId && <ZoneIcon zoneId={previousZoneId} />}
              <ZoneIcon
                zoneId={currentZoneId}
                className={cx({
                  'zone-delimiter':
                    showCurrentZoneDelimiter ||
                    (previousZoneId && currentZoneId),
                })}
                showUnknown
              />
              {nextZoneId && (
                <ZoneIcon
                  zoneId={nextZoneId}
                  className="zone-delimiter"
                  showUnknown
                />
              )}
            </div>
          )}
      </div>
      <div className={`leg-before ${modeClassName}`}>
        <Icon img={`icon-icon_${modeClassName}-stop`} color={color} />
        <div style={{ color }} className={`leg-before-line ${modeClassName}`} />
        {isLastPlace && (
          <Icon img={`icon-icon_${modeClassName}-stop`} color={color} />
        )}
      </div>
      <div
        className={`small-9 columns itinerary-instruction-column intermediate ${modeClassName}`}
      >
        <Link
          onClick={e => {
            e.stopPropagation();
          }}
          to={`/${PREFIX_STOPS}/${gtfsId}`}
        >
          <div className="itinerary-leg-row-intermediate">
            <div className="itinerary-intermediate-stop-name">
              <span className={cx({ realtime: realTime })}>
                <span className={cx({ canceled: isCanceled })}>
                  {localizeTime(arrivalTime)}
                </span>
              </span>
              {` ${name}`}
            </div>
            {stopCode && (
              <div className="stop-code-container">
                <span className="itinerary-stop-code">{stopCode}</span>
              </div>
            )}
          </div>
        </Link>
      </div>
    </div>
  );
}

IntermediateLeg.propTypes = {
  focusFunction: PropTypes.func.isRequired,
  name: PropTypes.string.isRequired,
  arrivalTime: PropTypes.number.isRequired,
  realTime: PropTypes.bool,
  mode: PropTypes.string.isRequired,
  color: PropTypes.string,
  showCurrentZoneDelimiter: PropTypes.bool,
  showZoneLimits: PropTypes.bool,
  stopCode: PropTypes.string,
  previousZoneId: PropTypes.string,
  currentZoneId: PropTypes.string,
  nextZoneId: PropTypes.string,
  isLastPlace: PropTypes.bool,
  gtfsId: PropTypes.string,
  isCanceled: PropTypes.bool,
};

IntermediateLeg.defaultProps = {
  showCurrentZoneDelimiter: false,
  showZoneLimits: false,
  previousZoneId: undefined,
  currentZoneId: undefined,
  nextZoneId: undefined,
  isCanceled: false,
  stopCode: undefined,
};

IntermediateLeg.contextTypes = {
  config: PropTypes.object.isRequired,
};

export default IntermediateLeg;
