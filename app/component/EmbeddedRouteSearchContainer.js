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

// Embark: we need to style only the route search page's <body>. Because the components
// above this one don't provide the means to do this, we do it here. 🙈
const BODY_CLASS_NAME = 'route-search-page';

const modules = {
  EmbeddedRouteSearch: () => importLazy(import('./StopsNearYouContainer')),
};

const filterResultsByMode = (results, mode) => {
  return results.filter(result => {
    // apparently DTAutoSuggest's filtering logic doesn't cover these cases 🤷

    // - all results with `type: 'Route'`
    // - *some* results with `type: 'OldSearch'`
    if (result.properties?.mode) {
      return result.properties?.mode === mode;
    }
    // - all results with `type: 'FavouriteStop'`
    if (Array.isArray(result.properties?.addendum?.GTFS?.modes)) {
      const modes = result.properties?.addendum?.GTFS?.modes;
      return modes.includes(mode);
    }

    // filter out all other results
    return false;
  });
};

// eslint-disable-next-line react/prefer-stateless-function
class EmbeddedRouteSearchContainer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      // see importSecondaryLogo()
      currentSecondaryLogo: null,
      secondaryLogoPath: null,
    };
  }

  static contextTypes = {
    router: routerShape.isRequired,
    config: PropTypes.object.isRequired,
  };

  componentDidMount() {
    document.body.classList.add(BODY_CLASS_NAME);
  }

  componentWillUnmount() {
    document.body.classList.remove(BODY_CLASS_NAME);
  }

  importSecondaryLogo(okcBrand) {
    const { secondaryLogo } = this.context.config;
    const logo =
      (okcBrand && this.context.config.okcBrandLogos?.[okcBrand]) ||
      secondaryLogo;
    // We only want to re-import() when `logo` has changed, so we keep track of the
    // previous `logo` value we've imported for.
    if (this.state.currentSecondaryLogo === logo) {
      return;
    }

    // This function gets called by render(), i.e. very often. It will call import() many times,
    // until one of the async import()s has finished and mutated state.currentSecondaryLogo, so
    // that it aborts above. If the async import() takes a long time, this may do hundreds of calls.
    // todo: find a better way (e.g. memoization) or move to functional components with useEffect()

    // eslint-disable-next-line no-underscore-dangle
    const _this = this;
    import(
      /* webpackChunkName: "embedded-search" */ `../configurations/images/${logo}`
    )
      .then(({ default: pathToLogo }) => {
        _this.setState({
          currentSecondaryLogo: logo,
          secondaryLogoPath: pathToLogo,
        });
      })
      .catch(err => {
        // eslint-disable-next-line no-console
        console.error(
          `EmbeddedRouteSearchContainer: failed to import() logo ${logo}`,
          err,
        );
      });
  }

  render() {
    const { config, match } = this.context;
    const { lang, breakpoint } = this.props;
    const { trafficNowLink, colors, fontWeights } = config;
    const color = colors.primary;
    const hoverColor = colors.hover; // || LightenDarkenColor(colors.primary, -20);
    const accessiblePrimaryColor = colors.accessiblePrimary || colors.primary;
    const sources = ['Favourite', 'History', 'Datasource'];

    const StopRouteSearch = withSearchContext(DTAutoSuggest);
    const onSelectStopRoute = item => {
      window.top.location.href = getStopRoutePath(item);
    };

    let stopAndRouteSearchTargets = ['Stops', 'Routes'];
    if (useCitybikes(config.cityBike?.networks)) {
      stopAndRouteSearchTargets.push('BikeRentalStations');
    }
    if (config.includeParkAndRideSuggestions) {
      stopAndRouteSearchTargets.push('ParkingAreas');
    }

    // Embark/OKC: Allow customizing the embedded route search via a `okc-brand`
    // query parameter.
    const query = match.location?.query || {};
    const okcBrand = query['okc-brand'] || null;
    const mode = (config.modesByOkcBrand || {})[okcBrand] || null;

    let transportMode = null;
    let filterResults = results => results;
    let placeholder = 'stop-near-you';
    if (mode === 'BUS') {
      // If digitransit has been loaded from Embark's main (a.k.a. bus) page, we
      // - filter results by mode
      transportMode = 'route-BUS';
      filterResults = filterResultsByMode;
    } else if (mode === 'TRAM') {
      // If digitransit has been loaded from Embark's Streetcar page, we
      // - filter results by mode
      transportMode = 'route-TRAM';
      filterResults = filterResultsByMode;
    } else if (mode === 'CITYBIKE') {
      // If digitransit has been loaded from Embark's Spokies (citybikes) page, we
      // - search for addresses (`Locations`) only.
      stopAndRouteSearchTargets = ['Locations'];
      // - adapt the search box placeholder
      placeholder = 'stop-near-you-citybike';
    }

    const { secondaryLogoPath } = this.state;
    this.importSecondaryLogo(okcBrand); // make sure secondaryLogoPath matches okcBrand

    const isMobile = this.props.breakpoint !== 'large';
    const stopRouteSearchProps = {
      appElement: '#app',
      icon: 'search',
      id: 'stop-route-station',
      className: 'destination',
      placeholder,
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
      transportMode,
      filterResults,
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
            <li style={{ display: 'inline-block', marginLeft: '1em' }}>
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
  breakpoint: PropTypes.string.isRequired,
};

EmbeddedRouteSearchContainer.contextTypes = {
  config: PropTypes.object.isRequired,
  match: matchShape.isRequired,
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
