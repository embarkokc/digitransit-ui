import React from 'react';

import { mockContext, mockChildContextTypes } from '../helpers/mock-context';
import { mountWithIntl, shallowWithIntl } from '../helpers/mock-intl-enzyme';
import { ItinerarySummarySubtitle } from '../../../app/component/ItinerarySummarySubtitle';
import { Component as ItinerarySummaryListContainer } from '../../../app/component/ItinerarySummaryListContainer/ItinerarySummaryListContainer';

const noop = () => {};

const LOCATIONS_STATE_TEMPLATE = {
  type: 'CurrentLocation',
  lat: 60.170384,
  lon: 24.939846,
  status: 'no-location',
  hasLocation: false,
  isLocationingInProgress: false,
  isReverseGeocodingInProgress: false,
  locationingFailed: false,
};

const PROPS_TEMPLATE = {
  activeIndex: 0,
  currentTime: 1656580024206,
  locationState: LOCATIONS_STATE_TEMPLATE,
  from: {},
  itineraries: [],
  onSelect: noop,
  onSelectImmediately: noop,
  searchTime: 1656509749000,
  to: {},
  bikeAndPublicItinerariesToShow: 0,
  bikeAndParkItinerariesToShow: 0,
  walking: true,
  biking: false,
  showAlternativePlan: false,
  loading: false,
  driving: false,
};

describe('<ItinerarySummaryListContainer />', () => {
  xit('should render the component for canceled itineraries', () => {
    // TODO: enzyme is currently missing support for react hooks
    const props = {
      ...PROPS_TEMPLATE,
      currentTime: 1234567890,
      searchTime: 1234567890,
    };
    const wrapper = mountWithIntl(
      <div>
        <ItinerarySummaryListContainer {...props} />
      </div>,
      { context: mockContext, childContextTypes: mockChildContextTypes },
    );
    // TODO: purposeful test case definition missing -> skip test
    expect(wrapper.debug()).to.equal(undefined);
  });

  it('should render without crashing', () => {
    const props = {
      ...PROPS_TEMPLATE,
    };

    const wrapper = mountWithIntl(
      <div>
        <ItinerarySummaryListContainer {...props} />
      </div>,
      { context: mockContext, childContextTypes: mockChildContextTypes },
    );

    expect(wrapper.isEmptyRender()).to.equal(false);
  });

  it('should give the bike and public subtitle a readable default message', () => {
    // The translation id is built from the itinerary modes, and only the rail
    // and subway variants exist. A bus network therefore always falls back to
    // the defaultMessage, so that string is what riders actually read.
    const props = {
      ...PROPS_TEMPLATE,
      bikeAndPublicItinerariesToShow: 1,
      itineraries: [
        {
          legs: [{ mode: 'BICYCLE' }, { mode: 'BUS' }, { mode: 'BICYCLE' }],
        },
      ],
    };

    const wrapper = shallowWithIntl(
      <ItinerarySummaryListContainer {...props} />,
      {
        context: {
          ...mockContext,
          config: { ...mockContext.config, zones: { stops: false } },
          match: {
            ...mockContext.match,
            params: { hash: 'bikeAndVehicle' },
          },
        },
      },
    );

    const subtitle = wrapper.find(ItinerarySummarySubtitle);
    expect(subtitle).to.have.lengthOf(1);
    expect(subtitle.prop('translationId')).to.equal(
      'itinerary-summary.bikeAndPublic-bus-title',
    );
    expect(subtitle.prop('defaultMessage')).to.contain('&');
    expect(subtitle.prop('defaultMessage')).to.not.contain('u0026');
  });
});
