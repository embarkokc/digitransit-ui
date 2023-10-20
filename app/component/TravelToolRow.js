import React from 'react';
import PropTypes from 'prop-types';
import Icon from './Icon';

/*
 * PrecheckedLink only renders the link in case the href can be accessed.
 * Note: in case the url references anothter host, appropriate Access-Control-Allow-Origin
 * headers need to be returned by that server.
 */
const TravelToolRow = ({ href, icon, children }) => {
  return (
    <div className="okc-travel-tool-row">
      <Icon img={icon} height={1} color="#686869" />
      <a
        target="_top"
        href={href}
        style={{ color: 'inherit', textDecoration: 'none' }}
      >
        {children}
      </a>
      <Icon img="icon-icon_arrow-collapse--right" height={1} />
    </div>
  );
};

TravelToolRow.propTypes = {
  href: PropTypes.string.isRequired,
  icon: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};

export default TravelToolRow;
