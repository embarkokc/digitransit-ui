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
import { localizeTime } from '../util/timeUtils';
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
  return moment.unix(dateTime).format('L');
};

const AgencyAlertEntity = ({ alert }) => {
  const severity = alert.alertSeverityLevel || 'UNKNOWN_SEVERITY';
  // poor man's kebab-case implementation
  const severityClassName = `alerts-alert-severity-level-${severity
    .replace(/_/, '')
    .toLowerCase()}`;
  return <Icon img="icon-icon_caution" className={severityClassName} />;
};
const RouteAlertEntity = ({ entity }) => {
  const { gtfsId, mode, shortName } = entity;
  // OTP provides the hex code without `#`
  const color = `#${entity.color || '686869'}`;
  const href = getRoutePath({ gtfsId });
  // this is copied & tweaked from DeparturesRow.js
  // todo: merge this code with RouteNumber.js & the implementation in DeparturesRow.js
  return (
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
};
const RouteTypeAlertEntity = ({ entity }, { config }) => {
  const { routeType } = entity;
  const mode = typeToName[routeType];
  if (!mode) {
    return <span>?</span>;
  }
  const color = config.colors.iconColors[`mode-${mode}`];
  return (
    <Icon img={`icon-icon_${mode}`} ariaLabel={`${mode} icon`} color={color} />
  );
};
const StopAlertEntity = ({ entity }) => {
  const { gtfsId, code } = entity;
  const href = getStopPath({ gtfsId });
  return (
    <span className="stop-code-container">
      <Link to={href}>
        <span className="stop-code">{code}</span>
      </Link>
    </span>
  );
};
const renderableAlertEntities = new Map([
  ['Agency', AgencyAlertEntity],
  ['Route', RouteAlertEntity],
  ['RouteType', RouteTypeAlertEntity],
  ['Stop', StopAlertEntity],
]);

const DateTime = ({ timestamp, classNamePrefix, children }) => {
  const pref = classNamePrefix ? `-${classNamePrefix}` : '';
  return (
    <time
      key={`alert-${pref}datetime`}
      className={`alerts-view-alert-${pref}datetime`}
      dateTime={new Date(timestamp).toISOString()}
    >
      {children}
    </time>
  );
};

export function AlertEntity(props) {
  // it is in fact defined in the prop types :/
  // eslint-disable-next-line react/prop-types
  const { __typename } = props.entity;

  const Component = renderableAlertEntities.get(__typename);
  if (!renderableAlertEntities.has(__typename)) {
    const err = new Error(
      `invalid/unsupported AlertEntity: __typename = ${__typename}`,
    );
    err.entity = props.entity;
    throw err;
  }
  const renderedEntity = <Component {...props} />;

  // eslint-disable-next-line react/prop-types
  const lowerCasedTypename = __typename.toLowerCase();
  return renderedEntity ? (
    <span
      className={`alerts-view-alert-alert-entity alerts-view-alert-alert-entity__${lowerCasedTypename}`}
    >
      {renderedEntity}
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

  const renderFullDateTime = (timestamp, classNamePrefix = '') => {
    return (
      <DateTime timestamp={timestamp} classNamePrefix={classNamePrefix}>
        {localizeDate(timestamp)} {localizeTime(timestamp)}
      </DateTime>
    );
  };
  const renderTimeOnly = (timestamp, classNamePrefix = '') => {
    return (
      <DateTime timestamp={timestamp} classNamePrefix={classNamePrefix}>
        {localizeTime(timestamp)}
      </DateTime>
    );
  };
  let dateTimeEls = null;
  if (effectiveStartDate && effectiveEndDate) {
    if (effectiveStartDate === effectiveEndDate) {
      dateTimeEls = [renderFullDateTime(effectiveStartDate)];
    } else if (
      localizeDate(effectiveStartDate) === localizeDate(effectiveEndDate)
    ) {
      // same day, different time
      dateTimeEls = [
        renderFullDateTime(effectiveStartDate, 'start'),
        ' – ',
        renderTimeOnly(effectiveEndDate, 'end'),
      ];
    } else {
      // different day
      dateTimeEls = [
        renderFullDateTime(effectiveStartDate, 'start'),
        ' – ',
        renderFullDateTime(effectiveEndDate, 'end'),
      ];
    }
  } else if (effectiveStartDate) {
    dateTimeEls = ['from ', renderFullDateTime(effectiveStartDate)];
  } else if (effectiveEndDate) {
    dateTimeEls = ['until ', renderFullDateTime(effectiveEndDate)];
  }

  const renderedEntities = entities
    .filter(entity => {
      // eslint-disable-next-line no-underscore-dangle
      return renderableAlertEntities.has(entity.__typename);
    })
    .map(entity => (
      <AlertEntity key={entity.id} entity={entity} alert={alertData} />
    ));

  return (
    <div id={id} className="alerts-view-alert">
      <div className="alerts-view-alert-entities">{renderedEntities}</div>
      {/* todo: i18n, proper fallback heading */}
      <h2>{alertHeaderText || 'notice'}</h2>
      <p className="alerts-view-alert-time-frame">{dateTimeEls}</p>
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

  const query = match.location?.query || {};
  let modes = null; // a.k.a. no modes configured
  if ('modes' in query) {
    if (query.modes === '') {
      modes = [];
    } else {
      modes = query.modes.split(',');
    }
  }

  let alerts = props.alerts
    .filter(alert => Array.isArray(alert.entities))
    .filter(alert => {
      return alert.entities.some(ae =>
        // eslint-disable-next-line no-underscore-dangle
        renderableAlertEntities.has(ae.__typename),
      );
    })
    .sort(sortAlerts);
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
            header={
              <h1>
                <FormattedMessage id="alerts-page-title" />
              </h1>
            }
            content={
              <>
                {renderSearchDialog()}
                {renderAlertsList()}
              </>
            }
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

DateTime.propTypes = {
  timestamp: PropTypes.number.isRequired,
  classNamePrefix: PropTypes.string.isRequired,
  children: PropTypes.arrayOf(PropTypes.node).isRequired,
};

const AlertPropTypes = PropTypes.shape({
  id: PropTypes.string.isRequired,
  // alertId
  alertHeaderText: PropTypes.string,
  alertDescriptionText: PropTypes.string.isRequired,
  effectiveStartDate: PropTypes.number,
  effectiveEndDate: PropTypes.number,
  alertSeverityLevel: PropTypes.string,
  entities: PropTypes.arrayOf(AlertEntityPropType),
});

AgencyAlertEntity.propTypes = {
  alert: AlertPropTypes.isRequired,
};
RouteAlertEntity.propTypes = {
  entity: AlertEntityPropType.isRequired,
};
RouteTypeAlertEntity.propTypes = {
  entity: AlertEntityPropType.isRequired,
};
StopAlertEntity.propTypes = {
  entity: AlertEntityPropType.isRequired,
};
AlertEntity.propTypes = {
  alert: AlertPropTypes.isRequired,
  entity: AlertEntityPropType.isRequired,
};
AlertEntity.contextTypes = {
  config: PropTypes.object.isRequired,
  router: routerShape.isRequired,
};

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
