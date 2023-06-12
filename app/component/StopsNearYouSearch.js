import PropTypes from 'prop-types';
import React from 'react';
import { routerShape } from 'found';
import { pure } from 'recompose';
import DTAutoSuggest from '@digitransit-component/digitransit-component-autosuggest';
import { filterSearchResultsByMode } from '@digitransit-search-util/digitransit-search-util-query-utils';
import withSearchContext from './WithSearchContext';
import { getStopRoutePath } from '../util/path';

const DTAutoSuggestWithSearchContext = withSearchContext(DTAutoSuggest);
const searchSources = ['Favourite', 'History', 'Datasource'];

function StopsNearYouSearch(
  { mode, breakpoint, lang, showNearbyStops },
  { router, config },
) {
  const isMobile = breakpoint !== 'large';
  const transportMode = `route-${mode}`;

  const redirectToStopOrRoute = item => {
    router.push(getStopRoutePath(item));
  };

  const filter = config.stopSearchFilter
    ? (results, transportmode, type) =>
        filterSearchResultsByMode(results, transportmode, type).filter(
          config.stopSearchFilter,
        )
    : filterSearchResultsByMode;

  // Upstream (HSL), with `mode === 'CITYBIKE', this component only allows searching for citybike stations; It *does not* allow you to search for an address (`targets: 'Locations'`), so that the page would show nearby cityike stations.
  // This component's `selectHandler` would always assume that a) it has been passed a stop or citybike station (depending on `mode`), and b) that it will redirect (`router.push()`) to an entirely different page.
  // For Embark, with `mode === 'CITYBIKE'`, we have adding the `Locations` target to allow searching for an address.
  // Thus, with `mode === 'CITYBIKE'`, the `selectHandler` now has to re-center the map and re-fetch nearby citybike stations; We have chosen to let the parent component pass this `selectHandler` implementation in (prop `showNearbyStops`).
  // Because the `StopsNearYouPage`'s `selectHandler` implementation depends on a specific "flattened" data format, and because `withSearchContext()` only post-processes the selected item into this format if we pass `id: 'origin-stop-near-you'`, we need to set `id` accordingly.
  let id = 'stop-route-station';
  let targets = ['Stops', 'Routes'];
  let selectHandler = redirectToStopOrRoute;
  if (mode === 'CITYBIKE') {
    id = 'origin-stop-near-you';
    targets = ['BikeRentalStations', 'Locations'];
    selectHandler = showNearbyStops;
  }

  return (
    <div className="stops-near-you-search-container">
      <div className="search-container-first">
        <DTAutoSuggestWithSearchContext
          icon="search"
          id={id}
          lang={lang}
          refPoint={origin}
          className="destination"
          placeholder={`stop-near-you-${mode.toLowerCase()}`}
          transportMode={transportMode}
          geocodingSize={40}
          value=""
          filterResults={filter}
          sources={searchSources}
          targets={targets}
          isMobile={isMobile}
          selectHandler={selectHandler} // prop for context handler
          getAutoSuggestIcons={config.getAutoSuggestIcons}
          modeIconColors={config.colors.iconColors}
          modeSet={config.iconModeSet}
        />
      </div>
    </div>
  );
}

StopsNearYouSearch.propTypes = {
  mode: PropTypes.string.isRequired,
  breakpoint: PropTypes.string.isRequired,
  lang: PropTypes.string.isRequired,
  showNearbyStops: PropTypes.func.isRequired,
};

StopsNearYouSearch.contextTypes = {
  router: routerShape.isRequired,
  config: PropTypes.object.isRequired,
};

export default pure(StopsNearYouSearch);
