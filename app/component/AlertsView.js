import React, { useMemo } from 'react';
import moment from 'moment';
import cx from 'classnames';
import { FormattedMessage } from 'react-intl';
import PropTypes from 'prop-types';
import { Link, matchShape, routerShape } from 'found';
import { TransportMode } from '../constants';
import Icon from './Icon';
import DesktopView from './DesktopView';
import MobileView from './MobileView';
import { getStopPath, getRoutePath } from '../util/path';
import { typeToName } from '../util/gtfs';
import { getAvailableTransportModeConfigs } from '../util/modeUtils';
import { replaceQueryParams } from '../util/queryUtils';
import { DesktopOrMobile } from '../util/withBreakpoint';
import ModesSelectDropdown from './ModesSelectDropdown';

const sortAlerts = (a, b) => {
  // Agency alerts first
  // eslint-disable-next-line no-underscore-dangle
  if (a.__typename === 'Agency' && b.__typename !== 'Agency') {
    return -1;
  }
  // eslint-disable-next-line no-underscore-dangle
  if (a.__typename !== 'Agency' && b.__typename === 'Agency') {
    return 1;
  }
  // otherwise sort by effectiveStartDate, ascending
  return (a.effectiveStartDate || 0) - (b.effectiveStartDate || 0);
};

const alertMatchesModes = (alert, modes) => {
  if (!alert.entities) {
    // eslint-disable-next-line no-console
    console.info('not showing alert because it has not entities', alert);
    return false;
  }

  return alert.entities.some(entity => {
    // eslint-disable-next-line no-underscore-dangle
    if (entity.__typename === 'Agency') {
      return true;
    }
    // eslint-disable-next-line no-underscore-dangle
    if (entity.__typename === 'Route') {
      return modes.includes(entity.mode);
    }
    // eslint-disable-next-line no-underscore-dangle
    if (entity.__typename === 'RouteType') {
      // TODO what if this fails?
      const mode = typeToName[entity.routeType]?.toUpperCase();
      return modes.includes(mode);
    }
    // eslint-disable-next-line no-underscore-dangle
    if (entity.__typename === 'Stop') {
      return modes.includes(entity.vehicleMode);
    }
    return false;
  });
};

// TODO
// import {localizeDate} from '../util/timeUtils.js';
// TODO `L` includes the year, which we usually don't want in digitransit-ui
// we need a localized "current-year-aware" formatting
// with Luxon, one might use https://moment.github.io/luxon/api-docs/index.html#datetimetolocaleparts ?
const localizeDate = dateTime => {
  return moment(dateTime).format('dd L');
};

export function AlertEntity({ entityData }, { config }) {
  // it is in fact defined in the prop types :/
  // eslint-disable-next-line react/prop-types
  const { __typename } = entityData;

  let entity = null;
  if (__typename === 'Agency') {
    entity = <Icon img="icon-icon_caution" color="#D6153B" />;
  } else if (__typename === 'Route') {
    // todo: fallback color?
    const { gtfsId, mode, color = '#686869', shortName } = entityData;
    const href = getRoutePath({ gtfsId });
    // this is copied & tweaked from DeparturesRow.js
    // todo: merge this code with RouteNumber.js & the implementation in DeparturesRow.js
    entity = (
      <span
        className={cx('route-number-container', {
          // todo: remove `<=`?
          long: shortName.length >= 5 && shortName.length <= 6,
        })}
        style={{ borderColor: color }}
      >
        <Link to={href}>
          <Icon
            className={mode.toLowerCase()}
            img={`icon-icon_${mode.toLowerCase()}`}
            color={color}
            ariaLabel={`${mode} icon`}
          />
          <span className="route-number">{shortName}</span>
        </Link>
      </span>
    );
  } else if (__typename === 'RouteType') {
    const { routeType } = entityData;
    // TODO what if this fails?
    const mode = typeToName[routeType];
    if (mode) {
      const color = config.colors.iconColors[`mode-${mode}`];
      entity = (
        <Icon
          img={`icon-icon_${mode}`}
          ariaLabel={`${mode} icon`}
          color={color}
        />
      );
    } else {
      entity = <span>?</span>;
    }
  } else if (__typename === 'Stop') {
    const { gtfsId, code } = entityData;
    const href = getStopPath({ gtfsId });
    entity = (
      <span className="stop-code-container">
        <Link to={href}>
          <span className="stop-code">{code}</span>
        </Link>
      </span>
    );
  }

  // eslint-disable-next-line react/prop-types
  const lowerCasedTypename = __typename.toLowerCase();
  return entity ? (
    <span
      className={`alerts-view-alert-alert-entity alerts-view-alert-alert-entity__${lowerCasedTypename}`}
    >
      {entity}
    </span>
  ) : null;
}

