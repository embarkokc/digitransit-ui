import PropTypes from 'prop-types';
import React from 'react';
import { createFragmentContainer, graphql } from 'react-relay';
import { FormattedMessage, intlShape } from 'react-intl';
import cx from 'classnames';
import { matchShape, routerShape, RedirectException } from 'found';

import Loading from './Loading';
import RouteAgencyInfo from './RouteAgencyInfo';
import RoutePageControlPanel from './RoutePageControlPanel';
import { PREFIX_DISRUPTION, PREFIX_ROUTES } from '../util/path';
import withBreakpoint from '../util/withBreakpoint';
import BackButton from './BackButton'; // DT-3472
import { isBrowser } from '../util/browser';
import { getRouteMode } from '../util/modeUtils';
import AlertBanner from './AlertBanner';
import { hasMeaningfulData } from '../util/alertUtils';

// eslint-disable-next-line react/prefer-stateless-function
class RoutePage extends React.Component {
  static contextTypes = {
    getStore: PropTypes.func.isRequired,
    executeAction: PropTypes.func.isRequired,
    intl: intlShape.isRequired,
    config: PropTypes.object.isRequired,
  };

  static propTypes = {
    route: PropTypes.object.isRequired,
    match: matchShape.isRequired,
    router: routerShape.isRequired,
    breakpoint: PropTypes.string.isRequired,
    error: PropTypes.object,
  };

  componentDidMount() {
    // Throw error in client side if relay fails to fetch data
    if (this.props.error && !this.props.route) {
      throw this.props.error.message;
    }
  }

  /* eslint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions, jsx-a11y/anchor-is-valid */
  render() {
    const { breakpoint, router, route, error } = this.props;
    const { config } = this.context;
    const tripId = this.props.match.params?.tripId;

    // Render something in client side to clear SSR
    if (isBrowser && error && !route) {
      return <Loading />;
    }

    if (route == null && !error) {
      /* In this case there is little we can do
       * There is no point continuing rendering as it can only
       * confuse user. Therefore redirect to Routes page */
      if (isBrowser) {
        router.replace(`/${PREFIX_ROUTES}`);
      } else {
        throw new RedirectException(`/${PREFIX_ROUTES}`);
      }
      return null;
    }
    const mode = getRouteMode(route);
    const label = route.shortName ? route.shortName : route.longName || '';

    return (
      <div className={cx('route-page-container')}>
        <div className="header-for-printing">
          <h1>
            {config.title}
            {` - `}
            <FormattedMessage id="route-guide" defaultMessage="Route guide" />
          </h1>
        </div>
        <div
          className={cx('card-header', 'header', 'route-container', {
            'bp-large': breakpoint === 'large',
          })}
          aria-live="polite"
        >
          {breakpoint === 'large' && (
            <BackButton
              title="Back"
              titleClassName="back-button-label"
              icon="icon-icon_arrow-collapse--left"
              iconClassName="arrow-icon"
            />
          )}
          <div className="card-header-content route-header">
            <div className="card-header-wrapper route-info">
              <h1
                className={cx('route-short-name', mode.toLowerCase())}
                embark-not-style={{
                  color: route.color ? `#${route.color}` : null,
                }}
              >
                <span className="sr-only" style={{ whiteSpace: 'pre' }}>
                  {this.context.intl.formatMessage({
                    id: mode.toLowerCase(),
                  })}{' '}
                </span>
                Route {label}
              </h1>
              {/* No trip headsign for EMBARK 
                tripId && headsign && (
                <div className="trip-destination">
                  <Icon className="in-text-arrow" img="icon-icon_arrow-right" />
                  <div className="destination-headsign">{headsign}</div>
                </div>
              ) */}
            </div>

            {/* !tripId && (
              <LazilyLoad modules={modules}>
                {({ FavouriteRouteContainer }) => (
                  <FavouriteRouteContainer
                    className="route-page-header"
                    gtfsId={route.gtfsId}
                  />
                )}
              </LazilyLoad>
            ) */}
          </div>
          {tripId && hasMeaningfulData(route.alerts) && (
            <div className="trip-page-alert-container">
              <AlertBanner
                alerts={route.alerts}
                linkAddress={`/${PREFIX_ROUTES}/${this.props.match.params.routeId}/${PREFIX_DISRUPTION}/${this.props.match.params.patternId}`}
              />
            </div>
          )}
          <RouteAgencyInfo route={route} />
        </div>
        {route &&
          route.patterns &&
          this.props.match.params.type === PREFIX_DISRUPTION && (
            <RoutePageControlPanel
              match={this.props.match}
              route={route}
              breakpoint={breakpoint}
            />
          )}
      </div>
    );
  }
}

// DT-2531: added activeDates
// EMBARK: Added url for schedule pdf, desc for additional infos
const containerComponent = createFragmentContainer(withBreakpoint(RoutePage), {
  route: graphql`
    fragment RoutePage_route on Route
    @argumentDefinitions(date: { type: "String" }) {
      gtfsId
      color
      shortName
      longName
      mode
      type
      url
      desc
      ...RouteAgencyInfo_route
      ...RoutePatternSelect_route @arguments(date: $date)
      alerts {
        alertSeverityLevel
        effectiveEndDate
        effectiveStartDate
        alertDescriptionTextTranslations {
          language
          text
        }
        entities {
          __typename
          ... on Route {
            patterns {
              code
            }
          }
        }
      }
      agency {
        name
        phone
      }
      patterns {
        headsign
        code
        stops {
          id
          gtfsId
          code
          alerts {
            id
            alertDescriptionText
            alertHash
            alertHeaderText
            alertSeverityLevel
            alertUrl
            effectiveEndDate
            effectiveStartDate
            alertDescriptionTextTranslations {
              language
              text
            }
            alertHeaderTextTranslations {
              language
              text
            }
            alertUrlTranslations {
              language
              text
            }
          }
        }
        trips: tripsForDate(serviceDate: $date) {
          stoptimes: stoptimesForDate(serviceDate: $date) {
            realtimeState
            scheduledArrival
            scheduledDeparture
            serviceDay
          }
        }
        activeDates: trips {
          serviceId
          day: activeDates
        }
      }
    }
  `,
});

export { containerComponent as default, RoutePage as Component };
