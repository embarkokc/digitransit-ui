import PropTypes from 'prop-types';
import React from 'react';
import { intlShape } from 'react-intl';
import Icon from './Icon';
import { FareShape } from '../util/shapes';

function formatPrice(intl, price) {
  return intl.formatNumber(price, {
    style: 'currency',
    currency: 'USD',
  });
}

export default function TicketInformation(
  { fares, transitLegCount },
  { intl },
) {
  if (!fares || fares.length === 0) {
    return null;
  }

  const knownFares = fares.filter(
    f => !f.isUnknown && typeof f.price === 'number',
  );
  if (knownFares.length === 0) {
    return null;
  }

  const isMultiLeg = transitLegCount > 1;

  // Single transit leg: show exact fare
  if (!isMultiLeg && knownFares.length === 1) {
    const fare = knownFares[0];
    const fareUrl = fare.agency?.fareUrl;
    return (
      <span className="okc-icon-button fare--itinerary-summary">
        <Icon img="icon-icon_ticket" />
        {fare.price > 0 ? (
          <>
            <span>{formatPrice(intl, fare.price)}</span>
            {fareUrl && <a href={fareUrl}>Buy</a>}
          </>
        ) : (
          <span>free</span>
        )}
      </span>
    );
  }

  // Multi transit leg: show combined total fare
  const totalFare = knownFares.reduce((sum, f) => sum + f.price, 0);
  const hasUnknown = fares.some(f => f.isUnknown);

  return (
    <span className="okc-icon-button fare--itinerary-summary fare--multi-leg">
      <span className="fare-amount-row">
        <Icon img="icon-icon_ticket" />
        <span className="fare-range">
          {formatPrice(intl, totalFare)}
          {hasUnknown && '+'}
        </span>
      </span>
      <span className="fare-details-note">See legs for fare details</span>
    </span>
  );
}

TicketInformation.propTypes = {
  fares: PropTypes.arrayOf(FareShape),
  transitLegCount: PropTypes.number,
};

TicketInformation.defaultProps = {
  fares: [],
  transitLegCount: 1,
};

TicketInformation.contextTypes = {
  intl: intlShape,
};

TicketInformation.displayName = 'TicketInformation';
