import PropTypes from 'prop-types';
import React from 'react';
import Link from 'found/Link';
import { FormattedMessage, intlShape } from 'react-intl';
import cx from 'classnames';
import StopCode from './StopCode';
import ServiceAlertIcon from './ServiceAlertIcon';
import { fromStopTime } from './DepartureTime';
import { getActiveAlertSeverityLevel } from '../util/alertUtils';
import { PREFIX_STOPS } from '../util/path';
import { addAnalyticsEvent } from '../util/analyticsUtils';
import Icon from './Icon';

const TripRouteStop = (
  {
    className,
    currentTime,
    stoptime,
    stopPassed,
    last,
    stop,
    displayNextDeparture,
    hideDepartures,
  },
  { config, intl },
) => {
  const patternExists =
    stop.stopTimesForPattern && stop.stopTimesForPattern.length > 0;

  const firstDeparture = stoptime;
  const nextDeparture = patternExists && stop.stopTimesForPattern[1];

  const getDepartureTime = patternStoptime => {
    let departureText = '';
    if (patternStoptime) {
      const departureTime =
        patternStoptime.serviceDay +
        (patternStoptime.realtimeState === 'CANCELED' ||
        patternStoptime.realtimeDeparture === -1
          ? patternStoptime.scheduledDeparture
          : patternStoptime.realtimeDeparture);
      const timeDiffInMinutes = Math.floor((departureTime - currentTime) / 60);
      if (
        timeDiffInMinutes < 0 ||
        timeDiffInMinutes > config.minutesToDepartureLimit
      ) {
        const date = new Date(departureTime * 1000);
        departureText = `${
          (date.getHours() < 10 ? '0' : '') + date.getHours()
        }:${date.getMinutes()}`;
      } else if (timeDiffInMinutes === 0) {
        departureText = intl.formatMessage({
          id: 'arriving-soon',
          defaultMessage: 'Now',
        });
      } else {
        departureText = intl.formatMessage(
          { id: 'departure-time-in-minutes', defaultMessage: '{minutes} min' },
          { minutes: timeDiffInMinutes },
        );
      }
    }
    return departureText;
  };

  const getText = () => {
    let text = intl.formatMessage({ id: 'stop' });
    text += ` ${stop.name},`;
    text += `${stop.code},`;
    text += `${stop.desc},`;

    if (getActiveAlertSeverityLevel(stop.alerts, currentTime)) {
      text += `${intl.formatMessage({
        id: 'disruptions-tab.sr-disruptions',
      })},`;
    }

    if (patternExists) {
      text += `${intl.formatMessage({ id: 'leaves' })},`;
      text += `${getDepartureTime(stop.stopTimesForPattern[0])},`;
      if (stop.stopTimesForPattern[0].stop.platformCode) {
        text += `${intl.formatMessage({ id: 'platform' })},`;
        text += `${stop.stopTimesForPattern[0].stop.platformCode},`;
      }
      if (displayNextDeparture) {
        text += `${intl.formatMessage({ id: 'next' })},`;
        text += `${getDepartureTime(
          stop.stopTimesForPattern[1],
          currentTime,
        )},`;
        if (
          stop.stopTimesForPattern[1] &&
          stop.stopTimesForPattern[1].stop.platformCode
        ) {
          text += `${intl.formatMessage({ id: 'platform' })},`;
          text += `${stop.stopTimesForPattern[1].stop.platformCode}`;
        }
      }
    }
    return text;
  };

  return (
    <li
      className={cx(
        'route-stop location-details_container ',
        { passed: stopPassed },
        className,
      )}
    >
      {/* getVehicleTripLink() */}

      <div className="route-stop-row_content-container">
        <Link
          as="button"
          type="button"
          to={`/${PREFIX_STOPS}/${encodeURIComponent(stop.gtfsId)}`}
          onClick={() => {
            addAnalyticsEvent({
              category: 'Routes',
              action: 'OpenStopViewFromRoute',
              name: null,
            });
          }}
          aria-label={getText()}
        >
          <div className="route-stop-container">
            <div className="route-details-left-column">
              {firstDeparture && (
                <div
                  key={firstDeparture.scheduledDeparture}
                  className="route-stop-time"
                >
                  {!hideDepartures &&
                    fromStopTime(
                      firstDeparture,
                      currentTime,
                      true,
                      false,
                      true,
                    )}
                </div>
              )}

              <StopCode code={stop.code} />
            </div>
            <div className="route-details-right-column">
              <div className="route-details-upper-row">
                <div className="route-details_container">
                  <div className="route-stop-name">
                    <span>{stop.name}</span>
                    <ServiceAlertIcon
                      className="inline-icon"
                      severityLevel={getActiveAlertSeverityLevel(
                        stop.alerts,
                        currentTime,
                      )}
                    />
                  </div>
                  <div className="platform-number-container">
                    <div
                      key={`${stop.scheduledDeparture}-platform-number`}
                      className={`platform-code ${
                        !stop.platformCode ? 'empty' : ''
                      }`}
                    >
                      {stop.platformCode}
                    </div>
                  </div>
                </div>
              </div>
              <div className="route-details-bottom-row">
                {firstDeparture && (
                  <div
                    key={firstDeparture.scheduledDeparture}
                    className="route-stop-time"
                  >
                    {!hideDepartures &&
                      fromStopTime(
                        firstDeparture,
                        currentTime,
                        true,
                        false,
                        true,
                      )}
                  </div>
                )}
                {nextDeparture && displayNextDeparture && (
                  <div
                    key={nextDeparture.scheduledDeparture}
                    className="route-stop-time"
                  >
                    &nbsp;&#x2022;&nbsp;
                    {!hideDepartures &&
                      fromStopTime(nextDeparture, currentTime, true, true)}
                  </div>
                )}
              </div>
              {patternExists &&
                stop.stopTimesForPattern[0].pickupType === 'NONE' &&
                !last && (
                  <div className="drop-off-container">
                    <Icon img="icon-icon_info" color={config.colors.primary} />
                    <FormattedMessage
                      id="route-destination-arrives"
                      defaultMessage="Drop-off only"
                    />
                  </div>
                )}
            </div>
          </div>
        </Link>
      </div>
    </li>
  );
};

