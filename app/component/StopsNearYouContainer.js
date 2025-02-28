import PropTypes from 'prop-types';
import React from 'react';
import { createPaginationContainer, graphql } from 'react-relay';
import { intlShape, FormattedMessage } from 'react-intl';
import connectToStores from 'fluxible-addons-react/connectToStores';
import { matchShape } from 'found';
import StopNearYouContainer from './StopNearYouContainer';
import withBreakpoint from '../util/withBreakpoint';
import { sortNearbyRentalStations, sortNearbyStops } from '../util/sortUtils';
import CityBikeStopNearYouContainer from './CityBikeStopNearYouContainer';
import Loading from './Loading';
import Icon from './Icon';
import { getDefaultNetworks } from '../util/citybikes';

// This value MUST match config.maxNearbyStopAmount (which is passed in as `first`
// by StopsNearYouPage into the first GraphQL fetch)!
const NO_OF_INITIAL_RESULTS = 15;

class StopsNearYouContainer extends React.Component {
  static propTypes = {
    stopPatterns: PropTypes.any,
    setLoadState: PropTypes.func,
    currentTime: PropTypes.number.isRequired,
    relay: PropTypes.shape({
      refetchConnection: PropTypes.func.isRequired,
      hasMore: PropTypes.func.isRequired,
      isLoading: PropTypes.func.isRequired,
      loadMore: PropTypes.func.isRequired,
    }).isRequired,
    favouriteIds: PropTypes.object.isRequired,
    match: matchShape.isRequired,
    position: PropTypes.shape({
      address: PropTypes.string,
      lat: PropTypes.number,
      lon: PropTypes.number,
    }).isRequired,
    withSeparator: PropTypes.bool,
    prioritizedStops: PropTypes.arrayOf(PropTypes.string),
  };

  static contextTypes = {
    config: PropTypes.object,
    intl: intlShape.isRequired,
    executeAction: PropTypes.func.isRequired,
    headers: PropTypes.object.isRequired,
    getStore: PropTypes.func,
  };

  constructor(props, context) {
    super(props, context);
    this.resultsUpdatedAlertRef = React.createRef();
    this.state = {
      maxRefetches: context.config.maxNearbyStopRefetches,
      refetches: 0,
      stopCount: NO_OF_INITIAL_RESULTS,
      currentPosition: props.position,
      fetchMoreStops: false,
      isLoadingmoreStops: false,
      isUpdatingPosition: false,
    };
  }

  static getDerivedStateFromProps = (nextProps, prevState) => {
    let newState = null;
    const terminals = [];
    if (
      !prevState.currentPosition ||
      (!prevState.currentPosition.address &&
        nextProps.position &&
        nextProps.position.address)
    ) {
      newState = {
        ...newState,
        currentPosition: nextProps.position,
      };
    }
    const checkStops = (t, n) => {
      return n.every(stop => {
        return (
          stop.node.place.parentStation &&
          t.indexOf(stop.node.place.parentStation.name) !== -1
        );
      });
    };
    if (nextProps.stopPatterns) {
      const stopsForFiltering = [...nextProps.stopPatterns.nearest.edges];
      const newestStops = stopsForFiltering.splice(
        stopsForFiltering.length - NO_OF_INITIAL_RESULTS,
      );
      stopsForFiltering.forEach(stop => {
        const node = stop.node.place;
        if (
          node.parentStation &&
          terminals.indexOf(node.parentStation.name) === -1
        ) {
          terminals.push(node.parentStation.name);
        }
      });
      if (
        (newestStops.every(stop => {
          return (
            stop.node.place.stoptimesWithoutPatterns &&
            stop.node.place.stoptimesWithoutPatterns.length === 0
          );
        }) ||
          checkStops(terminals, newestStops)) &&
        prevState.refetches < prevState.maxRefetches
      ) {
        newState = {
          ...newState,
          fetchMoreStops: true,
        };
      } else {
        newState = {
          ...newState,
          fetchMoreStops: false,
        };
      }
    }
    return newState;
  };

  componentDidUpdate(prevProps, prevState) {
    const { position } = prevProps;
    if (position && this.state.currentPosition) {
      if (
        position.lat !== this.props.position.lat ||
        position.lon !== this.props.position.lon
      ) {
        this.updatePosition();
      }
    }
    if (this.state.fetchMoreStops) {
      this.showMore(true);
    }
    if (
      this.resultsUpdatedAlertRef.current &&
      prevState.isLoadingmoreStops &&
      !this.state.isLoadingmoreStops
    ) {
      this.resultsUpdatedAlertRef.current.innerHTML = this.context.intl.formatMessage(
        {
          id: 'stop-near-you-update-alert',
          defaultMessage: 'Search results updated',
        },
      );
      setTimeout(() => {
        this.resultsUpdatedAlertRef.current.innerHTML = null;
      }, 100);
    }
  }

