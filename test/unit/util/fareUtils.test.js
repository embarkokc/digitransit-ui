import {
  getFaresFromLegs,
  getCappedTotalFare,
  getFareOptionsByCategory,
} from '../../../app/util/fareUtils';

const defaultConfig = {
  showTicketInformation: true,
  fareMapping: fareId => fareId,
  availableTickets: { HSL: { 'HSL:AB': { price: 3.1, zones: ['A', 'B'] } } },
};

describe('fareUtils', () => {
  describe('getFaresFromLegs', () => {
    it('should return null for missing fares', () => {
      expect(getFaresFromLegs(null, defaultConfig)).to.equal(null);
      expect(getFaresFromLegs({}, defaultConfig)).to.equal(null);
    });

    // OKC shows it's onw fare calculation. We want it calculatedes nevertheless
    // it('should return null if showTicketInformation is falsey', () => {
    //  expect(getFaresFromLegs([], {})).to.equal(null);
    // });

    it('should return empty list if no fare products are given', () => {
      const fares = [{ fareProducts: [] }];
      expect(getFaresFromLegs(fares, defaultConfig).length).to.equal(0);
    });

    it('should return individual tickets even if the total cost is unknown', () => {
      const fares = [
        {
          fareProducts: [
            { id: 1, product: { productId: 'HSL:AB', price: '3.1' } },
          ],
          route: { agency: {} },
        },
        { fareProducts: [], route: { agency: {} } },
      ];
      expect(getFaresFromLegs(fares, defaultConfig)).to.have.lengthOf(2);
    });

    it('should return empty list if there are no fare products', () => {
      const fares = [{ fareProducts: [] }];
      expect(getFaresFromLegs(fares, defaultConfig).length).to.equal(0);
    });

    it('should return an array containing a single fare', () => {
      const fares = [
        {
          fareProducts: [
            { id: 1, product: { productId: 'HSL:AB', price: '3.1' } },
          ],
          route: { agency: {} },
        },
      ];
      const result = getFaresFromLegs(fares, defaultConfig);
      expect(result).to.have.lengthOf(1);
    });

    it('should use the configured fareMapping function', () => {
      const fares = [
        {
          fareProducts: [
            {
              id: '1',
              product: { productId: 'HSL:AB', price: { amount: 3.1 } },
            },
          ],
          route: { agency: { id: 'HSL:HSL' } },
        },
      ];
      const config = {
        ...defaultConfig,
        fareMapping: fareId => `${fareId.split(':')[1]}`,
      };
      expect(getFaresFromLegs(fares, config)[0].ticketName).to.equal('AB');
    });

    it('should preserve the fare products properties', () => {
      const fares = [
        {
          fareProducts: [
            {
              id: '1',
              product: { productId: 'HSL:AB', price: { amount: 3.1 } },
            },
          ],
          route: { agency: { id: 'HSL:HSL' } },
        },
      ];
      const config = {
        ...defaultConfig,
        fareMapping: fareId => fareId.replace('HSL:', ''),
      };
      expect(getFaresFromLegs(fares, config)[0].fareProducts).to.deep.equal([
        {
          id: '1',
          product: { productId: 'HSL:AB', price: { amount: 3.1 } },
        },
      ]);
    });

    it("should map the legs routes' agency", () => {
      const fares = [
        {
          fareProducts: [
            {
              id: '1',
              product: { productId: 'HSL:AB', price: { amount: 3.1 } },
            },
          ],
          route: {
            agency: {
              name: 'foo',
              fareUrl: 'https://www.hsl.fi',
              gtfsId: 'bar',
            },
          },
        },
      ];
      const config = {
        ...defaultConfig,
        fareMapping: fareId => fareId.replace('HSL:', ''),
      };
      expect(getFaresFromLegs(fares, config)[0].agency).to.deep.equal({
        name: 'foo',
        fareUrl: 'https://www.hsl.fi',
        gtfsId: 'bar',
      });
    });
  });

  it('should map route and agency props for unknown fares', () => {
    const fares = [
      {
        fareProducts: [
          {
            id: '1',
            product: { productId: 'HSL:AB', price: { amount: 3.1 } },
          },
        ],
        route: {
          agency: {
            gtfsId: 'HSL:HSL',
          },
          gtfsId: 'HSL:1003',
        },
      },
      {
        fareProducts: [],
        route: {
          agency: {
            fareUrl: 'foobaz',
            gtfsId: 'FOO:BAR',
            name: 'Merisataman lauttaliikenne',
          },
          gtfsId: 'FOO:1234',
          longName: 'Merisataman lautta',
        },
      },
    ];

    const result = getFaresFromLegs(fares, defaultConfig);
    expect(result).to.have.lengthOf(2);
    expect(result.filter(fare => fare.isUnknown)).to.have.lengthOf(1);

    const unknown = result.find(fare => fare.isUnknown);
    expect(unknown.agency).to.deep.equal({
      fareUrl: 'foobaz',
      gtfsId: 'FOO:BAR',
      name: 'Merisataman lauttaliikenne',
    });
    expect(unknown.routeGtfsId).to.equal('FOO:1234');
    expect(unknown.routeName).to.equal('Merisataman lautta');
  });

  it('should map route and agency props for unknown fares, even without known fares', () => {
    const fares = [
      {
        fareProducts: [],
        route: {
          gtfsId: 'HSL:1003',
          longName: 'Olympiaterminaali - Eira - Kallio - Meilahti',
          agency: {
            gtfsId: 'HSL:HSL',
          },
        },
      },
      {
        fareProducts: [],
        route: {
          gtfsId: 'FOO:1234',
          longName: 'Merisataman lautta',
          agency: {
            fareUrl: 'foobaz',
            gtfsId: 'FOO:BAR',
            name: 'Merisataman lauttaliikenne',
          },
        },
      },
    ];

    const result = getFaresFromLegs(fares, defaultConfig);
    expect(result).to.have.lengthOf(2);
    expect(result.filter(fare => fare.isUnknown)).to.have.lengthOf(2);

    const unknown = result.find(fare => fare.isUnknown);
    expect(unknown.agency).to.deep.equal({
      fareUrl: undefined,
      gtfsId: 'HSL:HSL',
      name: undefined,
    });
    expect(unknown.routeGtfsId).to.equal('HSL:1003');
    expect(unknown.routeName).to.equal(
      'Olympiaterminaali - Eira - Kallio - Meilahti',
    );
  });

  it('should not suggest unknown tickets if the total fare is known', () => {
    const fares = [
      {
        fareProducts: [
          { id: 1, product: { productId: 'HSL:AB', price: '3.1' } },
        ],
        route: {
          agency: {
            gtfsId: 'HSL:HSL',
          },
        },
      },
    ];
    const result = getFaresFromLegs(fares, defaultConfig);
    expect(result).to.have.lengthOf(1);
    expect(result.filter(fare => fare.isUnknown)).to.have.lengthOf(0);
  });

  describe('mode fare caps (OKC ferry day pass)', () => {
    const adult = { id: 'embark:adult', name: 'Adult', isDefault: true };
    const reduced = { id: 'embark:reduced', name: 'Reduced', isDefault: false };

    const capConfig = {
      fareMapping: fareId => fareId,
      availableTickets: { embark: {} },
      modeFareCaps: {
        FERRY: { name: 'Ferry day pass', price: 12 },
      },
    };

    const product = (useId, productId, name, amount, riderCategory) => ({
      id: useId,
      product: {
        productId,
        name,
        price: { amount },
        riderCategory,
      },
    });

    const ferryLeg = useIdPrefix => ({
      mode: 'FERRY',
      route: {
        gtfsId: 'embark:ferry1',
        agency: { name: 'EMBARK', gtfsId: 'embark:ok' },
      },
      fareProducts: [
        product(
          `${useIdPrefix}-a`,
          'embark:ferry_single',
          'Ferry single ride',
          8,
          adult,
        ),
        product(
          `${useIdPrefix}-r`,
          'embark:ferry_single_reduced',
          'Ferry single ride reduced',
          4,
          reduced,
        ),
      ],
    });

    const busLeg = useIdPrefix => ({
      mode: 'BUS',
      route: {
        gtfsId: 'embark:bus1',
        agency: { name: 'EMBARK', gtfsId: 'embark:ok' },
      },
      fareProducts: [
        product(
          `${useIdPrefix}-a`,
          'embark:single_ride_local',
          'Single ride local',
          1.75,
          adult,
        ),
      ],
    });

    describe('getCappedTotalFare', () => {
      it('caps summed ferry single rides at the ferry day pass price', () => {
        const legs = [ferryLeg('l1'), ferryLeg('l2')];
        const fares = getFaresFromLegs(legs, capConfig);
        expect(getCappedTotalFare(legs, fares, capConfig)).to.equal(12);
      });

      it('adds uncapped modes on top of the capped ferry subtotal', () => {
        const legs = [busLeg('l1'), ferryLeg('l2'), ferryLeg('l3')];
        const fares = getFaresFromLegs(legs, capConfig);
        expect(getCappedTotalFare(legs, fares, capConfig)).to.equal(13.75);
      });

      it('does not cap when the ferry subtotal is below the cap', () => {
        const legs = [ferryLeg('l1')];
        const fares = getFaresFromLegs(legs, capConfig);
        expect(getCappedTotalFare(legs, fares, capConfig)).to.equal(8);
      });

      it('sums normally when no modeFareCaps are configured', () => {
        const config = { ...capConfig, modeFareCaps: undefined };
        const legs = [ferryLeg('l1'), ferryLeg('l2')];
        const fares = getFaresFromLegs(legs, config);
        expect(getCappedTotalFare(legs, fares, config)).to.equal(16);
      });

      it('returns null when there are no known fares', () => {
        const legs = [
          {
            mode: 'FERRY',
            route: { gtfsId: 'embark:ferry1', agency: {} },
            fareProducts: [],
          },
        ];
        const fares = getFaresFromLegs(legs, capConfig);
        expect(getCappedTotalFare(legs, fares, capConfig)).to.equal(null);
      });
    });

    describe('getFareOptionsByCategory with mode fare caps', () => {
      it('collapses capped ferry rides into one day pass line in the default category', () => {
        const legs = [ferryLeg('l1'), ferryLeg('l2')];
        const categories = getFareOptionsByCategory(legs, capConfig);
        const adultCategory = categories.find(c => c.categoryName === 'Adult');
        expect(adultCategory.singleTickets.totalPrice).to.equal(12);
        expect(adultCategory.singleTickets.rides).to.have.lengthOf(1);
        expect(adultCategory.singleTickets.rides[0].name).to.equal(
          'Ferry day pass',
        );
        expect(adultCategory.singleTickets.rides[0].price).to.equal(12);
      });

      it('leaves a reduced category uncapped when no per-category cap is configured', () => {
        const legs = [ferryLeg('l1'), ferryLeg('l2')];
        const categories = getFareOptionsByCategory(legs, capConfig);
        const reducedCategory = categories.find(
          c => c.categoryName === 'Reduced',
        );
        expect(reducedCategory.singleTickets.totalPrice).to.equal(8);
        expect(reducedCategory.singleTickets.rides).to.have.lengthOf(2);
      });

      it('caps a reduced category via pricesByCategoryId', () => {
        const config = {
          ...capConfig,
          modeFareCaps: {
            FERRY: {
              name: 'Ferry day pass',
              price: 12,
              pricesByCategoryId: { 'embark:reduced': 6 },
            },
          },
        };
        const legs = [ferryLeg('l1'), ferryLeg('l2')];
        const categories = getFareOptionsByCategory(legs, config);
        const reducedCategory = categories.find(
          c => c.categoryName === 'Reduced',
        );
        expect(reducedCategory.singleTickets.totalPrice).to.equal(6);
        expect(reducedCategory.singleTickets.rides).to.have.lengthOf(1);
        expect(reducedCategory.singleTickets.rides[0].name).to.equal(
          'Ferry day pass',
        );
      });

      it('caps only the ferry subtotal in a mixed bus and ferry itinerary', () => {
        const legs = [busLeg('l1'), ferryLeg('l2'), ferryLeg('l3')];
        const categories = getFareOptionsByCategory(legs, capConfig);
        const adultCategory = categories.find(c => c.categoryName === 'Adult');
        expect(adultCategory.singleTickets.totalPrice).to.equal(13.75);
        const rideNames = adultCategory.singleTickets.rides.map(r => r.name);
        expect(rideNames).to.include('Single ride local');
        expect(rideNames).to.include('Ferry day pass');
      });

      it('is unchanged when no modeFareCaps are configured', () => {
        const config = { ...capConfig, modeFareCaps: undefined };
        const legs = [ferryLeg('l1'), ferryLeg('l2')];
        const categories = getFareOptionsByCategory(legs, config);
        const adultCategory = categories.find(c => c.categoryName === 'Adult');
        expect(adultCategory.singleTickets.totalPrice).to.equal(16);
        expect(adultCategory.singleTickets.rides).to.have.lengthOf(2);
      });
    });
  });
});
