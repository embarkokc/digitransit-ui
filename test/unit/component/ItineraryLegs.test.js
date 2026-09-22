import { expect } from 'chai';
import { describe, it } from 'mocha';
import React from 'react';
import sinon from 'sinon';

import { mockContext, mockChildContextTypes } from '../helpers/mock-context';
import { mountWithIntl, shallowWithIntl } from '../helpers/mock-intl-enzyme';
import DefaultExport, {
  Component as ItineraryLegs,
} from '../../../app/component/ItineraryLegs';

import EndLeg from '../../../app/component/EndLeg';

import data from '../test-data/dcw12';
import dt2831b from '../test-data/dt2831b';

describe('<ItineraryLegs />', () => {
  it('should not fail to render even if the first leg is an intermediate place', () => {
    const props = {
      itinerary: {
        endTime: data.firstLegIsAnIntermediatePlace[3].endTime,
        legs: data.firstLegIsAnIntermediatePlace,
      },
      toggleCanceledLegsBanner: () => {},
      waitThreshold: 180,
    };
    const wrapper = mountWithIntl(<ItineraryLegs {...props} />, {
      context: {
        ...mockContext,
        match: {
          ...mockContext.match,
          location: {
            ...mockContext.match.location,
            state: {},
          },
        },
      },
      childContextTypes: mockChildContextTypes,
    });

    expect(wrapper).to.have.lengthOf(1);
  });

  it("should not fail to render even if the itinerary's legs array is empty", () => {
    const props = {
      itinerary: {
        endTime: 1542814001000,
        legs: [],
      },
      toggleCanceledLegsBanner: () => {},
      waitThreshold: 180,
    };
    const wrapper = shallowWithIntl(<ItineraryLegs {...props} />, {
      context: mockContext,
    });

    expect(wrapper.isEmptyRender()).to.equal(true);
  });

  it('should identify that there are legs that are cancelled in the current itinerary', () => {
    const props = {
      itinerary: dt2831b,
      toggleCanceledLegsBanner: sinon.stub(),
      waitThreshold: 180,
    };

    shallowWithIntl(<ItineraryLegs {...props} />, {
      context: mockContext,
    });
    expect(props.toggleCanceledLegsBanner.calledOnce).to.equal(true);
    expect(props.toggleCanceledLegsBanner.args[0][0]).to.equal(true);
  });

  it('should do the plumbing properly', () => {
    const props = {
      itinerary: {
        endTime: 1542814001000,
        legs: [],
      },
    };
    const config = {
      itinerary: {
        waitThreshold: 180,
      },
    };
    const executeAction = sinon.stub();

    const wrapper = mountWithIntl(<DefaultExport {...props} />, {
      context: {
        ...mockContext,
        config,
        executeAction,
      },
      childContextTypes: mockChildContextTypes,
    });
    const component = wrapper.find(ItineraryLegs);
    component.prop('toggleCanceledLegsBanner')('foobar');
    expect(executeAction.calledOnce).to.equal(true);
    expect(executeAction.args[0][1]).to.equal('foobar');
    expect(component.prop('waitThreshold')).to.equal(
      config.itinerary.waitThreshold,
    );
  });

  describe('realtime arrival at the destination (issue 404)', () => {
    const stop = gtfsId => ({ gtfsId, name: 'stop', vehicleMode: 'BUS' });

    const walkLeg = {
      mode: 'WALK',
      transitLeg: false,
      realTime: false,
      rentedBike: false,
      distance: 200,
      duration: 240,
      startTime: 1529588565000,
      endTime: 1529588805000,
      from: { name: 'Origin', stop: null },
      to: { name: 'S Robinson Ave @ SW 22 St', stop: stop('embark:1') },
      intermediatePlaces: [],
    };

    const busLeg = realTime => ({
      mode: 'BUS',
      transitLeg: true,
      realTime,
      rentedBike: false,
      distance: 10918,
      duration: 1320,
      startTime: 1529588805000,
      endTime: 1529590125000,
      route: { gtfsId: 'embark:013', shortName: '013', mode: 'BUS' },
      trip: { gtfsId: 'embark:t1', stoptimes: [] },
      from: { name: 'S Robinson Ave @ SW 22 St', stop: stop('embark:1') },
      to: { name: 'Transit Center-BAY C', stop: stop('embark:156') },
      intermediatePlaces: [],
      intermediatePlace: false,
    });

    const propsFor = legs => ({
      itinerary: { legs, endTime: legs[legs.length - 1].endTime },
      toggleCanceledLegsBanner: () => {},
      waitThreshold: 180,
    });

    it('should mark the destination row as realtime when the itinerary ends on a realtime transit leg', () => {
      const wrapper = shallowWithIntl(
        <ItineraryLegs {...propsFor([walkLeg, busLeg(true)])} />,
        { context: mockContext },
      );

      expect(wrapper.find(EndLeg).prop('realTime')).to.equal(true);
    });

    it('should not mark the destination row as realtime when the final transit leg is scheduled', () => {
      const wrapper = shallowWithIntl(
        <ItineraryLegs {...propsFor([walkLeg, busLeg(false)])} />,
        { context: mockContext },
      );

      expect(wrapper.find(EndLeg).prop('realTime')).to.equal(false);
    });

    it('should not mark the destination row as realtime when the itinerary ends on a walk', () => {
      const finalWalk = {
        ...walkLeg,
        startTime: 1529590125000,
        endTime: 1529590365000,
        from: { name: 'Transit Center-BAY C', stop: stop('embark:156') },
        to: { name: 'Destination', stop: null },
      };
      const wrapper = shallowWithIntl(
        <ItineraryLegs {...propsFor([walkLeg, busLeg(true), finalWalk])} />,
        { context: mockContext },
      );

      expect(wrapper.find(EndLeg).prop('realTime')).to.equal(false);
    });
  });
});