  componentDidMount() {
    this.props.setLoadState();
    if (this.state.fetchMoreStops) {
      this.showMore(true);
    }
  }

  updatePosition = () => {
    const variables = {
      lat: this.props.position.lat,
      lon: this.props.position.lon,
      startTime: this.props.currentTime,
    };
    this.setState({
      isUpdatingPosition: true,
    });
    this.props.relay.refetchConnection(
      this.state.stopCount,
      () => {
        this.setState({
          isUpdatingPosition: false,
          currentPosition: this.props.position,
        });
      },
      variables,
    );
  };

  showMore = automatic => {
    if (!this.props.relay.hasMore() || this.state.isLoadingmoreStops) {
      return;
    }
    this.setState({ isLoadingmoreStops: true, fetchMoreStops: false });
    this.props.relay.loadMore(10, () => {
      this.setState(previousState => ({
        refetches: automatic
          ? previousState.refetches + 1
          : previousState.refetches,
        stopCount: previousState.stopCount + 10,
        fetchMoreStops: false,
        isLoadingmoreStops: false,
      }));
    });
  };

  createNearbyStops = () => {
    if (!this.props.stopPatterns || !this.props.stopPatterns.nearest) {
      return null;
    }
    const { mode } = this.props.match.params;
    const walkRoutingThreshold =
      mode === 'RAIL' || mode === 'SUBWAY' || mode === 'FERRY' ? 3000 : 1500;
    const stopPatterns = this.props.stopPatterns.nearest.edges;
    const terminalNames = [];
    const isCityBikeView = this.props.match.params.mode === 'CITYBIKE';
    let sortedPatterns;
    if (isCityBikeView) {
      const withNetworks = stopPatterns.filter(pattern => {
        return !!pattern.node.place?.networks;
      });
      const filteredCityBikeStopPatterns = withNetworks.filter(pattern => {
        return pattern.node.place?.networks.every(network =>
          getDefaultNetworks(this.context.config).includes(network),
        );
      });
      sortedPatterns = filteredCityBikeStopPatterns
        .slice(0, NO_OF_INITIAL_RESULTS)
        .sort(sortNearbyRentalStations(this.props.favouriteIds));
      sortedPatterns.push(
        ...filteredCityBikeStopPatterns.slice(NO_OF_INITIAL_RESULTS),
      );
    } else {
      sortedPatterns = stopPatterns
        .slice(0, NO_OF_INITIAL_RESULTS)
        .sort(sortNearbyStops(this.props.favouriteIds, walkRoutingThreshold));
      sortedPatterns.push(...stopPatterns.slice(NO_OF_INITIAL_RESULTS));
    }

    const stops = sortedPatterns.map(({ node }) => {
      const stop = node.place;
      /* eslint-disable-next-line no-underscore-dangle */
      switch (stop.__typename) {
        case 'Stop':
          if (
            stop.stoptimesWithoutPatterns &&
            stop.stoptimesWithoutPatterns.length > 0
          ) {
            if (!this.props.prioritizedStops?.includes(stop.gtfsId)) {
              if (stop.parentStation) {
                if (terminalNames.indexOf(stop.parentStation.name) === -1) {
                  terminalNames.push(stop.parentStation.name);
                  return (
                    <StopNearYouContainer
                      key={`${stop.gtfsId}`}
                      stop={stop}
                      currentMode={this.props.match.params.mode}
                      stopIsStation
                    />
                  );
                }
              } else {
                return (
                  <StopNearYouContainer
                    key={`${stop.gtfsId}`}
                    stop={stop}
                    currentMode={this.props.match.params.mode}
                  />
                );
              }
            }
          }
          break;
        case 'BikeRentalStation':
          return (
            <CityBikeStopNearYouContainer
              key={`${stop.stationId}`}
              stop={stop}
              color={this.context.config.colors.primary}
              currentTime={this.props.currentTime}
              currentMode={this.props.match.params.mode}
            />
          );
        default:
          return null;
      }
      return null;
    });
    return stops;
  };