export function Alert({ alertData }) {
  const {
    id,
    alertHeaderText,
    alertDescriptionText,
    effectiveStartDate,
    effectiveEndDate,
  } = alertData;
  const entities = Array.isArray(alertData.entities) ? alertData.entities : [];

  const start = effectiveStartDate ? (
    <time
      key="alert-start-date"
      className="alerts-view-alert-start-date"
      dateTime={new Date(effectiveStartDate).toISOString()}
    >
      {localizeDate(effectiveStartDate)}
    </time>
  ) : null;
  const end = effectiveEndDate ? (
    <time
      key="alert-end-date"
      className="alerts-view-alert-end-date"
      dateTime={new Date(effectiveEndDate).toISOString()}
    >
      {localizeDate(effectiveEndDate)}
    </time>
  ) : null;
  const startEnd = start && end ? [start, ' – ', end] : [start, end];

  return (
    <div id={id} className="alerts-view-alert">
      <div className="alerts-view-alert-entities">
        {entities.map(entityData => (
          <AlertEntity key={entityData.id} entityData={entityData} />
        ))}
      </div>
      {/* todo: i18n, proper fallback heading */}
      <h2>{alertHeaderText || 'notice'}</h2>
      <p className="alerts-view-alert-time-frame">{startEnd}</p>
      <p>{alertDescriptionText}</p>
    </div>
  );
}

export function AlertsList(props) {
  const { alerts } = props;

  return (
    <section className="alerts-list">
      {alerts.map(alertData => (
        <Alert key={alertData.id} alertData={alertData} />
      ))}
    </section>
  );
}

export function AlertsView(props, context) {
  const { router, match, config } = context;

  const ALL_MODES = useMemo(() => {
    return getAvailableTransportModeConfigs(config).map(({ name }) => name);
  }, [config]);

  // todo: don't mock data anymore
  // const {alerts} = props;
  // id
  // # alertId
  // alertHeaderText
  // alertDescriptionText
  // effectiveStartDate
  // effectiveEndDate
  // entities {
  //   ...on Route {
  //     id
  //     gtfsId
  //     shortName
  //     # longName(language: $language)
  //     mode
  //     color
  //   }
  //   ...on Stop {
  //     id
  //     gtfsId
  //     code
  //     # name(language: $language)
  //     vehicleMode
  //   }
  //   ...on Agency {
  //     id
  //     name
  //     url
  //   }
  //   ...on RouteType {
  //     id
  //     routeType
  //   }
  //   # todo: how to handle others?
  // }
  // eslint-disable-next-line no-underscore-dangle
  const _mockAlerts = [
    {
      id: 'epofkewpofkwek',
      alertHeaderText: 'everything is burning',
      alertDescriptionText:
        'literally everything broke down. sorry. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Elementum nibh.',
      effectiveStartDate: Date.parse('2023-01-27T10:10-06:00'),
      effectiveEndDate: Date.parse('2023-02-10T00:00-06:00'),
      entities: [
        {
          // eslint-disable-next-line no-underscore-dangle
          __typename: 'Agency',
          id: 'wqpdowhefoewfnhewoifjf',
          name: 'Embark',
          url: 'https://embarkok.com/',
        },
      ],
    },
    {
      id: 'eoifjqfoij',
      alertHeaderText: 'strikes affecting all bus routes',
      alertDescriptionText:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Elementum nibh tellus molestie nunc non blandit massa. Quam elementum.',
      effectiveStartDate: Date.parse('2023-02-04T00:00-06:00'),
      effectiveEndDate: Date.parse('2023-02-08T00:00-06:00'),
      entities: [
        {
          // eslint-disable-next-line no-underscore-dangle
          __typename: 'RouteType',
          id: 'ewoifjeoijfoij',
          routeType: 3,
        },
      ],
    },
    {
      id: 'cwqdjonoiwww',
      alertHeaderText: 'construction on 123',
      alertDescriptionText:
        'it also affects stop 1234. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Elementum nibh tellus molestie nunc non blandit massa. Quam elementum pulvinar etiam non quam lacus suspendisse faucibus interdum. Pellentesque elit eget gravida cum sociis natoque penatibus et magnis.',
      effectiveStartDate: Date.parse('2023-01-27T10:10-06:00'),
      effectiveEndDate: Date.parse('2023-02-10T00:00-06:00'),
      entities: [
        {
          // eslint-disable-next-line no-underscore-dangle
          __typename: 'Route',
          id: 'podkspdkqpdokq',
          gtfsId: 'route-123',
          shortName: '123',
          longName: 'one Two thrEE',
          mode: 'BUS',
          color: '$ff0000',
        },
        {
          // eslint-disable-next-line no-underscore-dangle
          __typename: 'Stop',
          id: 'sdjwpddpqdp',
          gtfsId: 'stop-abc',
          code: '1234',
          vehicleMode: 'BUS',
        },
      ],
    },
    {
      id: 'poifi23oirn',
      alertHeaderText: 'stop closed because of a concert',
      alertDescriptionText: 'woohoooo',
      effectiveStartDate: Date.parse('2023-02-02T00:00-06:00'),
      effectiveEndDate: Date.parse('2023-02-03T00:00-06:00'),
      entities: [
        {
          // eslint-disable-next-line no-underscore-dangle
          __typename: 'Stop',
          id: 'p2oeijeoi3r3',
          gtfsId: 'stop-bcd',
          code: '2345',
          vehicleMode: 'TRAM',
        },
      ],
    },
  ];
  let alerts = _mockAlerts.sort(sortAlerts);

  const query = match.location?.query || {};
  let modes = null; // a.k.a. no modes configured
  if ('modes' in query) {
    if (query.modes === '') {
      modes = [];
    } else {
      modes = query.modes.split(',');
    }
  }
  if (modes !== null) {
    alerts = alerts.filter(alert => alertMatchesModes(alert, modes));
  }

  const renderAlertsList = () => {
    return <AlertsList alerts={alerts} />;
  };

  const renderSearchDialog = () => {
    const setModesFilter = newModes => {
      replaceQueryParams(router, match, { modes: newModes.join(',') });
    };
    return (
      <section className="alerts-view-search-dialog">
        <ModesSelectDropdown
          id="alerts-page-modes-select"
          labelId="alerts-page-modes-select-label"
          // selectedModes={modes !== null ? modes : ALL_MODES}
          defaultModes={modes !== null ? modes : ALL_MODES}
          availableModes={ALL_MODES}
          onSelectedModesChange={setModesFilter}
        />
      </section>
    );
  };

  return (
    <div
      className="alerts-view"
      style={{
        '--font-weight-medium': config.fontWeights.medium,
        '--font-weight-bolder': config.fontWeights.bolder,
      }}
    >
      <DesktopOrMobile
        desktop={() => (
          <DesktopView
            title={<FormattedMessage id="alerts-page-title" />}
            scrollable={false}
            // hiding the back button also hides the title 🙄
            // todo: show title even if back button is hidden
            bckBtnVisible
            content={renderSearchDialog()}
            map={renderAlertsList()}
          />
        )}
        mobile={() => (
          <MobileView
            searchBox={renderSearchDialog()}
            content={renderAlertsList()}
          />
        )}
      />
    </div>
  );
}

