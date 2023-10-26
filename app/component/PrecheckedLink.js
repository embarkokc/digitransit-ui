import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PropTypes from 'prop-types';
/*
 * PrecheckedLink only renders the link in case the href can be accessed.
 * Note: in case the url references anothter host, appropriate Access-Control-Allow-Origin
 * headers need to be returned by that server.
 */
const PrecheckedLink = ({ href, children }) => {
  const [linkVisible, setLinkVisible] = useState(true);

  useEffect(() => {
    axios
      .head(href.toString())
      .then(() => {
        // If the request is successful, the URL exists
        setLinkVisible(true);
      })
      .catch(error => {
        if (error.response && error.response.status === 404) {
          // Iff the request returns a 404 status, hide the link
          setLinkVisible(false);
        }
      });
  }, [href]);

  return linkVisible && <a href={href}>{children}</a>;
};

PrecheckedLink.propTypes = {
  href: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};

export default PrecheckedLink;
