import PropTypes from 'prop-types';
import React from 'react';
import ErrorBoundary from './ErrorBoundary';
import BackButton from './BackButton'; // DT-3358
import ScrollableWrapper from './ScrollableWrapper';

export default function DesktopView({
  title,
  header,
  map,
  content,
  settingsDrawer,
  scrollable,
  bckBtnVisible,
  bckBtnFallback,
}) {
  return (
    <div className="desktop">
      <div className="head-content">
        {bckBtnVisible && (
          <div className="desktop-title">
            <div className="title-container h2">
              <BackButton
                title="Back"
                titleClassName="back-button-label"
                icon="icon-icon_arrow-collapse--left"
                iconClassName="arrow-icon"
                fallback={bckBtnFallback}
              />
              <h1>{title}</h1>
              <h2 className="subtitle">
                Your schedule is important, so we work hard to stay on ours.
              </h2>
              <div>
                When special events, construction, or maintenance interfere with
                our schedule, we want you to know about it. Here, you will find
                information on detours, delays, stop closures, elevator outages,
                and other issues that may affect your EMBARK stop, route,
                plattform, or parking facility.
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="content">
        <div className="main-content" role="main">
          <ScrollableWrapper scrollable={scrollable}>
            {header}
            <ErrorBoundary>{content}</ErrorBoundary>
          </ScrollableWrapper>
        </div>
        <div className="map-content">
          {settingsDrawer}
          <ErrorBoundary>{map}</ErrorBoundary>
        </div>
      </div>
    </div>
  );
}

DesktopView.propTypes = {
  title: PropTypes.node,
  header: PropTypes.node,
  map: PropTypes.node,
  content: PropTypes.node,
  settingsDrawer: PropTypes.node,
  scrollable: PropTypes.bool,
  bckBtnVisible: PropTypes.bool,
  bckBtnFallback: PropTypes.string,
};

DesktopView.defaultProps = {
  scrollable: false,
  bckBtnVisible: true,
  bckBtnFallback: undefined,
};
