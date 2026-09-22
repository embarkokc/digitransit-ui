import { expect } from 'chai';
import { describe, it } from 'mocha';
import React from 'react';

import { shallowWithIntl } from '../helpers/mock-intl-enzyme';
import { mockMatch } from '../helpers/mock-router';
import EndLeg from '../../../app/component/EndLeg';

const props = extra => ({
  endTime: 1529589709000,
  index: 3,
  focusAction: () => {},
  to: { name: 'Transit Center-BAY C, Oklahoma City', stop: null },
  ...extra,
});

const context = {
  match: mockMatch,
  config: { colors: { primary: '#007ac9' } },
};

describe('<EndLeg />', () => {
  it('should show the arrival time as realtime when the itinerary ends on a realtime transit leg', () => {
    const wrapper = shallowWithIntl(<EndLeg {...props({ realTime: true })} />, {
      context,
    });

    expect(
      wrapper.find('.itinerary-time-column-time').find('.realtime'),
    ).to.have.lengthOf(1);
  });

  it('should not show the arrival time as realtime when the itinerary ends on a walk', () => {
    const wrapper = shallowWithIntl(
      <EndLeg {...props({ realTime: false })} />,
      {
        context,
      },
    );

    expect(
      wrapper.find('.itinerary-time-column-time').find('.realtime'),
    ).to.have.lengthOf(0);
  });

  it('should not show the arrival time as realtime when realTime is not given', () => {
    const wrapper = shallowWithIntl(<EndLeg {...props()} />, { context });

    expect(
      wrapper.find('.itinerary-time-column-time').find('.realtime'),
    ).to.have.lengthOf(0);
  });
});
