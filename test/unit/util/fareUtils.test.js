import {
  getFaresFromLegs,
  getFareOptions,
  getFareOptionsByCategory,
  getSingleLegFareByCategory,
  getCheapestTripFare,
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

  // OTP returns DependentFareProduct for legs covered by a fare transfer
  // rule (e.g. the OKC ferry east-west correspondence). The GraphQL
  // fragments only fetch price/riderCategory for known product types, so a
  // product of an unknown type arrives without a price at all.
  describe('fare products without a price', () => {
    const okcConfig = {
      fareMapping: fareId => fareId,
      availableTickets: {},
    };

    // Shape delivered when the fragment does not match the concrete type:
    // productId and name resolve, price and riderCategory are absent.
    const twoFerryLegs = [
      {
        fareProducts: [
          {
            id: '252272ec',
            product: {
              productId: 'embark:ferry_east',
              name: 'Ferry East route',
              price: { amount: 4.0 },
              riderCategory: { id: 'embark:adult', name: 'Adult universal' },
            },
          },
        ],
        route: { gtfsId: 'embark:rt-ERRC', shortName: 'ERRC', agency: {} },
      },
      {
        fareProducts: [
          {
            id: '0555fdff',
            product: {
              productId: 'embark:ferry_day_pass',
              name: 'Ferry day pass',
            },
          },
          {
            id: 'f0280023',
            product: {
              productId: 'embark:ferry_day_pass',
              name: 'Ferry day pass',
            },
          },
        ],
        route: { gtfsId: 'embark:rt-WRRC', shortName: 'WRRC', agency: {} },
      },
    ];

    it('getFaresFromLegs should treat a leg with only priceless products as an unknown fare', () => {
      const result = getFaresFromLegs(twoFerryLegs, okcConfig);
      expect(result).to.have.lengthOf(2);
      const known = result.filter(fare => !fare.isUnknown);
      expect(known).to.have.lengthOf(1);
      expect(known[0].price).to.equal(4.0);
      const unknown = result.filter(fare => fare.isUnknown);
      expect(unknown).to.have.lengthOf(1);
      expect(unknown[0].routeGtfsId).to.equal('embark:rt-WRRC');
    });

    it('getFaresFromLegs should ignore priceless products when the leg also has priced ones', () => {
      const legs = [
        {
          fareProducts: [
            {
              id: '1',
              product: { productId: 'embark:transfer', name: 'Transfer' },
            },
            {
              id: '2',
              product: {
                productId: 'embark:single_ride',
                name: 'Single ride',
                price: { amount: 2.0 },
              },
            },
          ],
          route: { gtfsId: 'embark:rt-023', agency: {} },
        },
      ];
      const result = getFaresFromLegs(legs, okcConfig);
      expect(result).to.have.lengthOf(1);
      expect(result[0].isUnknown).to.equal(undefined);
      expect(result[0].price).to.equal(2.0);
    });

    it('getFareOptions should skip priceless products without throwing', () => {
      const options = getFareOptions(twoFerryLegs, okcConfig);
      expect(options).to.have.lengthOf(1);
      expect(options[0].productId).to.equal('embark:ferry_east');
      expect(options[0].totalPrice).to.equal(4.0);
    });

    it('getFareOptionsByCategory should skip priceless products without throwing', () => {
      const categories = getFareOptionsByCategory(twoFerryLegs, okcConfig);
      expect(categories).to.have.lengthOf(1);
      // The $4.00 east single leaves the priceless WRRC leg unpaid
      expect(categories[0].singleTickets).to.equal(null);
      expect(categories[0].cheapestTotal).to.equal(null);
    });

    it('getSingleLegFareByCategory should skip priceless products without throwing', () => {
      const categories = getSingleLegFareByCategory(twoFerryLegs[1]);
      expect(categories).to.have.lengthOf(0);
    });

    // Shape delivered once the fragments also fetch DependentFareProduct
    // price and riderCategory: the transfer leg shows the day pass like a
    // day-pass-only leg already does.
    it('getFaresFromLegs should price the transfer leg once dependent products carry prices', () => {
      const legs = [
        twoFerryLegs[0],
        {
          fareProducts: [
            {
              id: '0555fdff',
              product: {
                productId: 'embark:ferry_day_pass',
                name: 'Ferry day pass',
                price: { amount: 6.0 },
                riderCategory: {
                  id: 'embark:reduced',
                  name: 'Reduced universal',
                },
              },
            },
            {
              id: 'f0280023',
              product: {
                productId: 'embark:ferry_day_pass',
                name: 'Ferry day pass',
                price: { amount: 12.0 },
                riderCategory: { id: 'embark:adult', name: 'Adult universal' },
              },
            },
          ],
          route: { gtfsId: 'embark:rt-WRRC', shortName: 'WRRC', agency: {} },
        },
      ];
      const result = getFaresFromLegs(legs, okcConfig);
      expect(result).to.have.lengthOf(2);
      expect(result.filter(fare => fare.isUnknown)).to.have.lengthOf(0);
      const wrrc = result.find(f => f.routeGtfsId === 'embark:rt-WRRC');
      expect(wrrc.price).to.equal(12.0);
    });
  });
  describe('cheapest total for a multi-leg trip (issue 447)', () => {
    const adult = {
      id: 'embark:adult',
      name: 'Adult universal',
      isDefault: true,
    };
    const reduced = {
      id: 'embark:reduced',
      name: 'Reduced universal',
      isDefault: false,
    };
    const use = (useId, productId, amount, riderCategory) => ({
      id: useId,
      product: { productId, name: productId, price: { amount }, riderCategory },
    });
    const config = { fareMapping: fareId => fareId };

    // OTP response for ERRC then WRRC once the ferry transfer rule is in:
    // the day pass bought on ERRC carries to WRRC under the same use id.
    const ferryLegs = [
      {
        route: { gtfsId: 'embark:rt-ERRC', shortName: 'ERRC', agency: {} },
        fareProducts: [
          use('66e7ece0', 'embark:ferry_day_pass', 12, adult),
          use('67f7929b', 'embark:ferry_day_pass', 6, reduced),
          use('cff70646', 'embark:ferry_east', 4, adult),
        ],
      },
      {
        route: { gtfsId: 'embark:rt-WRRC', shortName: 'WRRC', agency: {} },
        fareProducts: [
          use('66e7ece0', 'embark:ferry_day_pass', 12, adult),
          use('67f7929b', 'embark:ferry_day_pass', 6, reduced),
        ],
      },
    ];

    // Routes 011 then 003: singles have their own use ids, the pass shares one.
    const busLegs = [
      {
        route: { gtfsId: 'embark:rt-011', shortName: '011', agency: {} },
        fareProducts: [
          use('8c502c77', 'embark:single_ride_local', 1.75, adult),
          use('d476c2b1', 'embark:24h_universal_pass', 4, adult),
        ],
      },
      {
        route: { gtfsId: 'embark:rt-003', shortName: '003', agency: {} },
        fareProducts: [
          use('69641b64', 'embark:single_ride_local', 1.75, adult),
          use('d476c2b1', 'embark:24h_universal_pass', 4, adult),
        ],
      },
    ];

    it('charges a pass shared across legs once', () => {
      expect(getCheapestTripFare(ferryLegs, 'Adult universal')).to.equal(12);
      expect(getCheapestTripFare(ferryLegs, 'Reduced universal')).to.equal(6);
    });

    it('prefers singles when they are cheaper than the pass', () => {
      expect(getCheapestTripFare(busLegs, 'Adult universal')).to.equal(3.5);
    });

    it('returns null when a leg has no product in the category', () => {
      const legs = [ferryLegs[0], { ...busLegs[0], fareProducts: [] }];
      expect(getCheapestTripFare(legs, 'Adult universal')).to.equal(null);
    });

    it('does not count separate purchases of the same product as one', () => {
      const legs = ferryLegs.map((leg, i) => ({
        ...leg,
        fareProducts: [use(`pass-${i}`, 'embark:ferry_day_pass', 12, adult)],
      }));
      expect(getCheapestTripFare(legs, 'Adult universal')).to.equal(24);
    });

    it('exposes the cheapest total on each rider category', () => {
      const [adultCategory, reducedCategory] = getFareOptionsByCategory(
        ferryLegs,
        config,
      );
      expect(adultCategory.cheapestTotal).to.equal(12);
      expect(reducedCategory.cheapestTotal).to.equal(6);
    });

    it('hides single tickets that do not cover every leg', () => {
      const [adultCategory] = getFareOptionsByCategory(ferryLegs, config);
      expect(adultCategory.singleTickets).to.equal(null);
      expect(adultCategory.passes).to.have.lengthOf(1);
      expect(adultCategory.passes[0].price).to.equal(12);
    });

    it('keeps single tickets that cover every leg', () => {
      const [adultCategory] = getFareOptionsByCategory(busLegs, config);
      expect(adultCategory.singleTickets.totalPrice).to.equal(3.5);
      expect(adultCategory.singleTickets.count).to.equal(2);
      expect(adultCategory.cheapestTotal).to.equal(3.5);
    });
  });
});
