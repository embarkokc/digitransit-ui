import PropTypes from 'prop-types';
import React from 'react';
import { intlShape } from 'react-intl';
import Icon from './Icon';
import { FareShape } from '../util/shapes';

function formatPrice(intl, price, currency) {
  return intl.formatNumber(price, {
    style: 'currency',
    currency: currency || 'USD',
  });
}

/**
 * Single-leg fare display — just shows the price inline.
 */
function SingleLegFare({ fare, intl, currency }) {
  const fareUrl = fare.agency?.fareUrl;
  return (
    <span className="okc-icon-button fare--itinerary-summary">
      <Icon img="icon-icon_ticket" />
      {fare.price > 0 ? (
        <>
          <span>{formatPrice(intl, fare.price, currency)}</span>
          {fareUrl && <a href={fareUrl}>Buy</a>}
        </>
      ) : (
        <span>free</span>
      )}
    </span>
  );
}

SingleLegFare.propTypes = {
  fare: FareShape.isRequired,
  intl: intlShape.isRequired,
  currency: PropTypes.string,
};

SingleLegFare.defaultProps = { currency: 'USD' };

/**
 * Multi-leg expandable fare summary.
 * Shows "From $X" with expand/collapse to reveal all fare options.
 * Uses class component because React 16 (no hooks).
 */
class MultiLegFareSummary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { expanded: false };
    this.toggle = this.toggle.bind(this);
  }

  toggle(e) {
    if (e) {
      e.stopPropagation();
    }
    this.setState(prev => ({ expanded: !prev.expanded }));
  }

  render() {
    const { fareOptions, intl, currency } = this.props;
    const { expanded } = this.state;

    if (!fareOptions || fareOptions.length === 0) {
      return null;
    }

    const cheapest = fareOptions[0];

    return (
      <div className="fare--itinerary-summary fare--multi-leg">
        <button
          type="button"
          className="fare-summary-toggle"
          onClick={this.toggle}
          aria-expanded={expanded}
        >
          <span className="fare-amount-row">
            <Icon img="icon-icon_ticket" />
            <span className="fare-range">
              From {formatPrice(intl, cheapest.totalPrice, currency)}
            </span>
          </span>
          <Icon
            img="icon-icon_arrow-collapse--right"
            className={`fare-expand-icon ${expanded ? 'expanded' : ''}`}
          />
        </button>
        {expanded && (
          <ul className="fare-options-list">
            {fareOptions.map(option => (
              <li key={option.productId} className="fare-option-item">
                <span className="fare-option-name">
                  {option.count > 1
                    ? `${option.count} × ${option.name}`
                    : option.name}
                </span>
                <span className="fare-option-price">
                  {formatPrice(intl, option.totalPrice, currency)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }
}

MultiLegFareSummary.propTypes = {
  fareOptions: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string,
      productId: PropTypes.string,
      totalPrice: PropTypes.number,
      count: PropTypes.number,
    }),
  ).isRequired,
  intl: intlShape.isRequired,
  currency: PropTypes.string,
};

MultiLegFareSummary.defaultProps = { currency: 'USD' };

/**
 * Main fare display component for OKC.
 * Single leg: shows inline price.
 * Multi leg: shows expandable "From $X" with all fare options.
 */
export default function TicketInformation(
  { fares, transitLegCount, fareOptions },
  { intl, config },
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

  const currency = config?.fareDisplayCurrency || 'USD';
  const isMultiLeg = transitLegCount > 1;

  if (!isMultiLeg && knownFares.length === 1) {
    return (
      <SingleLegFare fare={knownFares[0]} intl={intl} currency={currency} />
    );
  }

  if (fareOptions && fareOptions.length > 0) {
    return (
      <MultiLegFareSummary
        fareOptions={fareOptions}
        intl={intl}
        currency={currency}
      />
    );
  }

  // Fallback: simple total
  const totalFare = knownFares.reduce((sum, f) => sum + f.price, 0);
  return (
    <span className="okc-icon-button fare--itinerary-summary">
      <Icon img="icon-icon_ticket" />
      <span>{formatPrice(intl, totalFare, currency)}</span>
    </span>
  );
}

TicketInformation.propTypes = {
  fares: PropTypes.arrayOf(FareShape),
  transitLegCount: PropTypes.number,
  fareOptions: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string,
      productId: PropTypes.string,
      totalPrice: PropTypes.number,
      count: PropTypes.number,
    }),
  ),
};

TicketInformation.defaultProps = {
  fares: [],
  transitLegCount: 1,
  fareOptions: null,
};

TicketInformation.contextTypes = {
  intl: intlShape,
  config: PropTypes.object,
};

TicketInformation.displayName = 'TicketInformation';
