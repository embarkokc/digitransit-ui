import React, { useState, createContext, useContext, useEffect } from 'react';
import axios from 'axios';
import { FormattedMessage } from 'react-intl';
import PropTypes from 'prop-types';
import DTAutoSuggest from '@digitransit-component/digitransit-component-autosuggest';
import Icon from './Icon';
import DesktopView from './DesktopViewEmbark';
import MobileView from './MobileView';
import BackButton from './BackButton';
import { DesktopOrMobile } from '../util/withBreakpoint';
import MultiSelectDropdown from './MultiSelectDropdown';
import withSearchContext from './WithSearchContext';
import ToggableSection from './ToggableSection';
import { getFormattedTimeDate } from '../util/timeUtils';
import TravelToolRow from './TravelToolRow';

// TODO font-weight stops

// EMBARK questions:
// * Values to filter for?
// * Marketing panel
// * Travel-Tools links

// Generalization TODOs
// A couple of actions should be performed, if this alerts page would become general use.
// For Embark only, this is not needed
// * move static strings to translations

const RouteShape = PropTypes.shape({
  group: PropTypes.string,
});

const StopShape = PropTypes.shape({
  code: PropTypes.string,
});

const AlertShape = PropTypes.shape({
  id: PropTypes.string,
  causeLabel: PropTypes.string,
  effectLabel: PropTypes.string,
  title: PropTypes.string,
  description: PropTypes.string,
  routes: PropTypes.arrayOf(RouteShape),
  stops: PropTypes.arrayOf(StopShape),
  lastUpdated: PropTypes.instanceOf(Date),
  activeFrom: PropTypes.instanceOf(Date),
  activeTo: PropTypes.instanceOf(Date),
  level: PropTypes.number,
});

export const AlertContext = createContext({
  alerts: [],
});

function AlertProvider({ children, url }) {
  const [alerts, setAlerts] = useState([]);

  async function fetchAlerts() {
    await axios
      .get(url)
      .then(resultJson => {
        const alertsData = resultJson.data;
        const transformedAlerts = alertsData.map(alert => {
          return {
            ...alert,
            lastUpdated: new Date(alert.lastUpdated),
            activeFrom: alert.activeFrom
              ? new Date(alert.activeFrom)
              : undefined,
            activeTo: alert.activeTo ? new Date(alert.activeTo) : undefined,
          };
        });

        setAlerts(transformedAlerts);
      })
      .catch(error => {
        console.log(error); // eslint-disable-line no-console
      });
  }

  useEffect(() => {
    fetchAlerts();
  }, []);

  const context = {
    alerts,
  };
  return (
    <AlertContext.Provider value={context}>{children}</AlertContext.Provider>
  );
}

AlertProvider.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
  ]).isRequired,
  url: PropTypes.string.isRequired,
};

// ---------------------------------------------------------------

function formatDateAsDateString(time) {
  return getFormattedTimeDate(time, 'M/D/yyyy');
}

function formatDateAsTimeString(time) {
  return getFormattedTimeDate(time, 'h:mm A');
}

// ---------------------------------------------------------------

export function AlertHeader(props) {
  const { alert } = props;
  const levelMap = {
    1: 'info',
    2: 'warning',
    3: 'emergency',
  };

  const titleMap = {
    info: 'Know Before You Go',
    warning: 'Service Alert',
    emergency: 'Emergency Alert',
  };

  const level =
    alert.level >= 1 && alert.level <= 3 ? levelMap[alert.level] : levelMap[3];

  return (
    <div className={`header ${level}`}>
      <div>
        <div className="alert-symbol">
          <Icon img={`icon-icon_alert-${level}`} />
        </div>
        <div className="alert-title">{titleMap[level]}</div>
      </div>
      <div className="last-updated">
        Updated {formatDateAsDateString(alert.lastUpdated)} at{' '}
        {formatDateAsTimeString(alert.lastUpdated)}
      </div>
    </div>
  );
}

AlertHeader.propTypes = {
  alert: AlertShape.isRequired,
};

// ---------------------------------------------------------------

