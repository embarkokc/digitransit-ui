import React from 'react';
import PropTypes from 'prop-types';
import { intlShape } from 'react-intl';
import { Link } from 'found';
import { PREFIX_STOPS, PREFIX_TERMINALS } from '../util/path';

import StopCode from './StopCode';
// todo: use app/component/Icon.js instead?
// import Icon from '@digitransit-component/digitransit-component-icon';
import Icon from './Icon';

const StopNearYou = ({ stop, stopId }, { config, intl }) => {
  const stopOrStation = stop.parentStation ? stop.parentStation : stop;
  // todo: this is very brittle
  const mode = stopOrStation.stoptimesWithoutPatterns[0]?.trip.route.mode?.toLowerCase();
  const isStation = !!stop.parentStation || !!stopId;
  const gtfsId =
    (stop.parentStation && stop.parentStation.gtfsId) || stop.gtfsId;
  const linkAddress = isStation
    ? `/${PREFIX_TERMINALS}/${gtfsId}`
    : `/${PREFIX_STOPS}/${gtfsId}`;

  const stopDescription = description => {
    const descriptionIconMappings = {
      Inbound: 'icon-icon_arrow-right',
      Outbound: 'icon-icon_arrow-left',
    };
    const icon = descriptionIconMappings[description];

    return (
      <div className="stop-near-you-direction">
        {icon && <Icon img={icon} className="direction-arrow" />}
        <span>{description}</span>
      </div>
    );
  };

  return (
    <span role="listitem">
      <div className="stop-near-you-container">
        <Link
          as="button"
          to={linkAddress}
          className="stop-near-you-inner-container"
        >
          <div className="stop-near-you-left-col">
            <span className={mode}>
              {/* <Icon color={config.colors.iconColors[mode]} img={`${mode}-stop`} /> */}
              <Icon
                color={config.colors.iconColors[mode]}
                img={`icon-icon_${mode}-stop`}
                width={3}
                height={3}
                ariaLabel={intl.formatMessage({ id: mode })}
              />
            </span>
            <div>
              <StopCode code={stop.code} />
            </div>
          </div>
          <div className="stop-near-you-right-col">
            <div className="stop-near-you-name">{stop.name}</div>
            {stopDescription(stop.desc)}
          </div>
          <Icon
            img="icon-icon_arrow-collapse--right"
            className="itinerary-arrow-icon"
          />
        </Link>
      </div>
    </span>
  );
};

StopNearYou.propTypes = {
  stop: PropTypes.object.isRequired,
  stopId: PropTypes.string,
};

StopNearYou.contextTypes = {
  config: PropTypes.object.isRequired,
  intl: intlShape.isRequired,
};

export default StopNearYou;
