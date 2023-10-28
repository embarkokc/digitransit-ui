import cx from 'classnames';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { createFragmentContainer, graphql } from 'react-relay';
import { intlShape, FormattedMessage } from 'react-intl';
import Icon from './Icon';
import DeparturesRow from './DeparturesRow';
import { isBrowser } from '../util/browser';
import {
  stopRealTimeClient,
  startRealTimeClient,
  changeRealTimeClientTopics,
} from '../action/realTimeClientAction';
import { getHeadsignFromRouteLongName } from '../util/legUtils';

const getDropoffMessage = (hasOnlyDropoff, hasNoStop) => {
  if (hasNoStop) {
    return 'route-no-stop';
  }
  if (hasOnlyDropoff) {
    return 'route-destination-arrives';
  }
  return undefined;
};

const asDepartures = stoptimes =>
  !stoptimes
    ? []
    : stoptimes.map(stoptime => {
        const hasDropoff = stoptime.dropoffType !== 'NONE';
        const hasPickup = stoptime.pickupType !== 'NONE';
        const hasNoStop = !hasPickup && !hasDropoff;
        const isArrival = !hasPickup;
        let isLastStop = false;
        if (stoptime.trip && stoptime.trip.stops) {
          const lastStop = stoptime.trip.stops.slice(-1).pop();
          isLastStop = stoptime.stop.id === lastStop.id;
        }
        const hasOnlyDropoff = !hasPickup && !isLastStop;
        /* OTP returns either scheduled time or realtime prediction in
         * 'realtimeDeparture' and 'realtimeArrival' fields.
         * EXCEPT when state is CANCELLED, then it returns -1 for realtime  */
        const canceled = stoptime.realtimeState === 'CANCELED';
        const arrivalTime =
          stoptime.serviceDay +
          (!canceled ? stoptime.realtimeArrival : stoptime.scheduledArrival);
        const departureTime =
          stoptime.serviceDay +
          (!canceled
            ? stoptime.realtimeDeparture
            : stoptime.scheduledDeparture);
        const stoptimeTime = isArrival ? arrivalTime : departureTime;

        const { pattern } = stoptime.trip;
        return {
          canceled,
          isArrival,
          hasNoStop,
          hasOnlyDropoff,
          isLastStop,
          stoptime: stoptimeTime,
          stop: stoptime.stop,
          realtime: stoptime.realtime,
          pattern,
          headsign: stoptime.headsign,
          trip: stoptime.trip,
          pickupType: stoptime.pickupType,
          serviceDay: stoptime.serviceDay,
        };
      });

const StopShape = PropTypes.shape({
  id: PropTypes.string.isRequired,
});

const TripShape = PropTypes.shape({
  stops: PropTypes.arrayOf(StopShape),
});

const StopTimeShape = PropTypes.shape({
  dropoffType: PropTypes.string.isRequired,
  pickupType: PropTypes.string.isRequired,
  trip: TripShape,
});

class DepartureListContainer extends Component {
  static propTypes = {
    stoptimes: PropTypes.arrayOf(StopTimeShape).isRequired,
    mode: PropTypes.string.isRequired,
    currentTime: PropTypes.number.isRequired,
    limit: PropTypes.number,
    infiniteScroll: PropTypes.bool,
    className: PropTypes.string,
    isTerminal: PropTypes.bool,
    isStopPage: PropTypes.bool,
  };

  static defaultProps = {
    limit: undefined,
    infiniteScroll: false,
    className: undefined,
    isTerminal: false,
    isStopPage: false,
  };

  static contextTypes = {
    intl: intlShape.isRequired,
  };

  constructor(props) {
    super(props);
    this.pageLoadedAlertRef = React.createRef();
  }