  render() {
    const screenReaderUpdateAlert = (
      <span
        className="sr-only"
        role="alert"
        ref={this.resultsUpdatedAlertRef}
      />
    );
    const stops = this.createNearbyStops().filter(e => e);
    const noStopsFound =
      !stops.length &&
      this.state.refetches >= this.state.maxRefetches &&
      !this.state.isLoadingmoreStops;
    return (
      <>
        {((!this.props.relay.hasMore() &&
          !stops.length &&
          !this.props.prioritizedStops?.length) ||
          (noStopsFound && !this.props.prioritizedStops?.length)) && (
          <>
            {this.props.withSeparator && <div className="separator" />}
            <div className="stops-near-you-no-stops">
              <Icon
                img="icon-icon_info"
                color={this.context.config.colors.primary}
              />
              <FormattedMessage id="nearest-no-stops" />
            </div>
          </>
        )}
        {screenReaderUpdateAlert}
        {this.state.isUpdatingPosition && (
          <div className="stops-near-you-spinner-container">
            <Loading />
          </div>
        )}
        <div role="list" className="stops-near-you-container">
          {stops}
        </div>
        {this.state.isLoadingmoreStops && (
          <div className="stops-near-you-spinner-container">
            <Loading />
          </div>
        )}
        {this.props.relay.hasMore() && !noStopsFound && (
          <button
            type="button"
            aria-label={this.context.intl.formatMessage({
              id: 'show-more-stops-near-you',
              defaultMessage: 'Load more nearby stops',
            })}
            className="show-more-button"
            onClick={() => this.showMore(false)}
          >
            <FormattedMessage id="show-more" defaultMessage="Show more" />
          </button>
        )}
      </>
    );
  }
}
const StopsNearYouContainerWithBreakpoint = withBreakpoint(
  StopsNearYouContainer,
);

const connectedContainer = connectToStores(
  StopsNearYouContainerWithBreakpoint,
  ['TimeStore', 'FavouriteStore'],
  ({ getStore }, { match }) => {
    const favouriteIds =
      match.params.mode === 'CITYBIKE'
        ? new Set(
            getStore('FavouriteStore')
              .getBikeRentalStations()
              .map(station => station.stationId),
          )
        : new Set(
            getStore('FavouriteStore')
              .getStopsAndStations()
              .map(stop => stop.gtfsId),
          );
    return {
      currentTime: getStore('TimeStore').getCurrentTime().unix(),
      favouriteIds,
    };
  },
);

const refetchContainer = createPaginationContainer(
  connectedContainer,
  {
    stopPatterns: graphql`
      fragment StopsNearYouContainer_stopPatterns on QueryType
      @argumentDefinitions(
        startTime: { type: "Long!", defaultValue: 0 }
        omitNonPickups: { type: "Boolean!", defaultValue: false }
        lat: { type: "Float!" }
        lon: { type: "Float!", defaultValue: 0 }
        filterByPlaceTypes: { type: "[FilterPlaceType]", defaultValue: null }
        filterByModes: { type: "[Mode]", defaultValue: null }
        first: { type: "Int!", defaultValue: 123 } # always overridden
        after: { type: "String" }
        maxResults: { type: "Int" }
        maxDistance: { type: "Int" }
      ) {
        nearest(
          lat: $lat
          lon: $lon
          filterByPlaceTypes: $filterByPlaceTypes
          filterByModes: $filterByModes
          first: $first
          after: $after
          maxResults: $maxResults
          maxDistance: $maxDistance
        ) @connection(key: "StopsNearYouContainer_nearest") {
          edges {
            node {
              distance
              place {
                __typename
                ... on BikeRentalStation {
                  ...CityBikeStopNearYouContainer_stop
                  stationId
                  networks
                  bikesAvailable
                }
                ... on Stop {
                  ...StopNearYouContainer_stop
                  @arguments(
                    startTime: $startTime
                    omitNonPickups: $omitNonPickups
                  )
                  id
                  name
                  gtfsId
                  stoptimesWithoutPatterns(
                    startTime: $startTime
                    omitNonPickups: $omitNonPickups
                  ) {
                    scheduledArrival
                  }
                  parentStation {
                    name
                  }
                }
              }
            }
          }
        }
      }
    `,
  },
  {
    direction: 'forward',
    getConnectionFromProps(props) {
      return props.stopPatterns && props.stopPatterns.nearest;
    },
    getFragmentVariables(prevVars, totalCount) {
      return {
        ...prevVars,
        first: totalCount,
      };
    },
    getVariables(props, pagevars, fragmentVariables) {
      return {
        ...fragmentVariables,
        first: pagevars.count,
        after: pagevars.cursor,
      };
    },
    query: graphql`
      query StopsNearYouContainerRefetchQuery(
        $lat: Float!
        $lon: Float!
        $filterByPlaceTypes: [FilterPlaceType]
        $filterByModes: [Mode]
        $first: Int!
        $after: String
        $maxResults: Int!
        $maxDistance: Int!
        $startTime: Long!
        $omitNonPickups: Boolean!
      ) {
        viewer {
          ...StopsNearYouContainer_stopPatterns
          @arguments(
            startTime: $startTime
            omitNonPickups: $omitNonPickups
            lat: $lat
            lon: $lon
            filterByPlaceTypes: $filterByPlaceTypes
            filterByModes: $filterByModes
            first: $first
            after: $after
            maxResults: $maxResults
            maxDistance: $maxDistance
          )
        }
      }
    `,
  },
);

export { refetchContainer as default, StopsNearYouContainer as Component };