export function Alert(props, context) {
  const { config } = context;
  const { alert } = props;

  const possibleGroups = [
    'EMBARKBUS',
    'NORMANEXP',
    'STREETCAR',
    'RAPID',
    'NORMAN',
  ];
  const groups = new Set(
    alert.routes.map(route => {
      return route.group;
    }),
  );
  return (
    <div className="alert">
      <AlertHeader alert={alert} />
      <div className="alert-content">
        <div className="title">
          <div className="modes">
            {possibleGroups.map(group => {
              return (
                groups.has(group) && (
                  <Icon
                    key={`${alert.id}_${group}`}
                    height={2}
                    width={2}
                    img={`icon-icon_group-${group}`}
                  />
                )
              );
            })}
          </div>
          <div className="effect">{alert.effectLabel}</div>
        </div>
        <div className="info-row cause">Cause: {alert.causeLabel} </div>
        {alert.activeFrom && (
          <div className="info-row starting">
            Starting: {formatDateAsDateString(alert.activeFrom)} at{' '}
            {formatDateAsTimeString(alert.activeFrom)}
          </div>
        )}
        <div className="info-row ending">
          Ending:
          {alert.activeTo ? (
            <div>
              {formatDateAsDateString(alert.activeTo)} at{' '}
              {formatDateAsTimeString(alert.activeTo)}
            </div>
          ) : (
            <div>Until further notice</div>
          )}
        </div>
        <div className="affected">
          <div className="items">
            Stops affected:
            {alert.stops
              .sort((a, b) => parseInt(a.code, 10) - parseInt(b.code, 10))
              .map(stop => (
                <a
                  key={`_${alert.id}_stop_${stop.code}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  href={`${config.URL.ROOTLINK}/stops/embark:${stop.code}`}
                >
                  <div>{stop.code}</div>
                </a>
              ))}
          </div>
        </div>
        <div className="affected">
          <div className="items">
            Routes affected:
            {alert.routes.map(route => (
              <a
                key={`_route_${route.id}`}
                target="_blank"
                rel="noopener noreferrer"
                href={`${config.URL.ROOTLINK}/routes/embark:${route.id}`}
              >
                <div>{route.shortName}</div>
              </a>
            ))}
          </div>
        </div>
        <ToggableSection>
          <div className="heading">Additional Information</div>
          {alert.title && alert.title !== 'Service alert' && (
            <div className="details-heading">{alert.title}</div>
          )}
          <div className="details">{alert.description}</div>
        </ToggableSection>
      </div>
    </div>
  );
}

Alert.propTypes = {
  alert: AlertShape.isRequired,
};

// ---------------------------------------------------------------

export function AlertsList(props) {
  const [sortLatestFirst, setSortLatestFirst] = useState(false);

  const { service, alertLevel, stop, route } = props;
  const { alerts } = useContext(AlertContext);

  const sortedAlerts = alerts
    .filter(
      alert => route === undefined || alert?.routes.some(r => r.id === route),
    )
    .filter(
      alert => stop === undefined || alert?.stops.some(s => s.id === stop),
    )
    .filter(alert => alertLevel === undefined || alert.level === alertLevel)
    .filter(
      alert =>
        service === undefined || alert?.routes.some(r => r.group === service),
    )
    .sort(
      (a, b) =>
        ((a.activeFrom?.getTime() ?? 0) - (b.activeFrom?.getTime() ?? 0)) *
        (sortLatestFirst ? 1 : -1),
    );

  return (
    <div className="alerts-wrapper">
      <div
        role="button"
        tabIndex={0}
        onKeyPress={() => {
          setSortLatestFirst(!sortLatestFirst);
        }}
        onClick={() => {
          setSortLatestFirst(!sortLatestFirst);
        }}
      >
        <Icon img="icon-icon_sort" />
        {sortLatestFirst ? 'Sort Newest to Oldest' : 'Sort Oldest to Newest'}
      </div>
      <section className="alerts-list">
        {sortedAlerts.map(alert => (
          <Alert key={alert.id} alert={alert} />
        ))}
      </section>
    </div>
  );
}

AlertsList.propTypes = {
  service: PropTypes.string,
  alertLevel: PropTypes.number,
  route: PropTypes.string,
  stop: PropTypes.string,
};

AlertsList.defaultProps = {
  service: undefined,
  alertLevel: undefined,
  route: undefined,
  stop: undefined,
};

// ---------------------------------------------------------------

export function TravelTools() {
  return (
    <div className="travel-tools">
      <h2>Travel Tools</h2>
      <TravelToolRow
        icon="icon-icon_point-to-point"
        href="https://go.embarkok.com/"
      >
        Plan a Trip
      </TravelToolRow>
      <TravelToolRow
        icon="icon-icon_show-on-map"
        href="https://www.embarkok.com/system-map/"
      >
        System Map
      </TravelToolRow>
      <TravelToolRow
        icon="icon-icon_ticket"
        href="https://www.embarkok.com/bus/buy-passes"
      >
        Buy Passes
      </TravelToolRow>
      <TravelToolRow
        icon="icon-icon_help"
        href="https://www.embarkok.com/help-center"
      >
        Help Center
      </TravelToolRow>
      <TravelToolRow
        icon="icon-icon_account"
        href="https://www.embarkok.com/login"
      >
        Your Account
      </TravelToolRow>
    </div>
  );
}

export function AlertsView(props, context) {
  const { config } = context;

  const [stopRouteSearchValue, setStopRouteSearchValue] = useState('');
  const [route, setRoute] = useState(undefined);
  const [stop, setStop] = useState(undefined);
  const [level, setLevel] = useState(undefined);
  const [service, setService] = useState(undefined);

  const StopRouteSearch = withSearchContext(DTAutoSuggest);

  const onSelectStopRoute = value => {
    if (value?.properties?.layer === 'stop') {
      // set stopId to filter, but remove feed id 'embark:'
      setStopRouteSearchValue(value?.properties?.name);
      setStop(value?.properties?.id.split(':')[1]);
      setRoute(undefined);
    } else if (value?.properties?.layer.startsWith('route-')) {
      setStopRouteSearchValue(
        `${value?.properties?.shortName}, ${value?.properties?.longName}`,
      );
      setStop(undefined);
      // set routeId to filter, but remove feed id 'embark:'
      setRoute(value?.properties?.gtfsId.split(':')[1]);
    } else {
      setStop(undefined);
      setRoute(undefined);
      setStopRouteSearchValue('');
    }
  };

  const onSelectLevel = value => {
    setLevel(value);
  };

  const onSelectService = value => {
    setService(value);
  };

  const stopRouteSearchProps = {
    appElement: '#app',
    icon: 'search',
    id: 'stop-route-station',
    className: 'destination',
    placeholder: 'stop-near-you',
    selectHandler: onSelectStopRoute,
    getAutoSuggestIcons: config.getAutoSuggestIcons,
    value: stopRouteSearchValue,
    lang: 'en',
    color: '#666',
    hoverColor: '#000',
    accessiblePrimaryColor: '#000',
    sources: ['Favourite', 'History', 'Datasource'],
    targets: ['Stops', 'Routes'],
    fontWeights: config.fontWeights,
    modeIconColors: config.colors.iconColors,
    modeSet: config.iconModeSet,
  };

  if (config.stopSearchFilter) {
    stopRouteSearchProps.filterResults = results =>
      results.filter(config.stopSearchFilter);
    stopRouteSearchProps.geocodingSize = 40; // increase size to compensate filtering
  }

  const renderAlertsList = () => {
    return (
      <AlertProvider url={config.embarkAlertsUrl}>
        <AlertsList
          service={service}
          alertLevel={level}
          stop={stop}
          route={route}
        />
      </AlertProvider>
    );
  };

  const renderSearchDialog = () => {
    return (
      <>
        <div className="alerts-view-filters">
          <section className="alerts-view-search-dialog">
            <h2>Search Stops &amp; Routes</h2>
            <StopRouteSearch {...stopRouteSearchProps} />
          </section>
          <section className="alerts-view-search-dialog">
            <MultiSelectDropdown
              id="alerts-page-service-select"
              labelId="alerts-page-service-select-label"
              availableOptions={[
                {
                  value: 'EMBARKBUS',
                  label: 'OKC Bus',
                },
                {
                  value: 'NORMANEXP',
                  label: 'NormanExp',
                },
                {
                  value: 'CART',
                  label: 'Cart',
                },
                {
                  value: 'NORMAN',
                  label: 'Norman Bus',
                },
                {
                  value: 'STREETCAR',
                  label: 'Streetcar',
                },
                {
                  value: 'RAPID',
                  label: 'RAPID',
                },
              ]}
              onSelectionChanged={onSelectService}
              placeholderLabelId="alerts-page-service-select-placeholder"
              ariaLabelId="alerts-page-service-select-aria-label"
            />
          </section>
          <section className="alerts-view-search-dialog">
            <MultiSelectDropdown
              id="alerts-page-level-select"
              labelId="alerts-page-level-select-label"
              availableOptions={[
                {
                  value: 3,
                  label: 'Emergency Alert',
                },
                {
                  value: 2,
                  label: 'Service Alert',
                },
                {
                  value: 1,
                  label: 'Know Before You Go',
                },
              ]}
              onSelectionChanged={onSelectLevel}
              placeholderLabelId="alerts-page-level-select-placeholder"
              ariaLabelId="alerts-page-level-select-aria-label"
            />
          </section>
        </div>
        <TravelTools />
      </>
    );
  };

  return (
    <div
      className="alerts-view alerts-view-embark"
      style={{
        '--font-weight-medium': config.fontWeights.medium,
        '--font-weight-bolder': 500,
      }}
    >
      <DesktopOrMobile
        desktop={() => (
          <DesktopView
            title={<FormattedMessage id="alerts-page-title" />}
            scrollable
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
              <>
                <h1>
                  <FormattedMessage id="alerts-page-title" />
                </h1>
                <BackButton
                  title={<FormattedMessage id="back" defaultMessage="Back" />}
                  titleClassName="back-title"
                  icon="icon-icon_arrow-collapse--left"
                  iconClassName="arrow-icon"
                />
              </>
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

Alert.contextTypes = {
  config: PropTypes.object.isRequired,
};

AlertsView.contextTypes = {
  config: PropTypes.object.isRequired,
};

export default AlertsView;
