import PropTypes from 'prop-types';
import React from 'react';
import Icon from './Icon';
import { FareShape } from '../util/shapes';

export default function TicketInformation({ fares }) {
  if (!fares || fares.length !== 1 || !fares[0].cents) {
    // FOR EMBARK, we asasume that exactly one fare is returned.
    // Should there be more than one, we better show nothing, than
    // an unexpected partial fare
    return null;
  }

  return (
    <span className="okc-icon-button">
      <Icon img="icon-icon_ticket" />
      <span>${fares[0]?.cents / 100}</span>
    </span>
  );
}

TicketInformation.propTypes = {
  fares: PropTypes.arrayOf(FareShape),
};

TicketInformation.defaultProps = {
  fares: [],
};

TicketInformation.displayName = 'TicketInformation';
