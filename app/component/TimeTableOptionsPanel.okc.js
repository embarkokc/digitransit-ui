import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { intlShape } from 'react-intl';
import uniqBy from 'lodash/uniqBy';
import Select from 'react-select';
import Icon from './Icon';
// import RouteScheduleDropdown from './RouteScheduleDropdown';

// todo: DRY with ModesSelectDropdown
const DropdownIndicator = ({ innerProps }, { config }) => {
  return (
    <span className="dd__indicator dd__dropdown-indicator" {...innerProps}>
      <Icon
        // className="arrow-dropdown"
        img="icon-icon_arrow-collapse"
        height={0.625}
        width={0.625}
        color={config.colors.primary}
      />
    </span>
  );
};

DropdownIndicator.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  innerProps: PropTypes.object.isRequired,
};
DropdownIndicator.contextTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  config: PropTypes.object.isRequired,
};

const TimeTableOptionsPanel = (props, context) => {
  const { stop, showRoutes, setShowRoutes } = props;
  const { intl } = context;

  const patterns = uniqBy(
    stop.stoptimesForServiceDate
      .filter(stoptimesInPattern => stoptimesInPattern.stoptimes.length > 0)
      .map(stoptimesInPattern => stoptimesInPattern.pattern),
    pattern => pattern.code,
  );
  if (patterns.length === 0) {
    return null;
  }

  const options = patterns.map(pattern => ({
    value: pattern.code,
    label: `Route ${pattern.route.shortName}`,
  }));
  const selectedOption =
    (showRoutes.length > 0 &&
      options.find(({ value }) => value === showRoutes[0])) ||
    null;

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleChange = newSelectedOption => {
    const { value: newSelectedRoute } = newSelectedOption;
    setShowRoutes({
      showRoutes: [newSelectedRoute],
    });
  };

  const domId = 'stop-schedule-route-select';
  const labelDomId = `aria-label-${domId}`;
  const inputDomId = `aria-input-${domId}`;

  return (
    <div className="stop-schedule-route-select">
      <Select
        className="dd-select"
        classNamePrefix="dd"
        components={{
          DropdownIndicator,
          ClearIndicator: null,
          IndicatorSeparator: null,
        }}
        inputId={inputDomId}
        aria-label={intl.formatMessage(
          { id: 'stop-schedule-route-select-aria-label' },
          { selectedRoute: selectedOption ? selectedOption.label : null },
        )}
        aria-labelledby={labelDomId}
        ariaLiveMessages={{
          // Guidance message used to convey component state and specific keyboard interactivity
          guidance: () => {
            return intl.formatMessage({
              id: 'stop-schedule-route-select-aria-message-guidance',
            });
          },
          // OnChange message used to convey changes to value but also called when user selects disabled option
          onChange: ({ value: option }) => {
            return intl.formatMessage(
              { id: 'stop-schedule-route-select-aria-message-change' },
              { route: option.label },
            );
          },
          // OnFocus message used to convey information about the currently focused option or value
          onFocus: ({ focused: option }) => {
            return intl.formatMessage(
              { id: 'stop-schedule-route-select-aria-message-focused' },
              { route: option.label },
            );
          },
          // todo: onFilter?
          // OnFilter message used to convey information about filtered results displayed in the menu
        }}
        isSearchable={false}
        isMulti={false}
        menuIsOpen={isMenuOpen}
        onChange={handleChange}
        onMenuOpen={() => setIsMenuOpen(true)}
        onMenuClose={() => setIsMenuOpen(false)}
        options={options}
        value={selectedOption}
      />
    </div>
  );
};

TimeTableOptionsPanel.propTypes = {
  // todo: DRY with Timetable.js
  stop: PropTypes.shape({
    stoptimesForServiceDate: PropTypes.arrayOf(
      PropTypes.shape({
        // eslint-disable-next-line react/forbid-prop-types
        stoptimes: PropTypes.array.isRequired,
        pattern: PropTypes.shape({
          code: PropTypes.string.isRequired,
          route: PropTypes.shape({
            shortName: PropTypes.string.isRequired,
          }).isRequired,
        }).isRequired,
      }),
    ).isRequired,
  }).isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  showRoutes: PropTypes.array.isRequired,
  setShowRoutes: PropTypes.func.isRequired,
};

TimeTableOptionsPanel.contextTypes = {
  intl: intlShape.isRequired, // eslint-disable-line react/no-typos
};

export default TimeTableOptionsPanel;
