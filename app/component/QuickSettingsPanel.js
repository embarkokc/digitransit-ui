import PropTypes from 'prop-types';
import React from 'react';
import cx from 'classnames';
import { matchShape, routerShape } from 'found';

import RightOffcanvasToggle from './RightOffcanvasToggle';
import DatetimepickerContainer from './DatetimepickerContainer';

class QuickSettingsPanel extends React.Component {
  // TODO decide if these are needed for new datepicker
  /* eslint-disable react/no-unused-prop-types */
  static propTypes = {
    timeSelectorStartTime: PropTypes.number,
    timeSelectorEndTime: PropTypes.number,
    timeSelectorServiceTimeRange: PropTypes.object.isRequired,
    toggleSettings: PropTypes.func.isRequired,
  };
  /* eslint-enable react/no-unused-prop-types */

  static contextTypes = {
    intl: PropTypes.object.isRequired,
    router: routerShape.isRequired,
    match: matchShape.isRequired,
    config: PropTypes.object.isRequired,
  };

  state = {};

  render() {
    const { toggleSettings } = this.props;

    return (
      <div className={cx(['quicksettings-container'])}>
        <div className="datetimepicker-container">
          <DatetimepickerContainer
            realtime={false}
            embedWhenClosed={
              <div className="open-advanced-settings">
                <RightOffcanvasToggle onToggleClick={toggleSettings} />
              </div>
            }
            embedWhenOpen={
              <div className="open-embed-container">
                <div className="open-advanced-settings open-embed">
                  <RightOffcanvasToggle onToggleClick={toggleSettings} />
                </div>
              </div>
            }
            color={this.context.config.colors.primary}
          />
        </div>
      </div>
    );
  }
}

export default QuickSettingsPanel;