  componentDidMount() {
    if (this.pageLoadedAlertRef.current) {
      this.pageLoadedAlertRef.current.innerHTML = this.context.intl.formatMessage(
        {
          id: 'stop-page.right-now.loaded',
          defaultMessage: 'Right now stop page loaded',
        },
      );
      setTimeout(() => {
        if (this.pageLoadedAlertRef?.current) {
          this.pageLoadedAlertRef.current.innerHTML = null;
        }
      }, 100);
    }
    if (this.context.config.showVehiclesOnStopPage && this.props.isStopPage) {
      const departures = asDepartures(this.props.stoptimes)
        .filter(departure => !(this.props.isTerminal && departure.isArrival))
        .filter(departure => this.props.currentTime < departure.stoptime);
      this.startClient(departures);
    }
  }

  componentDidUpdate() {
    if (this.context.config.showVehiclesOnStopPage && this.props.isStopPage) {
      const departures = asDepartures(this.props.stoptimes)
        .filter(departure => !(this.props.isTerminal && departure.isArrival))
        .filter(departure => this.props.currentTime < departure.stoptime)
        .filter(departure => departure.realtime);

      this.updateClient(departures);
    }
  }

  componentWillUnmount() {
    if (this.context.config.showVehiclesOnStopPage && this.props.isStopPage) {
      const { client } = this.context.getStore('RealTimeInformationStore');
      if (client) {
        this.context.executeAction(stopRealTimeClient, client);
      }
    }
  }

  configClient = departures => {
    const trips = departures
      .filter(departure => departure.realtime)
      .filter(
        departure =>
          departure.pattern.stops
            .map(stop => stop.code)
            .indexOf(departure.stop.code) >= 0,
      )
      .map(departure => ({
        tripId: departure.trip.gtfsId.split(':')[1],
      }));

    const { config } = this.context;
    const { realTime } = config;
    let agency;

    /* handle multiple feedid case */
    config.feedIds.forEach(ag => {
      if (!agency && realTime[ag]) {
        agency = ag;
      }
    });
    const source = agency && realTime[agency];
    if (source && source.active) {
      return {
        ...source,
        agency,
        options: trips,
      };
    }
    return null;
  };

  startClient = departures => {
    const clientConfig = this.configClient(departures);
    if (clientConfig) {
      this.context.executeAction(startRealTimeClient, clientConfig);
    }
  };

  updateClient = departures => {
    const { client, topics } = this.context.getStore(
      'RealTimeInformationStore',
    );
    if (client) {
      const clientConfig = this.configClient(departures);
      if (clientConfig) {
        this.context.executeAction(changeRealTimeClientTopics, {
          ...clientConfig,
          client,
          oldTopics: topics,
        });
      }
    }
  };

  onScroll = () => {
    if (this.props.infiniteScroll && isBrowser) {
      return this.scrollHandler;
    }
    return null;
  };

  getHeadsign = departure => {
    if (departure.isArrival) {
      if (departure.isLastStop) {
        return this.context.intl.formatMessage({
          id: 'route-destination-endpoint',
          defaultMessage: 'Arrives / Terminus',
        });
      }
      return (
        departure.trip?.tripHeadsign ||
        this.context.intl.formatMessage({
          id: 'route-destination-arrives',
          defaultMessage: 'Drop-off only',
        })
      );
    }
    const headsign =
      departure.headsign ||
      departure.pattern.headsign ||
      (departure.trip && departure.trip.tripHeadsign) ||
      getHeadsignFromRouteLongName(departure.pattern.route);

    if (headsign.endsWith(' via')) {
      return headsign.substring(0, headsign.indexOf(' via'));
    }
    return headsign;
  };

