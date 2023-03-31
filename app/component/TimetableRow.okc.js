/* eslint-disable no-return-assign */
import cx from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import moment from 'moment';
import { intlShape } from 'react-intl';

const TimetableRow = ({ stoptimes, showRoutes }, { intl }) => (
  <>
    {stoptimes
      .filter(
        time =>
          (showRoutes.filter(o => o === time.id).length > 0 &&
            showRoutes.length > 0) ||
          showRoutes.length === 0,
      )
      .sort(
        (time1, time2) => time1.scheduledDeparture - time2.scheduledDeparture,
      )
      .map(time => (
        <div
          className={cx('timetablerow-linetime', {
            canceled: time.isCanceled,
          })}
          key={`${time.id}-${time.name}-${time.scheduledDeparture}`}
        >
          <div className="sr-only">
            {time.isCanceled ? intl.formatMessage({ id: 'canceled' }) : ''}
            {`${moment
              .unix(time.serviceDay + time.scheduledDeparture)
              .format('hh:mm')}, ${intl.formatMessage({
              id: time.mode.toLowerCase(),
            })} ${time.name}
            `}
          </div>
          <span aria-hidden>
            <div>
              <span>
                {moment
                  .unix(time.serviceDay + time.scheduledDeparture)
                  .format('LT')}
              </span>
            </div>
          </span>
        </div>
      ))}
  </>
);

TimetableRow.propTypes = {
  stoptimes: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      serviceDay: PropTypes.number.isRequired,
      scheduledDeparture: PropTypes.number.isRequired,
    }),
  ).isRequired,
  showRoutes: PropTypes.arrayOf(PropTypes.string),
};

TimetableRow.contextTypes = {
  intl: intlShape.isRequired,
};

TimetableRow.defaultProps = {
  showRoutes: [],
};

export default TimetableRow;
