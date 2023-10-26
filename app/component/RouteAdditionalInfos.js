import React from 'react';
import PropTypes from 'prop-types';
/*
 * RouteAdditionalInfos renders additional attributes provided
 * via route desc as rows.
 */
const RouteAdditionalInfos = ({ route }) => {
  if (!route.desc) {
    return null;
  }
  const infos = route.desc.split('|');
  const rows = infos.map(info => {
    const keyValue = info.split(/:(.+)/);
    return (
      <li key={`add-infos-${keyValue[0]}`}>
        <b>{keyValue[0]}:</b>
        {keyValue[1]}
      </li>
    );
  });

  return <ul className="route-additional-infos">{rows}</ul>;
};

RouteAdditionalInfos.propTypes = {
  route: PropTypes.object.isRequired,
};

export default RouteAdditionalInfos;
