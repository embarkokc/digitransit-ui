import PropTypes from 'prop-types';
import React, { useState } from 'react';
import moment from 'moment';
import { intlShape } from 'react-intl';

import Select from 'react-select';
import Icon from './Icon';

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

  for (let i = 0; i < 58; i++) {
    dates.push({
      value: date.add(1, 'd').format(props.dateFormat),
      label: date.format('ddd MM/DD'),
    });
  }
  const dateList = dates.map(option => {
    return {
      value: option.value,
      textLabel: option.label,
      label: (
        <>
          <span>{option.label}</span>
          {option.value === props.selectedDate && (
            <Icon img="icon-icon_check" height={1.1525} width={0.904375} />
          )}
        </>
      ),
    };
  });
  const selectedDate = dateList.find(d => d.value === props.selectedDate);
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
          })} ${value.textLabel}`,
        onFilter: () => '',
        onFocus: ({ context: itemContext, focused }) => {
          if (itemContext === 'menu') {
            return focused.textLabel;
          }
          return '';
        },
      }}
      className="date-select"
      classNamePrefix={classNamePrefix}
      components={{
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
            })} ${selectedDate.textLabel}`}
      isSearchable={false}
      name={id}
      menuIsOpen={isMenuOpen}
      onChange={e => {
        props.onDateChange(e.value);
        onMenuClose();
      }}
      closeMenuOnSelect
      onMenuOpen={onMenuOpen}
      onMenuClose={onMenuClose}
      options={dateList}
      placeholder={
        <>
          <div>
            <Icon id="route-schedule-date-icon" img="icon-icon_calendar" />
          </div>
          <span className="left-column">
            <span className="selected-value">{selectedDate.textLabel}</span>
          </span>
        </>
      }
      value={selectedDate.value}
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
