/* eslint-disable max-classes-per-file */
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

const fareCategoryShape = PropTypes.shape({
  categoryName: PropTypes.string,
  singleTickets: PropTypes.shape({
    totalPrice: PropTypes.number,
    count: PropTypes.number,
    rides: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string,
        price: PropTypes.number,
      }),
    ),
  }),
  passes: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string,
      productId: PropTypes.string,
      price: PropTypes.number,
    }),
  ),
  fareUrl: PropTypes.string,
});

/**
 * Displays a single rider category section with single-ticket total
 * (expandable to show per-ride breakdown) and 24h pass suggestion.
 */
class CategoryFareSection extends React.Component {
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
    const { category, intl, currency } = this.props;
    const { expanded } = this.state;
    const { categoryName, singleTickets, passes } = category;

    return (
      <div className="fare-category-section">
        <div className="fare-category-header">{categoryName}</div>

        {singleTickets && (
          <div className="fare-single-tickets">
            <button
              type="button"
              className="fare-single-toggle"
              onClick={this.toggle}
              aria-expanded={expanded}
            >
              <span className="fare-single-total">
                {formatPrice(intl, singleTickets.totalPrice, currency)}
              </span>
              <span className="fare-single-count">
                ({singleTickets.count}{' '}
                {singleTickets.count === 1 ? 'ticket' : 'tickets'})
              </span>
              <Icon
                img="icon-icon_arrow-collapse--right"
                className={`fare-expand-icon ${expanded ? 'expanded' : ''}`}
              />
            </button>
            {expanded && (
              <ul className="fare-rides-list">
                {singleTickets.rides.map((ride, idx) => (
                  <li
                    key={`${ride.name}-${idx}`} // eslint-disable-line react/no-array-index-key
                    className="fare-ride-item"
                  >
                    {formatPrice(intl, ride.price, currency)} - {ride.name}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {passes.map(pass => (
          <div key={pass.productId} className="fare-pass-option">
            <span className="fare-pass-price">
              {formatPrice(intl, pass.price, currency)}
            </span>{' '}
            <span className="fare-pass-name">{pass.name}</span>{' '}
            <span className="fare-pass-suggested">(suggested)</span>
          </div>
        ))}
      </div>
    );
  }
}

CategoryFareSection.propTypes = {
  category: fareCategoryShape.isRequired,
  intl: intlShape.isRequired,
  currency: PropTypes.string,
};

CategoryFareSection.defaultProps = { currency: 'USD' };

/**
 * Expandable fare summary for the itinerary detail header.
 * Shows "From $X" (or "$X") toggle; expands to show full category detail
 * (Adult + Reduced with per-ride breakdown, 24h pass, buy link).
 */
class FareSummaryToggle extends React.Component {
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
    const { label, fareCategories, intl, currency } = this.props;
    const { expanded } = this.state;

    const fareUrl =
      fareCategories && fareCategories.length > 0 && fareCategories[0].fareUrl;

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
            <span className="fare-range">{label}</span>
          </span>
          <Icon
            img="icon-icon_arrow-collapse--right"
            className={`fare-expand-icon ${expanded ? 'expanded' : ''}`}
          />
        </button>
        {expanded && fareCategories && (
          <div className="fare-categories-display">
            {fareCategories.map(category => (
              <CategoryFareSection
                key={category.categoryName}
                category={category}
                intl={intl}
                currency={currency}
              />
            ))}
            {fareUrl && (
              <a
                className="fare-buy-ticket-link"
                href={fareUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
              >
                <Icon img="icon-icon_ticket" className="fare-buy-icon" />
                buy ticket
              </a>
            )}
          </div>
        )}
      </div>
    );
  }
}

FareSummaryToggle.propTypes = {
  label: PropTypes.string.isRequired,
  fareCategories: PropTypes.arrayOf(fareCategoryShape),
  intl: intlShape.isRequired,
  currency: PropTypes.string,
};

FareSummaryToggle.defaultProps = { currency: 'USD', fareCategories: null };

/**
 * Main fare display component for OKC.
 * Shows a toggle header ("From $X" or "$X") that expands to reveal the full
 * category-based fare breakdown (Adult + Reduced, per-ride detail, 24h pass, buy link).
 */
export default function TicketInformation(
  { fares, transitLegCount, fareOptions, fareCategories },
  { intl, config },
) {
  if (!fares || fares.length === 0) {
    return null;
  }

  const currency = config?.fareDisplayCurrency || 'USD';

  const knownFares = fares.filter(
    f => !f.isUnknown && typeof f.price === 'number',
  );
  if (knownFares.length === 0) {
    return null;
  }

  const isMultiLeg = transitLegCount > 1;

  // Build the toggle label
  let label;
  if (isMultiLeg && fareOptions && fareOptions.length > 0) {
    const cheapest = fareOptions[0];
    label = `From ${formatPrice(intl, cheapest.totalPrice, currency)}`;
  } else if (knownFares.length === 1 && knownFares[0].price > 0) {
    label = formatPrice(intl, knownFares[0].price, currency);
  } else if (knownFares.length === 1 && knownFares[0].price === 0) {
    label = 'free';
  } else {
    const totalFare = knownFares.reduce((sum, f) => sum + f.price, 0);
    label = formatPrice(intl, totalFare, currency);
  }

  // If we have category data, show toggle that expands to category detail
  if (fareCategories && fareCategories.length > 0) {
    return (
      <FareSummaryToggle
        label={label}
        fareCategories={fareCategories}
        intl={intl}
        currency={currency}
      />
    );
  }

  // Fallback: simple inline display (no category data available)
  return (
    <span className="okc-icon-button fare--itinerary-summary">
      <Icon img="icon-icon_ticket" />
      <span>{label}</span>
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
  fareCategories: PropTypes.arrayOf(fareCategoryShape),
};

TicketInformation.defaultProps = {
  fares: [],
  transitLegCount: 1,
  fareOptions: null,
  fareCategories: null,
};

TicketInformation.contextTypes = {
  intl: intlShape,
  config: PropTypes.object,
};

TicketInformation.displayName = 'TicketInformation';
