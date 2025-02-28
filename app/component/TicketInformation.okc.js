import PropTypes from 'prop-types';
import React from 'react';
import { intlShape } from 'react-intl';
import Icon from './Icon';
import { FareShape } from '../util/shapes';

export default function TicketInformation({ fares }, { intl }) {
  if (!fares || fares.length !== 1 || !fares[0].cents) {
    // FOR EMBARK, we assume that exactly one fare is returned.
    // Should there be more than one, we better show nothing, than
    // an unexpected partial fare
    return null;
  }
  const fareUrl = fares?.[0]?.components?.[0]?.routes?.[0]?.agency?.fareUrl;

  return (
    <span className="okc-icon-button fare--itinerary-summary">
      <Icon img="icon-icon_ticket" />
      <span>
        {intl.formatNumber(fares[0].cents / 100, {
          style: 'currency',
          currency: 'USD',
        })}
      </span>
      <a href={fareUrl}>Buy</a>
    </span>
  );
}

TicketInformation.propTypes = {
  fares: PropTypes.arrayOf(FareShape),
};

TicketInformation.defaultProps = {
  fares: [],
};

TicketInformation.contextTypes = {
  intl: intlShape,
};

TicketInformation.displayName = 'TicketInformation';
