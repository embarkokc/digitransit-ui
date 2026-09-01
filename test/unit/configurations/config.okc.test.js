import { expect } from 'chai';
import { describe, it } from 'mocha';

import config from '../../../app/configurations/config.okc';

describe('OKC Configuration', () => {
  describe('geocoding boundary', () => {
    it('keeps Pelias location awareness off so focus.point is never sent', () => {
      // The OKC geocoder backend stops enforcing boundary.rect when
      // focus.point is present, letting out-of-state results through.
      expect(config.autoSuggest.locationAware).to.equal(false);
    });

    it('filters saved searches to the geocoder boundary', () => {
      expect(config.filterOldSearchesToBoundary).to.equal(true);
    });

    it('defines the full boundary rect used for filtering', () => {
      expect(config.searchParams['boundary.rect.min_lat']).to.be.a('number');
      expect(config.searchParams['boundary.rect.max_lat']).to.be.a('number');
      expect(config.searchParams['boundary.rect.min_lon']).to.be.a('number');
      expect(config.searchParams['boundary.rect.max_lon']).to.be.a('number');
    });
  });
});
