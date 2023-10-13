import PropTypes from 'prop-types';
import React from 'react';
import Link from 'found/Link';
import cx from 'classnames';
import { PREFIX_ROUTES, PREFIX_STOPS } from '../util/path';
import { localizeTime } from '../util/timeUtils';
import { getRouteMode } from '../util/modeUtils';

export default function RouteHeader({ route, pattern, trip, className }) {
  const mode = getRouteMode(route);
  let tripEl;
  if (trip && trip.length > 3) {
    const startTime = localizeTime(trip);
    tripEl = <span className="route-header-trip">{startTime} →</span>;
  } else {
    tripEl = '';
  }

  const routeLineText = ` ${route.shortName || ''}`;

  const routeLine =
    trip && pattern ? (
      <>
        Route{' '}
        <Link
          to={`/${PREFIX_ROUTES}/${route.gtfsId}/${PREFIX_STOPS}/${pattern.code}`}
        >
          {routeLineText === '' ? pattern.headsign : routeLineText}
        </Link>
      </>
    ) : (
      `Route {routeLineText}`
    );

  return (
    <div className={cx('route-header', className)}>
      <h1 className={mode}>
        <span>{routeLine}</span>
        {tripEl}
      </h1>
    </div>
  );
}

RouteHeader.propTypes = {
  route: PropTypes.shape({
    gtfsId: PropTypes.string.isRequired,
    mode: PropTypes.string.isRequired,
    shortName: PropTypes.string,
    color: PropTypes.string,
  }).isRequired,
  trip: PropTypes.string,
  pattern: PropTypes.shape({
    code: PropTypes.string.isRequired,
    headsign: PropTypes.string,
  }),
  className: PropTypes.string,
};
