import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import { intlShape } from 'react-intl';
import { v4 as uuid } from 'uuid';
import { Link } from 'found';
import LocalTime from './LocalTime';
import { getHeadsignFromRouteLongName } from '../util/legUtils';
import { alertSeverityCompare } from '../util/alertUtils';
import { localizeTime } from '../util/timeUtils';
import Icon from './Icon';
import { addAnalyticsEvent } from '../util/analyticsUtils';
import { PREFIX_ROUTES, PREFIX_STOPS } from '../util/path';
import { getRouteMode } from '../util/modeUtils';

const getMostSevereAlert = (route, trip) => {
  const alerts = [...(route?.alerts || []), ...(trip?.alerts || [])];
  return alerts.sort(alertSeverityCompare)[0];
};

const DeparturesRow = (
  { departure, departures, showPlatformCode, canceled, ...props },
  { config, intl },
) => {
  const { trip, trip: { route } = {} } = departure;
  const mode = getRouteMode(route);
  let { shortName } = departure.trip.route;
  shortName = (
    <>
      <Icon
        className={mode.toLowerCase()}
        img={`icon-icon_${mode.toLowerCase()}`}
        color={`#${route.color}`}
      />
      {shortName?.length < 7 ? shortName : ''}
    </>
  );
  const headsign =
    departure.headsign ||
    departure.trip.tripHeadsign ||
    getHeadsignFromRouteLongName(trip.route);

  const getShownTime = departureTime => {
    const timeDiffInMinutes = Math.floor(
      (departureTime - props.currentTime) / 60,
    );
    let shownTime;
    if (timeDiffInMinutes <= 0) {
      shownTime = intl.formatMessage({
        id: 'arriving-soon',
        defaultMessage: 'Now',
      });
    } else if (timeDiffInMinutes > config.minutesToDepartureLimit) {
      shownTime = <LocalTime time={departureTime} />;
    } else {
      shownTime = intl.formatMessage(
        {
          id: 'departure-time-in-minutes',
          defaultMessage: '{minutes} min',
        },
        { minutes: timeDiffInMinutes },
      );
    }

    return shownTime;
  };

  const renderWithLink = (node, dep, first) => {
    return (
      <>
        <Link
          // to={`/${PREFIX_ROUTES}/${dep.trip.pattern.route.gtfsId}/${PREFIX_STOPS}/${dep.trip.pattern.code}/${dep.trip.gtfsId}`}
          to={`/${PREFIX_ROUTES}/${dep.trip.pattern.route.gtfsId}/${PREFIX_STOPS}/${dep.trip.pattern.code}`}
          onClick={() => {
            addAnalyticsEvent({
              category: 'Stop',
              action: 'OpenRouteViewFromStop',
              name: 'RightNowTab',
            });
          }}
          tabIndex={first ? '0' : '-1'}
          aria-hidden={!first}
          aria-label={intl.formatMessage(
            {
              id: 'departure-page-sr',
            },
            {
              shortName,
              destination: headsign,
              time: localizeTime(dep.stoptime * 1000),
            },
          )}
        />
        {node}
      </>
    );
  };

  const departureTimeElement = dep => {
    const departureTime = dep.stoptime;
    const shownTime = getShownTime(departureTime);
    return (
      <>
        <span
          className={cx('route-time', {
            realtime: dep.realtime,
            canceled,
          })}
          aria-hidden="true"
        >
          {dep.realtime ? '' : '*'}
          {shownTime}
        </span>
        <span className="sr-only">
          {intl.formatMessage(
            {
              id: 'departure-time-sr',
            },
            {
              when: shownTime,
              time: localizeTime(departureTime * 1000),
              realTime: dep.realtime
                ? intl.formatMessage({ id: 'realtime' })
                : '',
            },
          )}
        </span>
      </>
    );
  };

  const departureTimes = deps => {
    return renderWithLink(
      deps.map((dep, index) => (
        <>
          {index > 0 ? ', ' : ''}
          {departureTimeElement(dep)}
        </>
      )),
      deps[0],
    );
  };

  let icon;
  let iconColor;
  let backgroundShape;
  let sr;

  if (route?.alerts?.length > 0) {
    const alert = getMostSevereAlert(route, trip);
    sr = (
      <span className="sr-only">
        {intl.formatMessage({
          id: 'disruptions-tab.sr-disruptions',
        })}
      </span>
    );
    icon =
      alert.alertSeverityLevel !== 'INFO'
        ? 'icon-icon_caution-white-excl-stroke'
        : 'icon-icon_info';
    iconColor = alert.alertSeverityLevel !== 'INFO' ? '#DC0451' : '#888';
    backgroundShape = 'circle'; // alert.alertSeverityLevel !== 'INFO' ? undefined : 'circle';
  }

  return (
    <tr
      className={cx(
        'departure-row',
        mode,
        departure.bottomRow ? 'bottom' : '',
        props.className,
      )}
      key={uuid()}
    >
      <td
        className={cx('route-number-container', {
          long: shortName.length >= 5 && shortName.length <= 6,
        })}
        style={{ border: `1px solid #${departure.trip.route.color}` }}
      >
        {renderWithLink(
          <>
            <div className="route-number">{shortName}</div>
            {icon && (
              <>
                <Icon
                  className={backgroundShape}
                  img={icon}
                  color={iconColor}
                  backgroundShape={backgroundShape}
                />
                {sr}
              </>
            )}
          </>,
          departures[0],
          true,
        )}
      </td>
      <td className={cx('route-headsign', departure.bottomRow ? 'bottom' : '')}>
        {renderWithLink(
          <div className="headsign">
            {headsign} {departure.bottomRow && departure.bottomRow}
          </div>,
          departures[0],
        )}
        <span className="departuretimes">{departureTimes(departures)}</span>
      </td>
      {showPlatformCode && (
        <td className="platform-cell">
          {renderWithLink(
            <>
              <div
                className={cx(
                  'platform-code',
                  departure.stop?.platformCode ? '' : 'empty',
                )}
              >
                {departure.stop?.platformCode}
              </div>
            </>,
            departures[0],
          )}
        </td>
      )}
      <td className="time-cell">
        {renderWithLink(
          <Icon img="icon-icon_arrow-collapse--right" />,
          departures[0],
        )}
      </td>
    </tr>
  );
};
DeparturesRow.propTypes = {
  departure: PropTypes.object.isRequired,
  departures: PropTypes.array.isRequired,
  currentTime: PropTypes.number.isRequired,
  showPlatformCode: PropTypes.bool,
  canceled: PropTypes.bool,
  className: PropTypes.string,
};

DeparturesRow.defaultProps = {
  canceled: false,
  className: '',
  showPlatformCode: false,
};

DeparturesRow.contextTypes = {
  config: PropTypes.object.isRequired,
  intl: intlShape.isRequired,
};
export default DeparturesRow;
