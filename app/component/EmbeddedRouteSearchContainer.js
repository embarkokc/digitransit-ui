/* eslint-disable no-unused-vars */
import PropTypes from 'prop-types';
import React from 'react';
import { intlShape } from 'react-intl';
import { matchShape, routerShape } from 'found';
import cx from 'classnames';
import DTAutoSuggest from '@digitransit-component/digitransit-component-autosuggest';
import withBreakpoint from '../util/withBreakpoint';
import Icon from './Icon';

import LazilyLoad, { importLazy } from './LazilyLoad';

import withSearchContext from './WithSearchContext';
import { getStopRoutePath } from '../util/path';
import { useCitybikes } from '../util/modeUtils';

const modules = {
  EmbeddedRouteSearch: () => importLazy(import('./StopsNearYouContainer')),
};

// eslint-disable-next-line react/prefer-stateless-function
class EmbeddedRouteSearchContainer extends React.Component {
  static contextTypes = {
    router: routerShape.isRequired,
    config: PropTypes.object.isRequired,
  };

  secondaryLogoPath = null;

  componentDidMount() {
    const { secondaryLogo } = this.context.config;

    // eslint-disable-next-line no-underscore-dangle
    const _this = this;
    import(
      /* webpackChunkName: "embedded-search" */ `../configurations/images/${secondaryLogo}`
    )
      .then(({ default: pathToLogo }) => {
        _this.secondaryLogoPath = pathToLogo;
      })
      .catch(err => {
        // eslint-disable-next-line no-console
        console.error(
          'EmbeddedRouteSearchContainer: failed to import() config.secondaryLogo',
          err,
        );
      });
  }

  render() {
    const { config } = this.context;
    const { lang, breakpoint } = this.props;
    const { trafficNowLink, colors, fontWeights } = config;
    const { secondaryLogoPath } = this;
    const color = colors.primary;
    const hoverColor = colors.hover; // || LightenDarkenColor(colors.primary, -20);
    const accessiblePrimaryColor = colors.accessiblePrimary || colors.primary;
    const sources = ['Favourite', 'History', 'Datasource'];

    const StopRouteSearch = withSearchContext(DTAutoSuggest);
    const onSelectStopRoute = item => {
      window.top.location.href = getStopRoutePath(item);
    };

    const stopAndRouteSearchTargets = ['Stops', 'Routes'];
    if (useCitybikes(config.cityBike?.networks)) {
      stopAndRouteSearchTargets.push('BikeRentalStations');
    }
    if (config.includeParkAndRideSuggestions) {
      stopAndRouteSearchTargets.push('ParkingAreas');
    }

    const isMobile = this.props.breakpoint !== 'large';
    const stopRouteSearchProps = {
      appElement: '#app',
      icon: 'search',
      id: 'stop-route-station',
      className: 'destination',
      placeholder: 'stop-near-you',
      selectHandler: onSelectStopRoute,
      getAutoSuggestIcons: config.getAutoSuggestIcons,
      value: '',
      // TODO
      lang: 'en',
      color,
      hoverColor,
      accessiblePrimaryColor,
      sources,
      targets: stopAndRouteSearchTargets,
      fontWeights,
      modeIconColors: config.colors.iconColors,
      modeSet: config.iconModeSet,
      // todo: `isEmbedded: true`?
      // todo: pick based on props.breakpoint?
      isMobile,
    };

    const systemAlertsPath = '/alerts';
    const container = (
      // todo: detect mobile devices using props.breakpoint?
      <div
        className={cx(
          'embedded-seach-container embedded-route-search-container',
          {
            mobile: isMobile,
            desktop: !isMobile,
          },
        )}
        // id="#app"
      >
        <div className="control-panel-container">
          <h1 className="embedded-route-search-container-heading">
            {secondaryLogoPath ? (
              <img
                className="embedded-route-search-container-heading-logo"
                src={secondaryLogoPath}
                alt="Embark logo"
              />
            ) : null}
            Find A Ride
          </h1>
          <StopRouteSearch {...stopRouteSearchProps} />
          <ul
            style={{ listStyle: 'none', paddingLeft: 0, fontWeight: 'normal' }}
          >
            <li style={{ display: 'inline-block' }}>
              <a
                href={systemAlertsPath}
                target="_top"
                style={{ color: '#D6153B', textDecoration: 'none' }}
              >
                {/* todo: aria-hidden=true */}
                <Icon img="icon-icon_caution" height={1} color="#D6153B" />{' '}
                System Alerts
              </a>
            </li>
            <li style={{ display: 'inline-block', marginLeft: '2em' }}>
              <a
                href="/"
                target="_top"
                style={{ color: 'inherit', textDecoration: 'none' }}
              >
                {/* todo: aria-hidden=true */}
                <Icon
                  img="icon-icon_show-on-map"
                  height={1}
                  color="#000"
                />{' '}
                Plan A Trip
              </a>
            </li>
          </ul>
        </div>
      </div>
    );
    return <div className="route-search-page">{container}</div>;
  }
}

EmbeddedRouteSearchContainer.propTypes = {
  lang: PropTypes.string.isRequired,
  // match: matchShape.isRequired,
  breakpoint: PropTypes.string.isRequired,
};

EmbeddedRouteSearchContainer.defaultTypes = {
  lang: 'en',
};

const EmbeddedRouteSearchContainerWithBreakpoint = withBreakpoint(
  EmbeddedRouteSearchContainer,
);
export {
  EmbeddedRouteSearchContainer as Component,
  EmbeddedRouteSearchContainerWithBreakpoint as default,
};
