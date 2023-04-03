import PropTypes from 'prop-types';
import React, { useState } from 'react';
import moment from 'moment';
import { intlShape } from 'react-intl';

import Select, { components } from 'react-select';
import Icon from './Icon';

const DAYS_IN_ADVANCE = 58; // two months - 2 days

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

function DateSelect(props, context) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const onMenuOpen = () => setIsMenuOpen(true);
  const onMenuClose = () => setIsMenuOpen(false);

  const dates = [];
  const date = moment(props.startDate, props.dateFormat);

  dates.push({
    label: context.intl.formatMessage({ id: 'today', defaultMessage: 'Today' }),
    value: date.format(props.dateFormat),
  });

  dates.push({
    label: context.intl.formatMessage({
      id: 'tomorrow',
      defaultMessage: 'Tomorrow',
    }),
    value: date.add(1, 'd').format(props.dateFormat),
  });

  for (let i = 0; i < DAYS_IN_ADVANCE; i++) {
    dates.push({
      value: date.add(1, 'd').format(props.dateFormat),
      label: date.format('ddd MM/DD'),
    });
  }
  const dateList = dates.map(option => {
    return {
      value: option.value,
      label: option.label,
    };
  });
  const selectedOption = dateList.find(d => d.value === props.selectedDate);
  const id = 'route-schedule-datepicker';
  const classNamePrefix = 'route-schedule';

  return (
    <Select
      aria-labelledby={`aria-label-${id}`}
      ariaLiveMessages={{
        guidance: () => '.', // this can't be empty for some reason
        onChange: ({ value }) =>
          `${context.intl.formatMessage({
            id: 'route-page.pattern-chosen',
          })} ${value.label}`,
        onFilter: () => '',
        onFocus: ({ context: itemContext, focused }) => {
          if (itemContext === 'menu') {
            return focused.label;
          }
          return '';
        },
      }}
      className="date-select"
      classNamePrefix={classNamePrefix}
      components={{
        // We don't want to specify inline components' prop types.
        // eslint-disable-next-line react/prop-types
        Control: ({ children, ...rest }) => (
          <components.Control {...rest}>
            <Icon id="route-schedule-date-icon" img="icon-icon_calendar" />
            {children}
          </components.Control>
        ),
        DropdownIndicator,
        IndicatorSeparator: () => null,
      }}
      inputId={`aria-input-${id}`}
      aria-label={`
            ${context.intl.formatMessage({
              id: 'select-date',
              defaultMessage: 'Select date',
            })}.
            ${context.intl.formatMessage({
              id: 'route-page.pattern-chosen',
            })} ${selectedOption.textLabel}`}
      isSearchable={false}
      name={id}
      menuIsOpen={isMenuOpen}
      onChange={newSelectedOption => {
        props.onDateChange(newSelectedOption.value);
        onMenuClose();
      }}
      closeMenuOnSelect
      onMenuOpen={onMenuOpen}
      onMenuClose={onMenuClose}
      options={dateList}
      value={selectedOption}
    />
  );
}
DateSelect.propTypes = {
  startDate: PropTypes.string.isRequired,
  selectedDate: PropTypes.string.isRequired,
  dateFormat: PropTypes.string.isRequired,
  onDateChange: PropTypes.func.isRequired,
};
DateSelect.contextTypes = {
  intl: intlShape.isRequired, // eslint-disable-line react/no-typos
};
DateSelect.displayName = 'DateSelect';

export default DateSelect;
