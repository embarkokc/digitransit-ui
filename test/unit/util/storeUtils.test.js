import { getOldSearches } from '../../../app/util/storeUtils';

const okcBoundary = {
  'boundary.rect.min_lat': 35.1261666,
  'boundary.rect.max_lat': 35.75717549,
  'boundary.rect.min_lon': -97.90289458,
  'boundary.rect.max_lon': -97.0865951,
};

const feature = (lon, lat, name) => ({
  type: 'Feature',
  geometry: { type: 'Point', coordinates: [lon, lat] },
  properties: { name },
});

const okcItem = feature(-97.516, 35.468, 'Downtown Oklahoma City');
const dallasItem = feature(-96.797, 32.7767, 'Dallas, TX');
const routeItem = { properties: { name: 'Route 5', layer: 'route' } };

const makeContext = (items, config) => ({
  getStore: () => ({ getOldSearches: () => items }),
  config,
});

describe('storeUtils', () => {
  describe('getOldSearches', () => {
    it('drops saved searches outside the configured boundary when filtering is enabled', () => {
      const context = makeContext([okcItem, dallasItem], {
        filterOldSearchesToBoundary: true,
        searchParams: okcBoundary,
      });
      const result = getOldSearches(context, 'endpoint');
      expect(result).to.have.lengthOf(1);
      expect(result[0].properties.name).to.equal('Downtown Oklahoma City');
    });

    it('keeps saved searches without coordinates', () => {
      const context = makeContext([routeItem, dallasItem], {
        filterOldSearchesToBoundary: true,
        searchParams: okcBoundary,
      });
      const result = getOldSearches(context);
      expect(result).to.have.lengthOf(1);
      expect(result[0].properties.name).to.equal('Route 5');
    });

    it('returns saved searches unfiltered when filtering is not enabled', () => {
      const context = makeContext([okcItem, dallasItem], {
        searchParams: okcBoundary,
      });
      expect(getOldSearches(context)).to.have.lengthOf(2);
    });

    it('returns saved searches unfiltered when boundary params are missing', () => {
      const context = makeContext([okcItem, dallasItem], {
        filterOldSearchesToBoundary: true,
        searchParams: {},
      });
      expect(getOldSearches(context)).to.have.lengthOf(2);
    });
  });
});