// eslint-disable-next-line no-underscore-dangle
const _AlertEntityPropTypes = {
  __typename: PropTypes.string.isRequired,
  id: PropTypes.string.isRequired,
};
const RoutePropTypes = PropTypes.shape({
  ..._AlertEntityPropTypes,
  gtfsId: PropTypes.string.isRequired,
  shortName: PropTypes.string,
  // longName: PropTypes.string,
  mode: PropTypes.oneOf(Object.values(TransportMode)),
  color: PropTypes.string,
});
const StopPropTypes = PropTypes.shape({
  ..._AlertEntityPropTypes,
  gtfsId: PropTypes.string.isRequired,
  code: PropTypes.string,
  // name: PropTypes.string,
  vehicleMode: PropTypes.oneOf(Object.values(TransportMode)),
});
const AgencyPropTypes = PropTypes.shape({
  ..._AlertEntityPropTypes,
  name: PropTypes.string.isRequired,
  url: PropTypes.string.isRequired,
});
const RouteTypePropTypes = PropTypes.shape({
  ..._AlertEntityPropTypes,
  routeType: PropTypes.number.isRequired,
});
const AlertEntityPropType = PropTypes.oneOfType([
  RoutePropTypes,
  StopPropTypes,
  AgencyPropTypes,
  RouteTypePropTypes,
]);

AlertEntity.propTypes = {
  entityData: AlertEntityPropType.isRequired,
};
AlertEntity.contextTypes = {
  config: PropTypes.object.isRequired,
  router: routerShape.isRequired,
};

const AlertPropTypes = PropTypes.shape({
  id: PropTypes.string.isRequired,
  // alertId
  alertHeaderText: PropTypes.string,
  alertDescriptionText: PropTypes.string.isRequired,
  effectiveStartDate: PropTypes.number,
  effectiveEndDate: PropTypes.number,
  entities: PropTypes.arrayOf(AlertEntityPropType),
});

Alert.propTypes = {
  alertData: AlertPropTypes.isRequired,
};

const alertsPropType = PropTypes.arrayOf(AlertPropTypes);
AlertsList.propTypes = {
  alerts: alertsPropType.isRequired,
};

AlertsView.propTypes = {
  alerts: alertsPropType.isRequired,
};
AlertsView.contextTypes = {
  config: PropTypes.object.isRequired,
  router: routerShape.isRequired,
  match: matchShape.isRequired,
};

export default AlertsView;
