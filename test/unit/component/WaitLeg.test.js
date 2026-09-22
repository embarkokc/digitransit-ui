import { expect } from 'chai';
import { describe, it } from 'mocha';
import React from 'react';

import { shallowWithIntl } from '../helpers/mock-intl-enzyme';
import WaitLeg from '../../../app/component/WaitLeg';

const transitLeg = realTime => ({
  mode: 'BUS',
  transitLeg: true,
  realTime,
  from: { name: 'S Robinson Ave @ SW 22 St', stop: { gtfsId: 'embark:1' } },
  to: { name: 'Transit Center-BAY C', stop: { gtfsId: 'embark:156' } },
  startTime: 1529588805000,
  endTime: 1529589709000,
});

const props = leg => ({
  leg,
  startTime: leg.endTime,
  waitTime: 300000,
  focusAction: () => {},
  index: 2,
});

describe('<WaitLeg />', () => {
  it('should show the arrival time as realtime when the transit leg has realtime data', () => {
    const wrapper = shallowWithIntl(<WaitLeg {...props(transitLeg(true))} />, {
      context: { config: { colors: { primary: '#007ac9' } } },
    });

    expect(
      wrapper.find('.itinerary-time-column-time').find('.realtime'),
    ).to.have.lengthOf(1);
  });

  it('should not show the arrival time as realtime when the transit leg is scheduled', () => {
    const wrapper = shallowWithIntl(<WaitLeg {...props(transitLeg(false))} />, {
      context: { config: { colors: { primary: '#007ac9' } } },
    });

    expect(
      wrapper.find('.itinerary-time-column-time').find('.realtime'),
    ).to.have.lengthOf(0);
  });
});