TripRouteStop.propTypes = {
  stop: PropTypes.shape({
    code: PropTypes.string,
    name: PropTypes.string,
    desc: PropTypes.string,
    gtfsId: PropTypes.string,
    zoneId: PropTypes.string,
    scheduledDeparture: PropTypes.number,
    platformCode: PropTypes.string,
    alerts: PropTypes.arrayOf(
      PropTypes.shape({
        severityLevel: PropTypes.string,
        validityPeriod: PropTypes.shape({
          startTime: PropTypes.number,
          endTime: PropTypes.number,
        }),
      }),
    ),
    stopTimesForPattern: PropTypes.arrayOf(
      PropTypes.shape({
        realtimeDeparture: PropTypes.number,
        realtimeArrival: PropTypes.number,
        serviceDay: PropTypes.number,
        pickupType: PropTypes.string,
        stop: PropTypes.shape({
          platformCode: PropTypes.string,
        }),
      }),
    ),
  }).isRequired,
  stoptime: PropTypes.shape({
    realtimeDeparture: PropTypes.number,
    realtimeArrival: PropTypes.number,
    realtimeState: PropTypes.string,
    serviceDay: PropTypes.number,
    scheduledDeparture: PropTypes.number,
  }).isRequired,
  stopPassed: PropTypes.bool.isRequired,
  className: PropTypes.string,
  currentTime: PropTypes.number.isRequired,
  last: PropTypes.bool,
  displayNextDeparture: PropTypes.bool,
  hideDepartures: PropTypes.bool,
};

TripRouteStop.defaultProps = {
  className: undefined,
  displayNextDeparture: true,
  last: false,
};

TripRouteStop.contextTypes = {
  intl: intlShape.isRequired,
  config: PropTypes.object.isRequired,
};

export default TripRouteStop;