  render() {
    const screenReaderAlert = (
      <span className="sr-only" role="alert" ref={this.pageLoadedAlertRef} />
    );

    const departureObjs = [];
    const { currentTime, limit, isTerminal, stoptimes } = this.props;
    const departures = asDepartures(stoptimes)
      .filter(departure => !(isTerminal && departure.isArrival))
      .filter(departure => currentTime < departure.stoptime)
      .filter(departure => currentTime + 86400 > departure.stoptime)
      .slice(0, limit);

    // EMBARK: Group departures by route_short_name and headsign
    const groupedDepartures = new Map();
    const MAX_DEPARTURES_PER_PATTERN = 3;
    departures.forEach(departure => {
      const key =
        departure.trip.pattern.route.shortName + this.getHeadsign(departure);
      if (groupedDepartures.has(key)) {
        const deps = groupedDepartures.get(key);
        if (deps.length < MAX_DEPARTURES_PER_PATTERN) {
          deps.push(departure);
        }
      } else {
        groupedDepartures.set(key, [departure]);
      }
    });
    // No date separator
    // /EMBARK
    groupedDepartures.forEach(departureGroup => {
      const departure = departureGroup[0];
      const id = `${departure.pattern.code}:${departure.stoptime}`;
      const dropoffMessage = getDropoffMessage(
        departure.hasOnlyDropoff,
        departure.hasNoStop,
      );
      const row = {
        headsign: this.getHeadsign(departure),
        trip: { ...departure.trip, ...{ route: departure.trip.pattern.route } },
        stop: departure.stop,
        realtime: departure.realtime,
        bottomRow: dropoffMessage ? (
          <div className="drop-off-container">
            <Icon
              img="icon-icon_info"
              color={this.context.config.colors.primary}
            />
            <FormattedMessage
              id={dropoffMessage}
              defaultMessage="Drop-off only"
            />
          </div>
        ) : null,
      };

      const departureObj = (
        <DeparturesRow
          key={id}
          departure={row}
          departures={departureGroup}
          currentTime={this.props.currentTime}
          showPlatformCode={isTerminal}
          canceled={departure.canceled}
        />
      );

      departureObjs.push(departureObj);
    });

    return (
      <>
        {screenReaderAlert}
        <span className="sr-only">
          <FormattedMessage
            id="departure-list-update.sr-instructions"
            default="The departure list and estimated departure times will update in real time."
          />
        </span>
        <table
          className={cx('departure-list', this.props.className)}
          onScroll={this.onScroll()}
        >
          <thead className="sr-only">
            <tr>
              <th>
                <FormattedMessage id="route" defaultMessage="Route" />
              </th>
              <th>
                <FormattedMessage
                  id="destination"
                  defaultMessage="Destination"
                />
              </th>
              <th>
                <FormattedMessage id="leaving-at" defaultMessage="Leaves" />
              </th>
              <th>
                <FormattedMessage
                  id={this.props.mode === 'BUS' ? 'platform' : 'track'}
                  defaultMessage={
                    this.props.mode === 'BUS' ? 'Platform' : 'Track'
                  }
                />
              </th>
            </tr>
          </thead>
          <tbody>{departureObjs}</tbody>
        </table>
        <span className="departure-list-legend">
          <span className="realtime">Realtime arrivals are estimates</span>
          <span className="scheduled">* Scheduled</span>
        </span>
      </>
    );
  }
}

DepartureListContainer.contextTypes = {
  executeAction: PropTypes.func.isRequired,
  getStore: PropTypes.func.isRequired,
  config: PropTypes.object.isRequired,
  intl: intlShape.isRequired,
};

const containerComponent = createFragmentContainer(DepartureListContainer, {
  stoptimes: graphql`
    fragment DepartureListContainer_stoptimes on Stoptime @relay(plural: true) {
      realtimeState
      realtimeDeparture
      scheduledDeparture
      realtimeArrival
      scheduledArrival
      realtime
      serviceDay
      pickupType
      dropoffType
      headsign
      stop {
        id
        code
        platformCode
      }
      trip {
        gtfsId
        directionId
        tripHeadsign
        stops {
          id
        }
        alerts {
          alertSeverityLevel
          effectiveEndDate
          effectiveStartDate
        }
        pattern {
          route {
            gtfsId
            shortName
            longName
            mode
            type
            color
            agency {
              name
            }
            alerts {
              alertSeverityLevel
              effectiveEndDate
              effectiveStartDate
            }
          }
          code
          stops {
            gtfsId
            code
          }
        }
      }
    }
  `,
});

export { containerComponent as default, DepartureListContainer as Component };
